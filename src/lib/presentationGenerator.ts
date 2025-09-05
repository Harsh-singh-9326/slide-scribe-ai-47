import pptxgen from 'pptxgenjs';

interface SlideContent {
  title: string;
  content: string;
  notes?: string;
  layout?: string;
  imageUrl?: string;
  backgroundType?: 'gradient' | 'solid' | 'pattern';
  icon?: string;
}

interface GenerationSettings {
  textAmount: number;
  contentType: 'generate' | 'condense' | 'preserve';
  viewMode: 'freeform' | 'card-by-card';
  slideCount: number;
  language: string;
}

// Theme configurations for rich, Gamma-like presentations with advanced design
const THEMES = {
  minimal: {
    background: '#FFFFFF',
    backgroundSecondary: '#FAFAFA',
    primary: '#1A1A1A',
    secondary: '#666666',
    accent: '#007AFF',
    accentLight: '#E3F2FD',
    font: 'Helvetica Neue',
    gradient: ['#FFFFFF', '#F5F7FA']
  },
  modern: {
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    primary: '#212529',
    secondary: '#6C757D',
    accent: '#0D6EFD',
    accentLight: '#E7F3FF',
    font: 'Inter',
    gradient: ['#FFFFFF', '#F8FAFC']
  },
  creative: {
    background: '#1A1A2E',
    backgroundSecondary: '#16213E',
    primary: '#FFFFFF',
    secondary: '#A0AEC0',
    accent: '#E94560',
    accentLight: '#2D3748',
    font: 'Poppins',
    gradient: ['#1A1A2E', '#16213E']
  },
  professional: {
    background: '#FFFFFF',
    backgroundSecondary: '#F7FAFC',
    primary: '#2D3748',
    secondary: '#718096',
    accent: '#3182CE',
    accentLight: '#EBF8FF',
    font: 'Roboto',
    gradient: ['#FFFFFF', '#F7FAFC']
  },
  vibrant: {
    background: '#FFFFFF',
    backgroundSecondary: '#FFF8E1',
    primary: '#1A202C',
    secondary: '#4A5568',
    accent: '#FF6B35',
    accentLight: '#FFEDD5',
    font: 'Montserrat',
    gradient: ['#FFFFFF', '#FFF8E1']
  }
};

// Hardcoded placeholder images and icons for offline use
const PLACEHOLDER_IMAGES = {
  business: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzVMMTI1IDEwMEgxNzVMMTUwIDc1WiIgZmlsbD0iIzM0ODJDRSIvPgo8cGF0aCBkPSJNMTI1IDEwMEgxNzVWMTI1SDEyNVYxMDBaIiBmaWxsPSIjNjM5MEZGIi8+CjwvYnZnPgo=',
  technology: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiMxMEI5ODEiLz4KPHN2Zz4K',
  education: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjEwMCIgeT0iNzUiIHdpZHRoPSIxMDAiIGhlaWdodD0iNTAiIGZpbGw9IiM4RDQ0QUQiLz4KPHN2Zz4K'
};

