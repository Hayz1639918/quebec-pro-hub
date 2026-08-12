import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, FileText, Lock, Users, Clock, Banknote } from "lucide-react";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Politique de Confidentialité</h1>
          <p className="text-gray-600">Cadre de protection des renseignements personnels de BâtirNet</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
            <span>Mise à jour : 2026-08-11</span>
            <span>•</span>
            <span>Version 1.2</span>
          </div>
        </div>

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
              Pour toute question, plainte ou demande d’exercice de vos droits, écrivez à :
            </p>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Email</p>
                <a href="mailto:privacy@batirnet.com" className="text-primary hover:underline">
                  privacy@batirnet.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader><CardTitle>Introduction</CardTitle></CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              BâtirNet décrit dans cette politique comment les renseignements personnels sont recueillis,
              utilisés, communiqués et protégés dans le cadre de la plateforme. Nous appliquons les exigences
              québécoises applicables, notamment la Loi modernisant des dispositions législatives en matière de
              protection des renseignements personnels (Loi 25) et la Loi sur la protection des renseignements
              personnels dans le secteur privé.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              1. Renseignements collectés et affichage public
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">1.1 Informations de compte</h3>
              <p className="text-gray-600 mb-3">Selon le type de compte, nous pouvons recueillir :</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>nom, adresse courriel et numéro de téléphone;</li>
                <li>ville, région et renseignements de profil;</li>
                <li>pour les professionnels : entreprise, licence RBQ, services, expérience et documents de vérification;</li>
                <li>informations nécessaires à l’authentification et à la sécurité du compte.</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">1.2 Profil public des professionnels</h3>
              <p className="text-gray-600 mb-3">
                Pour permettre aux entrepreneurs et professionnels de présenter leur entreprise et d’être contactés,
                certaines informations professionnelles sont volontairement publiques :
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>nom du professionnel et nom de l’entreprise;</li>
                <li><strong>adresse courriel professionnelle</strong> utilisée comme moyen de contact public;</li>
                <li>ville et région, services, expérience, tarifs ou disponibilités lorsque fournis;</li>
                <li>numéro RBQ, statut de vérification, portfolio, avis et évaluations;</li>
                <li>site web ou liens professionnels lorsque fournis.</li>
              </ul>
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-gray-700">
                Le numéro de téléphone, l’adresse complète, les documents de vérification bruts, les métriques internes
                d’activité et les coordonnées géographiques précises ne font pas partie du profil public. Les comptes
                administrateurs ne sont pas listés dans l’annuaire public.
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">1.3 Projets, contrats et communications</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>descriptions de projets, budgets, dates et pièces jointes;</li>
                <li>propositions et contrats;</li>
                <li>messages et notifications liés aux projets;</li>
                <li>avis et évaluations.</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                1.4 Suivi des paiements directs
              </h3>
              <p className="text-gray-600">
                BâtirNet <strong>ne reçoit pas, ne conserve pas et ne transfère pas les fonds</strong> entre les parties.
                Le client et l’entrepreneur conviennent directement du moyen de règlement. La plateforme peut enregistrer
                le montant prévu, le mode déclaré (par exemple virement, chèque ou comptant), la date à laquelle le client
                indique avoir envoyé le paiement, la confirmation de réception de l’entrepreneur et une note facultative.
              </p>
              <p className="text-gray-600 mt-3">
                Ces statuts constituent un suivi déclaratif du projet; ils ne sont pas une preuve bancaire et BâtirNet ne
                stocke aucun numéro de carte de crédit dans ce processus.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" />2. Vos droits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-1">Accès</h4>
              <p className="text-gray-600 text-sm">Vous pouvez demander l’accès aux renseignements personnels que nous détenons à votre sujet.</p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-1">Rectification</h4>
              <p className="text-gray-600 text-sm">Vous pouvez demander la correction de renseignements inexacts ou incomplets.</p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-1">Suppression et retrait du consentement</h4>
              <p className="text-gray-600 text-sm">Vous pouvez présenter une demande de suppression lorsque la loi le permet et retirer un consentement applicable.</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm">
                Pour exercer vos droits : <a href="mailto:privacy@batirnet.com" className="text-primary hover:underline">privacy@batirnet.com</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />3. Mesures de sécurité</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>communications HTTPS/TLS;</li>
              <li>contrôles d’accès et Row-Level Security (RLS);</li>
              <li>séparation entre données publiques et données privées;</li>
              <li>journalisation et contrôles des opérations sensibles;</li>
              <li>analyses automatisées de sécurité du code et des dépendances.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />4. Conservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-600">
            <p>Nous conservons les renseignements seulement pendant la durée nécessaire aux services, aux obligations légales, à la sécurité et au règlement de différends.</p>
            <p>Les données liées aux contrats, factures et suivis de règlement peuvent devoir être conservées plus longtemps que les données ordinaires du profil.</p>
          </CardContent>
        </Card>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Nous contacter</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Pour toute question concernant cette politique ou vos renseignements personnels :{" "}
              <a href="mailto:privacy@batirnet.com" className="text-primary hover:underline">privacy@batirnet.com</a>.
            </p>
          </CardContent>
        </Card>

        <div className="text-center py-8 text-sm text-gray-500">
          <p>Les modifications importantes à cette politique seront publiées sur cette page avec une date de mise à jour.</p>
          <p className="mt-2"><strong>Dernière mise à jour :</strong> 2026-08-11</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
