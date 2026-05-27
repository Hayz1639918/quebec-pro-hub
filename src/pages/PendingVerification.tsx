import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, FileText, Shield, Loader2, LogOut, RefreshCw, Lightbulb } from "lucide-react";

const PendingVerification = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<{
    full_name: string;
    company_name: string | null;
    rbq_number: string | null;
    is_rbq_verified: boolean;
  } | null>(null);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, company_name, rbq_number, is_rbq_verified, user_type, profile_completed, professional_type')
        .eq('id', session.user.id)
        .single();

      if (!profileData) {
        navigate("/auth");
        return;
      }

      // If client, redirect to dashboard
      if (profileData.user_type === 'client') {
        navigate("/dashboard");
        return;
      }

      // If professional but profile not completed, redirect to the right completion page
      if (!profileData.profile_completed) {
        const completionRoute = profileData.professional_type === 'trade_professional'
          ? "/complete-profile-trade"
          : "/complete-profile-entrepreneur";
        navigate(completionRoute);
        return;
      }

      // If already verified, redirect to pro dashboard
      if (profileData.is_rbq_verified) {
        navigate("/pro/dashboard");
        return;
      }

      setProfile({
        full_name: profileData.full_name,
        company_name: profileData.company_name,
        rbq_number: profileData.rbq_number,
        is_rbq_verified: profileData.is_rbq_verified,
      });
      setChecking(false);
    };

    checkVerificationStatus();

    // Poll for verification status every 30 seconds
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_rbq_verified')
        .eq('id', session.user.id)
        .single();

      if (profileData?.is_rbq_verified) {
        // RBQ has been verified! Redirect to pro dashboard
        navigate("/pro/dashboard");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleRefresh = async () => {
    setChecking(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_rbq_verified')
      .eq('id', session.user.id)
      .single();

    if (profileData?.is_rbq_verified) {
      navigate("/pro/dashboard");
    } else {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 flex-1">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-10 w-10 text-orange-600 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Vérification en cours
            </h1>
            <p className="text-muted-foreground">
              Votre certification RBQ est en attente de validation par notre équipe
            </p>
          </div>

          {/* Main Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations soumises
              </CardTitle>
              <CardDescription>
                Vos informations professionnelles en cours de vérification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-foreground">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{profile?.company_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  RBQ: {profile?.rbq_number}
                </p>
              </div>

              {/* Status Steps */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Progression</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">Compte créé</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">Email confirmé</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">Profil complété</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600 animate-pulse" />
                    </div>
                    <span className="text-sm font-medium text-orange-600">Validation RBQ en cours...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">Accès à la plateforme</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-1 flex items-center gap-1.5"><Lightbulb className="h-4 w-4" />Délai estimé</h4>
            <p className="text-sm text-blue-800">
              Notre équipe vérifie généralement les certifications RBQ sous 24 à 48 heures ouvrables. 
              Vous recevrez un email dès que votre compte sera activé.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleRefresh}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Vérifier mon statut
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PendingVerification;

