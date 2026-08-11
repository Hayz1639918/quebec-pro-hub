// US-108: Insurance Certificate Manager
// Upload + expiry date, auto-status (active/expiring_soon/expired), 'Assuré' badge, renewal alerts

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { InsuranceCertificate, InsuranceStatus, InsuranceType } from "@/types/contractor-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Upload, Trash2, AlertTriangle, CheckCircle2, XCircle, ExternalLink, Plus } from "lucide-react";
import { openSignedDocument } from "@/lib/storage";

interface InsuranceCertificateManagerProps {
  professionalId: string;
}

const insuranceTypeLabels: Record<string, string> = {
  liability:    "Responsabilité civile",
  professional: "Assurance professionnelle",
  other:        "Autre",
};

const statusConfig = {
  active:          { label: "Active",           color: "bg-green-100 text-green-800 border-green-300",   icon: <CheckCircle2 className="h-3 w-3" /> },
  expiring_soon:   { label: "Expire bientôt",   color: "bg-amber-100 text-amber-800 border-amber-300",   icon: <AlertTriangle className="h-3 w-3" /> },
  expired:         { label: "Expirée",           color: "bg-red-100 text-red-800 border-red-300",         icon: <XCircle className="h-3 w-3" /> },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

interface FormState {
  insurance_type: string;
  expires_at: string;
}

const emptyForm: FormState = { insurance_type: "liability", expires_at: "" };

const InsuranceCertificateManager = ({ professionalId }: InsuranceCertificateManagerProps) => {
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<InsuranceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, [professionalId]);

  const fetchCertificates = async () => {
    const { data, error } = await supabase
      .from("insurance_certificates")
      .select("*")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });
    if (!error) {
      setCertificates((data ?? []).map((certificate) => ({
        ...certificate,
        insurance_type: ['liability', 'professional', 'other'].includes(certificate.insurance_type)
          ? certificate.insurance_type as InsuranceType
          : 'other',
        status: ['active', 'expiring_soon', 'expired'].includes(certificate.status)
          ? certificate.status as InsuranceStatus
          : 'active',
        created_at: certificate.created_at || '',
        updated_at: certificate.updated_at || '',
      })));
    }
    setLoading(false);
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Format non supporté. Utilisez PDF, JPG ou PNG.";
    if (file.size > MAX_FILE_SIZE) return "Fichier trop volumineux (max 10 MB).";
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { toast({ variant: "destructive", title: "Fichier invalide", description: err }); return; }
    setPendingFile(file);
    setShowForm(true);
  }, [toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { toast({ variant: "destructive", title: "Fichier invalide", description: err }); return; }
    setPendingFile(file);
    setShowForm(true);
  };

  const uploadFile = async (certId: string, file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${professionalId}/${certId}.${ext}`;
    const { error } = await supabase.storage.from("insurance-certificates").upload(path, file, { upsert: true });
    if (error) return null;
    return path;
  };

  const saveCertificate = async () => {
    if (!form.expires_at) {
      toast({ variant: "destructive", title: "Date requise", description: "Veuillez saisir la date d'expiration." });
      return;
    }
    setSaving(true);
    try {
      // Insert first to get an ID
      const { data, error } = await supabase
        .from("insurance_certificates")
        .insert({
          professional_id: professionalId,
          insurance_type: form.insurance_type,
          expires_at: form.expires_at,
          certificate_url: null,
        })
        .select()
        .single();
      if (error) throw error;

      // Upload file if provided
      if (pendingFile) {
        const url = await uploadFile(data.id, pendingFile);
        if (url) {
          await supabase.from("insurance_certificates").update({ certificate_url: url }).eq("id", data.id);
        }
      }

      toast({ title: "Assurance enregistrée", description: "Le certificat a été ajouté à votre profil." });
      setForm(emptyForm);
      setPendingFile(null);
      setShowForm(false);
      await fetchCertificates();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer le certificat." });
    } finally {
      setSaving(false);
    }
  };

  const replaceCertificateFile = async (certId: string, file: File) => {
    const err = validateFile(file);
    if (err) { toast({ variant: "destructive", title: "Fichier invalide", description: err }); return; }
    setUploadingId(certId);
    try {
      const url = await uploadFile(certId, file);
      if (!url) throw new Error("Upload failed");
      await supabase.from("insurance_certificates").update({ certificate_url: url }).eq("id", certId);
      await fetchCertificates();
      toast({ title: "Document remplacé", description: "Le nouveau certificat a été uploadé." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur upload", description: "Impossible de remplacer le document." });
    } finally {
      setUploadingId(null);
    }
  };

  const deleteCertificate = async (id: string) => {
    const { error } = await supabase.from("insurance_certificates").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le certificat." });
    } else {
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Certificat supprimé" });
    }
  };

  const isInsured = certificates.some((c) => c.status === "active");
  const hasExpiringSoon = certificates.some((c) => c.status === "expiring_soon");

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Chargement des assurances...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Assurances
            </CardTitle>
            <CardDescription className="mt-1">
              Responsabilité civile et professionnelle. Badge &quot;Assuré&quot; affiché sur votre profil public.
            </CardDescription>
          </div>
          {isInsured && (
            <Badge className="bg-green-600 text-white flex items-center gap-1 shrink-0">
              <ShieldCheck className="h-3 w-3" />
              Assuré
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Renewal alert */}
        {hasExpiringSoon && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Une ou plusieurs assurances expirent dans moins de 30 jours. Pensez à les renouveler.</p>
          </div>
        )}

        {/* Existing certificates */}
        {certificates.length > 0 && (
          <div className="space-y-3">
            {certificates.map((cert) => {
              const cfg = statusConfig[cert.status] ?? statusConfig.expired;
              const daysLeft = Math.ceil((new Date(cert.expires_at).getTime() - Date.now()) / 86400000);
              return (
                <div key={cert.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg bg-muted/20">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {insuranceTypeLabels[cert.insurance_type] ?? cert.insurance_type}
                      </span>
                      <Badge variant="outline" className={`${cfg.color} flex items-center gap-1 text-xs`}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expire le {new Date(cert.expires_at).toLocaleDateString("fr-CA")}
                      {daysLeft > 0 && daysLeft <= 60 && (
                        <span className={`ml-2 font-medium ${daysLeft <= 30 ? "text-amber-600" : "text-muted-foreground"}`}>
                          ({daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""})
                        </span>
                      )}
                    </p>
                    {cert.certificate_url && (
                      <button
                        type="button"
                        onClick={() => openSignedDocument(
                          "insurance-certificates",
                          cert.certificate_url,
                          () => toast({
                            variant: "destructive",
                            title: "Document indisponible",
                            description: "Impossible d'ouvrir ce certificat.",
                          }),
                        )}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Voir le document
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Replace file */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={uploadingId === cert.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) replaceCertificateFile(cert.id, f);
                        }}
                      />
                      <Button variant="outline" size="sm" asChild disabled={uploadingId === cert.id} className="pointer-events-none">
                        <span className="flex items-center gap-1 text-xs">
                          <Upload className="h-3 w-3" />
                          {uploadingId === cert.id ? "Upload..." : cert.certificate_url ? "Remplacer" : "Joindre"}
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
                          <AlertDialogTitle>Supprimer ce certificat ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Le badge &quot;Assuré&quot; sera retiré si c'est votre seule assurance active.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteCertificate(cert.id)}
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

        {/* Add new certificate */}
        {showForm ? (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
            <h4 className="text-sm font-semibold">Nouveau certificat d'assurance</h4>

            {/* Drag & Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              {pendingFile ? (
                <p className="text-sm font-medium text-primary">{pendingFile.name}</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Glissez votre certificat ici ou</p>
                  <label className="cursor-pointer">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileInput} />
                    <span className="text-sm text-primary hover:underline">parcourir les fichiers</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG · max 10 MB</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance_type">Type d'assurance</Label>
                <Select value={form.insurance_type} onValueChange={(v) => setForm({ ...form, insurance_type: v })}>
                  <SelectTrigger id="insurance_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="liability">Responsabilité civile</SelectItem>
                    <SelectItem value="professional">Assurance professionnelle</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">
                  Date d'expiration <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowForm(false); setPendingFile(null); setForm(emptyForm); }}
              >
                Annuler
              </Button>
              <Button size="sm" onClick={saveCertificate} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
              ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/40"}`}
            onClick={() => setShowForm(true)}
          >
            <Button variant="ghost" size="sm" className="pointer-events-none">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un certificat d'assurance
            </Button>
            <p className="text-xs text-muted-foreground mt-1">ou glissez un fichier ici</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsuranceCertificateManager;
