import React from "react";
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
import { User, LogOut, LayoutDashboard, MessageSquare, FileText, Bell, Menu, X, Building2, Briefcase, Clock, HardHat, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "/logo-batirnet.png";

const MobileNavItem = ({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 w-full min-h-[44px] p-3 rounded-md hover:bg-muted active:bg-muted/60 transition-colors text-left touch-target group"
  >
    <Icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
    <span className="font-ui text-sm text-foreground/75 group-hover:text-foreground transition-colors">{label}</span>
  </button>
);

const Navigation = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<{id: string; email?: string} | null>(null);
  const [profile, setProfile] = useState<{user_type: string; full_name: string; is_rbq_verified?: boolean; profile_completed?: boolean; professional_type?: string} | null>(null);
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/96 backdrop-blur-md border-b border-border/60">
      <div className="pt-safe">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">

            {/* ── Logo ── */}
            <div
              className="flex items-center gap-2 flex-shrink-0 cursor-pointer touch-target"
              onClick={() => navigateTo("/")}
            >
              <img
                src={logo}
                alt="BâtirNet"
                className="h-9 sm:h-11 md:h-14 lg:h-16 w-auto object-contain"
              />
            </div>

            {/* ── Desktop nav links — context-aware ── */}
            <div className="hidden md:flex items-center gap-5 lg:gap-7">
              {/* Trouver un entrepreneur — visible to everyone */}
              <button
                onClick={() => navigate("/professionals?type=entrepreneur")}
                className="nav-link text-foreground/75 hover:text-foreground transition-colors text-sm lg:text-base pb-0.5 flex items-center gap-1.5"
              >
                <Building2 className="h-3.5 w-3.5" />
                Trouver un entrepreneur
              </button>
              {/* Trouver un professionnel — visible to everyone */}
              <button
                onClick={() => navigate("/professionals?type=trade_professional")}
                className="nav-link text-foreground/75 hover:text-foreground transition-colors text-sm lg:text-base pb-0.5 flex items-center gap-1.5"
              >
                <HardHat className="h-3.5 w-3.5" />
                Trouver un professionnel
              </button>
              {/* Trouver un projet — visible to everyone */}
              <button
                onClick={() => navigate("/projects")}
                className="nav-link text-foreground/75 hover:text-foreground transition-colors text-sm lg:text-base pb-0.5 flex items-center gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                Trouver un projet
              </button>
            </div>

            {/* ── Desktop right actions ── */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
              <LanguageSwitcher />

              {user ? (
                <>
                  {/* Bell */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-foreground/70 hover:text-foreground hover:bg-muted"
                      onClick={() => navigate("/notifications")}
                    >
                      <Bell className={`h-4.5 w-4.5 ${unreadNotifications > 0 ? 'text-primary' : ''}`} />
                    </Button>
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary rounded-full border-2 border-background flex items-center justify-center pointer-events-none">
                        <span className="text-[9px] font-ui font-bold text-primary-foreground">
                          {unreadNotifications > 99 ? '99+' : unreadNotifications}
                        </span>
                      </span>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full border border-border/50 hover:border-primary/40 hover:bg-muted text-foreground/70 hover:text-foreground"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
                      <div className="px-3 py-2">
                        <p className="font-ui text-sm font-semibold text-foreground truncate">
                          {profile?.full_name || user.email}
                        </p>
                        <p className="font-ui text-xs text-muted-foreground mt-0.5">
                          {profile?.user_type === 'client'
                            ? 'Client'
                            : profile?.professional_type === 'entrepreneur'
                            ? 'Entrepreneur'
                            : profile?.professional_type === 'trade_professional'
                            ? 'Professionnel métier'
                            : 'Professionnel'}
                        </p>
                      </div>
                      <DropdownMenuSeparator />
                      {profile?.user_type === 'client' && (
                        <>
                          <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer font-ui text-sm">
                            <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                            {t('navigation.dashboard')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer font-ui text-sm">
                            <User className="mr-2 h-4 w-4 text-primary" />
                            Mon profil
                          </DropdownMenuItem>
                        </>
                      )}
                      {profile?.user_type === 'professional' && (
                        <>
                          {!profile.profile_completed ? (
                            <DropdownMenuItem
                              onClick={() => navigate(profile.professional_type === 'entrepreneur' ? "/complete-profile-entrepreneur" : "/complete-profile")}
                              className="cursor-pointer font-ui text-sm"
                            >
                              <User className="mr-2 h-4 w-4 text-primary" />
                              Compléter mon profil
                            </DropdownMenuItem>
                          ) : !profile.is_rbq_verified ? (
                            <DropdownMenuItem onClick={() => navigate("/pending-verification")} className="cursor-pointer font-ui text-sm">
                              <Clock className="mr-2 h-4 w-4 text-primary" />
                              Vérification en attente
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => navigate("/pro/dashboard")} className="cursor-pointer font-ui text-sm">
                                <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                                Dashboard Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate("/pro/profile")} className="cursor-pointer font-ui text-sm">
                                <User className="mr-2 h-4 w-4 text-primary" />
                                Mon profil
                              </DropdownMenuItem>
                            </>
                          )}
                        </>
                      )}
                      <DropdownMenuSeparator />
                      {(profile?.user_type === 'client' || profile?.is_rbq_verified) && (
                        <DropdownMenuItem onClick={() => navigate("/messages")} className="cursor-pointer font-ui text-sm">
                          <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                          {t('navigation.messages')}
                        </DropdownMenuItem>
                      )}
                      {profile?.user_type === 'professional' && profile?.is_rbq_verified && (
                        <DropdownMenuItem onClick={() => navigate("/contracts")} className="cursor-pointer font-ui text-sm">
                          <FileText className="mr-2 h-4 w-4 text-primary" />
                          {t('navigation.contracts')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer font-ui text-sm text-destructive focus:text-destructive">
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
                    className="hidden sm:inline-flex font-ui text-sm text-foreground/75 hover:text-foreground"
                    onClick={() => navigate("/auth?mode=login")}
                  >
                    {t('navigation.login')}
                  </Button>
                  <Button
                    className="font-ui font-semibold text-sm uppercase tracking-wider"
                    size="sm"
                    onClick={() => navigate("/auth?mode=signup")}
                  >
                    {t('navigation.signup')}
                  </Button>
                </>
              )}
            </div>

            {/* ── Mobile: bell + sheet menu ── */}
            <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
              {user && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-10 w-10 touch-target text-foreground/70"
                    onClick={() => navigate("/notifications")}
                  >
                    <Bell className={`h-5 w-5 ${unreadNotifications > 0 ? 'text-primary' : ''}`} />
                  </Button>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary rounded-full border-2 border-background flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-ui font-bold text-primary-foreground">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    </span>
                  )}
                </div>
              )}

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 touch-target text-foreground/70">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 pt-safe bg-card border-border">
                  <SheetHeader className="p-4 border-b border-border">
                    <SheetTitle className="flex items-center gap-2">
                      <img src={logo} alt="BâtirNet" className="h-9 w-auto" />
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col h-[calc(100%-60px)] overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 scroll-momentum">
                      {/* Discovery links — visible to everyone */}
                      <button onClick={() => navigateTo('/professionals?type=entrepreneur')} className="flex items-center gap-3 w-full min-h-[44px] p-3 rounded-md hover:bg-muted active:bg-muted/60 transition-colors text-left touch-target group">
                        <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-ui font-medium text-sm text-foreground/80 group-hover:text-foreground transition-colors">Trouver un entrepreneur</span>
                      </button>
                      <button onClick={() => navigateTo('/professionals?type=trade_professional')} className="flex items-center gap-3 w-full min-h-[44px] p-3 rounded-md hover:bg-muted active:bg-muted/60 transition-colors text-left touch-target group">
                        <HardHat className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-ui font-medium text-sm text-foreground/80 group-hover:text-foreground transition-colors">Trouver un professionnel</span>
                      </button>
                      {/* Trouver un projet — everyone */}
                      <button onClick={() => navigateTo('/projects')} className="flex items-center gap-3 w-full min-h-[44px] p-3 rounded-md hover:bg-muted active:bg-muted/60 transition-colors text-left touch-target group">
                        <Search className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-ui font-medium text-sm text-foreground/80 group-hover:text-foreground transition-colors">Trouver un projet</span>
                      </button>

                      {user && (
                        <>
                          <div className="h-px bg-border my-2" />
                          {profile?.user_type === 'client' && (
                            <>
                              <MobileNavItem icon={LayoutDashboard} label={t('navigation.dashboard')} onClick={() => navigateTo("/dashboard")} />
                              <MobileNavItem icon={User} label="Mon profil" onClick={() => navigateTo("/dashboard/profile")} />
                            </>
                          )}
                          {profile?.user_type === 'professional' && (
                            !profile.profile_completed ? (
                              <MobileNavItem icon={User} label="Compléter mon profil" onClick={() => navigateTo(profile.professional_type === 'entrepreneur' ? "/complete-profile-entrepreneur" : "/complete-profile")} />
                            ) : !profile.is_rbq_verified ? (
                              <MobileNavItem icon={Clock} label="Vérification en attente" onClick={() => navigateTo("/pending-verification")} />
                            ) : (
                              <>
                                <MobileNavItem icon={LayoutDashboard} label="Dashboard Pro" onClick={() => navigateTo("/pro/dashboard")} />
                                <MobileNavItem icon={User} label="Mon profil" onClick={() => navigateTo("/pro/profile")} />
                              </>
                            )
                          )}
                          {(profile?.user_type === 'client' || profile?.is_rbq_verified) && (
                            <MobileNavItem icon={MessageSquare} label={t('navigation.messages')} onClick={() => navigateTo("/messages")} />
                          )}
                          {profile?.user_type === 'professional' && profile?.is_rbq_verified && (
                            <MobileNavItem icon={FileText} label={t('navigation.contracts')} onClick={() => navigateTo("/contracts")} />
                          )}
                        </>
                      )}
                    </div>

                    <div className="border-t border-border p-3 sm:p-4 space-y-2.5 pb-safe flex-shrink-0">
                      <div className="flex items-center justify-between min-h-[44px]">
                        <span className="font-ui text-xs text-muted-foreground uppercase tracking-wider">Langue</span>
                        <LanguageSwitcher />
                      </div>

                      {user ? (
                        <div className="space-y-2">
                          <div className="p-3 bg-muted rounded-md border border-border/50">
                            <div className="font-ui font-semibold text-xs text-foreground truncate">{profile?.full_name || user.email}</div>
                            <div className="font-ui text-[10px] text-muted-foreground mt-0.5">
                              {profile?.user_type === 'client'
                                ? 'Client'
                                : profile?.professional_type === 'entrepreneur'
                                ? 'Entrepreneur'
                                : profile?.professional_type === 'trade_professional'
                                ? 'Professionnel métier'
                                : 'Professionnel'}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full min-h-[44px] font-ui text-sm text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={handleLogout}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            {t('navigation.logout')}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button className="w-full min-h-[44px] font-ui font-semibold text-sm uppercase tracking-wider" onClick={() => navigateTo("/auth?mode=signup")}>
                            {t('navigation.signup')}
                          </Button>
                          <Button variant="outline" className="w-full min-h-[44px] font-ui text-sm" onClick={() => navigateTo("/auth?mode=login")}>
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
      </div>
    </nav>
  );
};

export default Navigation;
