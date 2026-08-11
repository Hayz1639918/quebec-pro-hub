// US-109: Certifications Manager (CCQ / ASP Construction / Autres)
// List with issue/expiry dates and document upload

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProfessionalCertification, CertificationFormData, CertType } from "@/types/contractor-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Award, Plus, Trash2, Upload, ExternalLink, AlertTriangle } from "lucide-react";
import { openSignedDocument } from "@/lib/storage";

interface CertificationsManagerProps {
  professionalId: string;
}

const certTypeConfig: Record<CertType, { label: string; color: string; description: string }> = {
  ccq: {
    label: "CCQ",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    description: "Commission de la construction du Québec",
  },
  asp: {
    label: "ASP Construction",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    description: "Association paritaire pour la santé et sécurité",
  },
  other: {
    label: "Autre",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    description: "Autre certification professionnelle",
  },
};

// Common CCQ certifications
const CCQ_CERT_PRESETS = [
  "Carte de compétence apprenti",
  "Carte de compétence compagnon",
  "Carte de compétence occupation",
  "Carte de compétence journalier",
];

const ASP_CERT_PRESETS = [
  "Certificat ASP Construction",
  "Santé et sécurité générale sur les chantiers de construction",
];

const emptyForm: CertificationFormData = {
  cert_type: "ccq",
  cert_name: "",
  cert_number: "",
  issued_at: "",
  expires_at: "",
  issuer: "",
};

