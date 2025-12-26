import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideLap {
  slideIndex: number;
  slideTitle: string;
  duration: number; // in seconds
}

interface PresentationTimerProps {
  currentSlide: number;
  slideTitle: string;
  totalSlides: number;
  onSlideChange?: (slideIndex: number) => void;
}

export const PresentationTimer = ({ 
  currentSlide, 
  slideTitle, 
  totalSlides,
}: PresentationTimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // Total time in seconds
  const [slideStartTime, setSlideStartTime] = useState(0); // When current slide started
  const [slideLaps, setSlideLaps] = useState<SlideLap[]>([]);
  const [previousSlide, setPreviousSlide] = useState(currentSlide);

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Track slide changes to record lap times
  useEffect(() => {
    if (isRunning && currentSlide !== previousSlide) {
      const slideDuration = elapsedTime - slideStartTime;
      
      // Record the previous slide's lap
      if (slideDuration > 0) {
        setSlideLaps(prev => {
          // Check if we already have a lap for this slide
          const existingIndex = prev.findIndex(lap => lap.slideIndex === previousSlide);
          if (existingIndex >= 0) {
            // Update existing lap
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              duration: updated[existingIndex].duration + slideDuration
            };
            return updated;
          }
          // Add new lap
          return [...prev, {
            slideIndex: previousSlide,
            slideTitle: slideTitle,
            duration: slideDuration
          }];
        });
      }
      
      setSlideStartTime(elapsedTime);
      setPreviousSlide(currentSlide);
    }
  }, [currentSlide, isRunning, elapsedTime, slideStartTime, previousSlide, slideTitle]);

  const handleStart = useCallback(() => {
    if (!isRunning && elapsedTime === 0) {
      setSlideStartTime(0);
      setPreviousSlide(currentSlide);
    }
    setIsRunning(true);
  }, [isRunning, elapsedTime, currentSlide]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setElapsedTime(0);
    setSlideStartTime(0);
    setSlideLaps([]);
    setPreviousSlide(currentSlide);
  }, [currentSlide]);

  const currentSlideTime = elapsedTime - slideStartTime;
  const averageTimePerSlide = slideLaps.length > 0 
    ? Math.round(slideLaps.reduce((sum, lap) => sum + lap.duration, 0) / slideLaps.length)
    : 0;
  const estimatedRemaining = averageTimePerSlide * (totalSlides - currentSlide - 1);

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-4">
        {/* Main Timer Display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Presentation Timer</span>
          </div>
          <div 
            className={cn(
              "text-4xl font-mono font-bold tracking-wider transition-colors",
              isRunning ? "text-primary" : "text-foreground"
            )}
          >
            {formatTime(elapsedTime)}
          </div>
          {isRunning && (
            <div className="text-sm text-muted-foreground mt-1">
              Current slide: {formatTime(currentSlideTime)}
            </div>
          )}
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <Button 
              onClick={handleStart} 
              size="sm" 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Play className="w-4 h-4 mr-1" />
              {elapsedTime > 0 ? 'Resume' : 'Start'}
            </Button>
          ) : (
            <Button 
              onClick={handlePause} 
              size="sm" 
              variant="secondary"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          <Button 
            onClick={handleReset} 
            size="sm" 
            variant="outline"
            disabled={elapsedTime === 0}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        {/* Stats */}
        {(slideLaps.length > 0 || isRunning) && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Slides covered:</span>
              <span className="font-medium">{slideLaps.length + 1} / {totalSlides}</span>
            </div>
            {averageTimePerSlide > 0 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Avg per slide:</span>
                  <span className="font-medium">{formatTime(averageTimePerSlide)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Est. remaining:</span>
                  <span className="font-medium">{formatTime(estimatedRemaining)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Slide Laps */}
        {slideLaps.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-1 mb-2">
              <Flag className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Slide Times</span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {slideLaps.map((lap, index) => (
                <div 
                  key={index}
                  className="flex justify-between text-xs bg-muted/50 rounded px-2 py-1"
                >
                  <span className="truncate flex-1 mr-2">
                    Slide {lap.slideIndex + 1}
                  </span>
                  <span className="font-mono font-medium">
                    {formatTime(lap.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
