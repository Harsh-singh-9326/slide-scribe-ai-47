import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wand2, Loader2, FileText, LayoutGrid, Plus, Minus } from "lucide-react";

interface PromptEditorProps {
  initialContent: string;
  fileName?: string;
  onBack: () => void;
  onGenerate: (content: string, settings: GenerationSettings) => void;
  isGenerating: boolean;
}

interface GenerationSettings {
  textAmount: number;
  contentType: 'generate' | 'condense' | 'preserve';
  viewMode: 'freeform' | 'card-by-card';
  slideCount: number;
  language: string;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ 
  initialContent, 
  fileName, 
  onBack, 
  onGenerate, 
  isGenerating 
}) => {
  const [content, setContent] = useState(initialContent);
  const [textAmount, setTextAmount] = useState([2]); // 0-4 scale (Minimal to Extensive)
  const [contentType, setContentType] = useState<'generate' | 'condense' | 'preserve'>('generate');
  const [viewMode, setViewMode] = useState<'freeform' | 'card-by-card'>('freeform');
  const [slideCount, setSlideCount] = useState(10);
  const [language, setLanguage] = useState('english-us');

  const handleGenerate = () => {
    const settings: GenerationSettings = {
      textAmount: textAmount[0],
      contentType,
      viewMode,
      slideCount,
      language
    };
    onGenerate(content, settings);
  };

  const getTextAmountLabel = (value: number) => {
    const labels = ['Minimal', 'Concise', 'Balanced', 'Detailed', 'Extensive'];
    return labels[value] || 'Balanced';
  };

  const renderFreeformView = () => (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-semibold text-lg mb-2">
          {fileName ? `Content from ${fileName}` : 'Your Content'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Abstract</p>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[300px] border-0 p-0 focus-visible:ring-0 resize-none bg-transparent"
          placeholder="Edit your content here..."
        />
      </div>
    </div>
  );

  const renderCardByCardView = () => {
    // Split content into cards based on paragraphs
    const cards = content.split('\n\n').filter(card => card.trim().length > 0);
    
    return (
      <div className="space-y-4">
        {cards.map((card, index) => (
          <Card key={index} className="bg-blue-50/50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {index + 1}
                </Badge>
                <span className="text-sm font-medium">
                  {card.split('\n')[0]?.substring(0, 60) || `Card ${index + 1}`}...
                </span>
              </div>
              <Textarea
                value={card}
                onChange={(e) => {
                  const newCards = [...cards];
                  newCards[index] = e.target.value;
                  setContent(newCards.join('\n\n'));
                }}
                className="min-h-[100px] border-0 p-0 focus-visible:ring-0 resize-none bg-transparent"
                placeholder="Card content..."
              />
            </CardContent>
          </Card>
        ))}
        
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setContent(content + '\n\nNew slide content...')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add new card
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">Prompt editor</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Text content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Type Buttons */}
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={contentType === 'generate' ? 'default' : 'outline'}
                      onClick={() => setContentType('generate')}
                      className="flex-1 h-8 text-xs"
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                    <Button
                      size="sm"
                      variant={contentType === 'condense' ? 'default' : 'outline'}
                      onClick={() => setContentType('condense')}
                      className="flex-1 h-8 text-xs"
                    >
                      Condense
                    </Button>
                    <Button
                      size="sm"
                      variant={contentType === 'preserve' ? 'default' : 'outline'}
                      onClick={() => setContentType('preserve')}
                      className="flex-1 h-8 text-xs"
                    >
                      Preserve
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Amount of Text */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Amount of text</Label>
                  <div className="px-2">
                    <Slider
                      value={textAmount}
                      onValueChange={setTextAmount}
                      max={4}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Minimal</span>
                      <span className="font-medium text-foreground">
                        {getTextAmountLabel(textAmount[0])}
                      </span>
                      <span>Extensive</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Output Language */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Output language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english-us">🇺🇸 English (US)</SelectItem>
                      <SelectItem value="english-uk">🇬🇧 English (UK)</SelectItem>
                      <SelectItem value="spanish">🇪🇸 Spanish</SelectItem>
                      <SelectItem value="french">🇫🇷 French</SelectItem>
                      <SelectItem value="german">🇩🇪 German</SelectItem>
                      <SelectItem value="chinese">🇨🇳 Chinese</SelectItem>
                      <SelectItem value="japanese">🇯🇵 Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
              <Button
                size="sm"
                variant={viewMode === 'freeform' ? 'default' : 'ghost'}
                onClick={() => setViewMode('freeform')}
                className="h-8 px-4"
              >
                <FileText className="w-4 h-4 mr-2" />
                Freeform
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'card-by-card' ? 'default' : 'ghost'}
                onClick={() => setViewMode('card-by-card')}
                className="h-8 px-4"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Card-by-card
              </Button>
            </div>

            {/* Content Display */}
            {viewMode === 'freeform' ? renderFreeformView() : renderCardByCardView()}
          </div>

          {/* Right Sidebar - Tips */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Additional instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Optional"
                  className="min-h-[80px] text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <div>
                  <h4 className="font-medium text-foreground mb-1">📝 Freeform</h4>
                  <p>Freeform lets you scale or shrink your content into as many cards as you want. For example, you can turn a long document into a concise presentation.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-1 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Card-by-card
                  </h4>
                  <p>Card-by-card lets you specify exactly where card breaks should go, so you can outline your content card by card.</p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-1">✏️ Editing cards</h4>
                  <p>Drag to rearrange, or type <code className="bg-muted px-1 py-0.5 rounded text-xs">---</code> to add new cards.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Generate Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-50">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSlideCount(Math.max(1, slideCount - 1))}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium min-w-[80px] text-center">
                  {slideCount} {slideCount === 1 ? 'card' : 'cards'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSlideCount(slideCount + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">total</span>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !content.trim()}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Bottom padding to account for fixed bar */}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default PromptEditor;