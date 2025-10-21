import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Filter, Plus, Eye, Copy } from "lucide-react";
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

  useEffect(() => {
    fetchTemplates();
  }, []);

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

      setTemplates(data || []);
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

  const getCategoryColor = (category: ContractCategory) => {
    switch (category) {
      case 'construction':
        return 'bg-blue-100 text-blue-800';
      case 'renovation':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'consultation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: ContractCategory) => {
    switch (category) {
      case 'construction':
        return t('contracts.categories.construction');
      case 'renovation':
        return t('contracts.categories.renovation');
      case 'maintenance':
        return t('contracts.categories.maintenance');
      case 'consultation':
        return t('contracts.categories.consultation');
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
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('contracts.templates.filter_category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('contracts.templates.all_categories')}</SelectItem>
            <SelectItem value="construction">{t('contracts.categories.construction')}</SelectItem>
            <SelectItem value="renovation">{t('contracts.categories.renovation')}</SelectItem>
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
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {template.name}
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
                {/* Variables count */}
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{Object.keys(template.variables).length}</span> variables disponibles
                </div>

                {/* Version */}
                <div className="text-xs text-muted-foreground">
                  Version {template.version}
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
          ))}
        </div>
      )}
    </div>
  );
};
