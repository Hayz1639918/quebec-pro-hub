import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { User, LogOut, LayoutDashboard, MessageSquare, FileText, Bell, Menu, X, Building2, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "/logo-batirnet.png";

const Navigation = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<{id: string; email?: string} | null>(null);
  const [profile, setProfile] = useState<{user_type: string; full_name: string} | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setUnreadNotifications(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time subscription for notifications + polling
  useEffect(() => {
    if (!user?.id) return;

    // Fetch immediately
    fetchUnreadNotifications(user.id);

    // Real-time subscription
    const channel = supabase
      .channel('navigation-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadNotifications(user.id);
        }
      )
      .subscribe();

    // Polling every 10 seconds as backup
    const interval = setInterval(() => {
      fetchUnreadNotifications(user.id);
    }, 10000);

    // Refresh when window gets focus
    const handleFocus = () => {
      fetchUnreadNotifications(user.id);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    
    // Fetch unread notifications count
    fetchUnreadNotifications(userId);
  };

  const fetchUnreadNotifications = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (!error && count !== null) {
        setUnreadNotifications(count);
      }
    } catch (err) {
      console.warn('Could not fetch notifications count:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const navigateTo = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 flex-shrink-0 cursor-pointer" 
            onClick={() => navigateTo("/")}
          >
            <img 
              src={logo} 
              alt="BâtirNet" 
              className="h-12 sm:h-16 lg:h-20 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <button 
              onClick={() => navigate("/professionals")}
              className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap text-sm lg:text-base"
            >
              {t('navigation.professionals')}
            </button>
            <button 
              onClick={() => navigate("/projects")}
              className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap text-sm lg:text-base"
            >
              {t('navigation.projects')}
            </button>
          </div>

          {/* Desktop Right Side Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0">
            <LanguageSwitcher />
            
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    onClick={() => navigate("/notifications")}
                  >
                    <Bell className={`h-5 w-5 ${unreadNotifications > 0 ? 'text-destructive' : ''}`} />
                  </Button>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-destructive rounded-full border-2 border-background flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-white">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    </span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full relative">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card z-50">
                    <div className="px-2 py-1.5 text-sm font-semibold">
                      {profile?.full_name || user.email}
                    </div>
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      {profile?.user_type === 'client' ? t('auth.signup.client') : t('auth.signup.professional')}
                    </div>
                    <DropdownMenuSeparator />
                    {profile?.user_type === 'client' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          {t('navigation.dashboard')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Mon profil
                        </DropdownMenuItem>
                      </>
                    )}
                    {profile?.user_type === 'professional' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/pro/dashboard")} className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard Pro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/pro/profile")} className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Mon profil
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/messages")} className="cursor-pointer">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t('navigation.messages')}
                    </DropdownMenuItem>
                    {profile?.user_type === 'professional' && (
                      <DropdownMenuItem onClick={() => navigate("/contracts")} className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        {t('navigation.contracts')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('navigation.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("/auth?mode=login")}
                >
                  {t('navigation.login')}
                </Button>
                <Button onClick={() => navigate("/auth?mode=signup")} size="sm" className="lg:size-default">
                  {t('navigation.signup')}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-9 w-9"
                  onClick={() => navigate("/notifications")}
                >
                  <Bell className={`h-5 w-5 ${unreadNotifications > 0 ? 'text-destructive' : ''}`} />
                </Button>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-destructive rounded-full border-2 border-background flex items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-bold text-white">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  </span>
                )}
              </div>
            )}
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <img src={logo} alt="BâtirNet" className="h-10 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col h-[calc(100%-65px)]">
                  {/* Main Navigation */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                      onClick={() => navigateTo("/professionals")}
                      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="font-medium">{t('navigation.professionals')}</span>
                    </button>
                    <button
                      onClick={() => navigateTo("/projects")}
                      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Briefcase className="h-5 w-5 text-primary" />
                      <span className="font-medium">{t('navigation.projects')}</span>
                    </button>

                    {user && (
                      <>
                        <div className="h-px bg-border my-4" />
                        
                        {profile?.user_type === 'client' && (
                          <>
                            <button
                              onClick={() => navigateTo("/dashboard")}
                              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                              <span>{t('navigation.dashboard')}</span>
                            </button>
                            <button
                              onClick={() => navigateTo("/dashboard/profile")}
                              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <User className="h-5 w-5 text-muted-foreground" />
                              <span>Mon profil</span>
                            </button>
                          </>
                        )}
                        
                        {profile?.user_type === 'professional' && (
                          <>
                            <button
                              onClick={() => navigateTo("/pro/dashboard")}
                              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                              <span>Dashboard Pro</span>
                            </button>
                            <button
                              onClick={() => navigateTo("/pro/profile")}
                              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <User className="h-5 w-5 text-muted-foreground" />
                              <span>Mon profil</span>
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => navigateTo("/messages")}
                          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <MessageSquare className="h-5 w-5 text-muted-foreground" />
                          <span>{t('navigation.messages')}</span>
                        </button>
                        
                        {profile?.user_type === 'professional' && (
                          <button
                            onClick={() => navigateTo("/contracts")}
                            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span>{t('navigation.contracts')}</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Bottom Section */}
                  <div className="border-t p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Langue</span>
                      <LanguageSwitcher />
                    </div>
                    
                    {user ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium text-sm">{profile?.full_name || user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {profile?.user_type === 'client' ? t('auth.signup.client') : t('auth.signup.professional')}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {t('navigation.logout')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          onClick={() => navigateTo("/auth?mode=signup")}
                        >
                          {t('navigation.signup')}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => navigateTo("/auth?mode=login")}
                        >
                          {t('navigation.login')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
