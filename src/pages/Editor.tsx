import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";

const Editor = () => {
  const { id } = useParams();
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [slides, setSlides] = useState([
    {
      id: 1,
      title: "Introduction to Marketing Strategy",
      content: "Welcome to our comprehensive marketing strategy presentation for Q1 2024. This presentation will cover key objectives, target audiences, and strategic initiatives.",
      notes: "Start with enthusiasm and engage the audience with the quarterly goals."
    },
    {
      id: 2,
      title: "Market Analysis Overview",
      content: "Current market trends show significant growth in digital channels. Our analysis reveals three key opportunities for expansion and competitive advantage.",
      notes: "Highlight the data-driven insights and reference the quarterly report."
    },
    {
      id: 3,
      title: "Strategic Objectives",
      content: "Our primary objectives include: 1) Increase brand awareness by 25%, 2) Expand market share in key demographics, 3) Launch new product line successfully.",
      notes: "Emphasize measurable goals and timeline expectations."
    }
  ]);

  const addSlide = () => {
    const newSlide = {
      id: slides.length + 1,
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
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Palette className="w-4 h-4 mr-2" />
                Theme
              </Button>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
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
        <div className="flex-1 flex flex-col">
          {/* Slide Preview */}
          <div className="flex-1 p-6 overflow-y-auto">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Slide Title
                    </label>
                    <Input
                      value={slides[selectedSlide]?.title || ''}
                      onChange={(e) => updateSlide('title', e.target.value)}
                      className="mt-1 text-2xl font-bold border-0 px-0 focus-visible:ring-0"
                      placeholder="Enter slide title..."
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Slide Content
                    </label>
                    <Textarea
                      value={slides[selectedSlide]?.content || ''}
                      onChange={(e) => updateSlide('content', e.target.value)}
                      className="mt-1 min-h-40 border-0 px-0 focus-visible:ring-0 resize-none"
                      placeholder="Enter slide content..."
                    />
                  </div>

                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-muted-foreground">
                      Speaker Notes
                    </label>
                    <Textarea
                      value={slides[selectedSlide]?.notes || ''}
                      onChange={(e) => updateSlide('notes', e.target.value)}
                      className="mt-1 min-h-20 border-0 px-0 focus-visible:ring-0 resize-none text-sm"
                      placeholder="Add speaker notes for this slide..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor Footer */}
          <div className="border-t p-4 bg-muted/20">
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <span>Slide {selectedSlide + 1} of {slides.length}</span>
              <span>•</span>
              <span>Use AI to enhance content</span>
              <span>•</span>
              <span>Auto-save enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;