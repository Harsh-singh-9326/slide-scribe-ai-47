import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Mail, UserCheck } from "lucide-react";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        "Account information (name, email, password hash)",
        "Presentation content and files you upload",
        "Usage analytics to improve our services",
        "Device and browser information for optimization"
      ]
    },
    {
      icon: Lock,
      title: "How We Use Your Data",
      content: [
        "To provide and improve SlideForge AI services",
        "To personalize your experience and recommendations",
        "To send important updates about your account",
        "To analyze usage patterns and improve features"
      ]
    },
    {
      icon: Shield,
      title: "Data Security",
      content: [
        "End-to-end encryption for all data transfers",
        "Secure cloud storage with regular backups",
        "Regular security audits and vulnerability testing",
        "Compliance with industry security standards"
      ]
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      content: [
        "Access and download your personal data anytime",
        "Request deletion of your account and data",
        "Opt-out of marketing communications",
        "Export your presentations in multiple formats"
      ]
    },
    {
      icon: Eye,
      title: "Third-Party Sharing",
      content: [
        "We never sell your personal data to third parties",
        "Limited sharing with essential service providers only",
        "AI processing is done securely without data retention",
        "Anonymous analytics may be shared for research"
      ]
    },
    {
      icon: Mail,
      title: "Contact Us",
      content: [
        "Email: privacy@slideforge.ai",
        "Response time: Within 48 hours",
        "Data Protection Officer available for inquiries",
        "We take all privacy concerns seriously"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: January 2, 2026
            </p>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              At SlideForge AI, we are committed to protecting your privacy and ensuring the security of your personal information. This policy explains how we collect, use, and safeguard your data.
            </p>
          </div>

          <div className="grid gap-6">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index} className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.content.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 p-6 bg-muted/30 rounded-xl text-center">
            <p className="text-muted-foreground">
              By using SlideForge AI, you agree to this Privacy Policy. We may update this policy periodically, 
              and we'll notify you of any significant changes via email or in-app notifications.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
