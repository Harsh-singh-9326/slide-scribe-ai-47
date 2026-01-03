import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Maximize, 
  Minimize,
  Clock,
  Flag,
  FileText,
  Sparkles,
  Download,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EnhancedSpeakerNotes } from "@/components/EnhancedSpeakerNotes";
import { supabase } from "@/integrations/supabase/client";

interface Slide {
  id: string;
  title: string;
  content: string;
  notes?: string;
  layout?: string;
  theme?: string;
}

interface ThemeStyles {
  background: string;
  titleColor: string;
  contentColor: string;
  accentColor: string;
}

interface SlideLap {
  slideIndex: number;
  duration: number;
}

const PresentationMode = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [globalTheme, setGlobalTheme] = useState('modern');
  const [showControls, setShowControls] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [slideStartTime, setSlideStartTime] = useState(0);
  const [slideLaps, setSlideLaps] = useState<SlideLap[]>([]);
  const [presentationTitle, setPresentationTitle] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Load presentation data from URL params or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const presentationData = params.get('data');
    
    if (presentationData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(presentationData));
        setSlides(parsed.slides || []);
        setGlobalTheme(parsed.theme || 'modern');
        setPresentationTitle(parsed.title || 'Presentation');
      } catch (e) {
        console.error('Failed to parse presentation data');
      }
    }
  }, []);

  // Generate full presentation script
  const downloadFullScript = async (format: 'txt' | 'pdf') => {
    if (slides.length === 0) return;
    
    setIsGeneratingScript(true);
    
    try {
      // Generate scripts for all slides
      const allScripts: Array<{
        slideNumber: number;
        title: string;
        content: string;
        script: string;
        talkingPoints: string[];
        questions: string[];
        transitionTip: string;
      }> = [];

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        try {
          const { data, error } = await supabase.functions.invoke('enhance-speaker-notes', {
            body: { 
              slideTitle: slide.title, 
              slideContent: slide.content,
              existingNotes: slide.notes 
            }
          });

          if (error) throw error;
          
          allScripts.push({
            slideNumber: i + 1,
            title: slide.title,
            content: slide.content,
            script: data?.speakingScript || `Present the key points of ${slide.title} to your audience.`,
            talkingPoints: data?.keyTalkingPoints || [],
            questions: data?.suggestedQuestions || [],
            transitionTip: data?.transitionTip || 'Pause briefly before moving to the next slide.'
          });
        } catch (err) {
          // Fallback for failed API calls
          allScripts.push({
            slideNumber: i + 1,
            title: slide.title,
            content: slide.content,
            script: `"Let me walk you through ${slide.title}. ${slide.notes || 'This is an important topic to cover.'}"`,
            talkingPoints: ['Introduce the main concept', 'Provide examples', 'Summarize key takeaways'],
            questions: ['Any questions about this topic?'],
            transitionTip: 'Pause briefly before moving to the next slide.'
          });
        }
      }

      const safeTitle = (presentationTitle || 'presentation').replace(/[^a-z0-9]+/gi, '_');

      if (format === 'txt') {
        let content = `${'═'.repeat(60)}\n`;
        content += `FULL PRESENTATION SPEAKER SCRIPT\n`;
        content += `${'═'.repeat(60)}\n\n`;
        content += `Presentation: ${presentationTitle}\n`;
        content += `Total Slides: ${slides.length}\n`;
        content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
        content += `${'═'.repeat(60)}\n\n`;

        allScripts.forEach((item, index) => {
          content += `${'─'.repeat(50)}\n`;
          content += `SLIDE ${item.slideNumber}: ${item.title}\n`;
          content += `${'─'.repeat(50)}\n\n`;
          
          content += `📜 WHAT TO SAY:\n`;
          content += `${item.script}\n\n`;
          
          content += `🎯 KEY TALKING POINTS:\n`;
          item.talkingPoints.forEach((point, i) => {
            content += `   ${i + 1}. ${point}\n`;
          });
          content += '\n';
          
          content += `❓ AUDIENCE QUESTIONS:\n`;
          item.questions.forEach((q, i) => {
            content += `   Q${i + 1}: "${q}"\n`;
          });
          content += '\n';
          
          content += `💡 TRANSITION: ${item.transitionTip}\n\n`;
          
          if (index < allScripts.length - 1) {
            content += '\n';
          }
        });

        content += `\n${'═'.repeat(60)}\n`;
        content += `END OF SCRIPT\n`;
        content += `${'═'.repeat(60)}\n`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeTitle}_full_script.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        // PDF download
        const { default: jsPDF } = await import('jspdf');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const margin = 20;
        const pageWidth = 210 - margin * 2;
        let y = margin;

        const addNewPageIfNeeded = (requiredSpace: number) => {
          if (y + requiredSpace > 280) {
            pdf.addPage();
            y = margin;
          }
        };

        // Title page
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PRESENTATION SCRIPT', margin, y);
        y += 15;

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'normal');
        pdf.text(presentationTitle, margin, y);
        y += 10;

        pdf.setFontSize(11);
        pdf.text(`${slides.length} Slides | Generated: ${new Date().toLocaleDateString()}`, margin, y);
        y += 20;

        // Add each slide's script
        allScripts.forEach((item, index) => {
          addNewPageIfNeeded(60);

          // Slide header
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(100, 100, 100);
          pdf.text(`SLIDE ${item.slideNumber}`, margin, y);
          y += 6;

          pdf.setFontSize(16);
          pdf.setTextColor(0, 0, 0);
          const titleLines = pdf.splitTextToSize(item.title, pageWidth);
          pdf.text(titleLines, margin, y);
          y += titleLines.length * 7 + 5;

          // Speaking script
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('What to Say:', margin, y);
          y += 6;

          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'italic');
          const scriptLines = pdf.splitTextToSize(item.script, pageWidth);
          addNewPageIfNeeded(scriptLines.length * 5);
          pdf.text(scriptLines, margin, y);
          y += scriptLines.length * 5 + 8;

          // Talking points
          addNewPageIfNeeded(30);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Key Points:', margin, y);
          y += 6;

          pdf.setFont('helvetica', 'normal');
          item.talkingPoints.forEach((point, i) => {
            const pointLines = pdf.splitTextToSize(`${i + 1}. ${point}`, pageWidth - 5);
            addNewPageIfNeeded(pointLines.length * 5);
            pdf.text(pointLines, margin + 5, y);
            y += pointLines.length * 5;
          });
          y += 5;

          // Transition tip
          addNewPageIfNeeded(15);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Transition:', margin, y);
          y += 6;
          pdf.setFont('helvetica', 'normal');
          const tipLines = pdf.splitTextToSize(item.transitionTip, pageWidth);
          pdf.text(tipLines, margin, y);
          y += tipLines.length * 5 + 15;
        });

        pdf.save(`${safeTitle}_full_script.pdf`);
      }
    } catch (error) {
      console.error('Error generating full script:', error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Track slide changes for lap times
  useEffect(() => {
    if (isTimerRunning && currentSlide !== previousSlide) {
      const slideDuration = elapsedTime - slideStartTime;
      if (slideDuration > 0) {
        setSlideLaps(prev => {
          const existingIndex = prev.findIndex(lap => lap.slideIndex === previousSlide);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex].duration += slideDuration;
            return updated;
          }
          return [...prev, { slideIndex: previousSlide, duration: slideDuration }];
        });
      }
      setSlideStartTime(elapsedTime);
      setPreviousSlide(currentSlide);
    }
  }, [currentSlide, isTimerRunning, elapsedTime, slideStartTime, previousSlide]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const navigateToSlide = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= slides.length || newIndex === currentSlide || isTransitioning) return;
    
    setSlideDirection(newIndex > currentSlide ? 'right' : 'left');
    setPreviousSlide(currentSlide);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentSlide(newIndex);
      setTimeout(() => setIsTransitioning(false), 300);
    }, 150);
  }, [currentSlide, slides.length, isTransitioning]);

  const nextSlide = useCallback(() => navigateToSlide(currentSlide + 1), [navigateToSlide, currentSlide]);
  const prevSlide = useCallback(() => navigateToSlide(currentSlide - 1), [navigateToSlide, currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Home':
          e.preventDefault();
          navigateToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          navigateToSlide(slides.length - 1);
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'n':
        case 'N':
          setShowNotes(prev => !prev);
          break;
        case 'c':
        case 'C':
          setShowControls(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, navigateToSlide, slides.length]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleStartTimer = () => {
    if (!isTimerRunning && elapsedTime === 0) {
      setSlideStartTime(0);
      setPreviousSlide(currentSlide);
    }
    setIsTimerRunning(true);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setElapsedTime(0);
    setSlideStartTime(0);
    setSlideLaps([]);
  };

  const getThemeStyles = (theme: string): ThemeStyles => {
    const themes: Record<string, ThemeStyles> = {
      modern: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        titleColor: '#ffffff',
        contentColor: '#f8fafc',
        accentColor: '#667eea'
      },
      professional: {
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        titleColor: '#ecf0f1',
        contentColor: '#bdc3c7',
        accentColor: '#3498db'
      },
      creative: {
        background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
        titleColor: '#2c3e50',
        contentColor: '#34495e',
        accentColor: '#e91e63'
      },
      minimal: {
        background: '#ffffff',
        titleColor: '#2c3e50',
        contentColor: '#7f8c8d',
        accentColor: '#95a5a6'
      },
      vibrant: {
        background: 'linear-gradient(135deg, #1A202C 0%, #2D3748 100%)',
        titleColor: '#F56565',
        contentColor: '#48BB78',
        accentColor: '#ED8936'
      },
      corporate: {
        background: '#F7FAFC',
        titleColor: '#2B6CB0',
        contentColor: '#4A5568',
        accentColor: '#38B2AC'
      },
      dark: {
        background: 'linear-gradient(135deg, #111111 0%, #1a1a1a 100%)',
        titleColor: '#00D4FF',
        contentColor: '#FF6B6B',
        accentColor: '#4ECDC4'
      }
    };
    return themes[theme] || themes.modern;
  };

  const renderSlide = () => {
    const slide = slides[currentSlide];
    if (!slide) return null;

    const theme = slide.theme || globalTheme;
    const styles = getThemeStyles(theme);
    const layout = slide.layout || 'title-content';
    const contentLines = slide.content.split('\n').filter(l => l.trim());

    const renderContent = () => {
      switch (layout) {
        case 'hero':
          return (
            <div className="flex flex-col items-center justify-center h-full text-center p-16">
              <h1 className="text-6xl font-bold mb-8" style={{ color: styles.titleColor }}>
                {slide.title}
              </h1>
              <div className="text-2xl space-y-4" style={{ color: styles.contentColor }}>
                {contentLines.map((line, i) => (
                  <p key={i}>{line.replace('• ', '')}</p>
                ))}
              </div>
            </div>
          );
        case 'two-column':
          return (
            <div className="flex h-full p-16">
              <div className="w-1/2 pr-8 flex flex-col justify-center">
                <h1 className="text-5xl font-bold mb-6" style={{ color: styles.titleColor }}>
                  {slide.title}
                </h1>
                <div className="text-xl space-y-3" style={{ color: styles.contentColor }}>
                  {contentLines.map((line, i) => (
                    <p key={i} className="flex items-start">
                      <span className="w-3 h-3 rounded-full mr-4 mt-2 flex-shrink-0" style={{ backgroundColor: styles.accentColor }} />
                      {line.replace('• ', '')}
                    </p>
                  ))}
                </div>
              </div>
              <div className="w-1/2 flex items-center justify-center">
                <div className="w-80 h-80 rounded-2xl flex items-center justify-center" style={{ backgroundColor: styles.accentColor }}>
                  <span className="text-6xl">📊</span>
                </div>
              </div>
            </div>
          );
        case 'grid':
          const gridItems = contentLines.slice(0, 4).map(l => l.replace('• ', ''));
          while (gridItems.length < 4) gridItems.push(`Point ${gridItems.length + 1}`);
          return (
            <div className="h-full p-16">
              <h1 className="text-5xl font-bold mb-12 text-center" style={{ color: styles.titleColor }}>
                {slide.title}
              </h1>
              <div className="grid grid-cols-2 gap-8 h-2/3">
                {gridItems.map((item, i) => (
                  <div key={i} className="rounded-xl p-8 flex flex-col items-center justify-center text-center" 
                    style={{ backgroundColor: `${styles.accentColor}20`, borderLeft: `4px solid ${styles.accentColor}` }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-white font-bold text-2xl"
                      style={{ backgroundColor: styles.accentColor }}>
                      {i + 1}
                    </div>
                    <p className="text-xl" style={{ color: styles.contentColor }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        default: // title-content
          return (
            <div className="flex flex-col items-center justify-center h-full text-center p-16">
              <h1 className="text-5xl font-bold mb-12" style={{ color: styles.titleColor }}>
                {slide.title}
              </h1>
              <div className="text-2xl space-y-4" style={{ color: styles.contentColor }}>
                {contentLines.map((line, i) => (
                  <p key={i} className="flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full mr-4" style={{ backgroundColor: styles.accentColor }} />
                    {line.replace('• ', '')}
                  </p>
                ))}
              </div>
            </div>
          );
      }
    };

    return (
      <div 
        className={cn(
          "w-full h-full",
          isTransitioning && slideDirection === 'right' && "animate-slide-in-right",
          isTransitioning && slideDirection === 'left' && "animate-slide-in-left"
        )}
        style={{ background: styles.background }}
      >
        {renderContent()}
      </div>
    );
  };

  const currentSlideTime = elapsedTime - slideStartTime;
  const averageTime = slideLaps.length > 0 
    ? Math.round(slideLaps.reduce((sum, l) => sum + l.duration, 0) / slideLaps.length)
    : 0;
  const estimatedRemaining = averageTime * (slides.length - currentSlide - 1);

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Presentation Data</h1>
          <p className="text-muted-foreground mb-4">Open this page from the editor's Practice Mode button.</p>
          <Button onClick={() => window.close()}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      {/* Main Slide Area */}
      <div className="h-full w-full">
        {renderSlide()}
      </div>

      {/* Progress Bar - Always visible at top */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <Progress 
          value={((currentSlide + 1) / slides.length) * 100} 
          className="h-1 rounded-none bg-black/30"
        />
      </div>

      {/* Slide Counter - Always visible */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Timer Display - Always visible when running */}
      <div className={cn(
        "absolute top-4 right-4 z-10 bg-black/70 text-white px-6 py-3 rounded-xl backdrop-blur-sm transition-all",
        isTimerRunning ? "opacity-100" : "opacity-70"
      )}>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5" />
          <span className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</span>
        </div>
        {isTimerRunning && (
          <div className="text-xs text-white/70 mt-1 text-center">
            This slide: {formatTime(currentSlideTime)}
          </div>
        )}
      </div>

      {/* Controls Panel - Toggle with 'c' key */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="max-w-4xl mx-auto">
            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="lg"
                onClick={prevSlide}
                disabled={currentSlide === 0 || isTransitioning}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              
              <div className="flex items-center gap-2">
                {!isTimerRunning ? (
                  <Button 
                    onClick={handleStartTimer}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {elapsedTime > 0 ? 'Resume' : 'Start Timer'}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setIsTimerRunning(false)}
                    variant="secondary"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button 
                  onClick={handleResetTimer}
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/20"
                  disabled={elapsedTime === 0}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <Button 
                variant="ghost" 
                size="lg"
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1 || isTransitioning}
                className="text-white hover:bg-white/20"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </div>

            {/* Quick Stats */}
            {(slideLaps.length > 0 || isTimerRunning) && (
              <div className="flex justify-center gap-6 text-white/70 text-sm">
                <span>Avg/slide: {formatTime(averageTime)}</span>
                <span>Est. remaining: {formatTime(estimatedRemaining)}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
                className="text-white/70 hover:text-white hover:bg-white/20"
              >
                <FileText className="w-4 h-4 mr-2" />
                {showNotes ? 'Hide' : 'Show'} Notes (N)
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => downloadFullScript('txt')}
                disabled={isGeneratingScript}
                className="text-white/70 hover:text-white hover:bg-white/20"
              >
                {isGeneratingScript ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Full Script TXT
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => downloadFullScript('pdf')}
                disabled={isGeneratingScript}
                className="text-white/70 hover:text-white hover:bg-white/20"
              >
                {isGeneratingScript ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Full Script PDF
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleFullscreen}
                className="text-white/70 hover:text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize className="w-4 h-4 mr-2" /> : <Maximize className="w-4 h-4 mr-2" />}
                {isFullscreen ? 'Exit' : 'Fullscreen'} (F)
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.close()}
                className="text-white/70 hover:text-white hover:bg-white/20"
              >
                <X className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </div>

            {/* Keyboard Hints */}
            <div className="text-center text-white/40 text-xs mt-4">
              ← → or Space to navigate • F for fullscreen • N for notes • C to hide controls
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Speaker Notes Panel */}
      <EnhancedSpeakerNotes
        slideTitle={slides[currentSlide]?.title || ''}
        slideContent={slides[currentSlide]?.content || ''}
        notes={slides[currentSlide]?.notes}
        isVisible={showNotes}
        onClose={() => setShowNotes(false)}
        presentationTitle={presentationTitle}
      />

      {/* Slide Laps Panel */}
      {showControls && slideLaps.length > 0 && (
        <div className="absolute top-16 right-4 z-10 bg-black/70 text-white p-4 rounded-xl backdrop-blur-sm max-w-xs">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium">
            <Flag className="w-4 h-4" />
            Slide Times
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {slideLaps.map((lap, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-white/70">Slide {lap.slideIndex + 1}</span>
                <span className="font-mono">{formatTime(lap.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationMode;
