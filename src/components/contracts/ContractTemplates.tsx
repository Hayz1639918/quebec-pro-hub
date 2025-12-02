import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Filter, Plus, Eye, Copy, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ContractTemplate, ContractCategory } from "@/types/contracts";
import { useTranslation } from "react-i18next";

interface ContractTemplatesProps {
  onSelectTemplate: (template: ContractTemplate) => void;
  onCreateCustom?: () => void;
  showCreateButton?: boolean;
}

export const ContractTemplates = ({
  onSelectTemplate,
  onCreateCustom,
  showCreateButton = true,
}: ContractTemplatesProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ContractCategory | "all">("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      await checkUser();
      await fetchTemplates();
    };
    initialize();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
        console.log('User ID chargé:', session.user.id);
        return session.user.id;
      }
      return null;
    } catch (error) {
      console.error('Error checking user:', error);
      return null;
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        // If table doesn't exist yet, silently fail
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Contract templates table not yet created. Please apply migration 008_add_contracts_system.sql');
          setTemplates([]);
          return;
        }
        throw error;
      }

      const templatesData = data || [];
      setTemplates(templatesData);
      
      // Log pour déboguer
      if (templatesData.length > 0) {
        console.log('Templates chargés:', templatesData.map(t => ({
          id: t.id,
          name: t.name,
          created_by: t.created_by,
          is_custom: !!t.created_by
        })));
      }
    } catch (error) {
      console.error('Error fetching contract templates:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('contracts.error_loading_templates'),
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: ContractCategory | string) => {
    switch (category) {
      case 'construction':
        return 'bg-blue-100 text-blue-800';
      case 'renovation':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'consultation':
        return 'bg-purple-100 text-purple-800';
      case 'preliminary':
        return 'bg-violet-100 text-violet-800';
      case 'subcontract':
        return 'bg-orange-100 text-orange-800';
      case 'acceptance':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: ContractCategory | string) => {
    switch (category) {
      case 'construction':
        return t('contracts.categories.construction');
      case 'renovation':
        return t('contracts.categories.renovation');
      case 'maintenance':
        return t('contracts.categories.maintenance');
      case 'consultation':
        return t('contracts.categories.consultation');
      case 'preliminary':
        return 'Contrat préliminaire';
      case 'subcontract':
        return 'Sous-traitance';
      case 'acceptance':
        return 'Réception';
      default:
        return category;
    }
  };

  const handlePreviewTemplate = (template: ContractTemplate) => {
    // For now, just show the template content in a new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(template.template_content);
      previewWindow.document.title = template.name;
    }
  };

  const handleCopyTemplate = async (template: ContractTemplate) => {
    try {
      await navigator.clipboard.writeText(template.template_content);
      toast({
        title: t('contracts.template_copied'),
        description: t('contracts.template_copied_description'),
      });
    } catch (error) {
      console.error('Error copying template:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('contracts.error_copying_template'),
      });
    }
  };

  const handleDeleteTemplate = async (template: ContractTemplate) => {
    // Log pour déboguer
    console.log('=== SUPPRESSION DE TEMPLATE ===');
    console.log('Template:', {
      id: template.id,
      name: template.name,
      created_by: template.created_by,
    });
    console.log('Utilisateur actuel:', currentUserId);

    // Attendre que l'utilisateur soit chargé si nécessaire
    let userId = currentUserId;
    if (!userId) {
      userId = await checkUser();
      if (!userId) {
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: 'Vous devez être connecté pour supprimer un contrat',
        });
        return;
      }
    }

    // Demander confirmation
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrat personnalisé ?')) {
      return;
    }

    try {
      console.log('Appel de la fonction RPC delete_custom_template...');
      
      // Utiliser directement la fonction RPC qui gère toutes les vérifications
      const { data, error } = await supabase
        .rpc('delete_custom_template', { template_id: template.id });

      console.log('Réponse RPC:', { data, error });

      if (error) {
        console.error('Erreur RPC:', error);
        throw error;
      }

      // La fonction retourne un objet JSON avec success/error
      if (data && typeof data === 'object') {
        if (data.success === true) {
          // Succès - retirer le template de la liste locale
          setTemplates(prev => prev.filter(t => t.id !== template.id));
          toast({
            title: 'Contrat supprimé',
            description: 'Le contrat personnalisé a été supprimé avec succès',
          });
          return;
        } else if (data.error) {
          // Erreur retournée par la fonction
          console.error('Erreur de la fonction:', data);
          toast({
            variant: "destructive",
            title: t('common.error'),
            description: data.error,
          });
          return;
        }
      }

      // Si on arrive ici avec data = true (ancien format), c'est aussi un succès
      if (data === true) {
        setTemplates(prev => prev.filter(t => t.id !== template.id));
        toast({
          title: 'Contrat supprimé',
          description: 'Le contrat personnalisé a été supprimé avec succès',
        });
        return;
      }

      // Cas inattendu
      console.warn('Réponse inattendue:', data);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: 'Réponse inattendue du serveur',
      });

    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      
      let errorMessage = 'Erreur lors de la suppression du contrat';
      
      if (error?.message) {
        errorMessage = error.message;
      }
      
      // Si la fonction RPC n'existe pas, afficher un message clair
      if (error?.code === '42883' || error?.message?.includes('function') || error?.message?.includes('does not exist')) {
        errorMessage = 'La fonction de suppression n\'existe pas. Veuillez appliquer la migration 028_allow_users_delete_own_templates.sql dans Supabase.';
      }
      
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: errorMessage,
      });
    }
  };

  const isCustomTemplate = (template: ContractTemplate) => {
    // Un template est personnalisé si :
    // 1. created_by n'est pas null (nouveau système)
    // 2. OU si c'est un template qui n'est pas dans la liste des templates de base
    // Pour l'instant, on affiche le bouton pour tous les templates avec created_by non null
    // ET pour les templates qui pourraient être des anciens templates personnalisés
    // (on les identifie en vérifiant s'ils ne sont pas dans les templates de base connus)
    
    // Liste des noms de templates de base (ceux créés par les migrations)
    const baseTemplateNames = [
      'Contrat préliminaire',
      'Contrat d\'entreprise à forfait',
      'Contrat à prix coûtant majoré',
      'Contrat de sous-traitance',
      'Attestation de réception des travaux',
      'Contrat de construction résidentielle',
      'Contrat de rénovation',
      'Formulaire de soumission'
    ];

    // Si created_by est défini, c'est un template personnalisé
    if (template.created_by !== null) {
      return true;
    }

    // Si created_by est NULL mais que le nom n'est pas dans la liste des templates de base,
    // on considère que c'est peut-être un ancien template personnalisé
    // On affiche le bouton seulement si l'utilisateur est connecté
    if (!baseTemplateNames.includes(template.name) && currentUserId) {
      return true;
    }

    return false;
  };

  // Fonction pour vérifier si l'utilisateur peut supprimer ce template
  const canDeleteTemplate = (template: ContractTemplate) => {
    if (!template.created_by) return false;
    if (!currentUserId) return false;
    return template.created_by === currentUserId;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('contracts.templates.title')}</h2>
          <p className="text-muted-foreground">{t('contracts.templates.description')}</p>
        </div>
        {showCreateButton && onCreateCustom && (
          <Button onClick={onCreateCustom}>
            <Plus className="h-4 w-4 mr-2" />
            {t('contracts.templates.create_custom')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('contracts.templates.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ContractCategory | "all")}>
          <SelectTrigger className="w-56">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('contracts.templates.filter_category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('contracts.templates.all_categories')}</SelectItem>
            <SelectItem value="preliminary">Contrat préliminaire</SelectItem>
            <SelectItem value="construction">{t('contracts.categories.construction')}</SelectItem>
            <SelectItem value="renovation">{t('contracts.categories.renovation')}</SelectItem>
            <SelectItem value="subcontract">Sous-traitance</SelectItem>
            <SelectItem value="acceptance">Réception des travaux</SelectItem>
            <SelectItem value="maintenance">{t('contracts.categories.maintenance')}</SelectItem>
            <SelectItem value="consultation">{t('contracts.categories.consultation')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || selectedCategory !== "all" 
              ? t('contracts.templates.no_templates_found')
              : t('contracts.templates.no_templates')
            }
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedCategory !== "all"
              ? t('contracts.templates.try_different_filters')
              : t('contracts.templates.create_first_template')
            }
          </p>
          {showCreateButton && onCreateCustom && (
            <Button onClick={onCreateCustom}>
              <Plus className="h-4 w-4 mr-2" />
              {t('contracts.templates.create_custom')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const isCustom = isCustomTemplate(template);
            // Log pour déboguer
            if (isCustom) {
              console.log('Template personnalisé détecté:', {
                id: template.id,
                name: template.name,
                created_by: template.created_by,
                currentUserId: currentUserId,
                canDelete: canDeleteTemplate(template)
              });
            }
            
            return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow relative">
              {/* Bouton de suppression pour les templates personnalisés */}
              {isCustom && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 left-2 h-6 w-6 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template);
                  }}
                  title="Supprimer ce contrat personnalisé"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {template.name}
                      {isCustom && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <Badge className={getCategoryColor(template.category)}>
                    {getCategoryLabel(template.category)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Custom badge */}
                {isCustom && (
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                    Modèle personnalisé
                  </Badge>
                )}
                
                {/* Variables count */}
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{Object.keys(template.variables || {}).length}</span> variables disponibles
                </div>

                {/* Version */}
                <div className="text-xs text-muted-foreground">
                  Version {template.version || 1}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => onSelectTemplate(template)}
                    className="flex-1"
                  >
                    {t('contracts.templates.use_template')}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePreviewTemplate(template)}
                    title={t('contracts.templates.preview')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyTemplate(template)}
                    title={t('contracts.templates.copy')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
