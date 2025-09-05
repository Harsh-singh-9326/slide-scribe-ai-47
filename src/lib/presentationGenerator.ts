import pptxgen from 'pptxgenjs';

interface SlideContent {
  title: string;
  content: string;
  notes?: string;
  layout?: string;
  imageUrl?: string;
}

interface GenerationSettings {
  textAmount: number;
  contentType: 'generate' | 'condense' | 'preserve';
  viewMode: 'freeform' | 'card-by-card';
  slideCount: number;
  language: string;
}

// Theme configurations for rich, Gamma-like presentations
const THEMES = {
  minimal: {
    background: '#FFFFFF',
    primary: '#1A1A1A',
    secondary: '#666666',
    accent: '#007AFF',
    font: 'Helvetica Neue'
  },
  modern: {
    background: '#F8F9FA',
    primary: '#212529',
    secondary: '#6C757D',
    accent: '#0D6EFD',
    font: 'Arial'
  },
  creative: {
    background: '#1A1A2E',
    primary: '#FFFFFF',
    secondary: '#16213E',
    accent: '#E94560',
    font: 'Impact'
  },
  professional: {
    background: '#FFFFFF',
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    accent: '#3498DB',
    font: 'Calibri'
  },
  academic: {
    background: '#FAFAFA',
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    accent: '#8E44AD',
    font: 'Times New Roman'
  }
};

// Content processing with AI-like intelligence
class ContentProcessor {
  static processContent(content: string, settings: GenerationSettings): SlideContent[] {
    const { slideCount, contentType, textAmount } = settings;
    
    // Split content into logical sections
    const sections = this.identifySections(content);
    const slides: SlideContent[] = [];
    
    // Create title slide
    slides.push({
      title: this.generateTitle(content),
      content: this.generateSubtitle(content),
      layout: 'title'
    });
    
    // Process content based on type
    if (contentType === 'generate') {
      return this.generateExpandedSlides(content, slideCount);
    } else if (contentType === 'condense') {
      return this.condenseToSlides(content, slideCount);
    } else {
      return this.preserveStructureSlides(content, slideCount);
    }
  }
  
  private static identifySections(content: string): string[] {
    // Smart section identification
    const sections = content.split(/\n\s*\n|(?:\r?\n){2,}/);
    return sections.filter(section => section.trim().length > 0);
  }
  
