import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, LayoutDashboard, MessageSquare, FileText, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "/logo-batirnet.png";

const Navigation = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<{id: string} | null>(null);
  const [profile, setProfile] = useState<{user_type: string; full_name: string} | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
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
      
      console.log('Notifications count:', count, 'Error:', error);
      
      if (!error && count !== null) {
        setUnreadNotifications(count);
      } else if (error) {
        console.warn('Error fetching notifications:', error.message);
      }
    } catch (err) {
      console.warn('Could not fetch notifications count:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
            <img 
              src={logo} 
              alt="BâtirNet Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex items-center gap-8 mx-auto">
            <button 
              onClick={() => navigate("/professionals")}
              className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap"
            >
              {t('navigation.professionals')}
            </button>
            <button 
              onClick={() => navigate("/projects")}
              className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap"
            >
              {t('navigation.projects')}
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {user ? (
              <>
                {/* Notification Bell - Always visible */}
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
                      <DropdownMenuItem 
                        onClick={() => navigate("/dashboard")}
                        className="cursor-pointer"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t('navigation.dashboard')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate("/dashboard/profile")}
                        className="cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Mon profil
                      </DropdownMenuItem>
                    </>
                  )}
                  {profile?.user_type === 'professional' && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => navigate("/pro/dashboard")}
                        className="cursor-pointer"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard Pro
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate("/pro/profile")}
                        className="cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Mon profil
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate("/messages")}
                    className="cursor-pointer"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {t('navigation.messages')}
                  </DropdownMenuItem>
                  {profile?.user_type === 'professional' && (
                    <DropdownMenuItem 
                      onClick={() => navigate("/contracts")}
                      className="cursor-pointer"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {t('navigation.contracts')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600"
                  >
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
                <Button onClick={() => navigate("/auth?mode=signup")}>
                  {t('navigation.signup')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
