import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie, Settings, BarChart3, Shield, ToggleLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const CookiePolicy = () => {
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false,
    functional: true
  });

  const handleSavePreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    toast.success("Cookie preferences saved!");
  };

  const cookieTypes = [
    {
      icon: Shield,
      title: "Essential Cookies",
      key: "essential",
      required: true,
      description: "These cookies are necessary for the website to function and cannot be disabled. They are usually set in response to your actions like setting privacy preferences, logging in, or filling forms."
    },
    {
      icon: BarChart3,
      title: "Analytics Cookies",
      key: "analytics",
      required: false,
      description: "These cookies help us understand how visitors interact with our website by collecting information anonymously. This helps us improve our service and user experience."
    },
    {
      icon: Settings,
      title: "Functional Cookies",
      key: "functional",
      required: false,
      description: "These cookies enable enhanced functionality and personalization, such as remembering your theme preferences and language settings."
    },
    {
      icon: ToggleLeft,
      title: "Marketing Cookies",
      key: "marketing",
      required: false,
      description: "These cookies are used to track visitors across websites to display relevant advertisements. They may be set by our advertising partners."
    }
  ];

  const cookieList = [
    { name: "session_id", purpose: "User authentication", expiry: "Session", type: "Essential" },
    { name: "user_preferences", purpose: "Store user settings", expiry: "1 year", type: "Functional" },
    { name: "_ga", purpose: "Google Analytics tracking", expiry: "2 years", type: "Analytics" },
    { name: "theme", purpose: "Remember dark/light mode", expiry: "1 year", type: "Functional" },
    { name: "consent", purpose: "Store cookie consent", expiry: "1 year", type: "Essential" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Cookie className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: January 2, 2026
            </p>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              This Cookie Policy explains how SlideForge AI uses cookies and similar technologies to recognize you when you visit our website.
            </p>
          </div>

          {/* Cookie Preferences Card */}
          <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Manage Your Cookie Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {cookieTypes.map((cookie) => {
                const Icon = cookie.icon;
                return (
                  <div key={cookie.key} className="flex items-start justify-between gap-4 pb-4 border-b last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {cookie.title}
                          {cookie.required && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">Required</span>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{cookie.description}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences[cookie.key as keyof typeof preferences]}
                      onCheckedChange={(checked) => 
                        !cookie.required && setPreferences(prev => ({ ...prev, [cookie.key]: checked }))
                      }
                      disabled={cookie.required}
                    />
                  </div>
                );
              })}
              <Button onClick={handleSavePreferences} className="w-full">
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Cookie Details Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Cookies We Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Cookie Name</th>
                      <th className="text-left py-3 px-2 font-medium">Purpose</th>
                      <th className="text-left py-3 px-2 font-medium">Expiry</th>
                      <th className="text-left py-3 px-2 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cookieList.map((cookie, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3 px-2 font-mono text-xs">{cookie.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{cookie.purpose}</td>
                        <td className="py-3 px-2 text-muted-foreground">{cookie.expiry}</td>
                        <td className="py-3 px-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            cookie.type === 'Essential' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            cookie.type === 'Analytics' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {cookie.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 p-6 bg-muted/30 rounded-xl text-center">
            <p className="text-muted-foreground">
              For more information about how we handle your data, please see our{" "}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              Questions? Contact us at{" "}
              <a href="mailto:privacy@slideforge.ai" className="text-primary hover:underline">
                privacy@slideforge.ai
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicy;
