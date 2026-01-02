import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, AlertTriangle, Users, CreditCard, Gavel } from "lucide-react";

const TermsOfService = () => {
  const sections = [
    {
      icon: FileText,
      title: "1. Acceptance of Terms",
      content: "By accessing or using SlideForge AI, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service."
    },
    {
      icon: Users,
      title: "2. User Accounts",
      content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 13 years old to use SlideForge AI. You agree to provide accurate, current, and complete information during registration."
    },
    {
      icon: Scale,
      title: "3. Acceptable Use",
      content: "You agree not to use SlideForge AI for any unlawful purpose or to violate any laws. You may not upload content that infringes on intellectual property rights, contains malware, or is defamatory, obscene, or threatening. We reserve the right to terminate accounts that violate these terms."
    },
    {
      icon: CreditCard,
      title: "4. Payment & Subscriptions",
      content: "Paid plans are billed in advance on a monthly or annual basis. Refunds are available within 14 days of initial purchase if you're not satisfied. Prices may change with 30 days notice. Free tier usage is subject to fair use limits."
    },
    {
      icon: AlertTriangle,
      title: "5. Intellectual Property",
      content: "You retain all rights to the content you create using SlideForge AI. The service, including its original content, features, and functionality, is owned by SlideForge AI and protected by international copyright, trademark, and other intellectual property laws."
    },
    {
      icon: Gavel,
      title: "6. Limitation of Liability",
      content: "SlideForge AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service. Our total liability shall not exceed the amount you paid us in the past 12 months."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: January 2, 2026
            </p>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Please read these terms carefully before using SlideForge AI. These terms govern your use of our presentation creation platform.
            </p>
          </div>

          <div className="space-y-6">
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
                    <p className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-8 border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-3">7. Modifications</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the platform. Your continued use of SlideForge AI after such modifications constitutes your acceptance of the updated terms.
              </p>
            </CardContent>
          </Card>

          <div className="mt-12 p-6 bg-muted/30 rounded-xl text-center">
            <p className="text-muted-foreground">
              Questions about our Terms of Service? Contact us at{" "}
              <a href="mailto:legal@slideforge.ai" className="text-primary hover:underline">
                legal@slideforge.ai
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
