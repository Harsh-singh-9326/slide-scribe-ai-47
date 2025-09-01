import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import pptxgen from "pptxgenjs";
import { jsPDF } from "jspdf";
import axios from "axios";

// Hard-coded API keys
const GEMINI_KEY = "AIzaSyD5jNyxXaWZFDL9r3NgpTJcl-5FSujLXOY";
const UNSPLASH_KEY = "9VPTzZOtlD9xor2IaksV09QHR4blueC4Gf4JarzMEP8";

type Slide = {
  title: string;
  content: string[];
  keywords: string;
  image?: string;
};

export default function Editor() {
  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate slides using Gemini
  const generateSlides = async () => {
    if (!topic.trim()) return alert("Please enter a topic");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generateMessage",
        {
          input: `You are an AI presentation maker. Generate exactly 7 slides for a presentation on the topic: "${topic}". 
          Each slide must have: title, content (3-4 bullet points), and keywords for images. 
          Respond in JSON array format. Example:
          [
            { "title": "...", "content": ["..."], "keywords": "..." }
          ]`,
        },
        {
          headers: {
            Authorization: `Bearer ${GEMINI_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      let content = response.data?.output?.[0]?.content?.[0]?.text || "";

      // Sanitize content to avoid JSON parse errors
      content = content.replace(/\n/g, "").trim();
      let parsedSlides: Slide[] = [];

      try {
        parsedSlides = JSON.parse(content);
      } catch {
        // Fallback in case of malformed JSON
        console.warn("Gemini returned invalid JSON. Using default template.");
        parsedSlides = Array.from({ length: 7 }).map((_, i) => ({
          title: `Slide ${i + 1}`,
          content: ["Point 1", "Point 2", "Point 3"],
          keywords: "placeholder",
        }));
      }

      // Fetch images for each slide
      const slidesWithImages = await Promise.all(
        parsedSlides.map(async (slide) => {
          const image = await fetchUnsplash(slide.keywords);
          return { ...slide, image };
        })
      );

      setSlides(slidesWithImages);
    } catch (error) {
      console.error("Error generating slides:", error);
      alert("Failed to generate slides. Using default template.");
      const defaultSlides = Array.from({ length: 7 }).map((_, i) => ({
        title: `Slide ${i + 1}`,
        content: ["Point 1", "Point 2", "Point 3"],
        keywords: "placeholder",
        image: "https://via.placeholder.com/800x600?text=No+Image",
      }));
      setSlides(defaultSlides);
    }

    setLoading(false);
  };

  // Fetch image from Unsplash
  const fetchUnsplash = async (keywords: string) => {
    try {
      const res = await axios.get(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
          keywords
        )}&client_id=${UNSPLASH_KEY}`
      );
      return res.data.urls.small;
    } catch (err) {
      console.error("Unsplash error:", err);
      return "https://via.placeholder.com/800x600?text=No+Image";
    }
  };

  // Export as PPTX
  const exportPPTX = () => {
    const pres = new pptxgen();

    slides.forEach((slide) => {
      const pptSlide = pres.addSlide();
      pptSlide.addText(slide.title, { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: "#222" });
      pptSlide.addText(slide.content.join("\n"), { x: 0.5, y: 2, fontSize: 18, color: "#333" });
      if (slide.image) {
        pptSlide.addImage({ path: slide.image, x: 6, y: 1.5, w: 3, h: 3 });
      }
    });

    pres.writeFile({ fileName: `${topic || "Presentation"}.pptx` });
  };

  // Export as PDF
  const exportPDF = () => {
    const pdf = new jsPDF();
    slides.forEach((slide, index) => {
      if (index > 0) pdf.addPage();
      pdf.setFontSize(22);
      pdf.text(slide.title, 20, 30);
      pdf.setFontSize(14);
      let y = 50;
      slide.content.forEach((point) => {
        pdf.text(`• ${point}`, 20, y);
        y += 10;
      });
    });
    pdf.save(`${topic || "Presentation"}.pdf`);
  };

  return (
    <div className="min-h-screen p-6">
      <Card className="max-w-3xl mx-auto p-6">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">AI Presentation Generator (Gemini)</h1>

          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter your presentation topic..."
            className="mb-4"
          />

          <Button onClick={generateSlides} disabled={loading}>
            {loading ? "Generating..." : "Generate Presentation"}
          </Button>

          {slides.length > 0 && (
            <>
              <div className="mt-6 space-y-4">
                {slides.map((slide, i) => (
                  <div key={i} className="border p-4 rounded-lg bg-gray-50">
                    <h2 className="text-xl font-semibold mb-2">{i + 1}. {slide.title}</h2>
                    <ul className="list-disc pl-6">
                      {slide.content.map((point, idx) => <li key={idx}>{point}</li>)}
                    </ul>
                    {slide.image && <img src={slide.image} alt="Slide visual" className="mt-3 rounded-lg shadow-md" />}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-4">
                <Button onClick={exportPPTX} className="bg-blue-600 text-white">Export as PPTX</Button>
                <Button onClick={exportPDF} variant="outline">Export as PDF</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
