import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Zap, Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      // Check for guest user first
      const guestUser = localStorage.getItem('guest_user');
      if (guestUser) {
        const guestData = JSON.parse(guestUser);
        setUser(guestData);
        setIsGuest(true);
        return;
      }

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setIsGuest(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        setIsGuest(false);
      } else {
        // Check if guest user exists
        const guestUser = localStorage.getItem('guest_user');
        if (guestUser) {
          const guestData = JSON.parse(guestUser);
          setUser(guestData);
          setIsGuest(true);
        } else {
          setUser(null);
          setIsGuest(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (isGuest) {
      // Clear guest data
      localStorage.removeItem('guest_user');
      localStorage.removeItem('guest_presentations');
      setUser(null);
      setIsGuest(false);
      toast({
        title: "Signed out",
        description: "You have been signed out of guest mode.",
      });
      navigate('/');
    } else {
      // Sign out from Supabase
      await supabase.auth.signOut();
      setUser(null);
      setIsGuest(false);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">SlideForge AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/analytics"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/analytics") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Analytics
          </Link>
          <Link
            to="/create"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/create") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Create
          </Link>
          <Link
            to="/pricing"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/pricing") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Pricing
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                {isGuest ? 'Guest User' : user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/create">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link
              to="/"
              className="block text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="block text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/analytics"
              className="block text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Analytics
            </Link>
            <Link
              to="/create"
              className="block text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Create
            </Link>
            <Link
              to="/pricing"
              className="block text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <div className="pt-3 space-y-2">
              {user ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground text-center">
                    {isGuest ? 'Guest User' : user.email}
                  </div>
                  <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/create" onClick={() => setIsMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;