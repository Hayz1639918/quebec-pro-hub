import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
import { Copy, Eye, FileText, Filter, Search, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContractCategory, ContractTemplate } from "@/types/contracts";

interface ContractTemplatesProps {
  onSelectTemplate: (template: ContractTemplate) => void;
  /** Kept for API compatibility. Custom-template creation is intentionally hidden until a real editor is available. */
  onCreateCustom?: () => void;
  showCreateButton?: boolean;
}

export const ContractTemplates = ({ onSelectTemplate }: ContractTemplatesProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ContractCategory | "all">("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user.id || null);

      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        if (error.code === "42P01" || error.message.includes("does not exist")) {
          setTemplates([]);
          return;
        }
        throw error;
      }

      setTemplates((data || []).map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category as ContractCategory,
        template_content: template.template_content,
        variables: template.variables && typeof template.variables === "object" && !Array.isArray(template.variables)
          ? template.variables
          : {},
        is_active: Boolean(template.is_active),
        created_by: template.created_by,
        created_at: template.created_at || "",
        updated_at: template.updated_at || "",
        version: template.version ?? 1,
      })));
    } catch (error) {
      console.error("Unable to load contract templates", error);
      toast({ variant: "destructive", title: t("common.error"), description: t("contracts.error_loading_templates") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTemplates = useMemo(() => templates.filter((template) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query
      || template.name.toLowerCase().includes(query)
      || Boolean(template.description?.toLowerCase().includes(query));
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [templates, searchTerm, selectedCategory]);

  const getCategoryColor = (category: ContractCategory | string) => {
    switch (category) {
      case "construction": return "bg-blue-100 text-blue-800";
      case "renovation": return "bg-green-100 text-green-800";
      case "maintenance": return "bg-yellow-100 text-yellow-800";
      case "consultation": return "bg-purple-100 text-purple-800";
      case "preliminary": return "bg-violet-100 text-violet-800";
      case "subcontract": return "bg-orange-100 text-orange-800";
      case "acceptance": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category: ContractCategory | string) => {
    switch (category) {
      case "construction": return t("contracts.categories.construction");
      case "renovation": return t("contracts.categories.renovation");
      case "maintenance": return t("contracts.categories.maintenance");
      case "consultation": return t("contracts.categories.consultation");
      case "preliminary": return "Contrat préliminaire";
      case "subcontract": return "Sous-traitance";
      case "acceptance": return "Réception";
      default: return category;
    }
  };

  const previewTemplate = (template: ContractTemplate) => {
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!previewWindow) {
      toast({ variant: "destructive", title: "Aperçu bloqué", description: "Autorisez les fenêtres contextuelles pour afficher le modèle." });
      return;
    }
    previewWindow.document.write(DOMPurify.sanitize(template.template_content));
    previewWindow.document.title = template.name;
    previewWindow.document.close();
  };

  const copyTemplate = async (template: ContractTemplate) => {
    try {
      await navigator.clipboard.writeText(template.template_content);
      toast({ title: t("contracts.template_copied"), description: t("contracts.template_copied_description") });
    } catch (error) {
      console.error("Unable to copy contract template", error);
      toast({ variant: "destructive", title: t("common.error"), description: t("contracts.error_copying_template") });
    }
  };

  const isCustomTemplate = (template: ContractTemplate) => Boolean(template.created_by);
  const canDeleteTemplate = (template: ContractTemplate) => Boolean(currentUserId && template.created_by === currentUserId);

  const deleteTemplate = async (template: ContractTemplate) => {
    if (!canDeleteTemplate(template)) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce modèle personnalisé ?")) return;

    try {
      const { data, error } = await supabase.rpc("delete_custom_template", { template_id: template.id });
      if (error) throw error;
      const result = data && typeof data === "object" && !Array.isArray(data)
        ? data as { success?: boolean; error?: string }
        : null;
      if (data !== true && result?.success !== true) throw new Error(result?.error || "La suppression n’a pas été confirmée.");

      setTemplates((previous) => previous.filter((item) => item.id !== template.id));
      toast({ title: "Modèle supprimé", description: "Le modèle personnalisé a été supprimé." });
    } catch (error) {
      console.error("Unable to delete custom contract template", error);
      toast({ variant: "destructive", title: "Suppression impossible", description: error instanceof Error ? error.message : "Le modèle n’a pas été supprimé." });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-48" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} className="h-48" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("contracts.templates.title")}</h2>
        <p className="text-muted-foreground">Choisissez un modèle existant. La création d’un modèle personnalisé n’est affichée que lorsqu’un véritable éditeur est disponible.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("contracts.templates.search_placeholder")} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-9" />
        </div>
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ContractCategory | "all")}>
          <SelectTrigger className="sm:w-56"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder={t("contracts.templates.filter_category")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("contracts.templates.all_categories")}</SelectItem>
            <SelectItem value="preliminary">Contrat préliminaire</SelectItem>
            <SelectItem value="construction">{t("contracts.categories.construction")}</SelectItem>
            <SelectItem value="renovation">{t("contracts.categories.renovation")}</SelectItem>
            <SelectItem value="subcontract">Sous-traitance</SelectItem>
            <SelectItem value="acceptance">Réception des travaux</SelectItem>
            <SelectItem value="maintenance">{t("contracts.categories.maintenance")}</SelectItem>
            <SelectItem value="consultation">{t("contracts.categories.consultation")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Aucun modèle disponible</h3>
          <p className="text-sm text-muted-foreground mt-1">Modifiez les filtres ou réessayez plus tard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow relative">
              {canDeleteTemplate(template) && (
                <Button variant="ghost" size="icon" className="absolute top-2 left-2 h-7 w-7 rounded-full bg-destructive/10 text-destructive z-10" onClick={(event) => { event.stopPropagation(); void deleteTemplate(template); }} title="Supprimer ce modèle personnalisé">
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary shrink-0" /><span className="truncate">{template.name}</span>{isCustomTemplate(template) && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">{template.description}</CardDescription>
                  </div>
                  <Badge className={`${getCategoryColor(template.category)} shrink-0`}>{getCategoryLabel(template.category)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground"><span className="font-medium">{Object.keys(template.variables || {}).length}</span> variables · Version {template.version || 1}</div>
                <div className="flex gap-2">
                  <Button onClick={() => onSelectTemplate(template)} className="flex-1">{t("contracts.templates.use_template")}</Button>
                  <Button variant="outline" size="icon" onClick={() => previewTemplate(template)} title={t("contracts.templates.preview")}><Eye className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => void copyTemplate(template)} title={t("contracts.templates.copy")}><Copy className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
