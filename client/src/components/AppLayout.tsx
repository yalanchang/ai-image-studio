import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles, Images, LayoutGrid, Coins, ShieldCheck,
  Menu, X, Zap, LogOut, User, ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/generate", label: "Generate", icon: Sparkles, description: "Create AI images" },
  { href: "/gallery", label: "Gallery", icon: LayoutGrid, description: "Community showcase" },
  { href: "/my-images", label: "My Images", icon: Images, description: "Your creations" },
  { href: "/credits", label: "Credits", icon: Coins, description: "Manage credits" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: creditData } = trpc.credits.balance.useQuery(undefined, { enabled: isAuthenticated });

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-sidebar-foreground">AI Studio</span>
          <button className="ml-auto lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, description }) => {
            const active = location === href;
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer group ${active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{label}</div>
                    <div className={`text-xs truncate ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{description}</div>
                  </div>
                  {active && <ChevronRight className="w-4 h-4 shrink-0" />}
                </div>
              </Link>
            );
          })}

          {isAdmin && (
            <Link href="/admin" onClick={() => setSidebarOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer mt-2 ${location === "/admin" ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Admin</div>
                  <div className={`text-xs ${location === "/admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Dashboard</div>
                </div>
              </div>
            </Link>
          )}
        </nav>

        {/* Credits widget */}
        {isAuthenticated && (
          <div className="px-4 py-3 mx-3 mb-3 rounded-lg bg-sidebar-accent border border-sidebar-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Credits</span>
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="text-xl font-bold text-sidebar-foreground">{creditData?.credits ?? user?.credits ?? 0}</div>
            <Link href="/credits">
              <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs">Top Up</Button>
            </Link>
          </div>
        )}

        {/* User section */}
        <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "User"}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/my-images"><User className="w-4 h-4 mr-2" />My Images</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button className="w-full" onClick={() => window.location.href = getLoginUrl()}>
              Sign In
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 gap-4">
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {!isAuthenticated && (
            <Button size="sm" onClick={() => window.location.href = getLoginUrl()}>
              <Zap className="w-4 h-4 mr-1.5" />Sign In to Create
            </Button>
          )}
          {isAuthenticated && (
            <Badge variant="secondary" className="gap-1.5">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              {creditData?.credits ?? user?.credits ?? 0} credits
            </Badge>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
