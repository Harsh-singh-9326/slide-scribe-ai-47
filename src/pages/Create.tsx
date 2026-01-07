import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Wand2, Loader2, Eye, Edit3, ArrowLeft, Check, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Step = "input" | "preview" | "generating";

const Create = () => {
  const [step, setStep] = useState<Step>("input");
  const [inputType, setInputType] = useState<"text" | "file">("text");
  const [textContent, setTextContent] = useState("");
  const [extractedContent, setExtractedContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("");
  const [slideCount, setSlideCount] = useState("auto");
  const [stylePreset, setStylePreset] = useState("minimal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const guestUser = localStorage.getItem('guest_user');
      if (guestUser) {
        const guestData = JSON.parse(guestUser);
        setUser(guestData);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [navigate]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        toast({
          title: "File uploaded",
          description: `${file.name} is ready for processing`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOCX, or TXT file",
          variant: "destructive",
        });
      }
    }
  };

  const extractContent = async () => {
    if (!textContent.trim() && !selectedFile) {
      toast({
        title: "Input Required",
        description: "Please provide either text content or upload a file.",
        variant: "destructive",
      });
      return;
    }

    const guestUser = localStorage.getItem('guest_user');

    // For text input, just use the text directly
    if (inputType === "text" || !selectedFile) {
      setExtractedContent(textContent);
      setStep("preview");
      return;
    }

    // For file input, extract text from file
    if (selectedFile && inputType === "file") {
      if (guestUser) {
        toast({
          title: "Guest Mode Limitation",
          description: "File upload is not available in guest mode. Please sign up or paste text.",
          variant: "destructive",
        });
        return;
      }

      setIsExtracting(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const formData = new FormData();
        formData.append('file', selectedFile);

        const fileResponse = await supabase.functions.invoke('process-file', {
          body: formData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });

        if (fileResponse.error) throw fileResponse.error;
        
        setExtractedContent(fileResponse.data.text);
        setStep("preview");
        
        toast({
          title: "Content Extracted",
          description: "Review and edit the extracted text before generating.",
        });
      } catch (error: any) {
        console.error('Extraction error:', error);
        toast({
          title: "Extraction Failed",
          description: error.message || "Failed to extract content from file.",
          variant: "destructive",
        });
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleGenerate = async () => {
    if (!extractedContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please provide content to generate a presentation.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate presentations.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setStep("generating");
    setIsGenerating(true);
    
    try {
      const guestUser = localStorage.getItem('guest_user');
      
      if (guestUser) {
        const mockPresentation = {
          id: 'guest-' + Date.now(),
          title: extractedContent.substring(0, 50) + '...',
          theme: template || 'modern',
          slide_count: slideCount === 'auto' ? 8 : parseInt(slideCount),
          content: Array.from({ length: slideCount === 'auto' ? 8 : parseInt(slideCount) }, (_, i) => ({
            title: `Slide ${i + 1}`,
            content: `This is slide ${i + 1} content based on: ${extractedContent.substring(0, 100)}...`,
            layout: 'title-content',
            notes: 'Speaker notes for this slide'
          })),
          created_at: new Date().toISOString(),
          user_id: guestUser
        };

        const existingPresentations = JSON.parse(localStorage.getItem('guest_presentations') || '[]');
        existingPresentations.unshift(mockPresentation);
        localStorage.setItem('guest_presentations', JSON.stringify(existingPresentations));

        toast({
          title: "Demo Presentation Created!",
          description: `Created "${mockPresentation.title}" with ${mockPresentation.slide_count} slides.`,
        });
        
        navigate(`/editor/${mockPresentation.id}`);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('generate-presentation', {
        body: {
          prompt: extractedContent,
          slideCount: slideCount === 'auto' ? 8 : parseInt(slideCount),
          theme: template || 'modern',
          stylePreset
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Presentation Generated!",
        description: `Created "${response.data.presentation.title}" with ${response.data.presentation.slides.length} slides.`,
      });
      
      navigate(`/editor/${response.data.presentation.id}`);
      
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate presentation. Please try again.",
        variant: "destructive",
      });
      setStep("preview");
    } finally {
      setIsGenerating(false);
    }
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharCount = (text: string) => {
    return text.length;
  };

  // Step 1: Input
  if (step === "input") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Presentation</h1>
              <p className="text-muted-foreground">
                Transform your content into stunning presentations with AI
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Choose Your Input Method</CardTitle>
                <CardDescription>
                  Start by uploading a document or pasting your text content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex space-x-4">
                  <Button
                    variant={inputType === "text" ? "default" : "outline"}
                    onClick={() => setInputType("text")}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Paste Text
                  </Button>
                  <Button
                    variant={inputType === "file" ? "default" : "outline"}
                    onClick={() => setInputType("file")}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                </div>

                {inputType === "text" && (
                  <div className="space-y-2">
                    <Label htmlFor="content">Your Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Paste your text content here... (e.g., research notes, meeting minutes, article content)"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                )}

                {inputType === "file" && (
                  <div className="space-y-2">
                    <Label htmlFor="file">Upload Document</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {selectedFile ? selectedFile.name : "Choose a file or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Supports PDF, DOCX, and TXT files (up to 10MB)
                      </p>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('file')?.click()}
                      >
                        Browse Files
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Presentation Settings</CardTitle>
                <CardDescription>
                  Customize how your presentation will be generated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Template Style</Label>
                    <Select value={template} onValueChange={setTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern Business</SelectItem>
                        <SelectItem value="minimal">Clean Minimal</SelectItem>
                        <SelectItem value="creative">Creative Bold</SelectItem>
                        <SelectItem value="professional">Professional Corporate</SelectItem>
                        <SelectItem value="academic">Academic Research</SelectItem>
                        <SelectItem value="startup">Startup Pitch</SelectItem>
                        <SelectItem value="elegant">Elegant Premium</SelectItem>
                        <SelectItem value="tech">Tech Innovation</SelectItem>
                        <SelectItem value="healthcare">Healthcare & Medical</SelectItem>
                        <SelectItem value="finance">Finance & Banking</SelectItem>
                        <SelectItem value="education">Educational</SelectItem>
                        <SelectItem value="marketing">Marketing & Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slides">Number of Slides</Label>
                    <Select value={slideCount} onValueChange={setSlideCount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Slide count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (AI decides)</SelectItem>
                        <SelectItem value="5">5 slides</SelectItem>
                        <SelectItem value="10">10 slides</SelectItem>
                        <SelectItem value="15">15 slides</SelectItem>
                        <SelectItem value="20">20 slides</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stylePreset">Visual Style (Gamma-like Design)</Label>
                  <Select value={stylePreset} onValueChange={setStylePreset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose visual style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">
                        <div className="flex flex-col">
                          <span className="font-medium">Minimal</span>
                          <span className="text-xs text-muted-foreground">Clean white background, simple icons</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="vibrant">
                        <div className="flex flex-col">
                          <span className="font-medium">Vibrant</span>
                          <span className="text-xs text-muted-foreground">Bright colors, bold typography, full-width images</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="corporate">
                        <div className="flex flex-col">
                          <span className="font-medium">Corporate</span>
                          <span className="text-xs text-muted-foreground">Professional blue/gray palette, graphs</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex flex-col">
                          <span className="font-medium">Dark Mode</span>
                          <span className="text-xs text-muted-foreground">Dark background, neon accents, high-contrast</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={extractContent}
                  disabled={isExtracting || (!textContent.trim() && !selectedFile)}
                  className="w-full bg-gradient-to-r from-primary to-accent text-lg py-6"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Extracting Content...
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5 mr-2" />
                      Preview & Edit Content
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Review and refine extracted content before generating
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Step 2: Preview & Edit
  if (step === "preview") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setStep("input")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Review & Edit Content</h1>
                <p className="text-muted-foreground text-sm">
                  Edit the extracted content before generating your presentation
                </p>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Edit3 className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Extracted Content</CardTitle>
                      <CardDescription>
                        This text will be used to generate your presentation slides
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {getWordCount(extractedContent)} words
                    </Badge>
                    <Badge variant="outline">
                      {getCharCount(extractedContent)} chars
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={extractedContent}
                  onChange={(e) => setExtractedContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm leading-relaxed"
                  placeholder="Edit your content here..."
                />
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Content will be analyzed and organized into {slideCount === "auto" ? "optimal" : slideCount} slides</span>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Generation Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Template</p>
                    <p className="font-medium capitalize">{template || "Modern"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Slides</p>
                    <p className="font-medium">{slideCount === "auto" ? "Auto" : `${slideCount} slides`}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Style</p>
                    <p className="font-medium capitalize">{stylePreset}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            <div className="flex gap-4">
              <Button 
                variant="outline"
                onClick={() => setStep("input")}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={!extractedContent.trim()}
                className="flex-[2] bg-gradient-to-r from-primary to-accent text-lg py-6"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Presentation
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Step 3: Generating
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Generating Your Presentation</h2>
          <p className="text-muted-foreground text-sm mb-4">
            AI is analyzing your content and creating slides...
          </p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Create;