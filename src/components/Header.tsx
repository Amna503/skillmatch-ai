import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Sparkles, LayoutDashboard, History } from "lucide-react";
import { supabase } from "../lib/supabase";
import ThemeToggle from "./ThemeToggle";

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
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/history", label: "History", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 text-foreground cursor-pointer group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-gradient-from to-accent-gradient-to shadow-glow transition-all duration-200 group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight font-heading">
            SkillMatch AI
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-br from-accent-gradient-from/15 to-accent-gradient-to/15 text-primary shadow-sm"
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
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted px-2">
            <User className="h-3.5 w-3.5" />
            {email ?? "…"}
          </span>
          <button
            onClick={handleSignOut}
            className="btn-secondary text-xs !px-3 !py-2 !min-h-[40px] !rounded-xl"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex sm:hidden border-t border-border px-4 py-2 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-br from-accent-gradient-from/15 to-accent-gradient-to/15 text-primary"
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