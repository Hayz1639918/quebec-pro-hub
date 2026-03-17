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
    className="flex items-center gap-3 w-full min-h-[44px] p-3 rounded-none border-b border-white/5 hover:bg-white/8 active:bg-white/12 transition-colors text-left touch-target group"
  >
    <Icon className="h-4 w-4 text-blue-400/70 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
    <span className="font-ui text-sm text-white/70 group-hover:text-white transition-colors">{label}</span>
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[hsl(214,75%,7%)]/95 backdrop-blur-lg border-b border-white/10 shadow-[0_4px_32px_-4px_hsl(210,100%,20%,0.5)]'
          : 'bg-[hsl(214,75%,7%)]/80 backdrop-blur-md border-b border-white/8'
      }`}
    >
      {/* Blueprint micro-grid strip */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'linear-gradient(hsl(210,100%,65%,0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(210,100%,65%,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="pt-safe relative">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-[68px]">

            {/* ── Logo ── */}
            <div
              className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer touch-target group"
              onClick={() => navigateTo("/")}
            >
              <img
                src={logo}
                alt="BâtirNet"
                className="h-9 sm:h-11 md:h-13 lg:h-14 w-auto object-contain brightness-110"
              />
            </div>

            {/* ── Desktop nav links ── */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {[
                { icon: Building2, label: 'Entrepreneurs', path: '/professionals?type=entrepreneur' },
                { icon: HardHat, label: 'Professionnels', path: '/professionals?type=trade_professional' },
                { icon: Search, label: 'Projets', path: '/projects' },
              ].map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="nav-link flex items-center gap-1.5 px-3 lg:px-4 py-2 text-white/65 hover:text-white transition-colors text-sm lg:text-[0.875rem] font-ui font-medium"
                >
                  <Icon className="h-3.5 w-3.5 text-blue-400/60 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Desktop right actions ── */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
              <LanguageSwitcher />

              {user ? (
                <>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-none h-9 w-9 text-white/60 hover:text-white hover:bg-white/10 border border-white/0 hover:border-white/15 transition-all"
                      onClick={() => navigate("/notifications")}
                    >
                      <Bell className={`h-4 w-4 ${unreadNotifications > 0 ? 'text-blue-400' : ''}`} />
                    </Button>
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-primary rounded-full border border-[hsl(214,75%,7%)] flex items-center justify-center pointer-events-none">
                        <span className="text-[9px] font-ui font-bold text-white leading-none">
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
                        className="rounded-none h-9 w-9 border border-white/20 hover:border-blue-400/50 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[hsl(214,70%,11%)] border-white/15 z-50 rounded-none shadow-[0_8px_32px_-4px_hsl(210,100%,20%,0.6)]">
                      <div className="px-3 py-2 border-b border-white/10">
                        <p className="font-ui text-sm font-semibold text-white truncate">
                          {profile?.full_name || user.email}
                        </p>
                        <p className="font-mono text-[10px] text-blue-400/70 mt-0.5 uppercase tracking-wider">
                          {profile?.user_type === 'client' ? 'Client'
                            : profile?.professional_type === 'entrepreneur' ? 'Entrepreneur'
                            : profile?.professional_type === 'trade_professional' ? 'Professionnel métier'
                            : 'Professionnel'}
                        </p>
                      </div>
                      <DropdownMenuSeparator className="bg-white/8" />
                      {profile?.user_type === 'client' && (
                        <>
                          <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer font-ui text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                            <LayoutDashboard className="mr-2 h-4 w-4 text-blue-400" />
                            {t('navigation.dashboard')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer font-ui text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                            <User className="mr-2 h-4 w-4 text-blue-400" />
                            Mon profil
                          </DropdownMenuItem>
                        </>
                      )}
                      {profile?.user_type === 'professional' && (
                        <>
                          {profile.is_rbq_verified ? (
                            <>
                              <DropdownMenuItem onClick={() => navigate("/pro/dashboard")} className="cursor-pointer font-ui text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                                <LayoutDashboard className="mr-2 h-4 w-4 text-blue-400" />
                                Dashboard Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate("/pro/profile")} className="cursor-pointer font-ui text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                                <User className="mr-2 h-4 w-4 text-blue-400" />
                                Mon profil
                              </DropdownMenuItem>
                            </>
                          ) : !profile.profile_completed ? (
                            <DropdownMenuItem
                              onClick={() => navigate(profile.professional_type === 'entrepreneur' ? "/complete-profile-entrepreneur" : "/complete-profile")}
                              className="cursor-pointer font-ui text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/10"
                            >
                              <User className="mr-2 h-4 w-4 text-blue-400" />
                              Compléter mon profil
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => navigate("/pending-verification")} className="cursor-pointer font-ui text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                              <Clock className="mr-2 h-4 w-4 text-blue-400" />
                              Vérification en attente
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      <DropdownMenuSeparator className="bg-white/8" />
                      {(profile?.user_type === 'client' || profile?.is_rbq_verified) && (
                        <DropdownMenuItem onClick={() => navigate("/messages")} className="cursor-pointer font-ui text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                          <MessageSquare className="mr-2 h-4 w-4 text-blue-400" />
                          {t('navigation.messages')}
                        </DropdownMenuItem>
                      )}
                      {profile?.user_type === 'professional' && profile?.is_rbq_verified && (
                        <DropdownMenuItem onClick={() => navigate("/contracts")} className="cursor-pointer font-ui text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                          <FileText className="mr-2 h-4 w-4 text-blue-400" />
                          {t('navigation.contracts')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-white/8" />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer font-ui text-sm text-red-400/80 hover:text-red-400 focus:text-red-400 focus:bg-red-400/10">
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('navigation.logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <button
                    className="hidden sm:block font-ui text-sm font-medium text-white/65 hover:text-white transition-colors px-3 py-2"
                    onClick={() => navigate("/auth?mode=login")}
                  >
                    {t('navigation.login')}
                  </button>
                  <button
                    className="font-ui font-bold text-xs uppercase tracking-[0.1em] px-4 py-2 bg-primary hover:bg-[hsl(210,100%,33%)] text-white transition-colors border border-transparent hover:border-blue-300/20"
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
                    className="h-10 w-10 touch-target text-white/60 hover:text-white hover:bg-white/10 rounded-none"
                    onClick={() => navigate("/notifications")}
                  >
                    <Bell className={`h-5 w-5 ${unreadNotifications > 0 ? 'text-blue-400' : ''}`} />
                  </Button>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-primary rounded-full border border-[hsl(214,75%,7%)] flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-ui font-bold text-white leading-none">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    </span>
                  )}
                </div>
              )}

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 touch-target text-white/70 hover:text-white hover:bg-white/10 rounded-none">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 pt-safe bg-[hsl(214,75%,7%)] border-l border-white/10 rounded-none">
                  {/* Blueprint grid background */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: 'linear-gradient(hsl(210,100%,65%,0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(210,100%,65%,0.2) 1px, transparent 1px)',
                      backgroundSize: '32px 32px',
                    }}
                  />

                  <SheetHeader className="p-4 border-b border-white/10 relative">
                    <SheetTitle className="flex items-center gap-2">
                      <img src={logo} alt="BâtirNet" className="h-9 w-auto brightness-110" />
                    </SheetTitle>
                    <span className="font-mono text-[9px] text-blue-400/50 uppercase tracking-[0.2em] mt-1 block">
                      PLATEFORME — QC/CA
                    </span>
                  </SheetHeader>

                  <div className="flex flex-col h-[calc(100%-80px)] overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto scroll-momentum">

                      <div className="px-2 pt-2 pb-1">
                        <p className="font-mono text-[9px] text-blue-400/40 uppercase tracking-[0.2em] px-3 py-2">Navigation</p>
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
                          <div className="px-2 pt-4 pb-1">
                            <p className="font-mono text-[9px] text-blue-400/40 uppercase tracking-[0.2em] px-3 py-2">Mon compte</p>
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

                    <div className="border-t border-white/10 p-4 space-y-3 pb-safe flex-shrink-0 relative">
                      <div className="flex items-center justify-between min-h-[44px]">
                        <span className="font-mono text-[9px] text-blue-400/50 uppercase tracking-[0.2em]">Langue</span>
                        <LanguageSwitcher />
                      </div>

                      {user ? (
                        <div className="space-y-2">
                          <div className="p-3 bg-white/5 border border-white/10">
                            <div className="font-ui font-semibold text-xs text-white truncate">{profile?.full_name || user.email}</div>
                            <div className="font-mono text-[9px] text-blue-400/60 mt-0.5 uppercase tracking-wider">
                              {profile?.user_type === 'client' ? 'Client'
                                : profile?.professional_type === 'entrepreneur' ? 'Entrepreneur'
                                : 'Professionnel'}
                            </div>
                          </div>
                          <button
                            className="w-full min-h-[44px] font-ui text-sm text-red-400/80 border border-red-400/20 hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4" />
                            {t('navigation.logout')}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            className="w-full min-h-[44px] font-ui font-bold text-sm uppercase tracking-[0.08em] bg-primary hover:bg-[hsl(210,100%,33%)] text-white transition-colors"
                            onClick={() => navigateTo("/auth?mode=signup")}
                          >
                            {t('navigation.signup')}
                          </button>
                          <button
                            className="w-full min-h-[44px] font-ui text-sm text-white/70 border border-white/15 hover:bg-white/8 hover:text-white transition-colors"
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