const CertificationsManager = ({ professionalId }: CertificationsManagerProps) => {
  const { toast } = useToast();
  const [certifications, setCertifications] = useState<ProfessionalCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CertificationFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCertifications();
  }, [professionalId]);

  const fetchCertifications = async () => {
    const { data, error } = await supabase
      .from("professional_certifications")
      .select("*")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });
    if (!error) {
      setCertifications((data ?? []).map((certification) => ({
        ...certification,
        cert_type: ['ccq', 'asp', 'other'].includes(certification.cert_type)
          ? certification.cert_type as CertType
          : 'other',
        created_at: certification.created_at || '',
        updated_at: certification.updated_at || '',
      })));
    }
    setLoading(false);
  };

  const getPresets = (): string[] => {
    if (form.cert_type === "ccq") return CCQ_CERT_PRESETS;
    if (form.cert_type === "asp") return ASP_CERT_PRESETS;
    return [];
  };

  const saveCertification = async () => {
    if (!form.cert_name.trim()) {
      toast({ variant: "destructive", title: "Nom requis", description: "Veuillez saisir le nom de la certification." });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("professional_certifications").insert({
        professional_id: professionalId,
        cert_type: form.cert_type,
        cert_name: form.cert_name.trim(),
        cert_number: form.cert_number?.trim() || null,
        issued_at: form.issued_at || null,
        expires_at: form.expires_at || null,
        issuer: form.issuer?.trim() || null,
        certificate_url: null,
      });
      if (error) throw error;

      toast({ title: "Certification ajoutée", description: "Votre certification a été enregistrée." });
      setForm(emptyForm);
      setShowForm(false);
      await fetchCertifications();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer la certification." });
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (certId: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Fichier trop volumineux", description: "Maximum 10 MB." });
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: "destructive", title: "Format non supporté", description: "Utilisez PDF, JPG ou PNG." });
      return;
    }
    setUploadingId(certId);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${professionalId}/cert_${certId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("certifications")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("professional_certifications")
        .update({ certificate_url: path })
        .eq("id", certId);
      if (updateError) throw updateError;

      await fetchCertifications();
      toast({ title: "Document uploadé", description: "La preuve de certification a été jointe." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur upload", description: "Impossible d'uploader le document." });
    } finally {
      setUploadingId(null);
    }
  };

  const deleteCertification = async (id: string) => {
    const { error } = await supabase.from("professional_certifications").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la certification." });
    } else {
      setCertifications((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Certification supprimée" });
    }
  };

  const isExpiringSoon = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Chargement des certifications...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Certifications professionnelles
        </CardTitle>
        <CardDescription>
          Cartes de compétence CCQ, certificats ASP Construction et autres titres reconnus.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List existing certifications */}
        {certifications.length > 0 && (
          <div className="space-y-3">
            {certifications.map((cert) => {
              const cfg = certTypeConfig[cert.cert_type as CertType] ?? certTypeConfig.other;
              const expiring = isExpiringSoon(cert.expires_at);
              const expired = isExpired(cert.expires_at);

              return (
                <div
                  key={cert.id}
                  className={`flex flex-col sm:flex-row sm:items-start gap-3 p-3 border rounded-lg
                    ${expired ? "bg-red-50/50 border-red-200" : expiring ? "bg-amber-50/50 border-amber-200" : "bg-muted/20"}`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`${cfg.color} text-xs`}>
                        {cfg.label}
                      </Badge>
                      <span className="text-sm font-medium">{cert.cert_name}</span>
                    </div>

                    {cert.cert_number && (
                      <p className="text-xs text-muted-foreground font-mono">N° {cert.cert_number}</p>
                    )}
                    {cert.issuer && (
                      <p className="text-xs text-muted-foreground">Émis par : {cert.issuer}</p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {cert.issued_at && (
                        <span>Obtenu le {new Date(cert.issued_at).toLocaleDateString("fr-CA")}</span>
                      )}
                      {cert.expires_at && (
                        <span className={expired ? "text-red-600 font-medium" : expiring ? "text-amber-600 font-medium" : ""}>
                          {expired ? "Expiré le" : "Expire le"} {new Date(cert.expires_at).toLocaleDateString("fr-CA")}
                          {expiring && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                        </span>
                      )}
                    </div>

                    {cert.certificate_url && (
                      <button
                        type="button"
                        onClick={() => openSignedDocument(
                          "certifications",
                          cert.certificate_url,
                          () => toast({
                            variant: "destructive",
                            title: "Document indisponible",
                            description: "Impossible d'ouvrir cette preuve.",
                          }),
                        )}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Voir la preuve
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={uploadingId === cert.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleDocumentUpload(cert.id, f);
                        }}
                      />
                      <Button variant="outline" size="sm" asChild disabled={uploadingId === cert.id} className="pointer-events-none">
                        <span className="flex items-center gap-1 text-xs">
                          <Upload className="h-3 w-3" />
                          {uploadingId === cert.id ? "Upload..." : cert.certificate_url ? "Remplacer" : "Joindre"}
                        </span>
                      </Button>
                    </label>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette certification ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{cert.cert_name}" sera définitivement supprimée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteCertification(cert.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
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

        {/* Add form */}
        {showForm ? (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
            <h4 className="text-sm font-semibold">Nouvelle certification</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cert_type">Type</Label>
                <Select
                  value={form.cert_type}
                  onValueChange={(v) => setForm({ ...form, cert_type: v as CertType, cert_name: "" })}
                >
                  <SelectTrigger id="cert_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(certTypeConfig).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <span className="font-medium">{val.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">— {val.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cert_name">
                  Nom de la certification <span className="text-destructive">*</span>
                </Label>
                {getPresets().length > 0 ? (
                  <Select
                    value={form.cert_name}
                    onValueChange={(v) => setForm({ ...form, cert_name: v })}
                  >
                    <SelectTrigger id="cert_name">
                      <SelectValue placeholder="Choisir ou saisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getPresets().map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="cert_name"
                    value={form.cert_name}
                    onChange={(e) => setForm({ ...form, cert_name: e.target.value })}
                    placeholder="Nom de la certification"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cert_number">Numéro de carte / certificat</Label>
                <Input
                  id="cert_number"
                  value={form.cert_number ?? ""}
                  onChange={(e) => setForm({ ...form, cert_number: e.target.value })}
                  placeholder="ex : 12345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuer">Organisme émetteur</Label>
                <Input
                  id="issuer"
                  value={form.issuer ?? ""}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                  placeholder="ex : CCQ, ASP Construction..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cert_issued_at">Date d'obtention</Label>
                <Input
                  id="cert_issued_at"
                  type="date"
                  value={form.issued_at ?? ""}
                  onChange={(e) => setForm({ ...form, issued_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cert_expires_at">Date d'expiration</Label>
                <Input
                  id="cert_expires_at"
                  type="date"
                  value={form.expires_at ?? ""}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowForm(false); setForm(emptyForm); }}
              >
                Annuler
              </Button>
              <Button size="sm" onClick={saveCertification} disabled={saving}>
                {saving ? "Enregistrement..." : "Ajouter la certification"}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une certification
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificationsManager;
