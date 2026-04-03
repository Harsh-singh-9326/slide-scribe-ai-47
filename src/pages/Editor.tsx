import { useState, useEffect, useCallback } from "react";
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
  Save,
  ArrowLeft,
  Eye,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Play
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { ImageManager } from "@/components/ImageManager";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAutoSave } from "@/hooks/useAutoSave";
import { RotateCcw, X } from "lucide-react";

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
  theme?: string; // Per-slide theme override
}

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('modern');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draggingSlideIndex, setDraggingSlideIndex] = useState<number | null>(null);
  const [dragOverSlideIndex, setDragOverSlideIndex] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
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

  // Auto-save to localStorage for crash recovery
  const { hasRecovery, recover, dismiss, clearAutoSave } = useAutoSave(id, slides, currentTheme);

  // Smooth slide navigation with transitions
  const navigateToSlide = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= slides.length || newIndex === selectedSlide || isTransitioning) return;
    
    setSlideDirection(newIndex > selectedSlide ? 'right' : 'left');
    setPreviousSlide(selectedSlide);
    setIsTransitioning(true);
    
    // Short delay for exit animation
    setTimeout(() => {
      setSelectedSlide(newIndex);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 150);
  }, [selectedSlide, slides.length, isTransitioning]);

  const nextSlide = useCallback(() => {
    navigateToSlide(selectedSlide + 1);
  }, [navigateToSlide, selectedSlide]);

  const prevSlide = useCallback(() => {
    navigateToSlide(selectedSlide - 1);
  }, [navigateToSlide, selectedSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const addSlide = () => {
    const newSlide = {
      id: Date.now().toString(),
      title: "New Slide Title",
      content: "Enter your slide content here...",
      notes: "Add speaker notes for this slide."
    };
    setSlides([...slides, newSlide]);
    navigateToSlide(slides.length);
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

  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setSlides((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    setSelectedSlide((prev) => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < toIndex && prev > fromIndex && prev <= toIndex) return prev - 1;
      if (toIndex < fromIndex && prev >= toIndex && prev < fromIndex) return prev + 1;
      return prev;
    });
  };

  const updateSlide = (field: 'title' | 'content' | 'notes' | 'layout' | 'theme', value: string) => {
    const newSlides = [...slides];
    newSlides[selectedSlide] = {
      ...newSlides[selectedSlide],
      [field]: value
    };
    setSlides(newSlides);
  };

  const handleImageSelect = (imageUrl: string) => {
    const newSlides = [...slides];
    newSlides[selectedSlide] = {
      ...newSlides[selectedSlide],
      design_suggestion: {
        ...newSlides[selectedSlide].design_suggestion,
        image_url: imageUrl
      }
    };
    setSlides(newSlides);
    toast({
      title: "Image Added",
      description: "Image has been added to the slide",
    });
  };

  const trackAnalytics = async (eventType: 'view' | 'download' | 'edit') => {
    if (!id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('presentation_analytics').insert({
        presentation_id: id,
        user_id: user.id,
        event_type: eventType,
        event_data: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const refineSlide = async (instruction: string) => {
    const slide = slides[selectedSlide];
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('refine-slide', {
        body: {
          slideContent: {
            title: slide.title,
            content: slide.content,
          },
          instruction,
          layout: slide.layout
        }
      });

      if (error) {
        console.error('Refine slide error:', error);
        throw error;
      }

      if (!data || !data.title) {
        throw new Error('Invalid response from AI service');
      }

      const newSlides = [...slides];
      newSlides[selectedSlide] = {
        ...newSlides[selectedSlide],
        title: data.title,
        content: data.content,
        notes: data.notes || newSlides[selectedSlide].notes
      };
      setSlides(newSlides);
      sonnerToast.success('Slide refined successfully!');
    } catch (error: any) {
      console.error('Error refining slide:', error);
      const errorMessage = error?.message || 'Failed to refine slide. Please try again.';
      sonnerToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load presentation data if editing existing
  useEffect(() => {
    if (id && id !== 'new') {
      loadPresentation();
      trackAnalytics('view');
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
      setLastSaved(presentationData.updated_at ? new Date(presentationData.updated_at) : null);
      
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
      await trackAnalytics('edit');
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

      setLastSaved(new Date());
      clearAutoSave();
      
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

  const downloadSpeakerNotes = (presentationTitle: string, slidesData: Slide[]) => {
    const safeTitle = String(presentationTitle || "speaker-notes").replace(/[^a-z0-9]+/gi, "_");

    const body = slidesData
      .map((s, i) => {
        const notes = String(s.notes || "").trim() || "(no speaker notes)";
        const title = String(s.title || "Untitled").trim();
        return `Slide ${i + 1}: ${title}\n${notes}`;
      })
      .join("\n\n---\n\n");

    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}_speaker_notes.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'pptx' | 'pdf') => {
    try {
      await trackAnalytics('download');
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

  const generatePPTX = async (presentation: any, slidesData: any[]) => {
    const pptx = await import('pptxgenjs');
    const pres = new pptx.default();
    
    slidesData.forEach((slide, index) => {
      const pptxSlide = pres.addSlide();
      
      const slideTheme = slide.theme || currentTheme;
      const themeStyles = getThemeStylesForTheme(slideTheme);
      const layout = slide.layout || 'title-content';
      
      let bgColor = 'FFFFFF';
      if (themeStyles.background.includes('gradient')) {
        const match = themeStyles.background.match(/#([0-9a-fA-F]{6})/);
        if (match) bgColor = match[1];
      } else if (themeStyles.background.startsWith('#')) {
        bgColor = themeStyles.background.replace('#', '');
      }
      
      pptxSlide.background = { color: bgColor };
      
      const titleColor = themeStyles.titleColor.replace('#', '');
      const contentColor = themeStyles.contentColor.replace('#', '');
      const accentColor = themeStyles.accentColor.replace('#', '');
      
      // Grid icons mapping
      const gridIcons = ['💡', '🎯', '📊', '🚀', '⚡', '🔑', '💎', '🌟'];
      
      if (layout === 'hero') {
        pptxSlide.addText(String(slide.title || ''), {
          x: 0.5, y: 2.5, w: 9, h: 2,
          fontSize: 44, bold: true, align: 'center', color: titleColor
        });
        const contentLines = String(slide.content || '').split('\n').filter(l => l.trim());
        contentLines.forEach((line, i) => {
          pptxSlide.addText(String(line.replace('• ', '') || ''), {
            x: 1, y: 4.5 + (i * 0.4), w: 8, h: 0.4,
            fontSize: 18, align: 'center', color: contentColor
          });
        });
      } else if (layout === 'two-column') {
        pptxSlide.addText(String(slide.title || ''), {
          x: 0.5, y: 0.5, w: 4.5, h: 1,
          fontSize: 32, bold: true, color: titleColor
        });
        const contentLines = String(slide.content || '').split('\n').filter(l => l.trim());
        contentLines.forEach((line, i) => {
          pptxSlide.addText(String(line.replace('• ', '• ') || ''), {
            x: 0.5, y: 1.8 + (i * 0.5), w: 4.5, h: 0.5,
            fontSize: 16, color: contentColor
          });
        });
        pptxSlide.addShape(pres.ShapeType.rect, {
          x: 5.5, y: 1.5, w: 4, h: 4,
          fill: { color: accentColor, transparency: 20 }
        });
      } else if (layout === 'grid') {
        pptxSlide.addText(String(slide.title || ''), {
          x: 0.5, y: 0.5, w: 9, h: 0.8,
          fontSize: 32, bold: true, align: 'center', color: titleColor
        });
        const contentLines = String(slide.content || '').split('\n').filter(l => l.trim());
        let gridItems = contentLines.map(l => l.replace('• ', ''));
        // Ensure exactly 4 items in grid
        while (gridItems.length < 4) {
          gridItems.push(`Key Point ${gridItems.length + 1}`);
        }
        if (gridItems.length > 4) {
          gridItems = gridItems.slice(0, 4);
        }
        
        const positions = [
          { x: 0.5, y: 2 }, { x: 5.2, y: 2 },
          { x: 0.5, y: 4.5 }, { x: 5.2, y: 4.5 }
        ];
        gridItems.forEach((item, i) => {
          pptxSlide.addShape(pres.ShapeType.rect, {
            x: positions[i].x, y: positions[i].y, w: 4.2, h: 2,
            fill: { color: accentColor, transparency: 80 },
            line: { color: accentColor, width: 2 }
          });
          pptxSlide.addText(gridIcons[i], {
            x: positions[i].x + 0.3, y: positions[i].y + 0.2, w: 0.6, h: 0.6,
            fontSize: 32, align: 'center'
          });
          pptxSlide.addText(String(item || ''), {
            x: positions[i].x + 0.2, y: positions[i].y + 1.0, w: 3.8, h: 0.8,
            fontSize: 14, align: 'left', color: contentColor, bold: true
          });
        });
      } else if (layout === 'image-left') {
        pptxSlide.addShape(pres.ShapeType.rect, {
          x: 0.5, y: 1.5, w: 4, h: 4,
          fill: { color: accentColor, transparency: 20 }
        });
        pptxSlide.addText(String(slide.title || ''), {
          x: 5, y: 0.5, w: 4.5, h: 1,
          fontSize: 32, bold: true, color: titleColor
        });
        const contentLines = String(slide.content || '').split('\n').filter(l => l.trim());
        contentLines.forEach((line, i) => {
          pptxSlide.addText(String(line.replace('• ', '• ') || ''), {
            x: 5, y: 1.8 + (i * 0.5), w: 4.5, h: 0.5,
            fontSize: 16, color: contentColor
          });
        });
      } else if (layout === 'quote') {
        pptxSlide.addText('"', {
          x: 0.5, y: 1, w: 2, h: 2,
          fontSize: 120, color: accentColor, transparency: 70
        });
        pptxSlide.addText(String(slide.title || ''), {
          x: 1, y: 2.5, w: 8, h: 2,
          fontSize: 28, italic: true, align: 'center', color: titleColor
        });
        const firstLine = String(slide.content || '').split('\n')[0]?.replace('• ', '') || '';
        pptxSlide.addText(firstLine, {
          x: 2, y: 5, w: 6, h: 0.5,
          fontSize: 18, align: 'center', color: contentColor
        });
      } else if (layout === 'comparison') {
        pptxSlide.addText(String(slide.title || ''), {
          x: 0.5, y: 0.3, w: 9, h: 0.8,
          fontSize: 32, bold: true, align: 'center', color: titleColor
        });
        const contentLines = String(slide.content || '').split('\n').filter(l => l.trim());
        const leftItems = contentLines.slice(0, 2).map(l => l.replace('• ', ''));
        const rightItems = contentLines.slice(2, 4).map(l => l.replace('• ', ''));
        
        pptxSlide.addShape(pres.ShapeType.rect, {
          x: 0.5, y: 1.5, w: 4.2, h: 4.5,
          fill: { color: accentColor, transparency: 85 }
        });
        pptxSlide.addText('Option A', {
          x: 0.5, y: 1.6, w: 4.2, h: 0.6,
          fontSize: 20, bold: true, align: 'center', color: accentColor
        });
        leftItems.forEach((item, i) => {
          pptxSlide.addText('• ' + (item || `Point ${i + 1}`), {
            x: 0.7, y: 2.5 + (i * 0.6), w: 3.8, h: 0.5,
            fontSize: 14, color: contentColor
          });
        });
        
        pptxSlide.addShape(pres.ShapeType.rect, {
          x: 5.3, y: 1.5, w: 4.2, h: 4.5,
          fill: { color: accentColor, transparency: 85 }
        });
        pptxSlide.addText('Option B', {
          x: 5.3, y: 1.6, w: 4.2, h: 0.6,
          fontSize: 20, bold: true, align: 'center', color: accentColor
        });
        rightItems.forEach((item, i) => {
          pptxSlide.addText('• ' + (item || `Point ${i + 1}`), {
            x: 5.5, y: 2.5 + (i * 0.6), w: 3.8, h: 0.5,
            fontSize: 14, color: contentColor
          });
        });
      } else if (layout === 'stats') {
        pptxSlide.addText(String(slide.title || ''), {
          x: 0.5, y: 0.5, w: 9, h: 0.8,
          fontSize: 32, bold: true, align: 'center', color: titleColor
        });
        const contentLines = String(slide.content || '').split('\n').filter(l => l.trim());
        const stats = contentLines.slice(0, 4).map(l => l.replace('• ', ''));
        const icons = ['📈', '🎯', '💡', '🚀'];
        const positions = [
          { x: 0.5, y: 2.5 }, { x: 2.8, y: 2.5 },
          { x: 5.1, y: 2.5 }, { x: 7.4, y: 2.5 }
        ];
        stats.forEach((stat, i) => {
          pptxSlide.addText(icons[i], {
            x: positions[i].x, y: positions[i].y, w: 2, h: 1,
            fontSize: 48, align: 'center'
          });
          pptxSlide.addText(stat || `Stat ${i + 1}`, {
            x: positions[i].x, y: positions[i].y + 1.5, w: 2, h: 0.8,
            fontSize: 14, align: 'center', color: contentColor
          });
        });
      } else {
        pptxSlide.addText(String(slide.title || ''), {
          x: 0.5, y: 1.5, w: 9, h: 1,
          fontSize: 36, bold: true, align: 'center', color: titleColor
        });
        const contentLines = String(slide.content || '').split('\n').filter(l => l.trim());
        contentLines.forEach((line, i) => {
          pptxSlide.addText(String(line.replace('• ', '• ') || ''), {
            x: 1.5, y: 3 + (i * 0.5), w: 7, h: 0.5,
            fontSize: 18, align: 'center', color: contentColor
          });
        });
      }

      pptxSlide.addNotes(String(slide.notes || ''));

      pptxSlide.addText(String(`${index + 1} / ${slidesData.length}`), {
        x: 9, y: 6.8, w: 0.8, h: 0.3,
        fontSize: 10, align: 'right', color: titleColor
      });
    });

    await pres.writeFile({ fileName: `${presentation.title}.pptx` });
  };

  const generatePDF = async (presentation: any, slidesData: any[]) => {
    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF('landscape', 'mm', 'a4');

    slidesData.forEach((slide, index) => {
      if (index > 0) pdf.addPage('a4', 'landscape');

      // Get theme for this slide
      const slideTheme = slide.theme || currentTheme;
      const themeStyles = getThemeStylesForTheme(slideTheme);
      const layout = slide.layout || 'title-content';
      
      // Extract colors (remove # and convert to RGB)
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };
      
      // Set background color (approximate gradient with solid color)
      let bgColor = hexToRgb('#ffffff');
      if (themeStyles.background.includes('gradient')) {
        const match = themeStyles.background.match(/#([0-9a-fA-F]{6})/);
        if (match) bgColor = hexToRgb('#' + match[1]);
      } else if (themeStyles.background.startsWith('#')) {
        bgColor = hexToRgb(themeStyles.background);
      }
      
      pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
      pdf.rect(0, 0, 297, 210, 'F');
      
      const titleColor = hexToRgb(themeStyles.titleColor);
      const contentColor = hexToRgb(themeStyles.contentColor);
      const accentColor = hexToRgb(themeStyles.accentColor);
      
      const contentLines = (slide.content || '').split('\n').filter((l: string) => l.trim());
      
      if (layout === 'hero') {
        pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        pdf.setFontSize(36);
        pdf.setFont('helvetica', 'bold');
        pdf.text(slide.title, 148.5, 80, { align: 'center', maxWidth: 250 });
        
        pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'normal');
        let yPos = 120;
        contentLines.forEach((line: string) => {
          pdf.text(line.replace('• ', ''), 148.5, yPos, { align: 'center', maxWidth: 220 });
          yPos += 15;
        });
      } else if (layout === 'two-column') {
        pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        pdf.setFontSize(28);
        pdf.setFont('helvetica', 'bold');
        pdf.text(slide.title, 20, 40, { maxWidth: 120 });
        
        pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        let yPos = 65;
        contentLines.forEach((line: string) => {
          pdf.text('• ' + line.replace('• ', ''), 20, yPos, { maxWidth: 120 });
          yPos += 12;
        });
        
        pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b, 0.2);
        pdf.roundedRect(160, 40, 120, 120, 5, 5, 'F');
      } else if (layout === 'grid') {
        pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        pdf.setFontSize(28);
        pdf.setFont('helvetica', 'bold');
        pdf.text(slide.title, 148.5, 30, { align: 'center' });
        
        let gridItems = contentLines.map((l: string) => l.replace('• ', ''));
        while (gridItems.length < 4) gridItems.push(`Point ${gridItems.length + 1}`);
        gridItems = gridItems.slice(0, 4);
        
        const positions = [
          { x: 20, y: 60 }, { x: 160, y: 60 },
          { x: 20, y: 130 }, { x: 160, y: 130 }
        ];
        
        gridItems.forEach((item: string, i: number) => {
          pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b, 0.1);
          pdf.roundedRect(positions[i].x, positions[i].y, 120, 50, 5, 5, 'F');
          
          pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
          pdf.circle(positions[i].x + 60, positions[i].y + 15, 8, 'F');
          
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(String(i + 1), positions[i].x + 60, positions[i].y + 18, { align: 'center' });
          
          pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'normal');
          pdf.text(item, positions[i].x + 60, positions[i].y + 35, { align: 'center', maxWidth: 110 });
        });
      } else if (layout === 'image-left') {
        pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b, 0.2);
        pdf.roundedRect(20, 40, 120, 120, 5, 5, 'F');
        
        pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        pdf.setFontSize(28);
        pdf.setFont('helvetica', 'bold');
        pdf.text(slide.title, 160, 50, { maxWidth: 120 });
        
        pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        let yPos = 80;
        contentLines.forEach((line: string) => {
          pdf.text('• ' + line.replace('• ', ''), 160, yPos, { maxWidth: 120 });
          yPos += 12;
        });
      } else if (layout === 'quote') {
        pdf.setTextColor(accentColor.r, accentColor.g, accentColor.b);
        pdf.setFontSize(100);
        pdf.text('"', 30, 80);
        
        pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'italic');
        pdf.text(slide.title, 148.5, 100, { align: 'center', maxWidth: 220 });
        
        pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'normal');
        const firstLine = contentLines[0]?.replace('• ', '') || '';
        pdf.text(firstLine, 148.5, 140, { align: 'center', maxWidth: 200 });
      } else if (layout === 'comparison') {
        pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        pdf.setFontSize(28);
        pdf.setFont('helvetica', 'bold');
        pdf.text(slide.title, 148.5, 30, { align: 'center' });
        
        const leftItems = contentLines.slice(0, 2).map((l: string) => l.replace('• ', ''));
        const rightItems = contentLines.slice(2, 4).map((l: string) => l.replace('• ', ''));
        
        pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b, 0.1);
        pdf.roundedRect(20, 50, 120, 120, 5, 5, 'F');
        pdf.setTextColor(accentColor.r, accentColor.g, accentColor.b);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Option A', 80, 65, { align: 'center' });
        pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        leftItems.forEach((item: string, i: number) => {
          pdf.text('• ' + (item || `Point ${i + 1}`), 30, 90 + (i * 20), { maxWidth: 100 });
        });
        
        pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b, 0.1);
        pdf.roundedRect(160, 50, 120, 120, 5, 5, 'F');
        pdf.setTextColor(accentColor.r, accentColor.g, accentColor.b);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Option B', 220, 65, { align: 'center' });
        pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        rightItems.forEach((item: string, i: number) => {
          pdf.text('• ' + (item || `Point ${i + 1}`), 170, 90 + (i * 20), { maxWidth: 100 });
        });
      } else if (layout === 'stats') {
        pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        pdf.setFontSize(28);
        pdf.setFont('helvetica', 'bold');
        pdf.text(slide.title, 148.5, 40, { align: 'center' });
        
        const stats = contentLines.slice(0, 4).map((l: string) => l.replace('• ', ''));
        const icons = ['📈', '🎯', '💡', '🚀'];
        const positions = [40, 110, 180, 250];
        
        stats.forEach((stat: string, i: number) => {
          pdf.setFontSize(36);
          pdf.text(icons[i], positions[i], 90, { align: 'center' });
          pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text(stat || `Stat ${i + 1}`, positions[i], 120, { align: 'center', maxWidth: 60 });
        });
      } else { // title-content
        pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        pdf.setFontSize(32);
        pdf.setFont('helvetica', 'bold');
        pdf.text(slide.title, 148.5, 60, { align: 'center', maxWidth: 250 });
        
        pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'normal');
        let yPos = 90;
        contentLines.forEach((line: string) => {
          pdf.text('• ' + line.replace('• ', ''), 148.5, yPos, { align: 'center', maxWidth: 220 });
          yPos += 14;
        });
      }
      
      // Add slide number
      pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
      pdf.setFontSize(10);
      pdf.text(`${index + 1} / ${slidesData.length}`, 280, 200, { align: 'right' });
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
        <div className="relative w-full h-full flex items-center justify-center text-center overflow-hidden">
          {/* Decorative floating shapes */}
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full opacity-10" style={{ background: themeStyles.accentColor, filter: 'blur(40px)' }} />
          <div className="absolute bottom-16 right-16 w-48 h-48 rounded-full opacity-8" style={{ background: themeStyles.titleColor, filter: 'blur(60px)' }} />
          {imageUrl && (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center scale-110 blur-md"
                style={{ backgroundImage: `url(${imageUrl})` }}
              />
              <div 
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${themeStyles.accentColor}ee 0%, ${themeStyles.titleColor === '#ffffff' ? '#000000' : themeStyles.titleColor}dd 100%)` }}
              />
            </>
          )}
          <div className="relative z-10 max-w-3xl px-12">
            {/* Accent line above title */}
            <div className="w-16 h-1 rounded-full mx-auto mb-6" style={{ background: `linear-gradient(90deg, ${themeStyles.accentColor}, ${themeStyles.titleColor})` }} />
            <h1 
              className="text-5xl font-extrabold mb-6 leading-tight drop-shadow-lg tracking-tight"
              style={{ color: themeStyles.titleColor }}
            >
              {currentSlide.title}
            </h1>
            <div className="w-24 h-0.5 rounded-full mx-auto mb-8 opacity-40" style={{ backgroundColor: themeStyles.contentColor }} />
            <div 
              className="text-xl leading-relaxed space-y-3 drop-shadow-md"
              style={{ color: themeStyles.contentColor }}
            >
              {currentSlide.content.split('\n').map((line, index) => (
                <p key={index} className="opacity-90">{line.replace('• ', '')}</p>
              ))}
            </div>
          </div>
        </div>
      ),
      
      'two-column': () => (
        <div className="w-full h-full flex p-12 relative overflow-hidden">
          {/* Decorative corner accent */}
          <div className="absolute top-0 left-0 w-2 h-24 rounded-br-full" style={{ backgroundColor: themeStyles.accentColor }} />
          <div className="absolute top-0 left-0 h-2 w-24 rounded-br-full" style={{ backgroundColor: themeStyles.accentColor }} />
          <div className="w-1/2 pr-8 flex flex-col justify-center">
            <div className="w-10 h-1 rounded-full mb-4" style={{ background: `linear-gradient(90deg, ${themeStyles.accentColor}, transparent)` }} />
            <h1 
              className="text-4xl font-extrabold mb-6 tracking-tight"
              style={{ color: themeStyles.titleColor }}
            >
              {currentSlide.title}
            </h1>
            <div 
              className="text-lg leading-relaxed space-y-3"
              style={{ color: themeStyles.contentColor }}
            >
              {currentSlide.content.split('\n').map((line, index) => (
                <p key={index} className="flex items-start group">
                  {line.startsWith('• ') && (
                    <span 
                      className="w-2 h-2 rounded-full mr-3 mt-2 flex-shrink-0 ring-2 ring-offset-1"
                      style={{ backgroundColor: themeStyles.accentColor, boxShadow: `0 0 0 2px ${themeStyles.accentColor}30` }}
                    />
                  )}
                  <span>{line.replace('• ', '')}</span>
                </p>
              ))}
            </div>
          </div>
          <div className="w-1/2 flex items-center justify-center pl-4">
            {imageUrl ? (
              <div className="relative w-full h-4/5 rounded-2xl overflow-hidden shadow-2xl">
                <img src={imageUrl} alt="Slide visual" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeStyles.accentColor}30, transparent 50%)` }} />
                {/* Decorative frame corner */}
                <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: `${themeStyles.titleColor}80` }} />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: `${themeStyles.titleColor}80` }} />
              </div>
            ) : (
              <div 
                className="w-full h-4/5 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${themeStyles.accentColor}20, ${themeStyles.accentColor}05)`, border: `1px solid ${themeStyles.accentColor}20` }}
              >
                <div className="text-center opacity-60">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3" style={{ background: `${themeStyles.accentColor}15`, border: `1px dashed ${themeStyles.accentColor}40` }}>
                    <span className="text-3xl">📊</span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: themeStyles.contentColor }}>Visual Content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
      
      'title-content': () => (
        <div className="w-full h-full flex p-12 overflow-hidden relative">
          {/* Subtle decorative circle */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full opacity-5" style={{ border: `3px solid ${themeStyles.accentColor}` }} />
          <div className={cn("flex flex-col justify-center", imageUrl ? "w-3/5 pr-8" : "w-full items-center text-center")}>
            <div className={cn("w-12 h-1 rounded-full mb-5", !imageUrl && "mx-auto")} style={{ background: `linear-gradient(90deg, ${themeStyles.accentColor}, ${themeStyles.accentColor}40)` }} />
            <h1 
              className="text-4xl font-extrabold mb-8 max-w-4xl tracking-tight"
              style={{ color: themeStyles.titleColor }}
            >
              {currentSlide.title}
            </h1>
            <div 
              className="text-xl leading-relaxed max-w-3xl space-y-4"
              style={{ color: themeStyles.contentColor }}
            >
              {currentSlide.content.split('\n').map((line, index) => (
                <p key={index} className={cn("flex items-start", !imageUrl && "justify-center")}>
                  {line.startsWith('• ') && (
                    <span 
                      className="w-2.5 h-2.5 rounded-full mr-4 mt-2 flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: themeStyles.accentColor, boxShadow: `0 0 8px ${themeStyles.accentColor}40` }}
                    />
                  )}
                  <span>{line.replace('• ', '')}</span>
                </p>
              ))}
            </div>
          </div>
          {imageUrl && (
            <div className="w-2/5 flex items-center justify-center">
              <div className="relative w-full h-4/5">
                {/* Shadow layer behind image */}
                <div className="absolute inset-2 rounded-2xl" style={{ background: themeStyles.accentColor, opacity: 0.15, filter: 'blur(20px)' }} />
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                  <img src={imageUrl} alt="Slide visual" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 50%, ${themeStyles.accentColor}25)` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      
      'grid': () => {
        const contentLines = currentSlide.content.split('\n').filter(line => line.trim());
        let gridItems = contentLines.map(line => line.replace('• ', ''));
        while (gridItems.length < 4) gridItems.push(`Point ${gridItems.length + 1}`);
        gridItems = gridItems.slice(0, 4);
        const gridIcons = ['💡', '🎯', '📊', '🚀'];
        
        return (
          <div className="w-full h-full p-12 relative overflow-hidden">
            {imageUrl && (
              <div className="absolute inset-0 bg-cover bg-center opacity-8" style={{ backgroundImage: `url(${imageUrl})` }} />
            )}
            {/* Decorative dots pattern */}
            <div className="absolute top-8 right-8 grid grid-cols-3 gap-1.5 opacity-15">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeStyles.accentColor }} />
              ))}
            </div>
            <div className="relative z-10">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: `linear-gradient(90deg, transparent, ${themeStyles.accentColor}, transparent)` }} />
              <h1 
                className="text-4xl font-extrabold mb-12 text-center tracking-tight"
                style={{ color: themeStyles.titleColor }}
              >
                {currentSlide.title}
              </h1>
              <div className="grid grid-cols-2 gap-6 h-2/3">
                {gridItems.map((item, index) => (
                  <div 
                    key={index}
                    className="rounded-2xl p-6 flex flex-col items-center justify-center text-center backdrop-blur-sm relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(145deg, ${themeStyles.accentColor}12, ${themeStyles.accentColor}04)`,
                      border: `1px solid ${themeStyles.accentColor}20`,
                      boxShadow: `0 8px 32px ${themeStyles.accentColor}08, inset 0 1px 0 ${themeStyles.accentColor}10`
                    }}
                  >
                    {/* Glow accent in corner */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20" style={{ background: themeStyles.accentColor, filter: 'blur(16px)' }} />
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${themeStyles.accentColor}, ${themeStyles.accentColor}bb)`, boxShadow: `0 4px 16px ${themeStyles.accentColor}30` }}
                    >
                      {gridIcons[index]}
                    </div>
                    <p 
                      className="text-lg font-semibold leading-snug"
                      style={{ color: themeStyles.contentColor }}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      },

      'image-left': () => (
        <div className="w-full h-full flex overflow-hidden">
          <div className="w-1/2 relative">
            {imageUrl ? (
              <>
                <img src={imageUrl} alt="Slide visual" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to right, transparent 60%, ${themeStyles.background?.includes('gradient') ? '#00000090' : themeStyles.background || '#ffffff'})` }} />
                {/* Decorative diagonal stripe */}
                <div className="absolute bottom-0 right-0 w-1 h-full" style={{ background: `linear-gradient(180deg, transparent, ${themeStyles.accentColor}60, transparent)` }} />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${themeStyles.accentColor}20, ${themeStyles.accentColor}05)` }}>
                <div className="absolute inset-8 border rounded-2xl opacity-20" style={{ borderColor: themeStyles.accentColor, borderStyle: 'dashed' }} />
                <div className="text-center opacity-50">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${themeStyles.accentColor}15` }}>
                    <span className="text-3xl">🖼️</span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: themeStyles.contentColor }}>Add Image</p>
                </div>
              </div>
            )}
          </div>
          <div className="w-1/2 flex flex-col justify-center p-12">
            <div className="w-10 h-1 rounded-full mb-4" style={{ background: `linear-gradient(90deg, ${themeStyles.accentColor}, transparent)` }} />
            <h1 
              className="text-4xl font-extrabold mb-6 tracking-tight"
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
                    <span className="w-2.5 h-2.5 rounded-full mr-3 mt-2 flex-shrink-0 shadow-sm" style={{ backgroundColor: themeStyles.accentColor, boxShadow: `0 0 6px ${themeStyles.accentColor}40` }} />
                  )}
                  <span>{line.replace('• ', '')}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      ),

      'quote': () => (
        <div className="w-full h-full flex flex-col justify-center items-center text-center p-16 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-16 left-16 w-40 h-40 rounded-full opacity-5" style={{ border: `2px solid ${themeStyles.accentColor}` }} />
          <div className="absolute bottom-16 right-16 w-56 h-56 rounded-full opacity-5" style={{ border: `2px solid ${themeStyles.accentColor}` }} />
          <div 
            className="text-9xl mb-4 opacity-20 font-serif leading-none"
            style={{ color: themeStyles.accentColor }}
          >
            ❝
          </div>
          <h1 
            className="text-3xl font-light italic mb-8 max-w-4xl leading-relaxed"
            style={{ color: themeStyles.titleColor }}
          >
            {currentSlide.title}
          </h1>
          <div className="w-16 h-0.5 rounded-full mb-6" style={{ background: `linear-gradient(90deg, transparent, ${themeStyles.accentColor}, transparent)` }} />
          <div 
            className="text-xl font-medium tracking-wide uppercase"
            style={{ color: themeStyles.contentColor }}
          >
            {currentSlide.content.split('\n')[0]?.replace('• ', '')}
          </div>
        </div>
      ),

      'comparison': () => {
        const contentLines = currentSlide.content.split('\n').filter(line => line.trim());
        const leftItems = contentLines.slice(0, 2).map(l => l.replace('• ', ''));
        const rightItems = contentLines.slice(2, 4).map(l => l.replace('• ', ''));
        
        return (
          <div className="w-full h-full p-12 relative overflow-hidden">
            {/* VS circle in center */}
            <h1 
              className="text-4xl font-extrabold mb-12 text-center tracking-tight"
              style={{ color: themeStyles.titleColor }}
            >
              {currentSlide.title}
            </h1>
            <div className="flex gap-6 h-2/3 relative">
              <div 
                className="flex-1 rounded-2xl p-8 relative overflow-hidden"
                style={{ background: `linear-gradient(145deg, ${themeStyles.accentColor}12, ${themeStyles.accentColor}04)`, border: `1px solid ${themeStyles.accentColor}20` }}
              >
                <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full opacity-15" style={{ background: themeStyles.accentColor, filter: 'blur(10px)' }} />
                <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: themeStyles.accentColor }}>
                  Option A
                </h2>
                <div className="space-y-4">
                  {leftItems.map((item, i) => (
                    <p key={i} className="flex items-start" style={{ color: themeStyles.contentColor }}>
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 text-xs text-white font-bold" style={{ background: themeStyles.accentColor }}>✓</span>
                      {item || `Point ${i + 1}`}
                    </p>
                  ))}
                </div>
              </div>
              {/* VS divider */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${themeStyles.accentColor}, ${themeStyles.accentColor}cc)`, boxShadow: `0 4px 16px ${themeStyles.accentColor}40` }}>
                  VS
                </div>
              </div>
              <div 
                className="flex-1 rounded-2xl p-8 relative overflow-hidden"
                style={{ background: `linear-gradient(145deg, ${themeStyles.accentColor}12, ${themeStyles.accentColor}04)`, border: `1px solid ${themeStyles.accentColor}20` }}
              >
                <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full opacity-15" style={{ background: themeStyles.accentColor, filter: 'blur(10px)' }} />
                <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: themeStyles.accentColor }}>
                  Option B
                </h2>
                <div className="space-y-4">
                  {rightItems.map((item, i) => (
                    <p key={i} className="flex items-start" style={{ color: themeStyles.contentColor }}>
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 text-xs text-white font-bold" style={{ background: themeStyles.accentColor }}>✓</span>
                      {item || `Point ${i + 1}`}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      },

      'stats': () => {
        const contentLines = currentSlide.content.split('\n').filter(line => line.trim());
        const stats = contentLines.slice(0, 4).map(l => l.replace('• ', ''));
        const gradients = [
          `linear-gradient(135deg, ${themeStyles.accentColor}20, ${themeStyles.accentColor}08)`,
          `linear-gradient(135deg, ${themeStyles.titleColor}15, ${themeStyles.titleColor}05)`,
          `linear-gradient(135deg, ${themeStyles.contentColor}20, ${themeStyles.contentColor}08)`,
          `linear-gradient(135deg, ${themeStyles.accentColor}15, ${themeStyles.accentColor}05)`,
        ];
        
        return (
          <div className="w-full h-full p-12 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(${themeStyles.accentColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
            <div className="relative z-10">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: `linear-gradient(90deg, transparent, ${themeStyles.accentColor}, transparent)` }} />
              <h1 
                className="text-4xl font-extrabold mb-16 text-center tracking-tight"
                style={{ color: themeStyles.titleColor }}
              >
                {currentSlide.title}
              </h1>
              <div className="grid grid-cols-4 gap-6 h-1/2">
                {stats.map((stat, index) => (
                  <div 
                    key={index}
                    className="flex flex-col items-center justify-center text-center rounded-2xl p-6 relative overflow-hidden"
                    style={{ background: gradients[index], border: `1px solid ${themeStyles.accentColor}15` }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-b-full" style={{ background: `linear-gradient(90deg, transparent, ${themeStyles.accentColor}60, transparent)` }} />
                    <div className="text-5xl mb-4">
                      {['📈', '🎯', '💡', '🚀'][index]}
                    </div>
                    <p 
                      className="text-lg font-semibold"
                      style={{ color: themeStyles.contentColor }}
                    >
                      {stat || `Stat ${index + 1}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
    };

    const LayoutComponent = layouts[layout as keyof typeof layouts] || layouts['title-content'];
    
    return (
      <div 
        className={cn(
          "w-full h-full relative transition-all duration-300",
          isTransitioning && slideDirection === 'right' && "animate-slide-in-right",
          isTransitioning && slideDirection === 'left' && "animate-slide-in-left"
        )}
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
    const currentSlide = slides[selectedSlide];
    
    // Prioritize manually selected theme over AI-generated style
    const themeToUse = currentSlide?.theme || currentTheme;
    
    // Only use AI style if no manual theme is selected AND theme is default/modern
    if (!currentSlide?.theme && currentTheme === 'modern' && currentSlide?.design_suggestion?.style) {
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
    return themes[themeToUse as keyof typeof themes] || themes.modern;
  };

  const getThemeStylesForTheme = (theme: string) => {
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
    return themes[theme as keyof typeof themes] || themes.modern;
  };

  const handlePreview = () => {
    const previewContent = slides.map((slide, index) => {
      const layout = slide.layout || 'title-content';
      const imageUrl = slide.design_suggestion?.image_url;
      const manualTheme = slide.theme || currentTheme;
      const shouldUseAiStyle = !slide.theme && currentTheme === 'modern' && !!slide.design_suggestion?.style;

      const themeStyles = shouldUseAiStyle ? {
        background: slide.design_suggestion!.style!.background_color || '#ffffff',
        titleColor: slide.design_suggestion!.style!.primary_color || '#2c3e50',
        contentColor: slide.design_suggestion!.style!.secondary_color || '#7f8c8d',
        accentColor: slide.design_suggestion!.style!.accent_color || '#667eea'
      } : getThemeStylesForTheme(manualTheme);

      const contentLines = slide.content.split('\n').filter(line => line.trim());

      // Generate HTML based on layout
      let layoutHtml = '';
      
      if (layout === 'hero') {
        layoutHtml = `
          <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; padding: 60px;">
            ${imageUrl ? `<div style="position: absolute; inset: 0; background-image: url(${imageUrl}); background-size: cover; background-position: center; opacity: 0.2;"></div>` : ''}
            <div style="position: relative; z-index: 10; max-width: 900px;">
              <h1 style="font-size: 3.5em; font-weight: bold; margin-bottom: 40px; line-height: 1.2; color: ${themeStyles.titleColor};">${slide.title}</h1>
              <div style="font-size: 1.5em; line-height: 1.8; color: ${themeStyles.contentColor};">
                ${contentLines.map(line => `<p style="margin: 20px 0;">${line.replace('• ', '')}</p>`).join('')}
              </div>
            </div>
          </div>
        `;
      } else if (layout === 'two-column') {
        layoutHtml = `
          <div style="width: 100%; height: 100%; display: flex; padding: 60px;">
            <div style="width: 50%; padding-right: 40px;">
              <h1 style="font-size: 2.5em; font-weight: bold; margin-bottom: 30px; color: ${themeStyles.titleColor};">${slide.title}</h1>
              <div style="font-size: 1.2em; line-height: 1.8; color: ${themeStyles.contentColor};">
                ${contentLines.map(line => `
                  <p style="display: flex; align-items: flex-start; margin: 15px 0;">
                    ${line.startsWith('• ') ? `<span style="width: 10px; height: 10px; border-radius: 50%; background: ${themeStyles.accentColor}; margin-right: 15px; margin-top: 8px; flex-shrink: 0;"></span>` : ''}
                    <span>${line.replace('• ', '')}</span>
                  </p>
                `).join('')}
              </div>
            </div>
            <div style="width: 50%; display: flex; align-items: center; justify-center;">
              ${imageUrl ? `<img src="${imageUrl}" alt="Visual" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);" />` : 
                `<div style="width: 300px; height: 300px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; background: ${themeStyles.accentColor};">
                  <div style="text-align: center;">
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2em;">📊</div>
                    <p style="font-size: 1em;">Visual Content</p>
                  </div>
                </div>`}
            </div>
          </div>
        `;
      } else if (layout === 'grid') {
        const gridItems = contentLines.map(line => line.replace('• ', '')).slice(0, 4);
        // Ensure we have at least 4 items
        while (gridItems.length < 4) {
          gridItems.push(`Point ${gridItems.length + 1}`);
        }
        layoutHtml = `
          <div style="width: 100%; height: 100%; padding: 60px;">
            <h1 style="font-size: 2.5em; font-weight: bold; margin-bottom: 60px; text-align: center; color: ${themeStyles.titleColor};">${slide.title}</h1>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; height: 60%;">
              ${gridItems.map((item, idx) => `
                <div style="border-radius: 10px; padding: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); background: rgba(${themeStyles.accentColor.replace('#', '')}, 0.1); border-left: 4px solid ${themeStyles.accentColor};">
                  <div style="width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: white; font-weight: bold; font-size: 1.5em; background: ${themeStyles.accentColor};">
                    ${idx + 1}
                  </div>
                  <p style="font-size: 1.2em; font-weight: 500; color: ${themeStyles.contentColor};">${item}</p>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else if (layout === 'image-left') {
        layoutHtml = `
          <div style="width: 100%; height: 100%; display: flex; padding: 60px;">
            <div style="width: 50%; display: flex; align-items: center; justify-content: center; padding-right: 40px;">
              ${imageUrl ? `<img src="${imageUrl}" alt="Visual" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);" />` : 
                `<div style="width: 300px; height: 300px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; background: ${themeStyles.accentColor};">
                  <div style="text-align: center;">
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2em;">🖼️</div>
                    <p style="font-size: 1em;">Add Image</p>
                  </div>
                </div>`}
            </div>
            <div style="width: 50%; display: flex; flex-direction: column; justify-content: center;">
              <h1 style="font-size: 2.5em; font-weight: bold; margin-bottom: 30px; color: ${themeStyles.titleColor};">${slide.title}</h1>
              <div style="font-size: 1.2em; line-height: 1.8; color: ${themeStyles.contentColor};">
                ${contentLines.map(line => `
                  <p style="display: flex; align-items: flex-start; margin: 15px 0;">
                    ${line.startsWith('• ') ? `<span style="width: 10px; height: 10px; border-radius: 50%; background: ${themeStyles.accentColor}; margin-right: 15px; margin-top: 8px; flex-shrink: 0;"></span>` : ''}
                    <span>${line.replace('• ', '')}</span>
                  </p>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      } else if (layout === 'quote') {
        const firstLine = contentLines[0]?.replace('• ', '') || '';
        layoutHtml = `
          <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 80px;">
            <div style="font-size: 8em; opacity: 0.3; color: ${themeStyles.accentColor};">"</div>
            <h1 style="font-size: 2em; font-weight: 300; font-style: italic; margin-bottom: 40px; max-width: 900px; line-height: 1.6; color: ${themeStyles.titleColor};">${slide.title}</h1>
            <div style="font-size: 1.3em; color: ${themeStyles.contentColor};">${firstLine}</div>
          </div>
        `;
      } else if (layout === 'comparison') {
        const leftItems = contentLines.slice(0, 2).map(l => l.replace('• ', ''));
        const rightItems = contentLines.slice(2, 4).map(l => l.replace('• ', ''));
        layoutHtml = `
          <div style="width: 100%; height: 100%; padding: 60px;">
            <h1 style="font-size: 2.5em; font-weight: bold; margin-bottom: 60px; text-align: center; color: ${themeStyles.titleColor};">${slide.title}</h1>
            <div style="display: flex; gap: 40px; height: 60%;">
              <div style="flex: 1; border-radius: 10px; padding: 40px; background: ${themeStyles.accentColor}15;">
                <h2 style="font-size: 1.5em; font-weight: 600; margin-bottom: 30px; text-align: center; color: ${themeStyles.accentColor};">Option A</h2>
                <div style="color: ${themeStyles.contentColor};">
                  ${leftItems.map((item, i) => `
                    <p style="display: flex; align-items: flex-start; margin: 20px 0;">
                      <span style="width: 8px; height: 8px; border-radius: 50%; background: ${themeStyles.accentColor}; margin-right: 12px; margin-top: 8px;"></span>
                      ${item || `Point ${i + 1}`}
                    </p>
                  `).join('')}
                </div>
              </div>
              <div style="width: 2px; background: ${themeStyles.accentColor};"></div>
              <div style="flex: 1; border-radius: 10px; padding: 40px; background: ${themeStyles.accentColor}15;">
                <h2 style="font-size: 1.5em; font-weight: 600; margin-bottom: 30px; text-align: center; color: ${themeStyles.accentColor};">Option B</h2>
                <div style="color: ${themeStyles.contentColor};">
                  ${rightItems.map((item, i) => `
                    <p style="display: flex; align-items: flex-start; margin: 20px 0;">
                      <span style="width: 8px; height: 8px; border-radius: 50%; background: ${themeStyles.accentColor}; margin-right: 12px; margin-top: 8px;"></span>
                      ${item || `Point ${i + 1}`}
                    </p>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (layout === 'stats') {
        const stats = contentLines.slice(0, 4).map(l => l.replace('• ', ''));
        const icons = ['📈', '🎯', '💡', '🚀'];
        layoutHtml = `
          <div style="width: 100%; height: 100%; padding: 60px;">
            <h1 style="font-size: 2.5em; font-weight: bold; margin-bottom: 80px; text-align: center; color: ${themeStyles.titleColor};">${slide.title}</h1>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; height: 40%;">
              ${stats.map((stat, i) => `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                  <div style="font-size: 4em; margin-bottom: 20px;">${icons[i]}</div>
                  <p style="font-size: 1.2em; font-weight: 500; color: ${themeStyles.contentColor};">${stat || `Stat ${i + 1}`}</p>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else { // title-content
        layoutHtml = `
          <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 60px;">
            ${imageUrl ? `<div style="margin-bottom: 40px;"><img src="${imageUrl}" alt="Visual" style="max-width: 400px; max-height: 300px; object-fit: contain; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);" /></div>` : ''}
            <h1 style="font-size: 2.5em; font-weight: bold; margin-bottom: 40px; max-width: 1000px; color: ${themeStyles.titleColor};">${slide.title}</h1>
            <div style="font-size: 1.3em; line-height: 1.8; max-width: 900px; color: ${themeStyles.contentColor};">
              ${contentLines.map(line => `
                <p style="display: flex; align-items: center; justify-content: center; margin: 15px 0;">
                  ${line.startsWith('• ') ? `<span style="width: 10px; height: 10px; border-radius: 50%; background: ${themeStyles.accentColor}; margin-right: 15px; flex-shrink: 0;"></span>` : ''}
                  <span>${line.replace('• ', '')}</span>
                </p>
              `).join('')}
            </div>
          </div>
        `;
      }

      return `
        <div style="
          page-break-after: always; 
          min-height: 100vh; 
          background: ${themeStyles.background};
          position: relative;
        ">
          ${layoutHtml}
          <div style="position: absolute; bottom: 30px; right: 30px; color: ${themeStyles.titleColor}; font-size: 1em; opacity: 0.6;">
            ${index + 1} / ${slides.length}
          </div>
        </div>
      `;
    }).join('');

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

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 120) return '1 minute ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 7200) return '1 hour ago';
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 172800) return '1 day ago';
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const openPracticeMode = () => {
    // Pass presentation ID and theme via URL - PresentationMode will fetch from Supabase
    const presentationId = id;
    const theme = currentTheme || 'modern';
    const title = encodeURIComponent(presentation?.title || 'Presentation');
    window.open(`/present?id=${presentationId}&theme=${theme}&title=${title}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Auto-save Recovery Banner */}
      {hasRecovery && (
        <div className="border-b bg-accent/10 animate-fade-in">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="w-4 h-4 text-accent" />
              <span>Unsaved changes recovered from your last session.</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" onClick={() => {
                const data = recover();
                if (data) {
                  setSlides(data.slides);
                  setCurrentTheme(data.theme);
                }
              }}>
                Restore
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

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
                <h1 className="font-semibold">{presentation?.title || 'Untitled Presentation'}</h1>
                <p className="text-xs text-muted-foreground">
                  {lastSaved ? `Last saved: ${getTimeSince(lastSaved)}` : 'Not saved yet'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openPracticeMode}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
              >
                <Play className="w-4 h-4 mr-2" />
                Practice Mode
              </Button>
              
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
                        <SelectItem value="vibrant">Vibrant - Dark with colors</SelectItem>
                        <SelectItem value="corporate">Corporate - Light blue</SelectItem>
                        <SelectItem value="dark">Dark - High contrast</SelectItem>
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
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        await trackAnalytics('download');
                        downloadSpeakerNotes(presentation?.title || "Presentation", slides);
                        toast({
                          title: "Downloaded",
                          description: "Speaker notes file has been downloaded",
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Speaker Notes
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
                    draggable
                    onDragStart={(e) => {
                      setDraggingSlideIndex(index);
                      setDragOverSlideIndex(null);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', String(index));
                    }}
                    onDragEnd={() => {
                      setDraggingSlideIndex(null);
                      setDragOverSlideIndex(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggingSlideIndex !== null && draggingSlideIndex !== index) {
                        setDragOverSlideIndex(index);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverSlideIndex === index) setDragOverSlideIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggingSlideIndex === null || draggingSlideIndex === index) return;
                      moveSlide(draggingSlideIndex, index);
                      setDraggingSlideIndex(null);
                      setDragOverSlideIndex(null);
                    }}
                    onClick={() => navigateToSlide(index)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors group ${
                      selectedSlide === index 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-muted-foreground/50'
                    } ${
                      dragOverSlideIndex === index && draggingSlideIndex !== null && draggingSlideIndex !== index
                        ? 'ring-2 ring-primary/40'
                        : ''
                    } ${draggingSlideIndex === index ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                          <span>Slide {index + 1}</span>
                          <Move className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
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
              {/* Preview Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={prevSlide}
                    disabled={selectedSlide === 0 || isTransitioning}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-3">
                    Slide {selectedSlide + 1} / {slides.length}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={nextSlide}
                    disabled={selectedSlide === slides.length - 1 || isTransitioning}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Keyboard className="w-4 h-4" />
                  <span>Use arrow keys to navigate</span>
                </div>
              </div>

              {/* Slide Preview with Transitions */}
              <div className="aspect-[16/9] bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                {renderSlidePreview()}
              </div>

              {/* Global Theme Selector */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Global Theme</h3>
                      <p className="text-xs text-muted-foreground">Apply to all slides</p>
                    </div>
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
                  Refine with AI
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refineSlide('concise')}
                    disabled={isLoading}
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Concise
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refineSlide('detailed')}
                    disabled={isLoading}
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Detailed
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refineSlide('professional')}
                    disabled={isLoading}
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Professional
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refineSlide('technical')}
                    disabled={isLoading}
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Technical
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => refineSlide('regenerate-bullets')}
                    disabled={isLoading}
                    className="col-span-2 bg-gradient-to-r from-primary to-accent"
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Regenerate 4 Bullets
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Image
                </label>
                <ImageManager onImageSelect={handleImageSelect} />
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
                    <SelectItem value="grid">Grid Layout (4 items)</SelectItem>
                    <SelectItem value="image-left">Image Left</SelectItem>
                    <SelectItem value="quote">Quote / Statement</SelectItem>
                    <SelectItem value="comparison">Comparison (2 sides)</SelectItem>
                    <SelectItem value="stats">Stats / Numbers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Per-Slide Theme Override */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  This Slide Theme
                  <span className="text-xs ml-1">(optional override)</span>
                </label>
                <Select
                  value={slides[selectedSlide]?.theme || 'default'}
                  onValueChange={(value) => {
                    const newSlides = [...slides];
                    newSlides[selectedSlide] = {
                      ...newSlides[selectedSlide],
                      theme: value === 'default' ? undefined : value
                    };
                    setSlides(newSlides);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Use Global Theme</SelectItem>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;