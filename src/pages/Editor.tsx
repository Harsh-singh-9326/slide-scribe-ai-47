import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  Plus, 
  Trash2, 
  Move, 
  Palette, 
  Type, 
  Save,
  ArrowLeft,
  Eye
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Slide {
  id: string;
  title: string;
  content: string;
  notes: string;
  design_suggestion?: {
    layout?: string;
    image_url?: string;
    style?: {
      background_color?: string;
      primary_color?: string;
      secondary_color?: string;
      accent_color?: string;
    };
  };
  layout?: string;
}

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [currentTheme, setCurrentTheme] = useState('modern');
  const [isSaving, setIsSaving] = useState(false);
  const [presentation, setPresentation] = useState<any>(null);
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: "1",
      title: "Introduction to Marketing Strategy",
      content: "Welcome to our comprehensive marketing strategy presentation for Q1 2024. This presentation will cover key objectives, target audiences, and strategic initiatives.",
      notes: "Start with enthusiasm and engage the audience with the quarterly goals."
    },
    {
      id: "2",
      title: "Market Analysis Overview",
      content: "Current market trends show significant growth in digital channels. Our analysis reveals three key opportunities for expansion and competitive advantage.",
      notes: "Highlight the data-driven insights and reference the quarterly report."
    },
    {
      id: "3",
      title: "Strategic Objectives",
      content: "Our primary objectives include: 1) Increase brand awareness by 25%, 2) Expand market share in key demographics, 3) Launch new product line successfully.",
      notes: "Emphasize measurable goals and timeline expectations."
    }
  ]);

  const addSlide = () => {
    const newSlide = {
      id: Date.now().toString(), // Use timestamp string for unique ID
      title: "New Slide Title",
      content: "Enter your slide content here...",
      notes: "Add speaker notes for this slide."
    };
    setSlides([...slides, newSlide]);
    setSelectedSlide(slides.length);
  };

  const deleteSlide = (slideIndex: number) => {
    if (slides.length > 1) {
      const newSlides = slides.filter((_, index) => index !== slideIndex);
      setSlides(newSlides);
      if (selectedSlide >= newSlides.length) {
        setSelectedSlide(newSlides.length - 1);
      }
    }
  };

  const updateSlide = (field: 'title' | 'content' | 'notes', value: string) => {
    const newSlides = [...slides];
    newSlides[selectedSlide] = {
      ...newSlides[selectedSlide],
      [field]: value
    };
    setSlides(newSlides);
  };

  // Load presentation data if editing existing
  useEffect(() => {
    if (id && id !== 'new') {
      loadPresentation();
    }
  }, [id]);

  const loadPresentation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: presentationData, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setPresentation(presentationData);
      setCurrentTheme(presentationData.theme || 'modern');
      
      // Use AI-generated content if available, otherwise load from slides table
      if (presentationData.content && Array.isArray(presentationData.content)) {
        const formattedSlides = presentationData.content.map((slide: any, index: number) => ({
          id: slide.id || index.toString(),
          title: slide.slide_title || slide.title || 'Untitled Slide',
          content: Array.isArray(slide.content_bullets) 
            ? slide.content_bullets.map((bullet: string) => `• ${bullet}`).join('\n')
            : slide.content || '',
          notes: slide.speaker_notes || slide.notes || '',
          design_suggestion: slide.design_suggestion,
          layout: slide.design_suggestion?.layout || 'title-content'
        }));
        setSlides(formattedSlides);
      } else {
        // Fallback to slides table
        const { data: slidesData, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .eq('presentation_id', id)
          .order('slide_order');

        if (slidesError) throw slidesError;

        if (slidesData && slidesData.length > 0) {
          const formattedSlides = slidesData.map(slide => ({
            id: slide.id,
            title: slide.title,
            content: slide.content || '',
            notes: slide.notes || '',
            layout: slide.layout || 'title-content'
          }));
          setSlides(formattedSlides);
        }
      }
    } catch (error: any) {
      console.error('Error loading presentation:', error);
      toast({
        title: "Error",
        description: "Failed to load presentation",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save your presentation",
          variant: "destructive",
        });
        return;
      }

      if (id && id !== 'new') {
        // Update existing presentation
        const { error: updateError } = await supabase
          .from('presentations')
          .update({
            theme: currentTheme,
            slide_count: slides.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) throw updateError;

        // Delete existing slides first
        const { error: deleteError } = await supabase
          .from('slides')
          .delete()
          .eq('presentation_id', id);

        if (deleteError) throw deleteError;

        // Insert all slides fresh
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const { error: slideError } = await supabase
            .from('slides')
            .insert({
              presentation_id: id,
              title: slide.title,
              content: slide.content,
              notes: slide.notes,
              slide_order: i,
              layout: 'title-content'
            });

          if (slideError) throw slideError;
        }
      }

      toast({
        title: "Saved",
        description: "Your presentation has been saved successfully",
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save presentation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: 'pptx' | 'pdf') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to export your presentation",
          variant: "destructive",
        });
        return;
      }

      if (!id || id === 'new') {
        toast({
          title: "Save Required",
          description: "Please save your presentation before exporting",
          variant: "destructive",
        });
        return;
      }

      const presentationData = {
        title: presentation?.title || "Presentation",
        ...presentation
      };

      if (format === 'pptx') {
        await generatePPTX(presentationData, slides);
      } else {
        await generatePDF(presentationData, slides);
      }

      toast({
        title: "Export Complete",
        description: `Your ${format.toUpperCase()} has been downloaded`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export presentation",
        variant: "destructive",
      });
    }
  };

  const generatePPTX = async (presentation: any, slides: any[]) => {
    const pptx = await import('pptxgenjs');
    const pres = new pptx.default();

    const themeStyles = getThemeStyles();
    
    slides.forEach((slide, index) => {
      const pptxSlide = pres.addSlide();
      
      // Add background based on theme
      if (currentTheme !== 'minimal') {
        pptxSlide.background = { color: themeStyles.accentColor };
      }
      
      // Add title
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 1,
        w: 9,
        h: 1,
        fontSize: 24,
        bold: true,
        align: 'center',
        color: currentTheme === 'minimal' ? '2c3e50' : 'ffffff'
      });

      // Add content
      pptxSlide.addText(slide.content || '', {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 4,
        fontSize: 16,
        align: 'left',
        color: currentTheme === 'minimal' ? '7f8c8d' : 'f8fafc',
        valign: 'top'
      });

      // Add slide number
      pptxSlide.addText(`${index + 1} / ${slides.length}`, {
        x: 9,
        y: 6.8,
        w: 1,
        h: 0.3,
        fontSize: 12,
        align: 'right',
        color: currentTheme === 'minimal' ? '999999' : 'ffffff'
      });
    });

    await pres.writeFile({ fileName: `${presentation.title}.pptx` });
  };

  const generatePDF = async (presentation: any, slides: any[]) => {
    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF();

    slides.forEach((slide, index) => {
      if (index > 0) pdf.addPage();

      // Add title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(slide.title, 105, 40, { align: 'center' });

      // Add content
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      const splitContent = pdf.splitTextToSize(slide.content || '', 170);
      pdf.text(splitContent, 20, 80);

      // Add slide number
      pdf.setFontSize(10);
      pdf.text(`${index + 1} / ${slides.length}`, 190, 280, { align: 'right' });
    });

    pdf.save(`${presentation.title}.pdf`);
  };

  const renderSlidePreview = () => {
    const currentSlide = slides[selectedSlide];
    if (!currentSlide) return null;

    const themeStyles = getThemeStyles();
    const layout = currentSlide.layout || 'title-content';
    const imageUrl = currentSlide.design_suggestion?.image_url;

    // Different layout renderers
    const layouts = {
      'hero': () => (
        <div className="relative w-full h-full flex items-center justify-center text-center p-12">
          {imageUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          )}
          <div className="relative z-10 max-w-3xl">
            <h1 
              className="text-5xl font-bold mb-8 leading-tight"
              style={{ color: themeStyles.titleColor }}
            >
              {currentSlide.title}
            </h1>
            <div 
              className="text-xl leading-relaxed space-y-4"
              style={{ color: themeStyles.contentColor }}
            >
              {currentSlide.content.split('\n').map((line, index) => (
                <p key={index}>{line.replace('• ', '')}</p>
              ))}
            </div>
          </div>
        </div>
      ),
      
      'two-column': () => (
        <div className="w-full h-full flex p-12">
          <div className="w-1/2 pr-8">
            <h1 
              className="text-4xl font-bold mb-6"
              style={{ color: themeStyles.titleColor }}
            >
              {currentSlide.title}
            </h1>
            <div 
              className="text-lg leading-relaxed space-y-3"
              style={{ color: themeStyles.contentColor }}
            >
              {currentSlide.content.split('\n').map((line, index) => (
                <p key={index} className="flex items-start">
                  {line.startsWith('• ') && (
                    <span 
                      className="w-2 h-2 rounded-full mr-3 mt-2 flex-shrink-0"
                      style={{ backgroundColor: themeStyles.accentColor }}
                    />
                  )}
                  <span>{line.replace('• ', '')}</span>
                </p>
              ))}
            </div>
          </div>
          <div className="w-1/2 flex items-center justify-center">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Slide visual" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div 
                className="w-64 h-64 rounded-lg flex items-center justify-center text-white/80"
                style={{ backgroundColor: themeStyles.accentColor }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-sm">Visual Content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
      
      'title-content': () => (
        <div className="w-full h-full flex flex-col justify-center items-center text-center p-12">
          {imageUrl && (
            <div className="mb-8">
              <img 
                src={imageUrl} 
                alt="Slide visual" 
                className="max-w-xs max-h-48 object-contain rounded-lg shadow-lg mx-auto"
              />
            </div>
          )}
          <h1 
            className="text-4xl font-bold mb-8 max-w-4xl"
            style={{ color: themeStyles.titleColor }}
          >
            {currentSlide.title}
          </h1>
          <div 
            className="text-xl leading-relaxed max-w-3xl space-y-4"
            style={{ color: themeStyles.contentColor }}
          >
            {currentSlide.content.split('\n').map((line, index) => (
              <p key={index} className="flex items-center justify-center">
                {line.startsWith('• ') && (
                  <span 
                    className="w-2 h-2 rounded-full mr-4 flex-shrink-0"
                    style={{ backgroundColor: themeStyles.accentColor }}
                  />
                )}
                <span>{line.replace('• ', '')}</span>
              </p>
            ))}
          </div>
        </div>
      ),
      
      'grid': () => {
        const contentLines = currentSlide.content.split('\n').filter(line => line.trim());
        const gridItems = contentLines.map(line => line.replace('• ', ''));
        
        return (
          <div className="w-full h-full p-12">
            <h1 
              className="text-4xl font-bold mb-12 text-center"
              style={{ color: themeStyles.titleColor }}
            >
              {currentSlide.title}
            </h1>
            <div className="grid grid-cols-2 gap-8 h-2/3">
              {gridItems.slice(0, 4).map((item, index) => (
                <div 
                  key={index}
                  className="rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-lg"
                  style={{ 
                    backgroundColor: `${themeStyles.accentColor}20`,
                    borderLeft: `4px solid ${themeStyles.accentColor}`
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white font-bold"
                    style={{ backgroundColor: themeStyles.accentColor }}
                  >
                    {index + 1}
                  </div>
                  <p 
                    className="text-lg font-medium"
                    style={{ color: themeStyles.contentColor }}
                  >
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      }
    };

    const LayoutComponent = layouts[layout as keyof typeof layouts] || layouts['title-content'];
    
    return (
      <div 
        className="w-full h-full relative"
        style={{ background: themeStyles.background }}
      >
        <LayoutComponent />
        {/* Slide number */}
        <div 
          className="absolute bottom-4 right-4 text-sm opacity-60"
          style={{ color: themeStyles.titleColor }}
        >
          {selectedSlide + 1} / {slides.length}
        </div>
      </div>
    );
  };

  const getThemeStyles = () => {
    // Use AI-generated style if available
    const currentSlide = slides[selectedSlide];
    if (currentSlide?.design_suggestion?.style) {
      const aiStyle = currentSlide.design_suggestion.style;
      return {
        background: aiStyle.background_color || '#ffffff',
        titleColor: aiStyle.primary_color || '#2c3e50',
        contentColor: aiStyle.secondary_color || '#7f8c8d',
        accentColor: aiStyle.accent_color || '#667eea'
      };
    }

    // Fallback to preset themes
    const themes = {
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
      // AI preset themes
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
    return themes[currentTheme as keyof typeof themes] || themes.modern;
  };

  const handlePreview = () => {
    const themeStyles = getThemeStyles();
    const previewContent = slides.map((slide, index) => `
      <div style="
        page-break-after: always; 
        padding: 60px; 
        min-height: 100vh; 
        display: flex; 
        flex-direction: column; 
        justify-content: center;
        background: ${themeStyles.background};
        position: relative;
      ">
        <h1 style="
          font-size: 3em; 
          margin-bottom: 40px; 
          color: ${themeStyles.titleColor};
          font-weight: bold;
          text-align: center;
        ">${slide.title}</h1>
        <div style="
          font-size: 1.4em; 
          line-height: 1.8; 
          color: ${themeStyles.contentColor};
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        ">${slide.content.replace(/\n/g, '<br>')}</div>
        <div style="
          position: absolute; 
          bottom: 30px; 
          right: 30px; 
          color: ${themeStyles.titleColor}; 
          font-size: 1em;
          opacity: 0.8;
        ">
          ${index + 1} / ${slides.length}
        </div>
      </div>
    `).join('');

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Preview - ${presentation?.title || 'Presentation'}</title>
            <style>
              body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>${previewContent}</body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Editor Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="font-semibold">Marketing Strategy Q1 2024</h1>
                <p className="text-xs text-muted-foreground">Last saved: 2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Palette className="w-4 h-4 mr-2" />
                    Theme
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Choose Theme</DialogTitle>
                    <DialogDescription>
                      Select a theme to change the visual style of your presentation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={currentTheme} onValueChange={setCurrentTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern - Purple gradient</SelectItem>
                        <SelectItem value="professional">Professional - Dark blue</SelectItem>
                        <SelectItem value="creative">Creative - Pink gradient</SelectItem>
                        <SelectItem value="minimal">Minimal - Clean white</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Presentation</DialogTitle>
                    <DialogDescription>
                      Download your presentation in your preferred format
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => handleExport('pptx')}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export as PPTX
                    </Button>
                    <Button 
                      onClick={() => handleExport('pdf')}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export as PDF
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Slide Thumbnails */}
        <div className="w-64 border-r bg-muted/20 overflow-y-auto">
          <div className="p-4">
            <Button
              onClick={addSlide}
              variant="outline"
              size="sm"
              className="w-full mb-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>
            
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setSelectedSlide(index)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors group ${
                    selectedSlide === index 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1">
                        Slide {index + 1}
                      </div>
                      <div className="text-sm font-medium truncate">
                        {slide.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {slide.content.substring(0, 60)}...
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(index);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex">
          {/* Slide Preview - Main Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {/* Slide Preview */}
              <div className="aspect-[16/9] bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                {renderSlidePreview()}
              </div>

              {/* Theme Selector */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Theme: {currentTheme}</h3>
                    <Select value={currentTheme} onValueChange={setCurrentTheme}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern - Purple gradient</SelectItem>
                        <SelectItem value="professional">Professional - Dark blue</SelectItem>
                        <SelectItem value="creative">Creative - Pink gradient</SelectItem>
                        <SelectItem value="minimal">Minimal - Clean white</SelectItem>
                        <SelectItem value="vibrant">Vibrant - Dark with colors</SelectItem>
                        <SelectItem value="corporate">Corporate - Light blue</SelectItem>
                        <SelectItem value="dark">Dark - High contrast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Editing Panel */}
          <div className="w-80 border-l bg-muted/10 overflow-y-auto">
            <div className="p-4 space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Slide Title
                </label>
                <Input
                  value={slides[selectedSlide]?.title || ''}
                  onChange={(e) => updateSlide('title', e.target.value)}
                  className="text-lg font-semibold"
                  placeholder="Enter slide title..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Slide Content
                </label>
                <Textarea
                  value={slides[selectedSlide]?.content || ''}
                  onChange={(e) => updateSlide('content', e.target.value)}
                  className="min-h-32 resize-none"
                  placeholder="Enter slide content..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Speaker Notes
                </label>
                <Textarea
                  value={slides[selectedSlide]?.notes || ''}
                  onChange={(e) => updateSlide('notes', e.target.value)}
                  className="min-h-20 resize-none text-sm"
                  placeholder="Add speaker notes..."
                />
              </div>

              {/* Layout Options */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Layout
                </label>
                <Select
                  value={slides[selectedSlide]?.layout || 'title-content'}
                  onValueChange={(value) => {
                    const newSlides = [...slides];
                    newSlides[selectedSlide] = {
                      ...newSlides[selectedSlide],
                      layout: value
                    };
                    setSlides(newSlides);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title-content">Title + Content</SelectItem>
                    <SelectItem value="hero">Hero Layout</SelectItem>
                    <SelectItem value="two-column">Two Column</SelectItem>
                    <SelectItem value="grid">Grid Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;