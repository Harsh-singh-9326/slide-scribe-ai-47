import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FileText, Download, Calendar, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
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

  const handleDownload = async (presentationId: string, format: 'pptx' | 'pdf', event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the presentation
    try {
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

  const generatePPTX = async (presentation: any, slides: any[]) => {
    const pptx = await import('pptxgenjs');
    const pres = new pptx.default();

    slides.forEach((slide, index) => {
      const pptxSlide = pres.addSlide();
      
      // Add title
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 1,
        w: 9,
        h: 1,
        fontSize: 24,
        bold: true,
        align: 'center',
        color: '363636'
      });

      // Add content
      pptxSlide.addText(slide.content || '', {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 4,
        fontSize: 16,
        align: 'left',
        color: '666666',
        valign: 'top'
      });

      // Add slide number
      pptxSlide.addText(`${index + 1}`, {
        x: 9,
        y: 6.8,
        w: 1,
        h: 0.3,
        fontSize: 12,
        align: 'right',
        color: '999999'
      });
    });

    await pres.writeFile({ fileName: `${presentation.title}.pptx` });
  };

  const generatePDF = async (presentation: any, slides: any[]) => {
    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF();

    slides.forEach((slide, index) => {
      if (index > 0) pdf.addPage();

      // Add title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(slide.title, 105, 40, { align: 'center' });

      // Add content
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      const splitContent = pdf.splitTextToSize(slide.content || '', 170);
      pdf.text(splitContent, 20, 80);

      // Add slide number
      pdf.setFontSize(10);
      pdf.text(`${index + 1} / ${slides.length}`, 190, 280, { align: 'right' });
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
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading presentations...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {presentations.map((presentation) => (
                  <div
                    key={presentation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/editor/${presentation.id}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{presentation.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground space-x-4">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(presentation.created_at).toLocaleDateString()}
                          </span>
                          <span>{presentation.slide_count || 0} slides</span>
                          <span className="capitalize">{presentation.theme}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => handleDownload(presentation.id, 'pptx', e)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PPTX
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => handleDownload(presentation.id, 'pdf', e)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
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
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4" />
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
                  </div>
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
    </div>
  );
};

export default Dashboard;