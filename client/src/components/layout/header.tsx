import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationBell from "@/components/notification-bell";
import NetworkStatus from "@/components/network-status";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();

  const navigation = [
    { href: "/", label: "Главная", icon: "fas fa-home" },
    { href: "/profile", label: "Мой профиль", icon: "fas fa-user" },
    { href: "/notifications", label: "Уведомления", icon: "fas fa-bell" },
    { href: "/analytics", label: "Аналитика", icon: "fas fa-chart-line" },
    { href: "/ranking", label: "Рейтинг", icon: "fas fa-trophy" },
    { href: "/admin", label: "Админка", icon: "fas fa-cog", adminOnly: true },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const MobileNav = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
          <i className="fas fa-bars"></i>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex items-center space-x-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <i className="fas fa-graduation-cap text-primary-foreground"></i>
          </div>
          <span className="text-xl font-bold text-foreground">ProjectEnt</span>
        </div>
        
        <nav className="space-y-2">
          {navigation
            .filter(item => !item.adminOnly || user?.username === "admin")
            .map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setLocation(item.href)}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.label}
              </Button>
            ))}
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            data-testid="button-theme-toggle-mobile"
          >
            <i className={`fas ${theme === "light" ? "fa-moon" : "fa-sun"} mr-2`}></i>
            {theme === "light" ? "Темная тема" : "Светлая тема"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-transparent p-0"
              onClick={() => setLocation("/")}
              data-testid="brand-logo"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <i className="fas fa-graduation-cap text-primary-foreground"></i>
              </div>
              <span className="text-xl font-bold text-foreground">ProjectEnt</span>
            </Button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation
              .filter(item => !item.adminOnly || user?.username === "admin")
              .map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.href) 
                      ? "text-foreground bg-accent" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  onClick={() => setLocation(item.href)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {item.label}
                </Button>
              ))}
          </nav>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="hidden md:inline-flex"
              data-testid="button-theme-toggle"
            >
              <i className={`fas ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
            </Button>
            
            {/* Network Status */}
            <NetworkStatus className="hidden md:flex" />
            
            {/* Notification Bell */}
            {user && <NotificationBell />}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block font-medium">{user.username}</span>
                    <i className="fas fa-chevron-down text-xs"></i>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.createdAt && new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="dropdown-profile">
                    <i className="fas fa-user mr-2"></i>
                    Профиль
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setLocation("/ranking")} data-testid="dropdown-ranking">
                    <i className="fas fa-trophy mr-2"></i>
                    Рейтинг
                  </DropdownMenuItem>
                  
                  {user.username === "admin" && (
                    <DropdownMenuItem onClick={() => setLocation("/admin")} data-testid="dropdown-admin">
                      <i className="fas fa-cog mr-2"></i>
                      Админка
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-destructive focus:text-destructive"
                    data-testid="dropdown-logout"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => setLocation("/auth")} data-testid="button-login">
                Войти
              </Button>
            )}
            
            {/* Mobile Menu Toggle */}
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
