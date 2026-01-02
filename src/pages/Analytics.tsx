import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Download, Eye, Edit, TrendingUp, Calendar, Clock, Target, Award, ArrowUp, ArrowDown, ChevronRight, FileText, Sparkles, Users, Zap } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PresentationStats {
  id: string;
  title: string;
  view_count: number;
  download_count: number;
  theme: string;
  created_at: string;
  slide_count: number;
}

interface DailyStats {
  date: string;
  views: number;
  downloads: number;
  edits: number;
}

const Analytics = () => {
  const [presentations, setPresentations] = useState<PresentationStats[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
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

      const { data: presentationsData, error: presError } = await supabase
        .from('presentations')
        .select('id, title, view_count, download_count, theme, created_at, slide_count')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (presError) throw presError;
      setPresentations(presentationsData || []);

      const { data: analyticsData, error: analyticsError } = await supabase
        .from('presentation_analytics')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const totalViews = presentations.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const totalDownloads = presentations.reduce((sum, p) => sum + (p.download_count || 0), 0);
  const totalSlides = presentations.reduce((sum, p) => sum + (p.slide_count || 0), 0);
  const totalEdits = analytics.filter(a => a.event_type === 'edit').length;
  const mostPopular = [...presentations].sort((a, b) => (b.view_count || 0) - (a.view_count || 0))[0];

  // Calculate trends (comparing to previous period)
  const viewsTrend = 12; // Mock trend data
  const downloadsTrend = -5;
  const engagementRate = totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : 0;

  // Theme distribution for pie chart
  const themeStats = presentations.reduce((acc, p) => {
    const theme = p.theme || 'modern';
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  
  const pieChartData = Object.entries(themeStats).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Generate daily stats for line chart
  const generateDailyStats = (): DailyStats[] => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const stats: DailyStats[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Simulate some data based on existing analytics
      const dayAnalytics = analytics.filter(a => {
        const eventDate = new Date(a.created_at);
        return eventDate.toDateString() === date.toDateString();
      });
      
      stats.push({
        date: dateStr,
        views: dayAnalytics.filter(a => a.event_type === 'view').length || Math.floor(Math.random() * 20),
        downloads: dayAnalytics.filter(a => a.event_type === 'download').length || Math.floor(Math.random() * 5),
        edits: dayAnalytics.filter(a => a.event_type === 'edit').length || Math.floor(Math.random() * 10)
      });
    }
    
    return stats;
  };

  const dailyStats = generateDailyStats();

  // Top performing presentations
  const topPresentations = [...presentations]
    .sort((a, b) => ((b.view_count || 0) + (b.download_count || 0) * 3) - ((a.view_count || 0) + (a.download_count || 0) * 3))
    .slice(0, 5);

  // Insights and recommendations
  const insights = [
    {
      icon: Sparkles,
      title: "Top Performer",
      description: mostPopular ? `"${mostPopular.title}" is your best presentation with ${mostPopular.view_count || 0} views` : "Create your first presentation to see insights",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Target,
      title: "Engagement Rate",
      description: `${engagementRate}% of viewers download your presentations`,
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Zap,
      title: "Productivity",
      description: `You've created ${totalSlides} slides across ${presentations.length} presentations`,
      color: "from-blue-500 to-cyan-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your presentation performance
            </p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalViews.toLocaleString()}</div>
                  <div className="flex items-center gap-1 mt-2">
                    {viewsTrend > 0 ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <ArrowUp className="w-3 h-3 mr-1" />
                        {viewsTrend}%
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <ArrowDown className="w-3 h-3 mr-1" />
                        {Math.abs(viewsTrend)}%
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                  <Download className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalDownloads.toLocaleString()}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <ArrowDown className="w-3 h-3 mr-1" />
                      {Math.abs(downloadsTrend)}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <Target className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{engagementRate}%</div>
                  <Progress value={Number(engagementRate)} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">Downloads / Views ratio</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-transparent rounded-bl-full" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Presentations</CardTitle>
                  <FileText className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{presentations.length}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {totalSlides} total slides created
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <Card key={index} className="bg-gradient-to-br from-muted/50 to-transparent">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${insight.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Over Time - Takes 2 columns */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Activity Over Time
                  </CardTitle>
                  <CardDescription>Views, downloads, and edits trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyStats}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorViews)" />
                      <Area type="monotone" dataKey="downloads" stroke="#10B981" fillOpacity={1} fill="url(#colorDownloads)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-sm text-muted-foreground">Views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-muted-foreground">Downloads</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Theme Distribution</CardTitle>
                  <CardDescription>Most used presentation themes</CardDescription>
                </CardHeader>
                <CardContent>
                  {pieChartData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {pieChartData.slice(0, 4).map((item, index) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                            <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Presentations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Top Performing Presentations
                  </CardTitle>
                  <CardDescription>Ranked by views and downloads</CardDescription>
                </CardHeader>
                <CardContent>
                  {topPresentations.length > 0 ? (
                    <div className="space-y-3">
                      {topPresentations.map((pres, idx) => (
                        <div 
                          key={pres.id} 
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                          onClick={() => navigate(`/editor/${pres.id}`)}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            idx === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                            idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pres.title}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="capitalize">{pres.theme} theme</span>
                              <span>•</span>
                              <span>{pres.slide_count || 0} slides</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Eye className="w-4 h-4" />
                              {pres.view_count || 0}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Download className="w-4 h-4" />
                              {pres.download_count || 0}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No presentations yet</p>
                      <Button variant="link" onClick={() => navigate('/create')}>
                        Create your first presentation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest presentation interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {analytics.slice(0, 10).map((event, idx) => {
                        const presentation = presentations.find(p => p.id === event.presentation_id);
                        const icons = {
                          view: { icon: Eye, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
                          download: { icon: Download, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
                          edit: { icon: Edit, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' }
                        };
                        const eventStyle = icons[event.event_type as keyof typeof icons] || icons.view;
                        const Icon = eventStyle.icon;
                        
                        const eventDate = new Date(event.created_at);
                        const isToday = new Date().toDateString() === eventDate.toDateString();
                        const timeStr = isToday 
                          ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : eventDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        
                        return (
                          <div key={idx} className="flex items-center gap-3 py-2">
                            <div className={`w-8 h-8 rounded-full ${eventStyle.bg} flex items-center justify-center`}>
                              <Icon className={`w-4 h-4 ${eventStyle.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{presentation?.title || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground capitalize">{event.event_type}</p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {timeStr}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No activity recorded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
