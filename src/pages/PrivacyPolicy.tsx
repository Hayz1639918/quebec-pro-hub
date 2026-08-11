import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, FileText, Lock, Users, Clock } from "lucide-react";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Politique de Confidentialité</h1>
          <p className="text-gray-600">
            Cadre de protection des renseignements personnels de BâtirNet
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
            <span>Mise à jour : 2026-08-11</span>
            <span>•</span>
            <span>Version 1.1</span>
          </div>
        </div>

        {/* Responsable RP */}
        <h2 className="sr-only">Contenu de la politique de confidentialité</h2>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Point de contact — renseignements personnels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Pour toute question, plainte ou demande d’exercice de vos droits, écrivez à l’adresse suivante :
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <a href="mailto:privacy@batirnet.com" className="text-primary hover:underline">
                    privacy@batirnet.com
                  </a>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Vous pouvez contacter notre responsable pour toute question concernant cette politique ou l'exercice de vos droits.
            </p>
          </CardContent>
        </Card>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Introduction</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              BâtirNet exploite la plateforme web accessible à cette adresse. Cette Politique de Confidentialité 
              décrit comment nous recueillons, utilisons, divulguons et protégeons vos renseignements personnels 
              conformément à la <strong>Loi 25</strong> (Loi modernisant des dispositions législatives en matière 
              de protection des renseignements personnels) et à la <strong>Loi sur la protection des renseignements 
              personnels dans le secteur privé (LPRPSP)</strong> du Québec.
            </p>
            <p>
              En utilisant notre Plateforme, vous consentez aux pratiques décrites dans cette politique.
            </p>
          </CardContent>
        </Card>

        {/* Renseignements collectés */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              1. Renseignements Personnels Collectés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">1.1 Informations de Compte</h3>
              <p className="text-gray-600 mb-3">Lorsque vous créez un compte sur BâtirNet, nous recueillons :</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-3">
                <p className="font-medium mb-2">Pour tous les utilisateurs :</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Nom complet</li>
                  <li>Adresse courriel</li>
                  <li>Numéro de téléphone</li>
                  <li>Ville, province, code postal</li>
                  <li>Mot de passe (chiffré, jamais stocké en clair)</li>
                  <li>Type d'utilisateur (client ou professionnel)</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium mb-2">Pour les professionnels :</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Nom de l'entreprise</li>
                  <li>Numéro de licence RBQ</li>
                  <li>Spécialités et services offerts</li>
                  <li>Informations d'assurance</li>
                </ul>
              </div>

              <p className="text-sm text-gray-500 mt-3">
                <strong>Finalité :</strong> Création et gestion de votre compte, authentification, fourniture des services.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">1.2 Informations d'Utilisation</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li><strong>Données de connexion :</strong> Adresse IP, navigateur, horodatage</li>
                <li><strong>Données de navigation :</strong> Pages visitées, durée de session</li>
                <li><strong>Géolocalisation :</strong> Uniquement pour signatures de contrats (avec consentement)</li>
              </ul>
              <p className="text-sm text-gray-500 mt-3">
                <strong>Finalité :</strong> Sécurité, détection de fraude, audit trail des signatures.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">1.3 Informations de Projet et Contrat</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Descriptions de projets</li>
                <li>Budgets et délais</li>
                <li>Messages échangés</li>
                <li>Contrats signés électroniquement</li>
                <li>Évaluations et avis</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Vos droits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              2. Vos Droits (Loi 25)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-1">Droit d'accès (Art. 27)</h4>
                <p className="text-gray-600 text-sm">
                  Vous pouvez demander une copie de vos renseignements personnels en format JSON.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-1">Droit de rectification (Art. 28)</h4>
                <p className="text-gray-600 text-sm">
                  Vous pouvez demander la correction de renseignements inexacts.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-1">Droit à la suppression (Art. 29)</h4>
                <p className="text-gray-600 text-sm">
                  Vous pouvez demander la suppression de votre compte (données contractuelles conservées 7 ans).
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <p className="text-sm">
                  <strong>Délai de réponse :</strong> Maximum 30 jours (Loi 25)
                </p>
                <p className="text-sm mt-2">
                  <strong>Pour exercer vos droits :</strong>{" "}
                  <a href="mailto:privacy@batirnet.com" className="text-primary hover:underline">
                    privacy@batirnet.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              3. Mesures de Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-600">Chiffrement TLS 1.3 pour toutes les communications</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-600">Chiffrement des mots de passe (bcrypt)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-600">Contrôles d'accès stricts (RLS Supabase)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-600">Scan de sécurité automatique (CodeQL, Dependabot)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-gray-600">Journalisation des accès et modifications</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Rétention */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              4. Durée de Conservation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Données de compte</span>
                <span className="font-medium">Tant que compte actif</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Contrats et paiements</span>
                <span className="font-medium">7 ans (Code civil QC)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Logs de sécurité</span>
                <span className="font-medium">2 ans</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Messages et notifications</span>
                <span className="font-medium">Supprimés avec compte</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Nous Contacter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Pour toute question concernant cette politique ou vos renseignements personnels :
            </p>
            <div className="space-y-2">
              <p>
                <strong>Email :</strong>{" "}
                <a href="mailto:privacy@batirnet.com" className="text-primary hover:underline">
                  privacy@batirnet.com
                </a>
              </p>
              <p className="text-sm text-gray-500">
                Délai de réponse : Maximum 30 jours conformément à la Loi 25
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Modification */}
        <div className="text-center py-8 text-sm text-gray-500">
          <p>
            Nous nous réservons le droit de modifier cette politique. Les modifications seront 
            publiées sur cette page avec une nouvelle date d'entrée en vigueur.
          </p>
          <p className="mt-2">
            <strong>Dernière mise à jour :</strong> 2025-11-03
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;





