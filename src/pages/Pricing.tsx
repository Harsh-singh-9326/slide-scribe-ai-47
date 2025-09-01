import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Crown, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { PaymentButton } from "@/components/PaymentButton";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      amount: 0,
      period: "forever",
      description: "Perfect for trying SlideForge AI",
      icon: Zap,
      features: [
        "3 presentations per month",
        "Basic templates",
        "PDF & PPTX export",
        "Email support",
        "Basic AI summaries"
      ],
      limitations: [
        "Watermarked exports",
        "Limited customization"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Pro",
      price: "₹1,599",
      amount: 1599,
      period: "per month",
      description: "For professionals and small teams",
      icon: Crown,
      features: [
        "Unlimited presentations",
        "Premium templates & themes",
        "Advanced AI features",
        "Custom branding",
        "Priority support",
        "Collaboration tools",
        "Version history",
        "Multiple export formats"
      ],
      limitations: [],
      cta: "Start Pro Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "₹3,999",
      amount: 3999,
      period: "per month",
      description: "For large teams and organizations",
      icon: Star,
      features: [
        "Everything in Pro",
        "Team management",
        "SSO integration",
        "Advanced analytics",
        "Custom AI training",
        "Dedicated support",
        "On-premise deployment",
        "API access",
        "Custom integrations"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={plan.name} 
                className={`relative ${
                  plan.popular 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'border-muted'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">/{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <div key={limitation} className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full border-2 border-muted flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                  
                  {plan.name === 'Free' ? (
                    <Button 
                      className="w-full"
                      variant="outline"
                      asChild
                    >
                      <Link to="/auth">
                        {plan.cta}
                      </Link>
                    </Button>
                  ) : plan.name === 'Enterprise' ? (
                    <Button 
                      className="w-full"
                      variant="outline"
                      asChild
                    >
                      <Link to="/contact">
                        {plan.cta}
                      </Link>
                    </Button>
                  ) : (
                    <PaymentButton
                      planName={plan.name}
                      amount={plan.amount}
                      variant={plan.popular ? 'default' : 'outline'}
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-primary to-accent' 
                          : ''
                      }`}
                    >
                      {plan.cta}
                    </PaymentButton>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and you'll be prorated accordingly.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What file formats do you support?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We support PDF, DOCX, and TXT file uploads. You can export your presentations as PPTX, PDF, or DOCX files.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial for Pro plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We offer a 14-day free trial for all Pro features. No credit card required to start your trial.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does the AI content generation work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI analyzes your content and creates structured slides with titles, bullet points, and speaker notes. It can also suggest images and optimize the flow of your presentation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Transform Your Presentations?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Join thousands of professionals who create stunning presentations in minutes, not hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent" asChild>
                  <Link to="/create">
                    Start Creating Now
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">
                    Start Free Trial
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Pricing;