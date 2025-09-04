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
import PromptEditor from "@/components/PromptEditor";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

interface GenerationSettings {
  textAmount: number;
  contentType: 'generate' | 'condense' | 'preserve';
  viewMode: 'freeform' | 'card-by-card';
  slideCount: number;
  language: string;
}

const Create = () => {
  const [inputType, setInputType] = useState<"text" | "file">("text");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("");
  const [slideCount, setSlideCount] = useState("auto");
  const [stylePreset, setStylePreset] = useState("minimal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [extractedContent, setExtractedContent] = useState("");
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Set up PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }, []);

  // Client-side PDF text extraction
  const extractPDFText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 50); // Limit to 50 pages
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
        }
      }
      
      return fullText.trim() || 'No readable text found in PDF';
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Unable to extract text from this PDF. The file might be image-based, password-protected, or corrupted.');
    }
  };

  // Client-side DOCX text extraction using mammoth.js
  const extractDOCXText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || 'No readable text found in DOCX file';
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Unable to process DOCX file. Please try converting to PDF or TXT format.');
    }
  };

  // Client-side TXT text extraction
  const extractTXTText = async (file: File): Promise<string> => {
    try {
      const text = await file.text();
      return text;
    } catch (error) {
      console.error('TXT parsing error:', error);
      throw new Error('Unable to read text file.');
    }
  };

  // Process file client-side
  const processFileClientSide = async (file: File): Promise<string> => {
    const fileType = file.type;
    
    switch (fileType) {
      case 'application/pdf':
        return await extractPDFText(file);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await extractDOCXText(file);
      case 'text/plain':
        return await extractTXTText(file);
      default:
        throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
    }
  };

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      // Check for guest user first
      const guestUser = localStorage.getItem('guest_user');
      if (guestUser) {
        const guestData = JSON.parse(guestUser);
        setUser(guestData);
        return;
      }

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [navigate]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        setFileName(file.name);

        // Process file immediately and show prompt editor
        try {
          // Process file client-side instead of using edge function
          const extractedText = await processFileClientSide(file);
          
          setExtractedContent(extractedText);
          setShowPromptEditor(true);
          
          toast({
            title: "File processed",
            description: `${file.name} content extracted successfully`,
          });
        } catch (error: any) {
          console.error('File processing error:', error);
          toast({
            title: "Processing Failed",
            description: error.message || "Failed to process file. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOCX, or TXT file",
          variant: "destructive",
        });
      }
    }
  };

  const handlePromptEditorGenerate = async (content: string, settings: GenerationSettings) => {
    setIsGenerating(true);
    
    try {
      // Check if user is guest
      const guestUser = localStorage.getItem('guest_user');
      
      if (guestUser) {
        // For guest users, create a mock presentation and store in localStorage
        const mockPresentation = {
          id: 'guest-' + Date.now(),
          title: content.substring(0, 50) + '...',
          theme: template || 'modern',
          slide_count: settings.slideCount,
          content: Array.from({ length: settings.slideCount }, (_, i) => ({
            title: `Slide ${i + 1}`,
            content: content.substring(i * 100, (i + 1) * 100) + '...',
            layout: 'title-content',
            notes: 'Speaker notes for this slide'
          })),
          created_at: new Date().toISOString(),
          user_id: guestUser
        };

        // Store in localStorage
        const existingPresentations = JSON.parse(localStorage.getItem('guest_presentations') || '[]');
        existingPresentations.unshift(mockPresentation);
        localStorage.setItem('guest_presentations', JSON.stringify(existingPresentations));

        toast({
          title: "Demo Presentation Created!",
          description: `Created "${mockPresentation.title}" with ${mockPresentation.slide_count} slides in demo mode.`,
        });
        
        navigate(`/editor/${mockPresentation.id}`);
        return;
      }

      // Generate presentation with AI (for authenticated users)
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('generate-presentation', {
        body: {
          prompt: content,
          slideCount: settings.slideCount,
          theme: template || 'modern',
          stylePreset,
          textAmount: settings.textAmount,
          contentType: settings.contentType,
          language: settings.language
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

  const handleTextGenerate = async () => {
    if (!textContent.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide text content.",
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
      
      // Check if user is guest
      const guestUser = localStorage.getItem('guest_user');

      if (guestUser) {
        // For guest users, create a mock presentation and store in localStorage
        const mockPresentation = {
          id: 'guest-' + Date.now(),
          title: prompt.substring(0, 50) + '...',
          theme: template || 'modern',
          slide_count: slideCount === 'auto' ? 8 : parseInt(slideCount),
          content: Array.from({ length: slideCount === 'auto' ? 8 : parseInt(slideCount) }, (_, i) => ({
            title: `Slide ${i + 1}`,
            content: `This is slide ${i + 1} content based on: ${prompt.substring(0, 100)}...`,
            layout: 'title-content',
            notes: 'Speaker notes for this slide'
          })),
          created_at: new Date().toISOString(),
          user_id: guestUser
        };

        // Store in localStorage
        const existingPresentations = JSON.parse(localStorage.getItem('guest_presentations') || '[]');
        existingPresentations.unshift(mockPresentation);
        localStorage.setItem('guest_presentations', JSON.stringify(existingPresentations));

        toast({
          title: "Demo Presentation Created!",
          description: `Created "${mockPresentation.title}" with ${mockPresentation.slide_count} slides in demo mode.`,
        });
        
        navigate(`/editor/${mockPresentation.id}`);
        return;
      }

      // Generate presentation with AI (for authenticated users)
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('generate-presentation', {
        body: {
          prompt,
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

  // Show prompt editor if file was processed
  if (showPromptEditor) {
    return (
      <PromptEditor
        initialContent={extractedContent}
        fileName={fileName}
        onBack={() => {
          setShowPromptEditor(false);
          setExtractedContent('');
          setSelectedFile(null);
          setFileName('');
        }}
        onGenerate={handlePromptEditorGenerate}
        isGenerating={isGenerating}
      />
    );
  }

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
                onClick={handleTextGenerate}
                disabled={isGenerating || inputType === 'file'}
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