  private static generateTitle(content: string): string {
    // Extract or generate a compelling title
    const firstLine = content.split('\n')[0];
    if (firstLine.length < 100 && this.isTitle(firstLine)) {
      return firstLine.replace(/[#*]/g, '').trim();
    }
    
    // Generate title from content
    const words = content.split(' ').slice(0, 50).join(' ');
    const sentences = words.split(/[.!?]+/);
    return sentences[0]?.trim() || 'Presentation';
  }
  
  private static generateSubtitle(content: string): string {
    // Generate a compelling subtitle
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 1) {
      return sentences[1].trim().substring(0, 120) + (sentences[1].length > 120 ? '...' : '');
    }
    return 'Generated with AI';
  }
  
  private static isTitle(text: string): boolean {
    return text.length < 100 && 
           !text.includes('.') && 
           (text.includes(':') || !!text.match(/^[A-Z][a-z\s]+$/));
  }
  
  private static generateExpandedSlides(content: string, targetCount: number): SlideContent[] {
    const slides: SlideContent[] = [];
    const sections = this.identifySections(content);
    
    // Title slide
    slides.push({
      title: this.generateTitle(content),
      content: this.generateSubtitle(content),
      layout: 'title'
    });
    
    // Expand content across multiple slides
    const contentSlides = targetCount - 2; // Reserve space for title and conclusion
    const pointsPerSlide = Math.max(2, Math.floor(sections.length / contentSlides));
    
    for (let i = 0; i < contentSlides; i++) {
      const startIdx = i * pointsPerSlide;
      const endIdx = Math.min(startIdx + pointsPerSlide, sections.length);
      const slideContent = sections.slice(startIdx, endIdx);
      
      if (slideContent.length > 0) {
        slides.push({
          title: this.generateSlideTitle(slideContent[0], i + 1),
          content: slideContent.map(section => `• ${this.extractKeyPoint(section)}`).join('\n'),
          layout: 'content'
        });
      }
    }
    
    // Conclusion slide
    slides.push({
      title: 'Key Takeaways',
      content: this.generateSummary(content),
      layout: 'conclusion'
    });
    
    return slides;
  }
  
  private static condenseToSlides(content: string, targetCount: number): SlideContent[] {
    const slides: SlideContent[] = [];
    const sections = this.identifySections(content);
    
    // Title slide
    slides.push({
      title: this.generateTitle(content),
      content: this.generateSubtitle(content),
      layout: 'title'
    });
    
    // Condense content
    const contentSlides = targetCount - 1;
    const sectionsPerSlide = Math.ceil(sections.length / contentSlides);
    
    for (let i = 0; i < contentSlides; i++) {
      const startIdx = i * sectionsPerSlide;
      const endIdx = Math.min(startIdx + sectionsPerSlide, sections.length);
      const slideContent = sections.slice(startIdx, endIdx);
      
      if (slideContent.length > 0) {
        slides.push({
          title: this.generateSlideTitle(slideContent[0], i + 1),
          content: slideContent.map(section => `• ${this.extractKeyPoint(section)}`).join('\n'),
          layout: 'content'
        });
      }
    }
    
    return slides;
  }
  
  private static preserveStructureSlides(content: string, targetCount: number): SlideContent[] {
    const slides: SlideContent[] = [];
    const sections = this.identifySections(content);
    
    // Title slide
    slides.push({
      title: this.generateTitle(content),
      content: this.generateSubtitle(content),
      layout: 'title'
    });
    
    // Preserve original structure as much as possible
    const contentSlides = Math.min(targetCount - 1, sections.length);
    
    for (let i = 0; i < contentSlides; i++) {
      const section = sections[i];
      slides.push({
        title: this.generateSlideTitle(section, i + 1),
        content: this.formatSectionContent(section),
        layout: 'content'
      });
    }
    
    return slides;
  }
  
  private static generateSlideTitle(content: string, slideNumber: number): string {
    const firstSentence = content.split(/[.!?]+/)[0];
    if (firstSentence && firstSentence.length < 80) {
      return firstSentence.trim();
    }
    
    const words = content.split(' ').slice(0, 8).join(' ');
    return words.length > 60 ? words.substring(0, 60) + '...' : words;
  }
  
  private static extractKeyPoint(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    return sentences[0]?.trim().substring(0, 120) + (sentences[0]?.length > 120 ? '...' : '') || content.substring(0, 120);
  }
  
  private static formatSectionContent(section: string): string {
    const sentences = section.split(/[.!?]+/).filter(s => s.trim());
    return sentences.slice(0, 4).map(sentence => `• ${sentence.trim()}`).join('\n');
  }
  
  private static generateSummary(content: string): string {
    const sections = this.identifySections(content);
    const keyPoints = sections.slice(0, 4).map(section => 
      `• ${this.extractKeyPoint(section)}`
    );
    return keyPoints.join('\n');
  }
}

// Rich PPTX generator with Gamma-like features
export class PresentationGenerator {
  static async generatePresentation(
    content: string, 
    settings: GenerationSettings, 
    theme: string = 'modern'
  ): Promise<{ slides: SlideContent[], downloadUrl?: string }> {
    
    // Process content into slides
    const slides = ContentProcessor.processContent(content, settings);
    
    // Create PPTX with rich design
    const pptx = new pptxgen();
    const themeConfig = THEMES[theme as keyof typeof THEMES] || THEMES.modern;
    
    // Set presentation properties
    pptx.author = 'SlideForge AI';
    pptx.company = 'SlideForge';
    pptx.title = slides[0]?.title || 'AI Generated Presentation';
    
    // Configure slide master
    pptx.defineSlideMaster({
      title: 'SLIDE_MASTER',
      background: { color: themeConfig.background },
      objects: [
        // Logo placeholder
        {
          rect: {
            x: 0.2, y: 0.2, w: 1.5, h: 0.5,
            fill: { color: themeConfig.accent }
          }
        }
      ]
    });
    
    // Generate slides with rich layouts
    for (const slideContent of slides) {
      await this.createSlide(pptx, slideContent, themeConfig);
    }
    
    return { slides, downloadUrl: await this.exportPPTX(pptx, slides[0]?.title || 'presentation') };
  }
  
