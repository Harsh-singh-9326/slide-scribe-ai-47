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

// Enhanced image service with API integration and fallbacks
class ImageService {
  private static UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '9VPTzZOtlD9xor2IaksV09QHR4blueC4Gf4JarzMEP8'; 
  private static STABILITY_API_KEY = process.env.STABILITY_API_KEY || 'sk-VN7IxtX3BaiIqezoKLKu2gILSg4sbBReAXuSozhc9eiR2ZLF';
  
  // High-quality hardcoded images as fallbacks
  private static PLACEHOLDER_IMAGES = {
    business: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzMxODJDRTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2MzkwRkY7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZzEpIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMzAwIiByPSIxMDAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjIiLz48cGF0aCBkPSJNMzUwIDI1MEw0NTAgMjUwTDQ1MCAzNTBMMzUwIDM1MFoiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=',
    technology: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnMiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzEwQjk4MTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NEQ5RkY7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZzIpIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMzAwIiByPSI4MCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMiIvPjxwb2x5Z29uIHBvaW50cz0iNDAwLDIyMCA0NjAsMyAwIDM0MCwzMDAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=',
    education: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnMyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izg0NEFEQTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNBQjdCRkY7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZzMpIi8+PHJlY3QgeD0iMjUwIiB5PSIyMDAiIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4yIi8+PHJlY3QgeD0iMzAwIiB5PSIyNTAiIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+',
    marketing: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnNCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I0ZCN0M2RDtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGRkE3Mjg7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZzQpIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMzAwIiByPSIxMjAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjE1Ii8+PHBhdGggZD0iTTM1MCAyNDBMNDUwIDI0MEw0MjAgMzYwTDM4MCAzNjBaIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4yNSIvPjwvc3ZnPg==',
    finance: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnNSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzFENEVEODtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM0QzUxQkY7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZzUpIi8+PHBhdGggZD0iTTIwMCAzMDBMMzAwIDIwMEw0MDAgMjgwTDUwMCAxODBMNjAwIDI0MCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI2IiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjMiLz48Y2lyY2xlIGN4PSI2MDAiIGN5PSIyNDAiIHI9IjE1IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC40Ii8+PC9zdmc+'
  };

