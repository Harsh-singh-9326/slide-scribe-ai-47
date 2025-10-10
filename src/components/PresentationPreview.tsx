import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
  id: string;
  title: string;
  content: string;
  notes?: string;
  layout?: string;
  theme?: string;
}

interface PresentationPreviewProps {
  slides: Slide[];
  onSlideReorder?: (fromIndex: number, toIndex: number) => void;
}

export const PresentationPreview = ({ slides, onSlideReorder }: PresentationPreviewProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setFocusedElement(null);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      setFocusedElement(null);
    }
  };

  const increaseZoom = () => {
    if (zoom < 150) setZoom(zoom + 10);
  };

  const decreaseZoom = () => {
    if (zoom > 50) setZoom(zoom - 10);
  };

  const moveSlideUp = (index: number) => {
    if (index > 0 && onSlideReorder) {
      onSlideReorder(index, index - 1);
      if (currentSlide === index) setCurrentSlide(index - 1);
    }
  };

  const moveSlideDown = (index: number) => {
    if (index < slides.length - 1 && onSlideReorder) {
      onSlideReorder(index, index + 1);
      if (currentSlide === index) setCurrentSlide(index + 1);
    }
  };

  const toggleFocus = (element: string) => {
    setFocusedElement(focusedElement === element ? null : element);
  };

  const slide = slides[currentSlide];
  if (!slide) return null;

  const contentLines = slide.content.split('\n').filter(l => l.trim());

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevSlide} disabled={currentSlide === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            {currentSlide + 1} / {slides.length}
          </span>
          <Button variant="outline" size="sm" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={decreaseZoom}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={increaseZoom}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant={focusedElement ? "default" : "outline"}
            size="sm"
            onClick={() => setFocusedElement(null)}
          >
            {focusedElement ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        {onSlideReorder && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => moveSlideUp(currentSlide)} disabled={currentSlide === 0}>
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => moveSlideDown(currentSlide)} disabled={currentSlide === slides.length - 1}>
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Preview */}
      <Card 
        className="relative bg-gradient-to-br from-background to-muted p-8 min-h-[500px] flex flex-col justify-center"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
      >
        <div
          className={cn(
            "space-y-6 transition-all duration-300",
            focusedElement && "filter blur-sm opacity-30"
          )}
          onClick={() => focusedElement && setFocusedElement(null)}
        >
          <h1
            className={cn(
              "text-4xl font-bold text-center transition-all duration-300 cursor-pointer",
              focusedElement === 'title' && "!filter-none !opacity-100 scale-105"
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleFocus('title');
            }}
          >
            {slide.title}
          </h1>

          <div className="space-y-4">
            {contentLines.map((line, index) => (
              <p
                key={index}
                className={cn(
                  "text-lg transition-all duration-300 cursor-pointer",
                  focusedElement === `content-${index}` && "!filter-none !opacity-100 scale-105"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFocus(`content-${index}`);
                }}
              >
                • {line.replace('• ', '')}
              </p>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