  private static async createSlide(pptx: any, slideContent: SlideContent, theme: any): Promise<void> {
    const slide = pptx.addSlide();
    
    switch (slideContent.layout) {
      case 'title':
        this.createTitleSlide(slide, slideContent, theme);
        break;
      case 'conclusion':
        this.createConclusionSlide(slide, slideContent, theme);
        break;
      default:
        this.createContentSlide(slide, slideContent, theme);
    }
  }
  
  private static createTitleSlide(slide: any, content: SlideContent, theme: any): void {
    // Background gradient
    slide.background = {
      fill: {
        type: 'gradient',
        colors: [
          { color: theme.background, position: 0 },
          { color: theme.accent + '20', position: 100 }
        ],
        direction: 'toBottom'
      }
    };
    
    // Main title
    slide.addText(content.title, {
      x: 0.5, y: 2.5, w: 9, h: 1.5,
      fontSize: 44,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      align: 'center',
      valign: 'middle'
    });
    
    // Subtitle
    slide.addText(content.content, {
      x: 1, y: 4.2, w: 8, h: 1,
      fontSize: 24,
      fontFace: theme.font,
      color: theme.secondary,
      align: 'center',
      valign: 'middle'
    });
    
    // Decorative accent
    slide.addShape('rect', {
      x: 4.5, y: 5.5, w: 1, h: 0.1,
      fill: { color: theme.accent }
    });
  }
  
  private static createContentSlide(slide: any, content: SlideContent, theme: any): void {
    // Background
    slide.background = { color: theme.background };
    
    // Title section with accent
    slide.addShape('rect', {
      x: 0, y: 0, w: 10, h: 1.2,
      fill: { 
        type: 'gradient',
        colors: [
          { color: theme.accent + '10', position: 0 },
          { color: theme.background, position: 100 }
        ]
      }
    });
    
    // Title
    slide.addText(content.title, {
      x: 0.5, y: 0.2, w: 9, h: 0.8,
      fontSize: 28,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      valign: 'middle'
    });
    
    // Content with bullets
    const contentLines = content.content.split('\n').filter(line => line.trim());
    
    contentLines.forEach((line, index) => {
      const cleanLine = line.replace('•', '').trim();
      
      // Bullet point
      slide.addShape('circle', {
        x: 0.8, y: 2 + (index * 0.8), w: 0.15, h: 0.15,
        fill: { color: theme.accent }
      });
      
      // Text
      slide.addText(cleanLine, {
        x: 1.2, y: 1.9 + (index * 0.8), w: 8, h: 0.6,
        fontSize: 18,
        fontFace: theme.font,
        color: theme.primary,
        valign: 'middle'
      });
    });
    
    // Add visual element on the right
    slide.addShape('rect', {
      x: 7.5, y: 2, w: 2, h: 3,
      fill: { 
        type: 'gradient',
        colors: [
          { color: theme.accent + '20', position: 0 },
          { color: theme.accent + '40', position: 100 }
        ]
      },
      line: { color: theme.accent, width: 2 }
    });
  }
  
  private static createConclusionSlide(slide: any, content: SlideContent, theme: any): void {
    // Similar to content slide but with special styling
    slide.background = {
      fill: {
        type: 'gradient',
        colors: [
          { color: theme.background, position: 0 },
          { color: theme.accent + '15', position: 100 }
        ]
      }
    };
    
    // Title
    slide.addText(content.title, {
      x: 0.5, y: 1, w: 9, h: 1,
      fontSize: 32,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      align: 'center'
    });
    
    // Content
    slide.addText(content.content, {
      x: 1, y: 2.5, w: 8, h: 3,
      fontSize: 20,
      fontFace: theme.font,
      color: theme.primary,
      align: 'center',
      valign: 'middle'
    });
  }
  
  private static async exportPPTX(pptx: any, filename: string): Promise<string> {
    try {
      await pptx.writeFile({ fileName: `${filename}.pptx` });
      return 'success'; // Return success indicator
    } catch (error) {
      console.error('Error exporting PPTX:', error);
      throw new Error('Failed to export presentation');
    }
  }
}