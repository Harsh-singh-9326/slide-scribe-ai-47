import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Wand2, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Create = () => {
  const [inputType, setInputType] = useState<"text" | "file">("text");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("");
  const [slideCount, setSlideCount] = useState("auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
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

  const handleGenerate = async () => {
    if (!textContent.trim() && !selectedFile) {
      toast({
        title: "Input Required",
        description: "Please provide either text content or upload a file.",
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

    setIsGenerating(true);
    
    try {
      let prompt = textContent;
      
      // If file is selected, process it first
      if (selectedFile && inputType === "file") {
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
        
        prompt = fileResponse.data.text;
      }

      // Generate presentation with AI
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('generate-presentation', {
        body: {
          prompt,
          slideCount: slideCount === 'auto' ? 8 : parseInt(slideCount),
          theme: template || 'modern'
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
      
      // Navigate to editor with the new presentation
      navigate(`/editor/${response.data.presentation.id}`);
      
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate presentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
              {/* Input Type Selection */}
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

              {/* Text Input */}
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

              {/* File Upload */}
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-primary to-accent text-lg py-6"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Presentation...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate AI Presentation
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                This will analyze your content and create a professional presentation
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Create;