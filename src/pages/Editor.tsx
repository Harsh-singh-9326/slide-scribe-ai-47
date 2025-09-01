// src/pages/Editor.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Download, Plus, Trash2, Palette, Save, ArrowLeft, Eye,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ICON_EMOJI: Record<string, string> = {
  healthcare: "🩺",
  finance: "💹",
  agriculture: "🌾",
  ai: "🤖",
  analytics: "📊",
  education: "🎓",
  marketing: "📣",
  sustainability: "🌱",
  security: "🔒",
  cloud: "☁️",
  energy: "⚡",
  logistics: "🚚",
};

const Editor = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [currentTheme, setCurrentTheme] = useState("modern");
  const [isSaving, setIsSaving] = useState(false);
  const [presentation, setPresentation] = useState<any>(null);
  const [slides, setSlides] = useState<any[]>([
    {
      id: "1",
      title: "Introduction",
      content: "This is a sample slide.\nWith bullet-like lines.\nFor live preview.",
      notes: "",
      visual: null,
    },
  ]);

  // --- helpers ---
  const themes = {
    modern: { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", titleColor: "#ffffff", contentColor: "#f8fafc", accentColor: "#667eea" },
    professional: { background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)", titleColor: "#ecf0f1", contentColor: "#bdc3c7", accentColor: "#3498db" },
    creative: { background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)", titleColor: "#2c3e50", contentColor: "#34495e", accentColor: "#e91e63" },
    minimal: { background: "#ffffff", titleColor: "#2c3e50", contentColor: "#7f8c8d", accentColor: "#95a5a6" },
  } as const;

  const hex = (c?: string, fb = "#FFFFFF") => (c && /^#?[0-9a-fA-F]{6}$/.test(c) ? (c.startsWith("#") ? c : `#${c}`) : fb);

  const getThemeStyles = (slide?: any) => {
    const v = slide?.visual;
    if (v?.bgColor || v?.accentColor) {
      return {
        background: hex(v.bgColor, "#FFFFFF"),
        titleColor: hex(v.accentColor, "#111827"),
        contentColor: "#333333",
        accentColor: hex(v.bgColor, "#2563EB"),
      };
    }
    return (themes as any)[currentTheme] || themes.modern;
  };

  const addSlide = () => {
    const newSlide = {
      id: Date.now().toString(),
      title: "New Slide",
      content: "Enter your slide content here...",
      notes: "",
      visual: null,
    };
    setSlides((s) => [...s, newSlide]);
    setSelectedSlide(slides.length);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    const ns = slides.filter((_, i) => i !== idx);
    setSlides(ns);
    setSelectedSlide(Math.max(0, idx - 1));
  };

  const updateSlide = (field: "title" | "content" | "notes", value: string) => {
    setSlides((prev) => {
      const cp = [...prev];
      cp[selectedSlide] = { ...cp[selectedSlide], [field]: value };
      return cp;
    });
  };

  // --- load presentation from DB ---
  useEffect(() => {
    if (id && id !== "new") void loadPresentation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPresentation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: presentationData, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      setPresentation(presentationData);
      setCurrentTheme(presentationData.theme || "modern");

      const { data: slidesData, error: slidesError } = await supabase
        .from("slides")
        .select("*")
        .eq("presentation_id", id)
        .order("slide_order");
      if (slidesError) throw slidesError;

      if (slidesData?.length) {
        const formatted = slidesData.map((sl: any) => ({
          id: sl.id,
          title: sl.title,
          content: sl.content || "",
          notes: sl.notes || "",
          visual: sl.visual || null,
        }));
        setSlides(formatted);
      }
    } catch (err: any) {
      console.error("load error:", err);
      toast({ title: "Error", description: "Failed to load presentation", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Authentication Required", description: "Please sign in to save", variant: "destructive" });
        return;
      }
      if (id && id !== "new") {
        // update presentation meta
        const { error: updateError } = await supabase
          .from("presentations")
          .update({ theme: currentTheme, slide_count: slides.length, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (updateError) throw updateError;

        // replace slides
        const { error: delErr } = await supabase.from("slides").delete().eq("presentation_id", id);
        if (delErr) throw delErr;

        const bulk = slides.map((s, i) => ({
          presentation_id: id,
          title: s.title,
          content: s.content,
          notes: s.notes,
          slide_order: i + 1,
          layout: "title-content",
          visual: s.visual || null,
        }));
        const { error: insErr } = await supabase.from("slides").insert(bulk);
        if (insErr) throw insErr;
      }

      toast({ title: "Saved", description: "Presentation saved!" });
    } catch (err: any) {
      console.error("save error:", err);
      toast({ title: "Save Failed", description: err.message || "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // local export using your existing client-side method stays as-is
  const generatePPTX = async (pres: any, localSlides: any[]) => {
    const pptx = (await import("pptxgenjs")).default;
    const deck = new pptx();
    deck.layout = "16x9";

    // cover
    const cov = deck.addSlide();
    cov.addText(pres.title || "Presentation", { x: 0.5, y: 2, w: 9, h: 1.2, fontSize: 44, bold: true, align: "center", color: "363636" });

    localSlides.forEach((sl, idx) => {
      const slide = deck.addSlide();

      const v = sl.visual || {};
      const bg = hex(v.bgColor, "#FFFFFF");
      const ac = hex(v.accentColor, "#2563EB");
      (slide as any).background = { color: bg };

      const icon = v.icon ? (ICON_EMOJI[v.icon] ?? "📌") : "";
      if (icon) slide.addText(icon, { x: 0.5, y: 0.3, w: 1, h: 0.6, fontSize: 28 });

      slide.addText(sl.title || "Untitled", {
        x: 1.2, y: 0.3, w: 8.3, h: 0.8, fontSize: 32, bold: true, color: ac, align: "left", fontFace: "Poppins",
      });

      const bullets = (sl.content || "").split("\n").filter((b: string) => b.trim()).map((b: string) => `• ${b}`);
      slide.addText(bullets.length ? bullets : [" "], {
        x: 1.0, y: 1.6, w: 8.6, h: 5.5, fontSize: 20, bullet: true, color: "303030", fontFace: "Roboto",
      });

      slide.addText(`${idx + 1} / ${localSlides.length}`, { x: 9.0, y: 6.7, w: 1.2, h: 0.4, fontSize: 12, align: "right", color: "808080" });
    });

    await deck.writeFile({ fileName: `${pres.title || "Presentation"}.pptx` });
  };

  const generatePDF = async (pres: any, localSlides: any[]) => {
    const jsPDF = (await import("jspdf")).default;
    const pdf = new jsPDF();

    localSlides.forEach((sl, i) => {
      if (i > 0) pdf.addPage();
      pdf.setFontSize(24); pdf.setFont("helvetica", "bold");
      pdf.text(sl.title || "Untitled", 105, 40, { align: "center" });
      pdf.setFontSize(14); pdf.setFont("helvetica", "normal");
      const split = pdf.splitTextToSize((sl.content || "").split("\n").map((b: string) => `• ${b}`).join("\n"), 170);
      pdf.text(split, 20, 80);
      pdf.setFontSize(10); pdf.text(`${i + 1} / ${localSlides.length}`, 190, 280, { align: "right" });
    });

    pdf.save(`${pres.title || "Presentation"}.pdf`);
  };

  const handleExport = async (format: "pptx" | "pdf") => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Authentication Required", description: "Please sign in to export", variant: "destructive" });
        return;
      }
      if (!id || id === "new") {
        toast({ title: "Save Required", description: "Save your presentation before exporting", variant: "destructive" });
        return;
      }

      // client export (kept); alternatively call your server /export endpoint
      const pres = { title: presentation?.title || "Presentation", ...presentation };
      if (format === "pptx") await generatePPTX(pres, slides);
      else await generatePDF(pres, slides);

      toast({ title: "Export Complete", description: `${format.toUpperCase()} downloaded` });
    } catch (err: any) {
      console.error("export error:", err);
      toast({ title: "Export Failed", description: err.message || "Failed to export", variant: "destructive" });
    }
  };

  const handlePreview = () => {
    const s = slides[selectedSlide];
    const t = getThemeStyles(s);
    const icon = s?.visual?.icon ? (ICON_EMOJI[s.visual.icon] ?? "📌") : "";
    const html = `
      <div style="page-break-after: always; padding: 60px; min-height: 100vh; background:${t.background};
                  display:flex; flex-direction:column; justify-content:center; position:relative;">
        <div style="font-size: 3em; color: ${t.titleColor}; text-align:center; font-weight:bold; margin-bottom: 16px;">
          ${icon ? `${icon} ` : ""}${s?.title || ""}
        </div>
        <div style="font-size: 1.3em; color:${t.contentColor}; text-align:center; max-width: 900px; margin: 0 auto;">
          ${(s?.content || "").replace(/\n/g, "<br>")}
        </div>
      </div>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<!doctype html><html><head><title>Preview</title><style>body{margin:0;font-family:system-ui;-webkit-font-smoothing:antialiased}</style></head><body>${html}</body></html>`);
      win.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* top bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Link>
              </Button>
              <div>
                <h1 className="font-semibold">{presentation?.title || "Presentation"}</h1>
                <p className="text-xs text-muted-foreground">Auto-saved when you click Save</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreview}><Eye className="w-4 h-4 mr-2" />Preview</Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"><Palette className="w-4 h-4 mr-2" />Theme</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Choose Theme</DialogTitle>
                    <DialogDescription>Fallback theme when slides have no AI colors</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={currentTheme} onValueChange={setCurrentTheme}>
                      <SelectTrigger><SelectValue placeholder="Select a theme" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={async () => await handleSave()} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />{isSaving ? "Saving..." : "Save"}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                    <Download className="w-4 h-4 mr-2" />Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Presentation</DialogTitle>
                    <DialogDescription>Choose a format</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Button onClick={() => handleExport("pptx")} className="w-full"><Download className="w-4 h-4 mr-2" />Export as PPTX</Button>
                    <Button onClick={() => handleExport("pdf")} variant="outline" className="w-full"><Download className="w-4 h-4 mr-2" />Export as PDF</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* left sidebar */}
        <div className="w-64 border-r bg-muted/20 overflow-y-auto">
          <div className="p-4">
            <Button onClick={addSlide} variant="outline" size="sm" className="w-full mb-4">
              <Plus className="w-4 h-4 mr-2" />Add Slide
            </Button>

            <div className="space-y-2">
              {slides.map((sl, idx) => {
                const icon = sl?.visual?.icon ? (ICON_EMOJI[sl.visual.icon] ?? "📌") : "";
                return (
                  <div key={sl.id} onClick={() => setSelectedSlide(idx)}
                       className={`p-3 border rounded-lg cursor-pointer transition-colors group ${selectedSlide === idx ? "border-primary bg-primary/10" : "border-muted hover:border-muted-foreground/50"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">Slide {idx + 1}</div>
                        <div className="text-sm font-medium truncate">{icon ? `${icon} ` : ""}{sl.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{(sl.content || "").substring(0, 60)}...</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* main editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* AI Theme Preview */}
                  <div className="mb-6 p-4 rounded-lg border-2 border-dashed border-muted-foreground/20">
                    <div className="p-6 rounded-lg text-center" style={{
                      background: getThemeStyles(slides[selectedSlide]).background,
                      color: getThemeStyles(slides[selectedSlide]).titleColor,
                    }}>
                      <h3 className="text-lg font-semibold mb-2">
                        Theme Preview: {slides[selectedSlide]?.visual ? "AI (slide-specific)" : currentTheme}
                      </h3>
                      <p style={{ color: getThemeStyles(slides[selectedSlide]).contentColor }}>
                        Colors reflect the current slide’s AI visual hints (if present) or your selected theme.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Slide Title</label>
                    <Input
                      value={slides[selectedSlide]?.title || ""}
                      onChange={(e) => updateSlide("title", e.target.value)}
                      className="mt-1 text-2xl font-bold border-0 px-0 focus-visible:ring-0"
                      placeholder="Enter slide title..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Slide Content (one bullet per line)</label>
                    <Textarea
                      value={slides[selectedSlide]?.content || ""}
                      onChange={(e) => updateSlide("content", e.target.value)}
                      className="mt-1 min-h-40 border-0 px-0 focus-visible:ring-0 resize-none"
                      placeholder="• Bullet 1\n• Bullet 2\n• Bullet 3"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-muted-foreground">Speaker Notes</label>
                    <Textarea
                      value={slides[selectedSlide]?.notes || ""}
                      onChange={(e) => updateSlide("notes", e.target.value)}
                      className="mt-1 min-h-20 border-0 px-0 focus-visible:ring-0 resize-none text-sm"
                      placeholder="Add speaker notes for this slide..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border-t p-4 bg-muted/20">
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <span>Slide {selectedSlide + 1} of {slides.length}</span>
              <span>•</span>
              <span>AI visuals supported</span>
              <span>•</span>
              <span>Export uses Unsplash (if configured)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
