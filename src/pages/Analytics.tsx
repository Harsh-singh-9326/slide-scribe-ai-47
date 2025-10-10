import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, Eye, Edit, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PresentationStats {
  id: string;
  title: string;
  view_count: number;
  download_count: number;
  theme: string;
  created_at: string;
}

const Analytics = () => {
  const [presentations, setPresentations] = useState<PresentationStats[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Load presentations with stats
      const { data: presentationsData, error: presError } = await supabase
        .from('presentations')
        .select('id, title, view_count, download_count, theme, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (presError) throw presError;
      setPresentations(presentationsData || []);

      // Load analytics events
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('presentation_analytics')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalViews = presentations.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const totalDownloads = presentations.reduce((sum, p) => sum + (p.download_count || 0), 0);
  const mostPopular = presentations.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))[0];

  // Theme distribution
  const themeStats = presentations.reduce((acc, p) => {
    acc[p.theme] = (acc[p.theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const themeChartData = Object.entries(themeStats).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your presentation performance and engagement metrics
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalViews}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {presentations.length} presentations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalDownloads}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF and PPTX exports
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Edits</CardTitle>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.filter(a => a.event_type === 'edit').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Editing sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold truncate">
                    {mostPopular?.title || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mostPopular?.view_count || 0} views
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Theme Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Theme Distribution</CardTitle>
                  <CardDescription>Most used presentation themes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={themeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Presentations */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Presentations</CardTitle>
                  <CardDescription>By views and downloads</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {presentations.slice(0, 5).map((pres, idx) => (
                      <div 
                        key={pres.id} 
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/editor/${pres.id}`)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{pres.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{pres.theme} theme</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {pres.view_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {pres.download_count || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest presentation interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.slice(0, 10).map((event, idx) => {
                    const presentation = presentations.find(p => p.id === event.presentation_id);
                    const icons = {
                      view: Eye,
                      download: Download,
                      edit: Edit
                    };
                    const Icon = icons[event.event_type as keyof typeof icons];
                    
                    return (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                          <div>
                            <p className="text-sm font-medium">{presentation?.title || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground capitalize">{event.event_type}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
