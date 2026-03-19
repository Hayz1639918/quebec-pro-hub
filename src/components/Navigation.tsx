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
import { User, LogOut, LayoutDashboard, MessageSquare, FileText, Bell, Menu, Building2, Briefcase, Clock, HardHat, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "/logo-batirnet.png";

const MobileNavItem = ({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 w-full min-h-[44px] p-3.5 border-b border-foreground/5 hover:bg-foreground/5 active:bg-foreground/8 transition-colors text-left touch-target group"
  >
    <Icon className="h-4 w-4 text-primary/60 group-hover:text-primary flex-shrink-0 transition-colors" />
    <span className="font-ui text-sm text-foreground/70 group-hover:text-foreground transition-colors">{label}</span>
  </button>
);

const Navigation = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<{id: string; email?: string} | null>(null);
  const [profile, setProfile] = useState<{user_type: string; full_name: string; is_rbq_verified?: boolean; profile_completed?: boolean; professional_type?: string} | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchUnreadNotifications(user.id);
    const channel = supabase
      .channel('navigation-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        fetchUnreadNotifications(user.id);
      })
      .subscribe();
    const interval = setInterval(() => fetchUnreadNotifications(user.id), 10000);
    const handleFocus = () => fetchUnreadNotifications(user.id);
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
    if (session?.user) await fetchProfile(session.user.id);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
    fetchUnreadNotifications(userId);
  };

  const fetchUnreadNotifications = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (!error && count !== null) setUnreadNotifications(count);
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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-lg border-b border-foreground/8 shadow-soft'
          : 'bg-transparent'
      }`}
    >
      <div className="pt-safe relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">

            {/* ── Logo ── */}
            <div
              className="flex items-center gap-3 flex-shrink-0 cursor-pointer touch-target group"
              onClick={() => navigateTo("/")}
            >
              <img
                src={logo}
                alt="BâtirNet"
                className="h-9 sm:h-11 md:h-12 w-auto object-contain"
              />
            </div>

            {/* ── Desktop nav links ── */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {[
                { label: 'Entrepreneurs', path: '/professionals?type=entrepreneur' },
                { label: 'Professionnels', path: '/professionals?type=trade_professional' },
                { label: 'Projets', path: '/projects' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="nav-link px-4 py-2 text-foreground/50 hover:text-foreground transition-colors text-sm font-ui"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Desktop right actions ── */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <LanguageSwitcher />

              {user ? (
                <>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-9 w-9 text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                      onClick={() => navigate("/notifications")}
                    >
                      <Bell className={`h-4 w-4 ${unreadNotifications > 0 ? 'text-primary' : ''}`} />
                    </Button>
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-primary rounded-full flex items-center justify-center pointer-events-none">
                        <span className="text-[9px] font-ui font-bold text-primary-foreground leading-none">
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
                        className="rounded-full h-9 w-9 border border-foreground/10 hover:border-foreground/20 hover:bg-foreground/5 text-foreground/50 hover:text-foreground transition-all"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50 rounded-md shadow-medium">
                      <div className="px-3 py-2.5 border-b border-border">
                        <p className="font-ui text-sm font-medium text-foreground truncate">
                          {profile?.full_name || user.email}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                          {profile?.user_type === 'client' ? 'Client'
                            : profile?.professional_type === 'entrepreneur' ? 'Entrepreneur'
                            : profile?.professional_type === 'trade_professional' ? 'Professionnel métier'
                            : 'Professionnel'}
                        </p>
                      </div>
                      <DropdownMenuSeparator />
                      {profile?.user_type === 'client' && (
                        <>
                          <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer font-ui text-sm">
                            <LayoutDashboard className="mr-2 h-4 w-4 text-primary/60" />
                            {t('navigation.dashboard')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer font-ui text-sm">
                            <User className="mr-2 h-4 w-4 text-primary/60" />
                            Mon profil
                          </DropdownMenuItem>
                        </>
                      )}
                      {profile?.user_type === 'professional' && (
                        <>
                          {profile.is_rbq_verified ? (
                            <>
                              <DropdownMenuItem onClick={() => navigate("/pro/dashboard")} className="cursor-pointer font-ui text-sm">
                                <LayoutDashboard className="mr-2 h-4 w-4 text-primary/60" />
                                Dashboard Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate("/pro/profile")} className="cursor-pointer font-ui text-sm">
                                <User className="mr-2 h-4 w-4 text-primary/60" />
                                Mon profil
                              </DropdownMenuItem>
                            </>
                          ) : !profile.profile_completed ? (
                            <DropdownMenuItem
                              onClick={() => navigate(profile.professional_type === 'entrepreneur' ? "/complete-profile-entrepreneur" : "/complete-profile")}
                              className="cursor-pointer font-ui text-sm"
                            >
                              <User className="mr-2 h-4 w-4 text-primary/60" />
                              Compléter mon profil
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => navigate("/pending-verification")} className="cursor-pointer font-ui text-sm">
                              <Clock className="mr-2 h-4 w-4 text-primary/60" />
                              Vérification en attente
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      <DropdownMenuSeparator />
                      {(profile?.user_type === 'client' || profile?.is_rbq_verified) && (
                        <DropdownMenuItem onClick={() => navigate("/messages")} className="cursor-pointer font-ui text-sm">
                          <MessageSquare className="mr-2 h-4 w-4 text-primary/60" />
                          {t('navigation.messages')}
                        </DropdownMenuItem>
                      )}
                      {profile?.user_type === 'professional' && profile?.is_rbq_verified && (
                        <DropdownMenuItem onClick={() => navigate("/contracts")} className="cursor-pointer font-ui text-sm">
                          <FileText className="mr-2 h-4 w-4 text-primary/60" />
                          {t('navigation.contracts')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer font-ui text-sm text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('navigation.logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <button
                    className="hidden sm:block font-ui text-sm text-foreground/50 hover:text-foreground transition-colors px-3 py-2"
                    onClick={() => navigate("/auth?mode=login")}
                  >
                    {t('navigation.login')}
                  </button>
                  <button
                    className="font-ui font-medium text-sm px-5 py-2 bg-primary hover:bg-primary-hover text-white transition-colors rounded-full"
                    onClick={() => navigate("/auth?mode=signup")}
                  >
                    {t('navigation.signup')}
                  </button>
                </>
              )}
            </div>

            {/* ── Mobile: bell + sheet menu ── */}
            <div className="flex md:hidden items-center gap-1.5">
              {user && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 touch-target text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full"
                    onClick={() => navigate("/notifications")}
                  >
                    <Bell className={`h-5 w-5 ${unreadNotifications > 0 ? 'text-primary' : ''}`} />
                  </Button>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-primary rounded-full flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-ui font-bold text-primary-foreground leading-none">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    </span>
                  )}
                </div>
              )}

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 touch-target text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-full">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0 pt-safe bg-background border-l border-border">
                  <SheetHeader className="p-5 border-b border-border">
                    <SheetTitle className="flex items-center gap-2">
                      <img src={logo} alt="BâtirNet" className="h-9 w-auto" />
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col h-[calc(100%-72px)] overflow-hidden">
                    <div className="flex-1 overflow-y-auto scroll-momentum">

                      <div className="px-5 pt-4 pb-2">
                        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.1em]">Navigation</p>
                      </div>

                      {[
                        { icon: Building2, label: 'Trouver un entrepreneur', path: '/professionals?type=entrepreneur' },
                        { icon: HardHat, label: 'Trouver un professionnel', path: '/professionals?type=trade_professional' },
                        { icon: Search, label: 'Trouver un projet', path: '/projects' },
                      ].map(({ icon, label, path }) => (
                        <MobileNavItem key={path} icon={icon} label={label} onClick={() => navigateTo(path)} />
                      ))}

                      {user && (
                        <>
                          <div className="px-5 pt-6 pb-2">
                            <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.1em]">Mon compte</p>
                          </div>
                          {profile?.user_type === 'client' && (
                            <>
                              <MobileNavItem icon={LayoutDashboard} label={t('navigation.dashboard')} onClick={() => navigateTo("/dashboard")} />
                              <MobileNavItem icon={User} label="Mon profil" onClick={() => navigateTo("/dashboard/profile")} />
                            </>
                          )}
                          {profile?.user_type === 'professional' && (
                            profile.is_rbq_verified ? (
                              <>
                                <MobileNavItem icon={LayoutDashboard} label="Dashboard Pro" onClick={() => navigateTo("/pro/dashboard")} />
                                <MobileNavItem icon={User} label="Mon profil" onClick={() => navigateTo("/pro/profile")} />
                              </>
                            ) : !profile.profile_completed ? (
                              <MobileNavItem icon={User} label="Compléter mon profil" onClick={() => navigateTo(profile.professional_type === 'entrepreneur' ? "/complete-profile-entrepreneur" : "/complete-profile")} />
                            ) : (
                              <MobileNavItem icon={Clock} label="Vérification en attente" onClick={() => navigateTo("/pending-verification")} />
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

                    <div className="border-t border-border p-5 space-y-3 pb-safe flex-shrink-0">
                      <div className="flex items-center justify-between min-h-[44px]">
                        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.1em]">Langue</span>
                        <LanguageSwitcher />
                      </div>

                      {user ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded-md">
                            <div className="font-ui font-medium text-sm text-foreground truncate">{profile?.full_name || user.email}</div>
                            <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                              {profile?.user_type === 'client' ? 'Client'
                                : profile?.professional_type === 'entrepreneur' ? 'Entrepreneur'
                                : 'Professionnel'}
                            </div>
                          </div>
                          <button
                            className="w-full min-h-[44px] font-ui text-sm text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2 rounded-md"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4" />
                            {t('navigation.logout')}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            className="w-full min-h-[44px] font-ui font-medium text-sm bg-primary text-white hover:bg-primary-hover transition-colors rounded-full"
                            onClick={() => navigateTo("/auth?mode=signup")}
                          >
                            {t('navigation.signup')}
                          </button>
                          <button
                            className="w-full min-h-[44px] font-ui text-sm text-foreground/60 border border-border hover:bg-muted hover:text-foreground transition-colors rounded-full"
                            onClick={() => navigateTo("/auth?mode=login")}
                          >
                            {t('navigation.login')}
                          </button>
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
