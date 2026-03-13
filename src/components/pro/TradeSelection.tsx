// US-106: Trade Selection Component
// Multi-métier selection from CCQ/RBQ normalized list with badge display

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CCQ_TRADES, CCQ_CATEGORIES, getTradeByCode } from "@/data/ccq-trades";
import type { ContractorTrade } from "@/types/contractor-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Star, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface TradeSelectionProps {
  professionalId: string;
}

const TradeSelection = ({ professionalId }: TradeSelectionProps) => {
  const { toast } = useToast();
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [primaryTrade, setPrimaryTrade] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["electricite", "mecanique", "structure"])
  );

  useEffect(() => {
    fetchTrades();
  }, [professionalId]);

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from("contractor_trades")
      .select("*")
      .eq("professional_id", professionalId);

    if (!error && data) {
      const codes = new Set(data.map((t: ContractorTrade) => t.trade_code));
      setSelectedTrades(codes);
      const primary = data.find((t: ContractorTrade) => t.is_primary);
      if (primary) setPrimaryTrade(primary.trade_code);
    }
    setLoading(false);
  };

  const toggleTrade = (code: string) => {
    const next = new Set(selectedTrades);
    if (next.has(code)) {
      next.delete(code);
      if (primaryTrade === code) {
        const remaining = Array.from(next);
        setPrimaryTrade(remaining[0] ?? null);
      }
    } else {
      next.add(code);
      if (!primaryTrade) setPrimaryTrade(code);
    }
    setSelectedTrades(next);
  };

  const toggleCategory = (category: string) => {
    const next = new Set(expandedCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setExpandedCategories(next);
  };

  const saveTrades = async () => {
    if (selectedTrades.size === 0) {
      toast({ variant: "destructive", title: "Sélection requise", description: "Veuillez sélectionner au moins un métier." });
      return;
    }
    setSaving(true);
    try {
      // Delete existing and re-insert
      await supabase.from("contractor_trades").delete().eq("professional_id", professionalId);

      const rows = Array.from(selectedTrades).map((code) => {
        const trade = getTradeByCode(code);
        return {
          professional_id: professionalId,
          trade_code: code,
          trade_name: trade?.name_fr ?? code,
          is_primary: code === primaryTrade,
        };
      });

      const { error } = await supabase.from("contractor_trades").insert(rows);
      if (error) throw error;

      toast({ title: "Métiers enregistrés", description: `${selectedTrades.size} métier(s) sauvegardé(s).` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder les métiers." });
    } finally {
      setSaving(false);
    }
  };

  const groupedTrades = Object.entries(CCQ_CATEGORIES).map(([catKey, catLabel]) => ({
    key: catKey as keyof typeof CCQ_CATEGORIES,
    label: catLabel.label_fr,
    trades: CCQ_TRADES.filter((t) => t.category === catKey),
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Chargement des métiers...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Métiers et spécialisations
        </CardTitle>
        <CardDescription>
          Sélectionnez vos corps de métier (liste normalisée CCQ/RBQ). Cochez votre métier principal avec l'étoile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected trades badges */}
        {selectedTrades.size > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Métiers sélectionnés :</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedTrades).map((code) => {
                const trade = getTradeByCode(code);
                if (!trade) return null;
                return (
                  <Badge
                    key={code}
                    variant="outline"
                    className={`${trade.badge_color} flex items-center gap-1 text-xs px-2 py-1`}
                  >
                    {primaryTrade === code && <Star className="h-3 w-3 fill-current" />}
                    {trade.name_fr}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Trade list by category */}
        <div className="space-y-2">
          {groupedTrades.map(({ key, label, trades }) => (
            <div key={key} className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(key)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
              >
                <span className="text-sm font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  {trades.filter((t) => selectedTrades.has(t.code)).length > 0 && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {trades.filter((t) => selectedTrades.has(t.code)).length}
                    </Badge>
                  )}
                  {expandedCategories.has(key) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedCategories.has(key) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-3">
                  {trades.map((trade) => {
                    const isSelected = selectedTrades.has(trade.code);
                    const isPrimary = primaryTrade === trade.code;

                    return (
                      <div
                        key={trade.code}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors
                          ${isSelected ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"}`}
                        onClick={() => toggleTrade(trade.code)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleTrade(trade.code)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label className="flex-1 text-sm cursor-pointer">{trade.name_fr}</Label>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryTrade(trade.code);
                            }}
                            title={isPrimary ? "Métier principal" : "Définir comme principal"}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Star
                              className={`h-4 w-4 ${isPrimary ? "fill-primary text-primary" : ""}`}
                            />
                          </button>
                        )}
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {selectedTrades.size} métier(s) sélectionné(s)
            {primaryTrade && ` · Principal : ${getTradeByCode(primaryTrade)?.name_fr}`}
          </p>
          <Button onClick={saveTrades} disabled={saving || selectedTrades.size === 0} size="sm">
            {saving ? "Enregistrement..." : "Enregistrer les métiers"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeSelection;
