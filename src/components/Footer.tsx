import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Github, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-primary/5 to-secondary/10 border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SF</span>
              </div>
              <h3 className="text-xl font-bold">SlideForge AI</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Transform your ideas into stunning presentations with the power of AI. 
              Create professional slides in minutes, not hours.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <nav className="flex flex-col space-y-3">
              <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link to="/create" className="text-muted-foreground hover:text-primary transition-colors">
                Create Presentation
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                Templates
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                Help Center
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Support</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@slideforge.ai</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Mumbai, India</span>
              </div>
            </div>
            <div className="space-y-2">
              <Link to="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="block text-muted-foreground hover:text-primary transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Stay Updated</h4>
            <p className="text-muted-foreground text-sm">
              Get the latest features and updates delivered to your inbox.
            </p>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input 
                  placeholder="Enter your email" 
                  className="flex-1"
                />
                <Button size="sm" className="px-6">
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
              </p>
            </div>
            
            {/* Awards/Badges */}
            <div className="pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-3 rounded-lg text-center">
                  <div className="text-lg">⭐</div>
                  <div className="text-xs font-medium">4.9/5 Rating</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg text-center">
                  <div className="text-lg">🏆</div>
                  <div className="text-xs font-medium">Award Winner</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-muted-foreground text-sm">
            © 2024 SlideForge AI. All rights reserved. Made with ❤️ in India.
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>🔒 Secure & Private</span>
            <span>⚡ Lightning Fast</span>
            <span>🌍 Global Access</span>
          </div>
        </div>
      </div>
    </footer>
  );
};