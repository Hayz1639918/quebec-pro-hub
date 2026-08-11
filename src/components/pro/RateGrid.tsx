// US-111: Rate Grid by trade (hourly / flat / per sqft), min/max, CAD
// Linked to the professional's selected trades

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RateGrid as RateGridType, RateGridFormData, RateType } from "@/types/contractor-profile";
import type { ContractorTrade } from "@/types/contractor-profile";
import { getTradeByCode } from "@/data/ccq-trades";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Trash2, Edit2, Check, X, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RateGridProps {
  professionalId: string;
}

const rateTypeConfig: Record<RateType, { label: string; unit: string; description: string }> = {
  hourly:   { label: "Taux horaire",   unit: "$/h",     description: "Facturation à l'heure" },
  flat:     { label: "Prix forfaitaire", unit: "$/projet", description: "Prix fixe par projet ou type de travaux" },
  per_sqft: { label: "Au pied carré",   unit: "$/pi²",   description: "Facturation par pied carré" },
};

const formatCAD = (amount: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(amount);

const emptyForm: RateGridFormData = {
  trade_code: "",
  rate_type: "hourly",
  min_rate: 0,
  max_rate: undefined,
  description: "",
};

interface EditingState {
  id: string;
  min_rate: string;
  max_rate: string;
  description: string;
}

const RateGrid = ({ professionalId }: RateGridProps) => {
  const { toast } = useToast();
  const [rates, setRates] = useState<RateGridType[]>([]);
  const [trades, setTrades] = useState<ContractorTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RateGridFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchRates(), fetchTrades()]).finally(() => setLoading(false));
  }, [professionalId]);

  const fetchRates = async () => {
    const { data, error } = await supabase
      .from("rate_grids")
      .select("*")
      .eq("professional_id", professionalId)
      .order("trade_code");
    if (!error) {
      setRates((data ?? []).map((rate) => ({
        ...rate,
        rate_type: ['hourly', 'flat', 'per_sqft'].includes(rate.rate_type)
          ? rate.rate_type as RateType
          : 'hourly',
        created_at: rate.created_at || '',
        updated_at: rate.updated_at || '',
      })));
    }
  };

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from("contractor_trades")
      .select("*")
      .eq("professional_id", professionalId);
    if (!error) setTrades(data ?? []);
  };

  const validateForm = (): boolean => {
    if (!form.trade_code) {
      setFormError("Veuillez sélectionner un métier.");
      return false;
    }
    if (!form.min_rate || form.min_rate <= 0) {
      setFormError("Le tarif minimum doit être supérieur à 0.");
      return false;
    }
    if (form.max_rate !== undefined && form.max_rate > 0 && form.max_rate < form.min_rate) {
      setFormError("Le tarif maximum doit être supérieur ou égal au minimum.");
      return false;
    }
    // Check for duplicate
    const exists = rates.find(
      (r) => r.trade_code === form.trade_code && r.rate_type === form.rate_type
    );
    if (exists) {
      setFormError("Un tarif de ce type existe déjà pour ce métier. Modifiez l'existant.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const addRate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const tradeName = getTradeByCode(form.trade_code)?.name_fr
        ?? trades.find((t) => t.trade_code === form.trade_code)?.trade_name
        ?? form.trade_code;

      const { error } = await supabase.from("rate_grids").insert({
        professional_id: professionalId,
        trade_code: form.trade_code,
        rate_type: form.rate_type,
        min_rate: Number(form.min_rate),
        max_rate: form.max_rate && form.max_rate > 0 ? Number(form.max_rate) : null,
        currency: "CAD",
        description: form.description?.trim() || null,
      });
      if (error) throw error;

      toast({ title: "Tarif ajouté", description: `${tradeName} — ${rateTypeConfig[form.rate_type].label}` });
      setForm({ ...emptyForm, trade_code: form.trade_code }); // Keep trade selected
      setShowForm(false);
      await fetchRates();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le tarif." });
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    const min = parseFloat(editing.min_rate);
    const max = editing.max_rate ? parseFloat(editing.max_rate) : null;
    if (isNaN(min) || min <= 0) {
      toast({ variant: "destructive", title: "Valeur invalide", description: "Le tarif minimum doit être > 0." });
      return;
    }
    if (max !== null && max < min) {
      toast({ variant: "destructive", title: "Valeur invalide", description: "Le max doit être ≥ au min." });
      return;
    }
    const { error } = await supabase.from("rate_grids").update({
      min_rate: min,
      max_rate: max,
      description: editing.description?.trim() || null,
    }).eq("id", editing.id);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le tarif." });
    } else {
      setEditing(null);
      await fetchRates();
      toast({ title: "Tarif modifié" });
    }
  };

  const deleteRate = async (id: string) => {
    const { error } = await supabase.from("rate_grids").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le tarif." });
    } else {
      setRates((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Tarif supprimé" });
    }
  };

  // Group rates by trade
  const groupedRates = rates.reduce<Record<string, RateGridType[]>>((acc, rate) => {
    if (!acc[rate.trade_code]) acc[rate.trade_code] = [];
    acc[rate.trade_code].push(rate);
    return acc;
  }, {});

  const availableTrades = trades.length > 0
    ? trades
    : [{ trade_code: "RENOV", trade_name: "Rénovation générale", is_primary: true, id: "", professional_id: "", created_at: "" }];

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Chargement des tarifs...</CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Grille tarifaire
          </CardTitle>
          <CardDescription>
            Définissez vos tarifs par métier et type de facturation. Tous les prix sont en CAD.
            {trades.length === 0 && (
              <span className="block text-amber-600 mt-1">
                Ajoutez d'abord vos métiers (section ci-dessus) pour personnaliser vos tarifs.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing rates grouped by trade */}
          {Object.keys(groupedRates).length > 0 && (
            <div className="space-y-4">
              {Object.entries(groupedRates).map(([tradeCode, tradeRates]) => {
                const trade = getTradeByCode(tradeCode) ?? trades.find((t) => t.trade_code === tradeCode);
                const tradeName = trade
                  ? ("name_fr" in trade ? trade.name_fr : trade.trade_name)
                  : tradeCode;

                return (
                  <div key={tradeCode} className="border rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-muted/40 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{tradeName}</span>
                    </div>

                    <div className="divide-y">
                      {tradeRates.map((rate) => {
                        const rateTypeCfg = rateTypeConfig[rate.rate_type as RateType];
                        const isEditingThis = editing?.id === rate.id;

                        return (
                          <div key={rate.id} className="px-4 py-3">
                            {isEditingThis ? (
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {rateTypeCfg?.label ?? rate.rate_type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{rateTypeCfg?.unit}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Min</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={editing.min_rate}
                                      onChange={(e) => setEditing({ ...editing, min_rate: e.target.value })}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Max (optionnel)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={editing.max_rate}
                                      onChange={(e) => setEditing({ ...editing, max_rate: e.target.value })}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1 col-span-2 sm:col-span-1">
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                      value={editing.description}
                                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                                      className="h-8 text-sm"
                                      placeholder="Optionnel"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" className="h-7 text-xs" onClick={saveEdit}>
                                    <Check className="h-3 w-3 mr-1" /> Sauvegarder
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(null)}>
                                    <X className="h-3 w-3 mr-1" /> Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="text-xs shrink-0">
                                      {rateTypeCfg?.label ?? rate.rate_type}
                                    </Badge>
                                    <span className="text-sm font-semibold text-primary">
                                      {formatCAD(rate.min_rate)}
                                      {rate.max_rate && ` — ${formatCAD(rate.max_rate)}`}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{rateTypeCfg?.unit}</span>
                                  </div>
                                  {rate.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{rate.description}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => setEditing({
                                      id: rate.id,
                                      min_rate: String(rate.min_rate),
                                      max_rate: rate.max_rate ? String(rate.max_rate) : "",
                                      description: rate.description ?? "",
                                    })}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer ce tarif ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Le tarif {rateTypeCfg?.label} pour {tradeName} sera supprimé.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteRate(rate.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Supprimer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add new rate form */}
          {showForm ? (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
              <h4 className="text-sm font-semibold">Nouveau tarif</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Métier <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.trade_code} onValueChange={(v) => setForm({ ...form, trade_code: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un métier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTrades.map((t) => (
                        <SelectItem key={t.trade_code} value={t.trade_code}>
                          {t.trade_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Type de facturation <span className="text-destructive">*</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Horaire = $/h · Forfaitaire = prix fixe · Pied carré = $/pi²</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select
                    value={form.rate_type}
                    onValueChange={(v) => setForm({ ...form, rate_type: v as RateType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(rateTypeConfig).map(([key, val]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{val.label}</span>
                            <span className="text-xs text-muted-foreground">{val.unit}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_rate">
                    Tarif minimum (CAD) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="min_rate"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.min_rate || ""}
                    onChange={(e) => setForm({ ...form, min_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="ex : 75"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_rate">Tarif maximum (CAD, optionnel)</Label>
                  <Input
                    id="max_rate"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.max_rate ?? ""}
                    onChange={(e) => setForm({ ...form, max_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="ex : 120"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="rate_desc">Description (optionnel)</Label>
                  <Textarea
                    id="rate_desc"
                    value={form.description ?? ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="ex : Inclut déplacement, main d'œuvre et matériaux de base"
                    rows={2}
                  />
                </div>
              </div>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowForm(false); setForm(emptyForm); setFormError(null); }}
                >
                  Annuler
                </Button>
                <Button size="sm" onClick={addRate} disabled={saving}>
                  {saving ? "Enregistrement..." : "Ajouter le tarif"}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un tarif
            </Button>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default RateGrid;
