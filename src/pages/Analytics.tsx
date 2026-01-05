import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ComposedChart } from "recharts";
import { Download, Eye, Edit, TrendingUp, Calendar, Clock, Target, Award, ArrowUp, ArrowDown, ChevronRight, FileText, Sparkles, Users, Zap, BarChart2, Activity, AlertCircle, CheckCircle2, Lightbulb, Timer, Layers, MousePointer, Share2, Star, Trophy, Flame, TrendingDown, RefreshCw, FileDown } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface PresentationStats {
  id: string;
  title: string;
  view_count: number;
  download_count: number;
  theme: string;
  created_at: string;
  updated_at: string;
  slide_count: number;
}

interface AnalyticsEvent {
  id: string;
  event_type: string;
  presentation_id: string;
  created_at: string;
  event_data: any;
}

interface DailyStats {
  date: string;
  fullDate: Date;
  views: number;
  downloads: number;
  edits: number;
  presentations: number;
}

interface PerformanceScore {
  overall: number;
  engagement: number;
  reach: number;
  activity: number;
  quality: number;
}

const Analytics = () => {
  const [presentations, setPresentations] = useState<PresentationStats[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedTab, setSelectedTab] = useState('overview');
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
        .select('id, title, view_count, download_count, theme, created_at, updated_at, slide_count')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (presError) throw presError;
      setPresentations(presentationsData || []);

      const { data: analyticsData, error: analyticsError } = await supabase
        .from('presentation_analytics')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get date filter
  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      default: return new Date(0);
    }
  };

  // Filter data by date range
  const filteredAnalytics = useMemo(() => {
    const filterDate = getDateFilter();
    return analytics.filter(a => new Date(a.created_at) >= filterDate);
  }, [analytics, dateRange]);

  const filteredPresentations = useMemo(() => {
    const filterDate = getDateFilter();
    return presentations.filter(p => new Date(p.created_at) >= filterDate);
  }, [presentations, dateRange]);

  // Core metrics calculation
  const metrics = useMemo(() => {
    const totalViews = presentations.reduce((sum, p) => sum + (p.view_count || 0), 0);
    const totalDownloads = presentations.reduce((sum, p) => sum + (p.download_count || 0), 0);
    const totalSlides = presentations.reduce((sum, p) => sum + (p.slide_count || 0), 0);
    const totalEdits = filteredAnalytics.filter(a => a.event_type === 'edit').length;
    const avgSlidesPerPresentation = presentations.length > 0 ? totalSlides / presentations.length : 0;
    const engagementRate = totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0;
    const avgViewsPerPresentation = presentations.length > 0 ? totalViews / presentations.length : 0;
    const avgDownloadsPerPresentation = presentations.length > 0 ? totalDownloads / presentations.length : 0;

    // Calculate period comparison
    const now = new Date();
    const periodDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const currentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const currentPeriodViews = analytics.filter(a => 
      a.event_type === 'view' && new Date(a.created_at) >= currentPeriodStart
    ).length;
    const previousPeriodViews = analytics.filter(a => 
      a.event_type === 'view' && 
      new Date(a.created_at) >= previousPeriodStart && 
      new Date(a.created_at) < currentPeriodStart
    ).length;

    const currentPeriodDownloads = analytics.filter(a => 
      a.event_type === 'download' && new Date(a.created_at) >= currentPeriodStart
    ).length;
    const previousPeriodDownloads = analytics.filter(a => 
      a.event_type === 'download' && 
      new Date(a.created_at) >= previousPeriodStart && 
      new Date(a.created_at) < currentPeriodStart
    ).length;

    const viewsTrend = previousPeriodViews > 0 
      ? ((currentPeriodViews - previousPeriodViews) / previousPeriodViews) * 100 
      : currentPeriodViews > 0 ? 100 : 0;
    const downloadsTrend = previousPeriodDownloads > 0 
      ? ((currentPeriodDownloads - previousPeriodDownloads) / previousPeriodDownloads) * 100 
      : currentPeriodDownloads > 0 ? 100 : 0;

    return {
      totalViews,
      totalDownloads,
      totalSlides,
      totalEdits,
      avgSlidesPerPresentation: avgSlidesPerPresentation.toFixed(1),
      engagementRate: engagementRate.toFixed(1),
      avgViewsPerPresentation: avgViewsPerPresentation.toFixed(1),
      avgDownloadsPerPresentation: avgDownloadsPerPresentation.toFixed(1),
      viewsTrend: Math.round(viewsTrend),
      downloadsTrend: Math.round(downloadsTrend),
      presentationCount: presentations.length,
      newPresentations: filteredPresentations.length
    };
  }, [presentations, analytics, filteredAnalytics, filteredPresentations, dateRange]);

  // Calculate performance score
  const performanceScore: PerformanceScore = useMemo(() => {
    const engagement = Math.min(100, Number(metrics.engagementRate) * 5);
    const reach = Math.min(100, (metrics.totalViews / Math.max(1, metrics.presentationCount)) * 2);
    const activity = Math.min(100, (metrics.newPresentations / (dateRange === '7d' ? 2 : dateRange === '30d' ? 8 : 24)) * 100);
    const quality = Math.min(100, (Number(metrics.avgSlidesPerPresentation) / 15) * 100);
    const overall = (engagement + reach + activity + quality) / 4;

    return { overall, engagement, reach, activity, quality };
  }, [metrics, dateRange]);

  // Generate daily stats with real data
  const dailyStats = useMemo((): DailyStats[] => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const stats: DailyStats[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayAnalytics = analytics.filter(a => {
        const eventDate = new Date(a.created_at);
        return eventDate.toDateString() === date.toDateString();
      });

      const dayPresentations = presentations.filter(p => {
        const presDate = new Date(p.created_at);
        return presDate.toDateString() === date.toDateString();
      });
      
      stats.push({
        date: dateStr,
        fullDate: date,
        views: dayAnalytics.filter(a => a.event_type === 'view').length,
        downloads: dayAnalytics.filter(a => a.event_type === 'download').length,
        edits: dayAnalytics.filter(a => a.event_type === 'edit').length,
        presentations: dayPresentations.length
      });
    }
    
    return stats;
  }, [analytics, presentations, dateRange]);

  // Theme distribution
  const themeDistribution = useMemo(() => {
    const themes: Record<string, { count: number; views: number; downloads: number }> = {};
    presentations.forEach(p => {
      const theme = p.theme || 'modern';
      if (!themes[theme]) themes[theme] = { count: 0, views: 0, downloads: 0 };
      themes[theme].count++;
      themes[theme].views += p.view_count || 0;
      themes[theme].downloads += p.download_count || 0;
    });
    return Object.entries(themes)
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        ...data,
        avgViews: data.count > 0 ? (data.views / data.count).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [presentations]);

  // Top presentations with detailed scoring
  const topPresentations = useMemo(() => {
    return [...presentations]
      .map(p => ({
        ...p,
        score: (p.view_count || 0) + (p.download_count || 0) * 3,
        engagementRate: p.view_count ? ((p.download_count || 0) / p.view_count * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [presentations]);

  // Performance by day of week
  const dayOfWeekPerformance = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStats = days.map(day => ({ day, views: 0, downloads: 0, edits: 0 }));
    
    analytics.forEach(a => {
      const dayIndex = new Date(a.created_at).getDay();
      if (a.event_type === 'view') dayStats[dayIndex].views++;
      if (a.event_type === 'download') dayStats[dayIndex].downloads++;
      if (a.event_type === 'edit') dayStats[dayIndex].edits++;
    });
    
    return dayStats;
  }, [analytics]);

  // Hour of day performance
  const hourlyPerformance = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: i === 0 ? '12AM' : i < 12 ? `${i}AM` : i === 12 ? '12PM' : `${i - 12}PM`,
      activity: 0
    }));
    
    analytics.forEach(a => {
      const hour = new Date(a.created_at).getHours();
      hours[hour].activity++;
    });
    
    return hours;
  }, [analytics]);

  // Smart recommendations based on data
  const recommendations = useMemo(() => {
    const recs: { type: 'success' | 'warning' | 'tip'; title: string; description: string; action?: string }[] = [];

    // Engagement-based recommendations
    if (Number(metrics.engagementRate) < 10 && metrics.totalViews > 10) {
      recs.push({
        type: 'warning',
        title: 'Low Engagement Rate',
        description: `Only ${metrics.engagementRate}% of viewers download your presentations. Consider improving slide quality or adding more compelling content.`,
        action: 'Review low-performing presentations'
      });
    } else if (Number(metrics.engagementRate) > 25) {
      recs.push({
        type: 'success',
        title: 'Excellent Engagement',
        description: `${metrics.engagementRate}% engagement rate is above average! Your presentations resonate well with viewers.`
      });
    }

    // Activity recommendations
    if (metrics.newPresentations === 0 && dateRange !== 'all') {
      recs.push({
        type: 'tip',
        title: 'Stay Active',
        description: 'You haven\'t created any presentations recently. Regular content creation helps maintain audience engagement.',
        action: 'Create new presentation'
      });
    }

    // Slide count recommendations
    if (Number(metrics.avgSlidesPerPresentation) < 5) {
      recs.push({
        type: 'tip',
        title: 'Add More Content',
        description: `Average ${metrics.avgSlidesPerPresentation} slides per presentation. Consider adding more depth to your presentations for better value.`
      });
    }

    // Best performing day
    const bestDay = [...dayOfWeekPerformance].sort((a, b) => b.views - a.views)[0];
    if (bestDay.views > 0) {
      recs.push({
        type: 'tip',
        title: 'Optimal Publishing Day',
        description: `${bestDay.day} gets the most views. Consider publishing new content on this day for maximum reach.`
      });
    }

    // Theme recommendation
    const topTheme = themeDistribution[0];
    if (topTheme && topTheme.count >= 3) {
      recs.push({
        type: 'success',
        title: `${topTheme.name} Theme Works Best`,
        description: `Your ${topTheme.name.toLowerCase()} themed presentations get ${topTheme.avgViews} average views. Stick with what works!`
      });
    }

    return recs;
  }, [metrics, dayOfWeekPerformance, themeDistribution, dateRange]);

  // Growth trajectory
  const growthData = useMemo(() => {
    const weeklyData: { week: string; presentations: number; views: number; downloads: number }[] = [];
    const weeks = dateRange === '7d' ? 1 : dateRange === '30d' ? 4 : dateRange === '90d' ? 12 : 52;
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);
      
      const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const weekPres = presentations.filter(p => {
        const d = new Date(p.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      
      const weekViews = analytics.filter(a => {
        const d = new Date(a.created_at);
        return a.event_type === 'view' && d >= weekStart && d < weekEnd;
      }).length;
      
      const weekDownloads = analytics.filter(a => {
        const d = new Date(a.created_at);
        return a.event_type === 'download' && d >= weekStart && d < weekEnd;
      }).length;
      
      weeklyData.push({
        week: weekLabel,
        presentations: weekPres,
        views: weekViews,
        downloads: weekDownloads
      });
    }
    
    return weeklyData;
  }, [presentations, analytics, dateRange]);

  const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  // Radar chart data for performance
  const radarData = [
    { metric: 'Engagement', value: performanceScore.engagement, fullMark: 100 },
    { metric: 'Reach', value: performanceScore.reach, fullMark: 100 },
    { metric: 'Activity', value: performanceScore.activity, fullMark: 100 },
    { metric: 'Quality', value: performanceScore.quality, fullMark: 100 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Fair';
    return 'Needs Improvement';
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = ['Title', 'Views', 'Downloads', 'Engagement Rate', 'Theme', 'Slides', 'Created Date'];
      const rows = presentations.map(p => [
        `"${p.title.replace(/"/g, '""')}"`,
        p.view_count || 0,
        p.download_count || 0,
        p.view_count ? ((p.download_count || 0) / p.view_count * 100).toFixed(1) + '%' : '0%',
        p.theme || 'modern',
        p.slide_count || 0,
        new Date(p.created_at).toLocaleDateString()
      ]);

      // Add summary section
      const summary = [
        '',
        'Summary Statistics',
        `Total Presentations,${metrics.presentationCount}`,
        `Total Views,${metrics.totalViews}`,
        `Total Downloads,${metrics.totalDownloads}`,
        `Average Engagement Rate,${metrics.engagementRate}%`,
        `Average Slides per Presentation,${metrics.avgSlidesPerPresentation}`,
        `Performance Score,${Math.round(performanceScore.overall)}/100`,
        '',
        'Performance by Theme',
        'Theme,Count,Views,Downloads,Avg Views'
      ];

      const themeRows = themeDistribution.map(t => 
        `${t.name},${t.count},${t.views},${t.downloads},${t.avgViews}`
      );

      const csvContent = [
        'Presentation Analytics Report',
        `Generated: ${new Date().toLocaleString()}`,
        `Date Range: ${dateRange === 'all' ? 'All Time' : `Last ${dateRange.replace('d', ' Days')}`}`,
        '',
        headers.join(','),
        ...rows.map(r => r.join(',')),
        ...summary,
        ...themeRows
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('CSV report downloaded successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Analytics Report', pageWidth / 2, y, { align: 'center' });
      y += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
      y += 5;
      pdf.text(`Date Range: ${dateRange === 'all' ? 'All Time' : `Last ${dateRange.replace('d', ' Days')}`}`, pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Performance Score Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Performance Score', 20, y);
      y += 8;

      pdf.setFontSize(24);
      pdf.text(`${Math.round(performanceScore.overall)}/100`, 20, y);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`(${getScoreLabel(performanceScore.overall)})`, 55, y);
      y += 10;

      const scoreItems = [
        { label: 'Engagement', value: performanceScore.engagement },
        { label: 'Reach', value: performanceScore.reach },
        { label: 'Activity', value: performanceScore.activity },
        { label: 'Quality', value: performanceScore.quality }
      ];

      scoreItems.forEach((item, i) => {
        pdf.text(`${item.label}: ${Math.round(item.value)}/100`, 20 + (i * 45), y);
      });
      y += 15;

      // Key Metrics Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Metrics', 20, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const metricsData = [
        ['Total Presentations', metrics.presentationCount.toString()],
        ['Total Views', metrics.totalViews.toString()],
        ['Total Downloads', metrics.totalDownloads.toString()],
        ['Engagement Rate', `${metrics.engagementRate}%`],
        ['Total Slides', metrics.totalSlides.toString()],
        ['Avg Slides/Presentation', metrics.avgSlidesPerPresentation],
        ['Avg Views/Presentation', metrics.avgViewsPerPresentation],
        ['Avg Downloads/Presentation', metrics.avgDownloadsPerPresentation]
      ];

      metricsData.forEach(([label, value], i) => {
        const col = i % 2;
        if (i > 0 && col === 0) y += 6;
        pdf.text(`${label}: ${value}`, 20 + (col * 90), y);
      });
      y += 15;

      // Theme Performance Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Theme Performance', 20, y);
      y += 10;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Theme', 20, y);
      pdf.text('Count', 60, y);
      pdf.text('Views', 85, y);
      pdf.text('Downloads', 115, y);
      pdf.text('Avg Views', 150, y);
      y += 6;

      pdf.setFont('helvetica', 'normal');
      themeDistribution.slice(0, 8).forEach(theme => {
        pdf.text(theme.name, 20, y);
        pdf.text(theme.count.toString(), 60, y);
        pdf.text(theme.views.toString(), 85, y);
        pdf.text(theme.downloads.toString(), 115, y);
        pdf.text(theme.avgViews.toString(), 150, y);
        y += 6;
      });
      y += 10;

      // Top Presentations Section
      if (topPresentations.length > 0) {
        if (y > 240) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Top Presentations', 20, y);
        y += 10;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Title', 20, y);
        pdf.text('Views', 100, y);
        pdf.text('Downloads', 125, y);
        pdf.text('Engagement', 155, y);
        y += 6;

        pdf.setFont('helvetica', 'normal');
        topPresentations.slice(0, 10).forEach(pres => {
          const title = pres.title.length > 35 ? pres.title.substring(0, 35) + '...' : pres.title;
          pdf.text(title, 20, y);
          pdf.text((pres.view_count || 0).toString(), 100, y);
          pdf.text((pres.download_count || 0).toString(), 125, y);
          pdf.text(`${pres.engagementRate}%`, 155, y);
          y += 6;

          if (y > 280) {
            pdf.addPage();
            y = 20;
          }
        });
        y += 10;
      }

      // Recommendations Section
      if (recommendations.length > 0) {
        if (y > 240) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Insights & Recommendations', 20, y);
        y += 10;

        pdf.setFontSize(10);
        recommendations.forEach(rec => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          
          pdf.setFont('helvetica', 'bold');
          const typeSymbol = rec.type === 'success' ? '✓' : rec.type === 'warning' ? '!' : '•';
          pdf.text(`${typeSymbol} ${rec.title}`, 20, y);
          y += 6;
          
          pdf.setFont('helvetica', 'normal');
          const descLines = pdf.splitTextToSize(rec.description, pageWidth - 40);
          pdf.text(descLines, 25, y);
          y += (descLines.length * 5) + 8;
        });
      }

      pdf.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Deep insights into your presentation performance and audience engagement
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Download CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="icon" onClick={loadAnalytics}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              {/* Performance Score Banner */}
              <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
                <CardContent className="py-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`text-5xl font-bold ${getScoreColor(performanceScore.overall)}`}>
                          {Math.round(performanceScore.overall)}
                        </div>
                        <div className="text-xs text-muted-foreground">out of 100</div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Performance Score</h3>
                        <Badge variant="secondary" className={getScoreColor(performanceScore.overall)}>
                          {getScoreLabel(performanceScore.overall)}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: 'Engagement', value: performanceScore.engagement, icon: Target },
                        { label: 'Reach', value: performanceScore.reach, icon: Users },
                        { label: 'Activity', value: performanceScore.activity, icon: Activity },
                        { label: 'Quality', value: performanceScore.quality, icon: Star }
                      ].map(item => (
                        <div key={item.label} className="text-center">
                          <item.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <div className={`text-lg font-semibold ${getScoreColor(item.value)}`}>
                            {Math.round(item.value)}
                          </div>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Eye className="h-5 w-5 text-blue-500" />
                      {metrics.viewsTrend !== 0 && (
                        <Badge variant="secondary" className={metrics.viewsTrend > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>
                          {metrics.viewsTrend > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                          {Math.abs(metrics.viewsTrend)}%
                        </Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold">{metrics.totalViews.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~{metrics.avgViewsPerPresentation} per presentation
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Download className="h-5 w-5 text-green-500" />
                      {metrics.downloadsTrend !== 0 && (
                        <Badge variant="secondary" className={metrics.downloadsTrend > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>
                          {metrics.downloadsTrend > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                          {Math.abs(metrics.downloadsTrend)}%
                        </Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold">{metrics.totalDownloads.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Downloads</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~{metrics.avgDownloadsPerPresentation} per presentation
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="h-5 w-5 text-purple-500" />
                      <Badge variant="secondary" className={Number(metrics.engagementRate) > 20 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}>
                        {Number(metrics.engagementRate) > 20 ? 'High' : 'Average'}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold">{metrics.engagementRate}%</div>
                    <p className="text-sm text-muted-foreground">Engagement Rate</p>
                    <Progress value={Number(metrics.engagementRate)} max={50} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Layers className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="text-3xl font-bold">{metrics.presentationCount}</div>
                    <p className="text-sm text-muted-foreground">Presentations</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics.totalSlides} slides total ({metrics.avgSlidesPerPresentation} avg)
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Activity Trend
                    </CardTitle>
                    <CardDescription>Views and downloads over time</CardDescription>
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
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorViews)" name="Views" />
                        <Area type="monotone" dataKey="downloads" stroke="#10B981" fillOpacity={1} fill="url(#colorDownloads)" name="Downloads" />
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

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm font-medium">Best Performer</span>
                      </div>
                      <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                        {topPresentations[0]?.title || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-medium">Most Used Theme</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {themeDistribution[0]?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium">Best Day</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {[...dayOfWeekPerformance].sort((a, b) => b.views - a.views)[0]?.day || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Edit className="h-5 w-5 text-purple-500" />
                        <span className="text-sm font-medium">Total Edits</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{metrics.totalEdits}</span>
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full" onClick={() => setSelectedTab('insights')}>
                      View All Insights
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Top Presentations & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Top Presentations
                    </CardTitle>
                    <CardDescription>Ranked by engagement score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topPresentations.length > 0 ? (
                      <div className="space-y-2">
                        {topPresentations.slice(0, 5).map((pres, idx) => (
                          <div 
                            key={pres.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => navigate(`/editor/${pres.id}`)}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              idx === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              idx === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800' :
                              idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{pres.title}</p>
                              <p className="text-xs text-muted-foreground">{pres.engagementRate}% engagement</p>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {pres.view_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                {pres.download_count || 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No presentations yet</p>
                        <Button variant="link" onClick={() => navigate('/create')}>Create your first</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.length > 0 ? (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto">
                        {analytics.slice(0, 10).map((event, idx) => {
                          const pres = presentations.find(p => p.id === event.presentation_id);
                          const eventConfig = {
                            view: { icon: Eye, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
                            download: { icon: Download, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
                            edit: { icon: Edit, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' }
                          };
                          const config = eventConfig[event.event_type as keyof typeof eventConfig] || eventConfig.view;
                          const Icon = config.icon;
                          const date = new Date(event.created_at);
                          const timeStr = date.toLocaleDateString() === new Date().toLocaleDateString()
                            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

                          return (
                            <div key={idx} className="flex items-center gap-3 py-2">
                              <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{pres?.title || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground capitalize">{event.event_type}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">{timeStr}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No activity yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* PERFORMANCE TAB */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Radar */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Breakdown</CardTitle>
                    <CardDescription>Your strengths and areas for improvement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {radarData.map(item => (
                        <div key={item.metric} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{item.metric}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={item.value} className="w-16 h-2" />
                            <span className={`text-sm font-medium ${getScoreColor(item.value)}`}>{Math.round(item.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Day of Week Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Day</CardTitle>
                    <CardDescription>When your content performs best</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dayOfWeekPerformance}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="downloads" fill="#10B981" name="Downloads" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Hourly Activity */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Activity by Hour</CardTitle>
                    <CardDescription>Peak engagement times throughout the day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={hourlyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="activity" fill="hsl(var(--primary))" name="Activity" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Growth Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Weekly Growth</CardTitle>
                    <CardDescription>Track your progress over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="presentations" fill="#F59E0B" name="Presentations" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} name="Views" />
                        <Line yAxisId="right" type="monotone" dataKey="downloads" stroke="#10B981" strokeWidth={2} name="Downloads" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Theme Performance */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Theme Performance</CardTitle>
                    <CardDescription>How different themes perform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {themeDistribution.map((theme, idx) => (
                        <div key={theme.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="font-medium">{theme.name}</span>
                              <Badge variant="secondary">{theme.count} presentations</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {theme.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <Download className="h-4 w-4" />
                                {theme.downloads}
                              </span>
                              <span className="text-xs">~{theme.avgViews} views/pres</span>
                            </div>
                          </div>
                          <Progress value={(theme.count / presentations.length) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Theme Distribution Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle>Theme Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {themeDistribution.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={themeDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="count"
                            >
                              {themeDistribution.map((_, idx) => (
                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {themeDistribution.slice(0, 6).map((item, idx) => (
                            <div key={item.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        No data
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All Presentations Table */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>All Presentations</CardTitle>
                    <CardDescription>Detailed breakdown of each presentation's performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Theme</th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Slides</th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Views</th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Downloads</th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Engagement</th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {presentations.slice(0, 20).map(pres => {
                            const engagement = pres.view_count ? ((pres.download_count || 0) / pres.view_count * 100).toFixed(1) : '0';
                            return (
                              <tr key={pres.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/editor/${pres.id}`)}>
                                <td className="py-3 px-4 font-medium truncate max-w-[200px]">{pres.title}</td>
                                <td className="py-3 px-4 text-center">
                                  <Badge variant="outline" className="capitalize">{pres.theme || 'modern'}</Badge>
                                </td>
                                <td className="py-3 px-4 text-center">{pres.slide_count || 0}</td>
                                <td className="py-3 px-4 text-center">{pres.view_count || 0}</td>
                                <td className="py-3 px-4 text-center">{pres.download_count || 0}</td>
                                <td className="py-3 px-4 text-center">
                                  <Badge variant="secondary" className={Number(engagement) > 20 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}>
                                    {engagement}%
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                                  {new Date(pres.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* INSIGHTS TAB */}
            <TabsContent value="insights" className="space-y-6">
              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Smart Recommendations
                  </CardTitle>
                  <CardDescription>Personalized suggestions to improve your performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {recommendations.map((rec, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border ${
                          rec.type === 'success' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30' :
                          rec.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30' :
                          'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30'
                        }`}>
                          <div className="flex items-start gap-3">
                            {rec.type === 'success' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : rec.type === 'warning' ? (
                              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            ) : (
                              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium">{rec.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                              {rec.action && (
                                <Button variant="link" className="p-0 h-auto mt-2 text-sm" onClick={() => navigate('/create')}>
                                  {rec.action} →
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Create more presentations to get personalized insights!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Growth Rate</p>
                        <p className="text-2xl font-bold">{metrics.viewsTrend > 0 ? '+' : ''}{metrics.viewsTrend}%</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Compared to previous period</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Target className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Conversion</p>
                        <p className="text-2xl font-bold">{metrics.engagementRate}%</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">View to download rate</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-transparent">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Content Depth</p>
                        <p className="text-2xl font-bold">{metrics.avgSlidesPerPresentation}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Avg slides per presentation</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-transparent">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Productivity</p>
                        <p className="text-2xl font-bold">{metrics.newPresentations}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">New presentations this period</p>
                  </CardContent>
                </Card>
              </div>

              {/* Benchmarks */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Benchmarks</CardTitle>
                  <CardDescription>How you compare to your goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Engagement Rate</span>
                        <span className="text-sm text-muted-foreground">{metrics.engagementRate}% / 25% goal</span>
                      </div>
                      <div className="relative">
                        <Progress value={Math.min(100, (Number(metrics.engagementRate) / 25) * 100)} className="h-3" />
                        <div className="absolute top-0 left-[100%] w-0.5 h-3 bg-green-500 -translate-x-full" style={{ left: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Views per Presentation</span>
                        <span className="text-sm text-muted-foreground">{metrics.avgViewsPerPresentation} / 50 goal</span>
                      </div>
                      <Progress value={Math.min(100, (Number(metrics.avgViewsPerPresentation) / 50) * 100)} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Content Quality (Slides)</span>
                        <span className="text-sm text-muted-foreground">{metrics.avgSlidesPerPresentation} / 12 goal</span>
                      </div>
                      <Progress value={Math.min(100, (Number(metrics.avgSlidesPerPresentation) / 12) * 100)} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Monthly Presentations</span>
                        <span className="text-sm text-muted-foreground">{metrics.newPresentations} / 8 goal</span>
                      </div>
                      <Progress value={Math.min(100, (metrics.newPresentations / 8) * 100)} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Analytics;
