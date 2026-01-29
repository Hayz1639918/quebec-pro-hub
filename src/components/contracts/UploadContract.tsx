import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Upload, 
  FileText, 
  X, 
  Loader2,
  CheckCircle2,
  Calendar,
  DollarSign,
  User
} from "lucide-react";

interface UploadContractProps {
  userId: string;
  userType: 'client' | 'professional';
  onContractUploaded: () => void;
  onCancel: () => void;
}

export const UploadContract = ({ 
  userId, 
  userType,
  onContractUploaded, 
  onCancel 
}: UploadContractProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [otherPartyEmail, setOtherPartyEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        variant: "destructive",
        title: "Format non supporté",
        description: "Veuillez uploader un fichier PDF, JPG ou PNG",
      });
      return;
    }

    if (selectedFile.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 10 MB",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        variant: "destructive",
        title: "Fichier requis",
        description: "Veuillez sélectionner un fichier de contrat",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Titre requis",
        description: "Veuillez donner un titre au contrat",
      });
      return;
    }

    setLoading(true);

    try {
      // Find the other party by email
      let otherPartyId = null;
      if (otherPartyEmail.trim()) {
        const { data: otherParty, error: searchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', otherPartyEmail.trim().toLowerCase())
          .single();
        
        if (searchError || !otherParty) {
          toast({
            variant: "destructive",
            title: "Utilisateur non trouvé",
            description: `Aucun utilisateur avec l'email ${otherPartyEmail}`,
          });
          setLoading(false);
          return;
        }
        otherPartyId = otherParty.id;
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `contract-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error("Erreur lors de l'upload du fichier");
      }

      // Store the file path (NOT a signed URL - signed URLs expire!)
      // The signed URL should be generated on-demand when viewing the contract
      const fileUrl = filePath;

      // Create contract record
      const contractData: Record<string, any> = {
        title: title.trim(),
        description: description.trim() || null,
        total_amount: totalAmount ? parseFloat(totalAmount) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_uploaded: true,
        uploaded_file_url: fileUrl,
        uploaded_filename: file.name,
        uploaded_at: new Date().toISOString(),
        status: 'draft',
        content: `Contrat uploadé: ${file.name}`,
      };

      // Set client and professional based on user type
      if (userType === 'professional') {
        contractData.professional_id = userId;
        if (otherPartyId) {
          contractData.client_id = otherPartyId;
        }
      } else {
        contractData.client_id = userId;
        if (otherPartyId) {
          contractData.professional_id = otherPartyId;
        }
      }

      const { error: insertError } = await supabase
        .from('contracts')
        .insert(contractData);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error("Erreur lors de la création du contrat");
      }

      toast({
        title: "Contrat uploadé avec succès",
        description: "Le contrat a été ajouté à votre liste",
      });

      onContractUploaded();

    } catch (error) {
      console.error('Error uploading contract:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Uploader un contrat existant
        </CardTitle>
        <CardDescription>
          Ajoutez un contrat que vous avez déjà signé ou créé en dehors de la plateforme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : file 
                ? 'border-green-500 bg-green-50' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Glissez votre contrat ici
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou cliquez pour sélectionner un fichier
                </p>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="contract-file"
                />
                <Button type="button" variant="outline" asChild>
                  <label htmlFor="contract-file" className="cursor-pointer">
                    Parcourir les fichiers
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Formats acceptés: PDF, JPG, PNG (max 10 MB)
                </p>
              </>
            )}
          </div>

          {/* Contract Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du contrat *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Contrat de rénovation cuisine"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes ou description du contrat..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalAmount" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Montant total (optionnel)
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="otherPartyEmail" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Email de l'autre partie (optionnel)
                </Label>
                <Input
                  id="otherPartyEmail"
                  type="email"
                  value={otherPartyEmail}
                  onChange={(e) => setOtherPartyEmail(e.target.value)}
                  placeholder="client@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date de début
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Uploader le contrat
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadContract;