const ICONS = {
  lightbulb: '💡',
  chart: '📊',
  target: '🎯',
  rocket: '🚀',
  star: '⭐',
  heart: '❤️',
  check: '✅',
  arrow: '➡️'
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
    
    // Title slide with dynamic background
    slides.push({
      title: this.generateTitle(content),
      content: this.generateSubtitle(content),
      layout: 'title',
      backgroundType: 'gradient',
      imageUrl: this.selectImageForContent(content)
    });
    
    // Expand content across multiple slides with variety
    const contentSlides = targetCount - 2; // Reserve space for title and conclusion
    const pointsPerSlide = Math.max(2, Math.floor(sections.length / contentSlides));
    
    for (let i = 0; i < contentSlides; i++) {
      const startIdx = i * pointsPerSlide;
      const endIdx = Math.min(startIdx + pointsPerSlide, sections.length);
      const slideContent = sections.slice(startIdx, endIdx);
      
      if (slideContent.length > 0) {
        // Alternate layouts for visual interest
        const layouts = ['content', 'split', 'feature', 'list'];
        const layout = layouts[i % layouts.length];
        
        slides.push({
          title: this.generateSlideTitle(slideContent[0], i + 1),
          content: slideContent.map(section => `• ${this.extractKeyPoint(section)}`).join('\n'),
          layout: layout,
          backgroundType: i % 2 === 0 ? 'gradient' : 'solid',
          icon: this.selectIconForContent(slideContent[0]),
          imageUrl: i % 3 === 0 ? this.selectImageForContent(slideContent[0]) : undefined
        });
      }
    }
    
    // Conclusion slide with special styling
    slides.push({
      title: 'Key Takeaways',
      content: this.generateSummary(content),
      layout: 'conclusion',
      backgroundType: 'gradient',
      icon: ICONS.star
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
  
  private static selectImageForContent(content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('business') || lowerContent.includes('corporate') || lowerContent.includes('company')) {
      return PLACEHOLDER_IMAGES.business;
    } else if (lowerContent.includes('technology') || lowerContent.includes('digital') || lowerContent.includes('innovation')) {
      return PLACEHOLDER_IMAGES.technology;
    } else if (lowerContent.includes('education') || lowerContent.includes('learning') || lowerContent.includes('academic')) {
      return PLACEHOLDER_IMAGES.education;
    }
    return PLACEHOLDER_IMAGES.business; // Default
  }
  
  private static selectIconForContent(content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('idea') || lowerContent.includes('innovation')) return ICONS.lightbulb;
    if (lowerContent.includes('data') || lowerContent.includes('analytics') || lowerContent.includes('chart')) return ICONS.chart;
    if (lowerContent.includes('goal') || lowerContent.includes('target') || lowerContent.includes('objective')) return ICONS.target;
    if (lowerContent.includes('growth') || lowerContent.includes('launch') || lowerContent.includes('start')) return ICONS.rocket;
    if (lowerContent.includes('success') || lowerContent.includes('achievement') || lowerContent.includes('best')) return ICONS.star;
    return ICONS.arrow; // Default
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
      case 'split':
        this.createSplitSlide(slide, slideContent, theme);
        break;
      case 'feature':
        this.createFeatureSlide(slide, slideContent, theme);
        break;
      case 'list':
        this.createListSlide(slide, slideContent, theme);
        break;
      default:
        this.createContentSlide(slide, slideContent, theme);
    }
  }
  
  private static createTitleSlide(slide: any, content: SlideContent, theme: any): void {
    // Dynamic background
    if (content.backgroundType === 'gradient') {
      slide.background = {
        fill: {
          type: 'gradient',
          colors: [
            { color: theme.gradient[0], position: 0 },
            { color: theme.gradient[1], position: 100 }
          ],
          direction: 'toBottomRight'
        }
      };
    } else {
      slide.background = { color: theme.background };
    }
    
    // Background image if available
    if (content.imageUrl) {
      slide.addImage({
        data: content.imageUrl,
        x: 6, y: 2, w: 3, h: 2,
        transparency: 80
      });
    }
    
    // Main title with enhanced styling
    slide.addText(content.title, {
      x: 0.5, y: 2, w: 9, h: 1.8,
      fontSize: 48,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      align: 'center',
      valign: 'middle',
      shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, color: theme.accent + '30' }
    });
    
    // Subtitle with better styling
    slide.addText(content.content, {
      x: 1, y: 4, w: 8, h: 1.2,
      fontSize: 24,
      fontFace: theme.font,
      color: theme.secondary,
      align: 'center',
      valign: 'middle'
    });
    
    // Enhanced decorative elements
    slide.addShape('rect', {
      x: 3, y: 5.8, w: 4, h: 0.15,
      fill: { 
        type: 'gradient',
        colors: [
          { color: theme.accent, position: 0 },
          { color: theme.accent + '40', position: 100 }
        ]
      },
      line: { color: 'transparent' }
    });
    
    // Brand logo placeholder
    slide.addShape('rect', {
      x: 0.5, y: 0.3, w: 2, h: 0.8,
      fill: { color: theme.accentLight },
      line: { color: theme.accent, width: 2 }
    });
    
    slide.addText('LOGO', {
      x: 0.5, y: 0.3, w: 2, h: 0.8,
      fontSize: 16,
      fontFace: theme.font,
      color: theme.accent,
      bold: true,
      align: 'center',
      valign: 'middle'
    });
  }
  
  private static createContentSlide(slide: any, content: SlideContent, theme: any): void {
    // Dynamic background
    if (content.backgroundType === 'gradient') {
      slide.background = {
        fill: {
          type: 'gradient',
          colors: [
            { color: theme.background, position: 0 },
            { color: theme.backgroundSecondary, position: 100 }
          ],
          direction: 'toBottomRight'
        }
      };
    } else {
      slide.background = { color: theme.background };
    }
    
    // Header with icon
    slide.addShape('rect', {
      x: 0, y: 0, w: 10, h: 1.3,
      fill: { color: theme.accentLight },
      line: { color: 'transparent' }
    });
    
    // Icon
    if (content.icon) {
      slide.addText(content.icon, {
        x: 0.5, y: 0.3, w: 0.8, h: 0.7,
        fontSize: 32,
        align: 'center',
        valign: 'middle'
      });
    }
    
    // Title
    slide.addText(content.title, {
      x: 1.5, y: 0.2, w: 8, h: 0.9,
      fontSize: 32,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      valign: 'middle'
    });
    
    // Content with enhanced bullets
    const contentLines = content.content.split('\n').filter(line => line.trim());
    
    contentLines.forEach((line, index) => {
      const cleanLine = line.replace('•', '').trim();
      
      // Modern bullet point
      slide.addShape('rect', {
        x: 0.8, y: 2.1 + (index * 0.9), w: 0.25, h: 0.25,
        fill: { color: theme.accent }
      });
      
      // Text with better spacing
      slide.addText(cleanLine, {
        x: 1.3, y: 2 + (index * 0.9), w: 7.5, h: 0.7,
        fontSize: 20,
        fontFace: theme.font,
        color: theme.primary,
        valign: 'middle'
      });
    });
    
    // Image if available
    if (content.imageUrl) {
      slide.addImage({
        data: content.imageUrl,
        x: 6.5, y: 2.5, w: 3, h: 2,
        transparency: 20
      });
    } else {
      // Visual accent element
      slide.addShape('rect', {
        x: 7, y: 2.5, w: 2.5, h: 3,
        fill: { 
          type: 'gradient',
          colors: [
            { color: theme.accent + '15', position: 0 },
            { color: theme.accent + '25', position: 100 }
          ]
        },
        line: { color: theme.accent, width: 3 }
      });
    }
  }
  
  private static createSplitSlide(slide: any, content: SlideContent, theme: any): void {
    slide.background = { color: theme.background };
    
    // Left section
    slide.addShape('rect', {
      x: 0, y: 0, w: 5, h: 7.5,
      fill: { color: theme.accentLight }
    });
    
    // Title
    slide.addText(content.title, {
      x: 0.5, y: 1, w: 4, h: 1,
      fontSize: 28,
      fontFace: theme.font,
      color: theme.primary,
      bold: true
    });
    
    // Content
    slide.addText(content.content, {
      x: 0.5, y: 2.5, w: 4, h: 4,
      fontSize: 18,
      fontFace: theme.font,
      color: theme.primary
    });
    
    // Right section visual
    if (content.imageUrl) {
      slide.addImage({
        data: content.imageUrl,
        x: 5.5, y: 1, w: 4, h: 5
      });
    } else {
      slide.addShape('circle', {
        x: 6.5, y: 2, w: 2, h: 2,
        fill: { color: theme.accent }
      });
    }
  }
  
  private static createFeatureSlide(slide: any, content: SlideContent, theme: any): void {
    slide.background = {
      fill: {
        type: 'gradient',
        colors: [
          { color: theme.background, position: 0 },
          { color: theme.accentLight, position: 100 }
        ]
      }
    };
    
    // Center the content
    slide.addText(content.title, {
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 36,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      align: 'center'
    });
    
    // Feature content with emphasis
    slide.addShape('rect', {
      x: 2, y: 4, w: 6, h: 2,
      fill: { color: theme.background },
      line: { color: theme.accent, width: 3 }
    });
    
    slide.addText(content.content, {
      x: 2.5, y: 4.5, w: 5, h: 1,
      fontSize: 18,
      fontFace: theme.font,
      color: theme.primary,
      align: 'center',
      valign: 'middle'
    });
  }
  
  private static createListSlide(slide: any, content: SlideContent, theme: any): void {
    slide.background = { color: theme.background };
    
    // Header
    slide.addText(content.title, {
      x: 1, y: 0.5, w: 8, h: 1,
      fontSize: 32,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      align: 'center'
    });
    
    // List items with numbers
    const items = content.content.split('\n').filter(line => line.trim());
    items.forEach((item, index) => {
      const cleanItem = item.replace('•', '').trim();
      
      // Number circle
      slide.addShape('circle', {
        x: 1, y: 2.5 + (index * 1), w: 0.5, h: 0.5,
        fill: { color: theme.accent }
      });
      
      slide.addText((index + 1).toString(), {
        x: 1, y: 2.5 + (index * 1), w: 0.5, h: 0.5,
        fontSize: 18,
        fontFace: theme.font,
        color: 'white',
        bold: true,
        align: 'center',
        valign: 'middle'
      });
      
      slide.addText(cleanItem, {
        x: 2, y: 2.5 + (index * 1), w: 7, h: 0.5,
        fontSize: 18,
        fontFace: theme.font,
        color: theme.primary,
        valign: 'middle'
      });
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