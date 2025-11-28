import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  FileText,
  Users,
  Calendar,
  DollarSign,
  Shield,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfessionalProposalFormProps {
  projectId: string;
  professionalId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface TeamMember {
  name: string;
  role: string;
  experience: string;
}

interface TimelinePhase {
  name: string;
  duration: string;
  date: string;
}

interface Reference {
  project_name: string;
  client_name: string;
  contact_phone: string;
  year: string;
  value: string;
}

export const ProfessionalProposalForm: React.FC<ProfessionalProposalFormProps> = ({
  projectId,
  professionalId,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Section 1: Base information
  const [message, setMessage] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [methodology, setMethodology] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [rbqLicense, setRbqLicense] = useState('');
  const [insuranceUrl, setInsuranceUrl] = useState('');

  // Section 2: Team composition
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: '', role: '', experience: '' }
  ]);

  // Section 3: Timeline
  const [timelinePhases, setTimelinePhases] = useState<TimelinePhase[]>([
    { name: '', duration: '', date: '' }
  ]);

  // Section 4: Budget breakdown
  const [budgetItems, setBudgetItems] = useState<{ [key: string]: string }>({
    'Matériaux': '',
    'Main-d\'œuvre': '',
    'Équipement': '',
  });

  // Section 5: References
  const [references, setReferences] = useState<Reference[]>([
    { project_name: '', client_name: '', contact_phone: '', year: '', value: '' }
  ]);

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', role: '', experience: '' }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };

  const addTimelinePhase = () => {
    setTimelinePhases([...timelinePhases, { name: '', duration: '', date: '' }]);
  };

  const removeTimelinePhase = (index: number) => {
    setTimelinePhases(timelinePhases.filter((_, i) => i !== index));
  };

  const updateTimelinePhase = (index: number, field: keyof TimelinePhase, value: string) => {
    const updated = [...timelinePhases];
    updated[index][field] = value;
    setTimelinePhases(updated);
  };

  const addBudgetItem = () => {
    const key = `Poste ${Object.keys(budgetItems).length + 1}`;
    setBudgetItems({ ...budgetItems, [key]: '' });
  };

  const removeBudgetItem = (key: string) => {
    const { [key]: _, ...rest } = budgetItems;
    setBudgetItems(rest);
  };

  const updateBudgetItem = (oldKey: string, newKey: string, value: string) => {
    if (oldKey !== newKey) {
      const { [oldKey]: _, ...rest } = budgetItems;
      setBudgetItems({ ...rest, [newKey]: value });
    } else {
      setBudgetItems({ ...budgetItems, [oldKey]: value });
    }
  };

  const addReference = () => {
    setReferences([...references, { project_name: '', client_name: '', contact_phone: '', year: '', value: '' }]);
  };

  const removeReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
  };

  const updateReference = (index: number, field: keyof Reference, value: string) => {
    const updated = [...references];
    updated[index][field] = value;
    setReferences(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!message || !estimatedBudget || !estimatedDuration) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare budget breakdown
      const budgetBreakdown: { [key: string]: number } = {};
      Object.entries(budgetItems).forEach(([key, value]) => {
        if (value) {
          budgetBreakdown[key] = parseFloat(value);
        }
      });

      // Filter out empty team members
      const validTeamMembers = teamMembers.filter(
        m => m.name && m.role && m.experience
      );

      // Filter out empty timeline phases
      const validTimelinePhases = timelinePhases.filter(
        p => p.name && p.duration
      );

      // Filter out empty references
      const validReferences = references.filter(
        r => r.project_name && r.client_name
      );

      // Calculate valid_until (90 days from now)
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 90);

      // Insert proposal
      const { data: proposal, error } = await supabase
        .from('proposals')
        .insert({
          project_id: projectId,
          professional_id: professionalId,
          message,
          detailed_description: detailedDescription || null,
          work_methodology: methodology || null,
          estimated_budget: parseFloat(estimatedBudget),
          estimated_duration_days: parseInt(estimatedDuration),
          team_composition: validTeamMembers.length > 0 ? validTeamMembers : null,
          timeline_details: validTimelinePhases.length > 0 ? validTimelinePhases : null,
          budget_breakdown: Object.keys(budgetBreakdown).length > 0 ? budgetBreakdown : null,
          rbq_license_number: rbqLicense || null,
          insurance_proof_url: insuranceUrl || null,
          references: validReferences.length > 0 ? validReferences : null,
          warranty_offered_months: parseInt(warrantyMonths),
          valid_until: validUntil.toISOString().split('T')[0],
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Get project details to find client_id
      const { data: projectData } = await supabase
        .from('projects')
        .select('client_id, title')
        .eq('id', projectId)
        .single();

      // Get professional details
      const { data: professionalData } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', professionalId)
        .single();

      // Create notification for client
      if (projectData && professionalData) {
        await supabase
          .from('notifications')
          .insert({
            user_id: projectData.client_id,
            type: 'proposal',
            title: 'Nouvelle proposition reçue',
            message: `${professionalData.company_name || professionalData.full_name} a soumis une proposition pour "${projectData.title}"`,
            action_url: `/proposal/${proposal.id}?showPDF=true`,
            metadata: {
              proposal_id: proposal.id,
              project_id: projectId,
              professional_id: professionalId,
            },
          });
      }

      toast.success('Soumission envoyée avec succès !');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/pro/dashboard');
      }
    } catch (error: any) {
      console.error('Error submitting proposal:', error);
      if (error.code === '23505') {
        toast.error('Vous avez déjà soumis une proposition pour ce projet');
      } else {
        toast.error('Erreur lors de l\'envoi de la soumission');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="base">
            <FileText className="h-4 w-4 mr-2" />
            Base
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Équipe
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Calendar className="h-4 w-4 mr-2" />
            Calendrier
          </TabsTrigger>
          <TabsTrigger value="budget">
            <DollarSign className="h-4 w-4 mr-2" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="extras">
            <Shield className="h-4 w-4 mr-2" />
            Extras
          </TabsTrigger>
        </TabsList>

        {/* Base Information */}
        <TabsContent value="base">
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="message">Message de présentation *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Présentez brièvement votre proposition..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="detailedDescription">Description détaillée</Label>
                <Textarea
                  id="detailedDescription"
                  value={detailedDescription}
                  onChange={(e) => setDetailedDescription(e.target.value)}
                  placeholder="Description complète de la portée des travaux..."
                  rows={5}
                />
              </div>

              <div>
                <Label htmlFor="methodology">Méthodologie</Label>
                <Textarea
                  id="methodology"
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  placeholder="Décrivez votre approche et méthodologie pour ce projet..."
                  rows={5}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedBudget">Budget estimé (CAD) *</Label>
                  <Input
                    id="estimatedBudget"
                    type="number"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
                    placeholder="50000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="estimatedDuration">Durée estimée (jours) *</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="30"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rbqLicense">Numéro de licence RBQ</Label>
                  <Input
                    id="rbqLicense"
                    value={rbqLicense}
                    onChange={(e) => setRbqLicense(e.target.value)}
                    placeholder="1234-5678-01"
                  />
                </div>

                <div>
                  <Label htmlFor="warrantyMonths">Garantie offerte (mois)</Label>
                  <Input
                    id="warrantyMonths"
                    type="number"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value)}
                    placeholder="12"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="insuranceUrl">URL du certificat d'assurance</Label>
                <Input
                  id="insuranceUrl"
                  type="url"
                  value={insuranceUrl}
                  onChange={(e) => setInsuranceUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Composition */}
        <TabsContent value="team">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Composition de l'équipe</CardTitle>
              <Button type="button" onClick={addTeamMember} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un membre
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Membre {index + 1}</h4>
                    {teamMembers.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeTeamMember(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label>Nom</Label>
                      <Input
                        value={member.name}
                        onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                        placeholder="Jean Tremblay"
                      />
                    </div>
                    <div>
                      <Label>Rôle</Label>
                      <Input
                        value={member.role}
                        onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                        placeholder="Chef de chantier"
                      />
                    </div>
                    <div>
                      <Label>Expérience</Label>
                      <Input
                        value={member.experience}
                        onChange={(e) => updateTeamMember(index, 'experience', e.target.value)}
                        placeholder="15 ans"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Calendrier détaillé</CardTitle>
              <Button type="button" onClick={addTimelinePhase} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une phase
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelinePhases.map((phase, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Phase {index + 1}</h4>
                    {timelinePhases.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeTimelinePhase(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label>Nom de la phase</Label>
                      <Input
                        value={phase.name}
                        onChange={(e) => updateTimelinePhase(index, 'name', e.target.value)}
                        placeholder="Préparation du site"
                      />
                    </div>
                    <div>
                      <Label>Durée</Label>
                      <Input
                        value={phase.duration}
                        onChange={(e) => updateTimelinePhase(index, 'duration', e.target.value)}
                        placeholder="5 jours"
                      />
                    </div>
                    <div>
                      <Label>Date (optionnel)</Label>
                      <Input
                        type="date"
                        value={phase.date}
                        onChange={(e) => updateTimelinePhase(index, 'date', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Breakdown */}
        <TabsContent value="budget">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Décomposition budgétaire</CardTitle>
              <Button type="button" onClick={addBudgetItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un poste
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(budgetItems).map(([key, value]) => (
                <div key={key} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Poste de dépense</Label>
                    <Input
                      value={key}
                      onChange={(e) => updateBudgetItem(key, e.target.value, value)}
                      placeholder="Description du poste"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Montant (CAD)</Label>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => updateBudgetItem(key, key, e.target.value)}
                      placeholder="10000"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeBudgetItem(key)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total estimé :</span>
                  <span>
                    {new Intl.NumberFormat('fr-CA', {
                      style: 'currency',
                      currency: 'CAD',
                    }).format(
                      Object.values(budgetItems).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* References and Extras */}
        <TabsContent value="extras">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Références de projets similaires</CardTitle>
              <Button type="button" onClick={addReference} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une référence
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {references.map((ref, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Référence {index + 1}</h4>
                    {references.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeReference(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label>Nom du projet</Label>
                      <Input
                        value={ref.project_name}
                        onChange={(e) => updateReference(index, 'project_name', e.target.value)}
                        placeholder="Rénovation résidentielle"
                      />
                    </div>
                    <div>
                      <Label>Nom du client</Label>
                      <Input
                        value={ref.client_name}
                        onChange={(e) => updateReference(index, 'client_name', e.target.value)}
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div>
                      <Label>Téléphone du contact</Label>
                      <Input
                        value={ref.contact_phone}
                        onChange={(e) => updateReference(index, 'contact_phone', e.target.value)}
                        placeholder="514-123-4567"
                      />
                    </div>
                    <div>
                      <Label>Année</Label>
                      <Input
                        value={ref.year}
                        onChange={(e) => updateReference(index, 'year', e.target.value)}
                        placeholder="2023"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Valeur du projet (CAD)</Label>
                      <Input
                        type="number"
                        value={ref.value}
                        onChange={(e) => updateReference(index, 'value', e.target.value)}
                        placeholder="75000"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end mt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="gap-2">
          <Send className="h-4 w-4" />
          {submitting ? 'Envoi en cours...' : 'Envoyer la soumission'}
        </Button>
      </div>
    </form>
  );
};

export default ProfessionalProposalForm;

