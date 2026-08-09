import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Brain, BarChart3, Upload } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Upload },
    { path: "/history", label: "History", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-foreground cursor-pointer"
        >
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">SkillMatch AI</span>
        </button>

        {/* Navigation */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:text-foreground hover:bg-card-hover"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted">
            <User className="h-3.5 w-3.5" />
            {email ?? "…"}
          </span>
          <button
            onClick={handleSignOut}
            className="btn-secondary text-xs px-3 py-1.5"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex sm:hidden border-t border-border px-4 py-1.5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}