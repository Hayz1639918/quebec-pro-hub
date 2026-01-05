import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, FileText, Shield, Loader2, LogOut } from "lucide-react";
import logo from "/logo-batirnet.png";

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
        .select('full_name, company_name, rbq_number, is_rbq_verified, user_type, profile_completed')
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

      // If professional but profile not completed, redirect to complete-profile
      if (!profileData.profile_completed) {
        navigate("/complete-profile");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-background to-yellow-50 p-4">
      <Card className="w-full max-w-lg mx-auto shadow-lg border-orange-200">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <img 
              src={logo} 
              alt="BâtirNet Logo" 
              className="h-14 w-14 rounded-lg object-cover"
            />
          </div>
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-orange-600 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-2xl text-orange-900">
              Vérification en cours
            </CardTitle>
            <CardDescription className="text-orange-700 mt-2">
              Votre certification RBQ est en attente de validation par notre équipe
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          {/* Profile Info */}
          <div className="bg-white border border-orange-100 rounded-lg p-4 space-y-2">
            <p className="font-medium text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-gray-600">{profile?.company_name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              RBQ: {profile?.rbq_number}
            </p>
          </div>

          {/* Status Steps */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">Compte créé</span>
            </div>
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">Email confirmé</span>
            </div>
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">Profil complété</span>
            </div>
            <div className="flex items-center gap-3 text-orange-600">
              <Clock className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-medium">Validation RBQ en cours...</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Accès à la plateforme</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Délai estimé :</strong> Notre équipe vérifie généralement les certifications RBQ 
              sous 24 à 48 heures ouvrables. Vous recevrez un email dès que votre compte sera activé.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="w-full"
            >
              🔄 Vérifier mon statut
            </Button>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-gray-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingVerification;

