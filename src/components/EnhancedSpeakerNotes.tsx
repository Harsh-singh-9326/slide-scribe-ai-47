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
  ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedSpeakerNotesProps {
  slideTitle: string;
  slideContent: string;
  notes?: string;
  isVisible: boolean;
  onClose: () => void;
}

interface AIEnhancement {
  expandedNotes: string;
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
  onClose 
}: EnhancedSpeakerNotesProps) => {
  const [enhancement, setEnhancement] = useState<AIEnhancement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");
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
      // Fallback content
      setEnhancement({
        expandedNotes: notes || `This slide covers "${slideTitle}". Focus on the key points and engage your audience with relevant examples.`,
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-9">
                  <TabsTrigger value="notes" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Notes
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

                <ScrollArea className="h-[200px] mt-3">
                  <TabsContent value="notes" className="m-0 space-y-3">
                    {notes && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <FileText className="w-4 h-4" />
                          Your Notes
                        </div>
                        <p className="text-sm text-muted-foreground">{notes}</p>
                      </div>
                    )}
                    
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
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default EnhancedSpeakerNotes;
