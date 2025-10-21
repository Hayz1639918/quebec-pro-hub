import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Key,
  User,
  Building2,
  Globe
} from "lucide-react";
import { useDocuSign } from "@/hooks/useDocuSign";
import { useTranslation } from "react-i18next";
import type { DocuSignConfig } from "@/services/docusign";

interface DocuSignConfigProps {
  onConfigSaved?: (config: DocuSignConfig) => void;
}

export const DocuSignConfigComponent = ({ onConfigSaved }: DocuSignConfigProps) => {
  const { t } = useTranslation();
  const { initialize, isInitialized, isLoading, error } = useDocuSign();
  
  const [config, setConfig] = useState<DocuSignConfig>({
    basePath: 'https://demo.docusign.net/restapi',
    accessToken: '',
    accountId: '',
    integratorKey: '',
    userId: '',
    privateKey: '',
    expiresIn: 3600
  });
  
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field: keyof DocuSignConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveConfig = async () => {
    try {
      await initialize(config);
      onConfigSaved?.(config);
    } catch (error) {
      console.error('Error saving DocuSign config:', error);
    }
  };

  const loadDemoConfig = () => {
    setConfig({
      basePath: 'https://demo.docusign.net/restapi',
      accessToken: 'demo-token',
      accountId: 'demo-account-id',
      integratorKey: 'demo-integrator-key',
      userId: 'demo-user-id',
      privateKey: 'demo-private-key',
      expiresIn: 3600
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('contracts.docusign.configuration')}
        </CardTitle>
        <CardDescription>
          {t('contracts.docusign.config_description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Mode Demo/Production */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">{t('contracts.docusign.demo_mode')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('contracts.docusign.demo_mode_description')}
            </p>
          </div>
          <Switch
            checked={isDemoMode}
            onCheckedChange={setIsDemoMode}
          />
        </div>

        {isDemoMode && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('contracts.docusign.demo_alert')}
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration de base */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('contracts.docusign.basic_config')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePath">{t('contracts.docusign.base_path')}</Label>
              <Input
                id="basePath"
                value={config.basePath}
                onChange={(e) => handleInputChange('basePath', e.target.value)}
                placeholder="https://demo.docusign.net/restapi"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountId">{t('contracts.docusign.account_id')}</Label>
              <Input
                id="accountId"
                value={config.accountId}
                onChange={(e) => handleInputChange('accountId', e.target.value)}
                placeholder="12345678-1234-1234-1234-123456789012"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Configuration avancée */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              {t('contracts.docusign.advanced_config')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? t('common.hide') : t('common.show')}
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="integratorKey">{t('contracts.docusign.integrator_key')}</Label>
                  <Input
                    id="integratorKey"
                    type="password"
                    value={config.integratorKey}
                    onChange={(e) => handleInputChange('integratorKey', e.target.value)}
                    placeholder="12345678-1234-1234-1234-123456789012"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="userId">{t('contracts.docusign.user_id')}</Label>
                  <Input
                    id="userId"
                    value={config.userId}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    placeholder="12345678-1234-1234-1234-123456789012"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privateKey">{t('contracts.docusign.private_key')}</Label>
                <Textarea
                  id="privateKey"
                  value={config.privateKey}
                  onChange={(e) => handleInputChange('privateKey', e.target.value)}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresIn">{t('contracts.docusign.expires_in')}</Label>
                <Input
                  id="expiresIn"
                  type="number"
                  value={config.expiresIn}
                  onChange={(e) => handleInputChange('expiresIn', parseInt(e.target.value))}
                  placeholder="3600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {isInitialized ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {t('contracts.docusign.initialized')}
              </Badge>
            ) : (
              <Badge variant="secondary">
                {t('contracts.docusign.not_initialized')}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {isDemoMode && (
              <Button
                variant="outline"
                onClick={loadDemoConfig}
                disabled={isLoading}
              >
                {t('contracts.docusign.load_demo')}
              </Button>
            )}
            
            <Button
              onClick={handleSaveConfig}
              disabled={isLoading || !config.accountId}
            >
              {isLoading ? t('common.loading') : t('contracts.docusign.save_config')}
            </Button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Liens utiles */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">{t('contracts.docusign.useful_links')}</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://developers.docusign.com/', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {t('contracts.docusign.developer_docs')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://demo.docusign.net/', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {t('contracts.docusign.demo_sandbox')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://app.docusign.com/', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {t('contracts.docusign.production')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
