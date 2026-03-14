// US-107: RBQ License Manager
// License numbers per work category, format validation (XXXXXXX-XX), admin verification status

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RBQLicense, RBQLicenseFormData } from "@/types/contractor-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, Plus, Trash2, AlertCircle, CheckCircle2, Clock, XCircle, Upload } from "lucide-react";
import { CCQ_TRADES } from "@/data/ccq-trades";

interface RBQLicenseManagerProps {
  professionalId: string;
}

const RBQ_LICENSE_REGEX = /^\d{7}-\d{2}$/;

const statusConfig: Record<RBQLicense["status"], { label: string; color: string; icon: React.ReactNode }> = {
  pending_verification: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="h-3 w-3" />,
  },
  valid: {
    label: "Valide",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  expired: {
    label: "Expiré",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: <XCircle className="h-3 w-3" />,
  },
  revoked: {
    label: "Révoqué",
    color: "bg-red-200 text-red-900 border-red-400",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const WORK_CATEGORIES = [
  ...CCQ_TRADES.map((t) => ({ value: t.code, label: t.name_fr })),
  { value: "GENERAL", label: "Entrepreneur général" },
  { value: "SPECIALISE", label: "Entrepreneur spécialisé" },
];

const emptyForm: RBQLicenseFormData = {
  license_number: "",
  category: "",
  issued_at: "",
  expires_at: "",
  certificate_url: "",
};

const RBQLicenseManager = ({ professionalId }: RBQLicenseManagerProps) => {
  const { toast } = useToast();
  const [licenses, setLicenses] = useState<RBQLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RBQLicenseFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLicenses();
  }, [professionalId]);

  const fetchLicenses = async () => {
    const { data, error } = await supabase
      .from("rbq_licenses")
      .select("*")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });
    if (!error) setLicenses(data ?? []);
    setLoading(false);
  };

  const validateForm = (): boolean => {
    if (!form.license_number.trim()) {
      setFormError("Le numéro de licence est requis.");
      return false;
    }
    if (!RBQ_LICENSE_REGEX.test(form.license_number.trim())) {
      setFormError("Format invalide. Le format requis est XXXXXXX-XX (ex : 8365477-01).");
      return false;
    }
    if (!form.category) {
      setFormError("Veuillez sélectionner une catégorie de travaux.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const addLicense = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("rbq_licenses").insert({
        professional_id: professionalId,
        license_number: form.license_number.trim().toUpperCase(),
        category: form.category,
        issued_at: form.issued_at || null,
        expires_at: form.expires_at || null,
        certificate_url: form.certificate_url || null,
        status: "pending_verification",
      });
      if (error) throw error;
      toast({ title: "Licence ajoutée", description: "Votre licence RBQ sera vérifiée par l'équipe." });
      setForm(emptyForm);
      setShowForm(false);
      await fetchLicenses();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter la licence." });
    } finally {
      setSaving(false);
    }
  };

  const deleteLicense = async (id: string) => {
    const { error } = await supabase.from("rbq_licenses").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la licence." });
    } else {
      setLicenses((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Licence supprimée" });
    }
  };

  const handleCertificateUpload = async (licenseId: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Fichier trop volumineux", description: "Maximum 10 MB." });
      return;
    }
    setUploadingId(licenseId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${professionalId}/${licenseId}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("certifications").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("certifications").getPublicUrl(path);
      const { error: updateError } = await supabase.from("rbq_licenses").update({ certificate_url: publicUrl }).eq("id", licenseId);
      if (updateError) throw updateError;

      await fetchLicenses();
      toast({ title: "Certificat uploadé", description: "Le document a été joint à la licence." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur upload", description: "Impossible d'uploader le certificat." });
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Chargement des licences...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Licences RBQ
        </CardTitle>
        <CardDescription>
          Ajoutez vos numéros de licence RBQ par catégorie de travaux. Format requis : XXXXXXX-XX
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing licenses */}
        {licenses.length > 0 && (
          <div className="space-y-3">
            {licenses.map((license) => {
              const cfg = statusConfig[license.status];
              const catLabel = WORK_CATEGORIES.find((c) => c.value === license.category)?.label ?? license.category;
              return (
                <div
                  key={license.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg bg-muted/20"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold text-sm">{license.license_number}</span>
                      <Badge variant="outline" className={`${cfg.color} flex items-center gap-1 text-xs`}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{catLabel}</p>
                    {license.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expiration : {new Date(license.expires_at).toLocaleDateString("fr-CA")}
                      </p>
                    )}
                    {license.notes && (
                      <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">{license.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Upload certificate */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={uploadingId === license.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCertificateUpload(license.id, f);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        disabled={uploadingId === license.id}
                        className="pointer-events-none"
                      >
                        <span className="flex items-center gap-1 text-xs">
                          <Upload className="h-3 w-3" />
                          {uploadingId === license.id ? "Upload..." : license.certificate_url ? "Remplacer" : "Joindre"}
                        </span>
                      </Button>
                    </label>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer la licence ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            La licence {license.license_number} sera définitivement supprimée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteLicense(license.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add new license form */}
        {showForm ? (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
            <h4 className="text-sm font-semibold">Nouvelle licence RBQ</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_number">
                  Numéro de licence <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="license_number"
                  placeholder="ex : 8365477-01"
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  className={formError && !RBQ_LICENSE_REGEX.test(form.license_number) ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">Format : 7 chiffres + tiret + 2 chiffres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Catégorie de travaux <span className="text-destructive">*</span>
                </Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Sélectionner...</option>
                  <optgroup label="Général">
                    <option value="GENERAL">Entrepreneur général</option>
                    <option value="SPECIALISE">Entrepreneur spécialisé</option>
                  </optgroup>
                  <optgroup label="Métiers CCQ">
                    {CCQ_TRADES.map((t) => (
                      <option key={t.code} value={t.code}>{t.name_fr}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issued_at">Date d'émission</Label>
                <Input
                  id="issued_at"
                  type="date"
                  value={form.issued_at}
                  onChange={(e) => setForm({ ...form, issued_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Date d'expiration</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm(emptyForm); setFormError(null); }}>
                Annuler
              </Button>
              <Button size="sm" onClick={addLicense} disabled={saving}>
                {saving ? "Enregistrement..." : "Ajouter la licence"}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une licence RBQ
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RBQLicenseManager;
