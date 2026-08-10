// US-112: Admin panel to review and set the status of a professional's RBQ
// licenses (manual verification — no external RBQ API). Changing a status
// triggers the compliance notifications (migration 087) to the professional
// and to clients of any active project (US-113).

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, ShieldAlert, ShieldX, ExternalLink, Loader2 } from "lucide-react";
import { openSignedDocument } from "@/lib/storage";

type LicenseStatus = "pending_verification" | "valid" | "expired" | "revoked";

interface RbqLicense {
  id: string;
  license_number: string;
  category: string;
  status: LicenseStatus;
  certificate_url: string | null;
  expires_at: string | null;
}

const STATUS_META: Record<LicenseStatus, { label: string; className: string }> = {
  valid: { label: "Valide", className: "bg-green-600" },
  pending_verification: { label: "En attente", className: "bg-amber-500" },
  expired: { label: "Expirée", className: "bg-orange-600" },
  revoked: { label: "Révoquée", className: "bg-red-600" },
};

const AdminLicensePanel = ({ professionalId }: { professionalId: string }) => {
  const { toast } = useToast();
  const [licenses, setLicenses] = useState<RbqLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("rbq_licenses")
        .select("id, license_number, category, status, certificate_url, expires_at")
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: true });
      if (active) {
        setLicenses((data as RbqLicense[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [professionalId]);

  const setStatus = async (license: RbqLicense, status: LicenseStatus) => {
    if (license.status === status) return;
    setUpdatingId(license.id);
    try {
      const { error } = await supabase
        .from("rbq_licenses")
        .update({ status, last_verified_at: new Date().toISOString() })
        .eq("id", license.id);
      if (error) throw error;
      setLicenses((prev) =>
        prev.map((l) => (l.id === license.id ? { ...l, status } : l))
      );
      toast({
        title: "Statut mis à jour",
        description: `Licence ${license.license_number} : ${STATUS_META[status].label}.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la licence.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement des licences…
      </div>
    );
  }

  if (licenses.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Aucune licence RBQ enregistrée par ce professionnel.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Vérification des licences RBQ
      </h4>
      {licenses.map((license) => (
        <div key={license.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="font-mono font-medium">{license.license_number}</p>
              <p className="text-xs text-muted-foreground">
                {license.category}
                {license.expires_at &&
                  ` · expire le ${new Date(license.expires_at).toLocaleDateString("fr-CA")}`}
              </p>
            </div>
            <Badge className={STATUS_META[license.status].className}>
              {STATUS_META[license.status].label}
            </Badge>
          </div>

          {license.certificate_url && (
            <Button
              variant="link"
              size="sm"
              className="px-0 h-auto"
              onClick={() => openSignedDocument(
                "certifications",
                license.certificate_url,
                () => toast({
                  variant: "destructive",
                  title: "Document indisponible",
                  description: "Impossible d'ouvrir ce certificat.",
                }),
              )}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Voir le certificat
            </Button>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Label className="text-xs text-muted-foreground mr-1">Définir :</Label>
            <Button
              size="sm"
              variant="outline"
              disabled={updatingId === license.id}
              className="text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => setStatus(license, "valid")}
            >
              <ShieldCheck className="h-4 w-4 mr-1" /> Valide
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={updatingId === license.id}
              className="text-orange-700 border-orange-300 hover:bg-orange-50"
              onClick={() => setStatus(license, "expired")}
            >
              <ShieldAlert className="h-4 w-4 mr-1" /> Expirée
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={updatingId === license.id}
              className="text-red-700 border-red-300 hover:bg-red-50"
              onClick={() => setStatus(license, "revoked")}
            >
              <ShieldX className="h-4 w-4 mr-1" /> Révoquée
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminLicensePanel;