  static async fetchImageFromUnsplash(query: string): Promise<string> {
    // Always return fallback to avoid API issues
    if (!this.UNSPLASH_ACCESS_KEY) {
      return this.getFallbackImage(query);
    }
    
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${this.UNSPLASH_ACCESS_KEY}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].urls.regular;
        }
      }
    } catch (error) {
      console.warn('Unsplash API failed, using fallback:', error);
    }
    
    return this.getFallbackImage(query);
  }

  static async fetchImageFromStability(prompt: string): Promise<string> {
    try {
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.STABILITY_API_KEY}`
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: 512,
          width: 768,
          steps: 30,
          samples: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.artifacts && data.artifacts.length > 0) {
          return `data:image/png;base64,${data.artifacts[0].base64}`;
        }
      }
    } catch (error) {
      console.warn('Stability AI failed:', error);
    }
    
    return this.getFallbackImage(prompt);
  }

  static getFallbackImage(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('business') || lowerQuery.includes('corporate') || lowerQuery.includes('office')) {
      return this.PLACEHOLDER_IMAGES.business;
    } else if (lowerQuery.includes('technology') || lowerQuery.includes('tech') || lowerQuery.includes('digital') || lowerQuery.includes('ai')) {
      return this.PLACEHOLDER_IMAGES.technology;
    } else if (lowerQuery.includes('education') || lowerQuery.includes('learning') || lowerQuery.includes('school') || lowerQuery.includes('academic')) {
      return this.PLACEHOLDER_IMAGES.education;
    } else if (lowerQuery.includes('marketing') || lowerQuery.includes('social') || lowerQuery.includes('brand')) {
      return this.PLACEHOLDER_IMAGES.marketing;
    } else if (lowerQuery.includes('finance') || lowerQuery.includes('money') || lowerQuery.includes('investment') || lowerQuery.includes('chart')) {
      return this.PLACEHOLDER_IMAGES.finance;
    }
    
    return this.PLACEHOLDER_IMAGES.business; // Default fallback
  }

  static async getImageForContent(content: string): Promise<string> {
    // Try Unsplash first, then Stability AI, then fallback
    const keywords = this.extractKeywords(content);
    const query = keywords.slice(0, 3).join(' ');
    
    // Try Unsplash first (free API with good images)
    let imageUrl = await this.fetchImageFromUnsplash(query);
    
    // If Unsplash fails and we have Stability AI, try that
    if (imageUrl.includes('data:image/svg+xml') && this.STABILITY_API_KEY !== 'YOUR_STABILITY_KEY') {
      imageUrl = await this.fetchImageFromStability(`professional ${query} presentation slide background`);
    }
    
    return imageUrl;
  }

  private static extractKeywords(content: string): string[] {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall'];
    
    return content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 5);
  }
}

const ICONS = {
  lightbulb: '💡',
  chart: '📊',
  target: '🎯',
  rocket: '🚀',
  star: '⭐',
  heart: '❤️',
  check: '✅',
  arrow: '➡️',
  growth: '📈',
  idea: '🧠',
  team: '👥',
  world: '🌍',
  trophy: '🏆',
  diamond: '💎'
};

// Enhanced logo generator
class LogoService {
  static generateCompanyLogo(theme: any): string {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${theme.accent};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${theme.accent}80;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#logoGrad)"/>
        <text x="45" y="25" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${theme.primary}">SlideForge</text>
        <circle cx="20" cy="20" r="8" fill="white" opacity="0.3"/>
        <polygon points="20,14 26,26 14,26" fill="white" opacity="0.8"/>
      </svg>
    `)}`;
  }
}

// Content processing with AI-like intelligence
class ContentProcessor {
  static async processContent(content: string, settings: GenerationSettings): Promise<SlideContent[]> {
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
      return await this.generateExpandedSlides(content, slideCount);
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
  
  private static async generateExpandedSlides(content: string, targetCount: number): Promise<SlideContent[]> {
    const slides: SlideContent[] = [];
    const sections = this.identifySections(content);
    
    // Title slide with dynamic background
    const titleImageUrl = await ImageService.getImageForContent(content);
    
    slides.push({
      title: this.generateTitle(content),
      content: this.generateSubtitle(content),
      layout: 'title',
      backgroundType: 'gradient',
      imageUrl: titleImageUrl
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
        
      const slideImageUrl = await ImageService.getImageForContent(slideContent[0]);
      
      slides.push({
        title: this.generateSlideTitle(slideContent[0], i + 1),
        content: slideContent.map(section => `• ${this.extractKeyPoint(section)}`).join('\n'),
        layout: layout,
        backgroundType: i % 2 === 0 ? 'gradient' : 'solid',
        icon: this.selectIconForContent(slideContent[0]),
        imageUrl: slideImageUrl
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
  
  private static async selectImageForContent(content: string): Promise<string> {
    return await ImageService.getImageForContent(content);
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
    const slides = await ContentProcessor.processContent(content, settings);
    
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
    slide.addText(content.title || '', {
      x: 0.5, y: 2, w: 9, h: 1.8,
      fontSize: 48,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      align: 'center',
      valign: 'middle',
      shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, color: theme.accent.replace('#', '') + '30' }
    });
    
    // Subtitle with better styling
    slide.addText(content.content || '', {
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
    
    // Company logo
    try {
      const logoUrl = LogoService.generateCompanyLogo(theme);
      slide.addImage({
        data: logoUrl,
        x: 0.5, y: 0.3, w: 2.4, h: 0.8
      });
    } catch (error) {
      // Fallback logo
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
    slide.addText((content.title || '').toString(), {
      x: 1.5, y: 0.2, w: 8, h: 0.9,
      fontSize: 32,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      valign: 'middle'
    });
    
    // Content with enhanced bullets
    const contentLines = (content.content || '').toString().split('\n').filter(line => line.trim());
    
    contentLines.forEach((line, index) => {
      const cleanLine = (line || '').replace('•', '').trim();
      
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
    slide.addText((content.title || '').toString(), {
      x: 0.5, y: 1, w: 4, h: 1,
      fontSize: 28,
      fontFace: theme.font,
      color: theme.primary,
      bold: true
    });
    
    // Content
    slide.addText((content.content || '').toString(), {
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
    slide.addText((content.title || '').toString(), {
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
    
    slide.addText((content.content || '').toString(), {
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
    slide.addText((content.title || '').toString(), {
      x: 1, y: 0.5, w: 8, h: 1,
      fontSize: 32,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      align: 'center'
    });
    
    // List items with numbers
    const items = (content.content || '').toString().split('\n').filter(line => line.trim());
    items.forEach((item, index) => {
      const cleanItem = (item || '').replace('•', '').trim();
      
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
    slide.addText((content.title || '').toString(), {
      x: 0.5, y: 1, w: 9, h: 1,
      fontSize: 32,
      fontFace: theme.font,
      color: theme.primary,
      bold: true,
      align: 'center'
    });
    
    // Content
    slide.addText((content.content || '').toString(), {
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
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'presentation';
      await pptx.writeFile({ fileName: `${sanitizedFilename}.pptx` });
      return `${sanitizedFilename}.pptx downloaded successfully`;
    } catch (error) {
      console.error('Error exporting PPTX:', error);
      throw new Error(`Failed to export presentation: ${error.message}`);
    }
  }
}
