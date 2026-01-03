import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Youtube, 
  HelpCircle, 
  Lightbulb, 
  ExternalLink, 
  Loader2,
  BookOpen,
  MessageCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  Mic
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedSpeakerNotesProps {
  slideTitle: string;
  slideContent: string;
  notes?: string;
  isVisible: boolean;
  onClose: () => void;
  presentationTitle?: string;
  allSlides?: Array<{ title: string; content: string; notes?: string }>;
}

interface AIEnhancement {
  expandedNotes: string;
  speakingScript: string;
  keyTalkingPoints: string[];
  suggestedQuestions: string[];
  youtubeSearchTerms: string[];
  transitionTip: string;
}

export const EnhancedSpeakerNotes = ({ 
  slideTitle, 
  slideContent, 
  notes, 
  isVisible, 
  onClose,
  presentationTitle,
  allSlides
}: EnhancedSpeakerNotesProps) => {
  const [enhancement, setEnhancement] = useState<AIEnhancement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("script");
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (isVisible && slideTitle) {
      generateEnhancement();
    }
  }, [isVisible, slideTitle, slideContent]);

  const generateEnhancement = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-speaker-notes', {
        body: { 
          slideTitle, 
          slideContent,
          existingNotes: notes 
        }
      });

      if (error) throw error;
      setEnhancement(data);
    } catch (error) {
      console.error('Error generating enhancement:', error);
      // Fallback content with speaking script
      setEnhancement({
        expandedNotes: notes || `This slide covers "${slideTitle}". Focus on the key points and engage your audience with relevant examples.`,
        speakingScript: `"Let me walk you through ${slideTitle}. ${notes || 'This is an important topic that I want to highlight for you today.'} As you can see on the slide, ${slideContent?.slice(0, 100) || 'we have several key points to discuss'}... Let me break this down for you."`,
        keyTalkingPoints: [
          `Introduce the concept of ${slideTitle}`,
          "Explain the significance with real-world examples",
          "Connect this to your audience's experience",
          "Summarize the key takeaway"
        ],
        suggestedQuestions: [
          `What experience do you have with ${slideTitle.toLowerCase()}?`,
          "How might this apply in your context?",
          "What challenges have you faced in this area?",
          "Any questions before we move on?"
        ],
        youtubeSearchTerms: [
          `${slideTitle} explained`,
          `${slideTitle} tutorial`,
          `${slideTitle} examples`,
          `${slideTitle} best practices`
        ],
        transitionTip: "Pause for questions before transitioning to the next slide."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openYouTubeSearch = (term: string) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, '_blank');
  };

  const downloadSpeakerScript = (format: 'txt' | 'pdf') => {
    if (!enhancement) return;
    
    const title = presentationTitle || slideTitle || 'Speaker Script';
    const safeTitle = title.replace(/[^a-z0-9]+/gi, '_');
    
    let content = `SPEAKER SCRIPT\n${'='.repeat(50)}\n\n`;
    content += `Presentation: ${presentationTitle || 'Untitled'}\n`;
    content += `Slide: ${slideTitle}\n\n`;
    content += `${'─'.repeat(50)}\n\n`;
    
    content += `📜 WHAT TO SAY:\n${'─'.repeat(30)}\n`;
    content += `${enhancement.speakingScript}\n\n`;
    
    content += `🎯 KEY TALKING POINTS:\n${'─'.repeat(30)}\n`;
    enhancement.keyTalkingPoints.forEach((point, i) => {
      content += `${i + 1}. ${point}\n`;
    });
    content += '\n';
    
    content += `❓ AUDIENCE QUESTIONS:\n${'─'.repeat(30)}\n`;
    enhancement.suggestedQuestions.forEach((q, i) => {
      content += `Q${i + 1}: "${q}"\n`;
    });
    content += '\n';
    
    content += `💡 TRANSITION TIP:\n${'─'.repeat(30)}\n`;
    content += `${enhancement.transitionTip}\n\n`;
    
    content += `🎥 RELATED VIDEOS TO WATCH:\n${'─'.repeat(30)}\n`;
    enhancement.youtubeSearchTerms.forEach((term) => {
      content += `• Search: "${term}"\n`;
    });

    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle}_speaker_script.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else {
      // PDF download
      import('jspdf').then(({ default: jsPDF }) => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const margin = 20;
        const pageWidth = 210 - margin * 2;
        let y = margin;
        
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SPEAKER SCRIPT', margin, y);
        y += 10;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Slide: ${slideTitle}`, margin, y);
        y += 15;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('What to Say:', margin, y);
        y += 8;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'italic');
        const scriptLines = pdf.splitTextToSize(enhancement.speakingScript, pageWidth);
        pdf.text(scriptLines, margin, y);
        y += scriptLines.length * 6 + 10;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Key Talking Points:', margin, y);
        y += 8;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        enhancement.keyTalkingPoints.forEach((point, i) => {
          const lines = pdf.splitTextToSize(`${i + 1}. ${point}`, pageWidth);
          pdf.text(lines, margin, y);
          y += lines.length * 6;
        });
        y += 10;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Audience Questions:', margin, y);
        y += 8;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        enhancement.suggestedQuestions.forEach((q, i) => {
          const lines = pdf.splitTextToSize(`Q${i + 1}: "${q}"`, pageWidth);
          pdf.text(lines, margin, y);
          y += lines.length * 6;
        });
        
        pdf.save(`${safeTitle}_speaker_script.pdf`);
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-32 left-4 right-4 md:right-auto md:max-w-lg z-20">
      <Card className="bg-background/95 backdrop-blur-md border shadow-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Speaker Assistant
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground truncate">{slideTitle}</p>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Generating insights...</span>
              </div>
            ) : (
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 h-9">
                    <TabsTrigger value="script" className="text-xs">
                      <Mic className="w-3 h-3 mr-1" />
                      Script
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="text-xs">
                      <HelpCircle className="w-3 h-3 mr-1" />
                      Q&A
                    </TabsTrigger>
                    <TabsTrigger value="videos" className="text-xs">
                      <Youtube className="w-3 h-3 mr-1" />
                      Videos
                    </TabsTrigger>
                    <TabsTrigger value="tips" className="text-xs">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Tips
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="h-[220px] mt-3">
                    <TabsContent value="script" className="m-0 space-y-3">
                      {/* Speaking Script - What to Say */}
                      <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Mic className="w-4 h-4 text-primary" />
                          What to Say
                        </div>
                        <p className="text-sm text-muted-foreground italic leading-relaxed">
                          "{enhancement?.speakingScript}"
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <BookOpen className="w-4 h-4 text-primary" />
                          Key Talking Points
                        </div>
                        <ul className="space-y-2">
                          {enhancement?.keyTalkingPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-muted-foreground">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>

                    <TabsContent value="questions" className="m-0 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        Questions to Engage Your Audience
                      </div>
                      <div className="space-y-2">
                        {enhancement?.suggestedQuestions.map((question, i) => (
                          <div 
                            key={i} 
                            className="p-3 bg-muted/50 rounded-lg text-sm flex items-start gap-2"
                          >
                            <Badge variant="outline" className="flex-shrink-0">Q{i + 1}</Badge>
                            <span className="text-muted-foreground">{question}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="videos" className="m-0 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Youtube className="w-4 h-4 text-red-500" />
                        Related YouTube Videos
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Click to search for relevant videos on this topic
                      </p>
                      <div className="space-y-2">
                        {enhancement?.youtubeSearchTerms.map((term, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            className="w-full justify-between text-left h-auto py-2"
                            onClick={() => openYouTubeSearch(term)}
                          >
                            <span className="text-sm truncate">{term}</span>
                            <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2" />
                          </Button>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="tips" className="m-0 space-y-3">
                      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Lightbulb className="w-4 h-4 text-primary" />
                          Transition Tip
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {enhancement?.transitionTip}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Best Practices</div>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                            Make eye contact with your audience
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                            Pause after key points for emphasis
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                            Use gestures to reinforce your message
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                            Check audience understanding before moving on
                          </li>
                        </ul>
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>

                {/* Download Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => downloadSpeakerScript('txt')}
                    disabled={!enhancement}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download TXT
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => downloadSpeakerScript('pdf')}
                    disabled={!enhancement}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download PDF
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default EnhancedSpeakerNotes;
