import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FileText, Download, Calendar, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import PageTransition from "@/components/PageTransition";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [presentations, setPresentations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication and load data
    const init = async () => {
      // Check for guest user first
      const guestUser = localStorage.getItem('guest_user');
      if (guestUser) {
        const guestData = JSON.parse(guestUser);
        setUser(guestData);
        const guestPresentations = JSON.parse(localStorage.getItem('guest_presentations') || '[]');
        setPresentations(guestPresentations);
        setIsLoading(false);
        return;
      }

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUser(session.user);
      await loadPresentations(session.user.id);
    };
    init();
  }, [navigate]);

  const loadPresentations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPresentations(data || []);
    } catch (error: any) {
      console.error('Error loading presentations:', error);
      toast({
        title: "Error",
        description: "Failed to load presentations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const trackAnalytics = async (presentationId: string, eventType: 'view' | 'download') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('presentation_analytics').insert({
        presentation_id: presentationId,
        user_id: user.id,
        event_type: eventType,
        event_data: { timestamp: new Date().toISOString() }
      });

      // Update counter - get current count and increment
      const { data: presentation } = await supabase
        .from('presentations')
        .select(`${eventType}_count`)
        .eq('id', presentationId)
        .single();

      if (presentation) {
        await supabase
          .from('presentations')
          .update({ 
            [`${eventType}_count`]: (presentation[`${eventType}_count`] || 0) + 1
          })
          .eq('id', presentationId);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  const handleDownload = async (presentationId: string, format: 'pptx' | 'pdf', event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the presentation
    try {
      await trackAnalytics(presentationId, 'download');
      
      // Get presentation data
      const presentation = presentations.find(p => p.id === presentationId);
      if (!presentation) {
        toast({
          title: "Error",
          description: "Presentation not found",
          variant: "destructive",
        });
        return;
      }

      // Get slides data
      let slidesData = [];
      
      // Check if user is guest
      const guestUser = localStorage.getItem('guest_user');
      if (guestUser) {
        // For guest users, create simple slides from presentation
        slidesData = [
          {
            title: presentation.title,
            content: presentation.description || "Generated presentation content",
            notes: "Speaker notes"
          }
        ];
      } else {
        // For authenticated users, get actual slides from database
        const { data: slides, error } = await supabase
          .from('slides')
          .select('*')
          .eq('presentation_id', presentationId)
          .order('slide_order');

        if (error) throw error;
        slidesData = slides || [];
      }

      if (format === 'pptx') {
        await generatePPTX(presentation, slidesData);
      } else {
        await generatePDF(presentation, slidesData);
      }

      toast({
        title: "Download Complete",
        description: `Your ${format.toUpperCase()} has been downloaded`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export presentation",
        variant: "destructive",
      });
    }
  };

  const getThemeStylesForTheme = (theme: string) => {
    const themes = {
      modern: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        titleColor: '#ffffff',
        contentColor: '#f8fafc',
        accentColor: '#667eea'
      },
      professional: {
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        titleColor: '#ecf0f1',
        contentColor: '#bdc3c7',
        accentColor: '#3498db'
      },
      creative: {
        background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
        titleColor: '#2c3e50',
        contentColor: '#34495e',
        accentColor: '#e91e63'
      },
      minimal: {
        background: '#ffffff',
        titleColor: '#2c3e50',
        contentColor: '#7f8c8d',
        accentColor: '#95a5a6'
      },
      vibrant: {
        background: 'linear-gradient(135deg, #1A202C 0%, #2D3748 100%)',
        titleColor: '#F56565',
        contentColor: '#48BB78',
        accentColor: '#ED8936'
      },
      corporate: {
        background: '#F7FAFC',
        titleColor: '#2B6CB0',
        contentColor: '#4A5568',
        accentColor: '#38B2AC'
      },
      dark: {
        background: 'linear-gradient(135deg, #111111 0%, #1a1a1a 100%)',
        titleColor: '#00D4FF',
        contentColor: '#FF6B6B',
        accentColor: '#4ECDC4'
      }
    };
    return themes[theme as keyof typeof themes] || themes.modern;
  };

  const generatePPTX = async (presentation: any, slides: any[]) => {
    const pptx = await import('pptxgenjs');
    const pres = new pptx.default();

    const theme = presentation?.theme || 'modern';
    const themeStyles = getThemeStylesForTheme(theme);

    const bgToHex = (background: string) => {
      if (background.includes('gradient')) {
        const match = background.match(/#([0-9a-fA-F]{6})/);
        if (match) return match[1];
      }
      if (background.startsWith('#')) return background.replace('#', '');
      return 'FFFFFF';
    };

    const bgColor = bgToHex(themeStyles.background);
    const titleColor = themeStyles.titleColor.replace('#', '');
    const contentColor = themeStyles.contentColor.replace('#', '');

    slides.forEach((slide, index) => {
      const pptxSlide = pres.addSlide();
      pptxSlide.background = { color: bgColor };
      pptxSlide.addNotes(String(slide.notes || ''));

      pptxSlide.addText(String(slide.title || ''), {
        x: 0.5,
        y: 1,
        w: 9,
        h: 1,
        fontSize: 28,
        bold: true,
        align: 'center',
        color: titleColor,
      });

      const lines = String(slide.content || '').split('\n').filter((l) => l.trim());
      lines.forEach((line, i) => {
        pptxSlide.addText(String('• ' + line.replace('• ', '')), {
          x: 1,
          y: 2.3 + (i * 0.5),
          w: 8,
          h: 0.5,
          fontSize: 16,
          align: 'left',
          color: contentColor,
        });
      });

      pptxSlide.addText(`${index + 1} / ${slides.length}`, {
        x: 9,
        y: 6.8,
        w: 1,
        h: 0.3,
        fontSize: 10,
        align: 'right',
        color: titleColor,
      });
    });

    await pres.writeFile({ fileName: `${presentation.title}.pptx` });
  };

  const generatePDF = async (presentation: any, slides: any[]) => {
    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF('landscape', 'mm', 'a4');

    const theme = presentation?.theme || 'modern';
    const themeStyles = getThemeStylesForTheme(theme);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const bgHex = themeStyles.background.includes('gradient')
      ? ('#' + (themeStyles.background.match(/#([0-9a-fA-F]{6})/)?.[1] || 'FFFFFF'))
      : (themeStyles.background.startsWith('#') ? themeStyles.background : '#FFFFFF');

    const bg = hexToRgb(bgHex);
    const title = hexToRgb(themeStyles.titleColor);
    const content = hexToRgb(themeStyles.contentColor);

    slides.forEach((slide, index) => {
      if (index > 0) pdf.addPage('a4', 'landscape');

      pdf.setFillColor(bg.r, bg.g, bg.b);
      pdf.rect(0, 0, 297, 210, 'F');

      pdf.setTextColor(title.r, title.g, title.b);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(slide.title || ''), 148.5, 55, { align: 'center', maxWidth: 250 });

      pdf.setTextColor(content.r, content.g, content.b);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');

      const lines = String(slide.content || '').split('\n').filter((l) => l.trim());
      let yPos = 85;
      lines.forEach((line) => {
        pdf.text('• ' + line.replace('• ', ''), 148.5, yPos, { align: 'center', maxWidth: 220 });
        yPos += 14;
      });

      pdf.setFontSize(10);
      pdf.text(`${index + 1} / ${slides.length}`, 280, 200, { align: 'right' });
    });

    pdf.save(`${presentation.title}.pdf`);
  };

  const handleDelete = async (presentationId: string, presentationTitle: string) => {
    try {
      // Check if user is guest
      const guestUser = localStorage.getItem('guest_user');
      if (guestUser) {
        // Handle guest user deletion from localStorage
        const guestPresentations = JSON.parse(localStorage.getItem('guest_presentations') || '[]');
        const updatedPresentations = guestPresentations.filter((p: any) => p.id !== presentationId);
        localStorage.setItem('guest_presentations', JSON.stringify(updatedPresentations));
        setPresentations(updatedPresentations);
        toast({
          title: "Deleted",
          description: `"${presentationTitle}" has been deleted.`,
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Delete slides first (due to foreign key constraint)
      const { error: slidesError } = await supabase
        .from('slides')
        .delete()
        .eq('presentation_id', presentationId);

      if (slidesError) throw slidesError;

      // Then delete the presentation
      const { error: presentationError } = await supabase
        .from('presentations')
        .delete()
        .eq('id', presentationId);

      if (presentationError) throw presentationError;

      // Refresh the presentations list
      await loadPresentations(session.user.id);
      
      toast({
        title: "Deleted",
        description: `"${presentationTitle}" has been deleted.`,
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete presentation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <PageTransition>
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.full_name || user?.email || 'User'}! Manage your presentations and create new ones
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-primary to-accent">
            <Link to="/create">
              <Plus className="w-4 h-4 mr-2" />
              New Presentation
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Presentations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentations.length}</div>
              <p className="text-xs text-muted-foreground">
                Created with SlideForge AI
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Slides</CardTitle>
              <div className="h-4 w-4 bg-primary rounded text-primary-foreground text-xs flex items-center justify-center">
                {presentations.reduce((acc, p) => acc + (p.slide_count || 0), 0)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentations.reduce((acc, p) => acc + (p.slide_count || 0), 0)}</div>
              <p className="text-xs text-muted-foreground">
                Across all presentations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Generated</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentations.length}</div>
              <p className="text-xs text-muted-foreground">
                Powered by AI
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analytics Overview</CardTitle>
            <CardDescription>
              Track your presentation performance and engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{presentations.reduce((acc, p) => acc + (p.view_count || 0), 0)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">{presentations.reduce((acc, p) => acc + (p.download_count || 0), 0)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Most Downloaded</p>
                <p className="text-lg font-medium">{
                  presentations.length > 0
                    ? presentations.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))[0]?.title.slice(0, 30) + '...'
                    : 'N/A'
                }</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Presentations</CardTitle>
            <CardDescription>
              Your latest presentations and their download links
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {presentations.map((presentation) => (
                  <Card
                    key={presentation.id}
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => navigate(`/editor/${presentation.id}`)}
                  >
                    {/* Compact Preview Section */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted p-4 flex flex-col justify-between border-b">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="p-1.5 bg-gradient-to-br from-primary to-accent rounded-md">
                            <FileText className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <span className="text-[10px] text-muted-foreground capitalize px-2 py-0.5 bg-background/80 rounded-full">
                            {presentation.theme}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm line-clamp-2">{presentation.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {presentation.description || "AI-generated presentation"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(presentation.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-medium">{presentation.slide_count || 0} slides</span>
                      </div>
                    </div>

                    {/* Compact Actions Section */}
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={(e) => handleDownload(presentation.id, 'pptx', e)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          PPTX
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={(e) => handleDownload(presentation.id, 'pdf', e)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/editor/${presentation.id}`);
                          }}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive px-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Presentation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{presentation.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(presentation.id, presentation.title)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {presentations.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No presentations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first AI-powered presentation to get started.
                </p>
                <Button asChild>
                  <Link to="/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Presentation
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      </PageTransition>
    </div>
  );
};

export default Dashboard;