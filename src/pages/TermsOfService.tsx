import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    title: '1. Objet du service',
    content: 'BâtirNet est une plateforme de mise en relation et de gestion de projets entre clients et professionnels de la construction. BâtirNet n’exécute pas les travaux, n’est pas partie aux contrats conclus entre utilisateurs et ne remplace pas les vérifications professionnelles ou juridiques appropriées.',
  },
  {
    title: '2. Admissibilité et compte',
    content: 'Vous devez avoir la capacité de conclure un contrat au Québec et fournir des renseignements exacts. Vous êtes responsable de la confidentialité de vos accès, de l’activation des mesures de sécurité offertes et de toute activité réalisée depuis votre compte. Signalez rapidement tout accès non autorisé.',
  },
  {
    title: '3. Profils et vérifications',
    content: 'Les badges, numéros de licence et documents affichés facilitent la diligence raisonnable, sans constituer une garantie continue de compétence, de solvabilité, d’assurance ou de conformité. Avant des travaux, chaque partie doit vérifier les licences, assurances, références, permis et obligations applicables.',
  },
  {
    title: '4. Projets, propositions et contrats',
    content: 'Les utilisateurs déterminent eux-mêmes la portée, le prix, l’échéancier et les autres conditions de leurs projets. Relisez tout contrat avant de le signer. Les signatures, horodatages et codes de vérification enregistrés par la plateforme servent à documenter l’opération; leur effet juridique dépend du document et des circonstances.',
  },
  {
    title: '5. Paiements et règlements',
    content: 'Les paiements se font directement entre le client et le professionnel selon le moyen convenu entre eux. BâtirNet ne reçoit pas, ne conserve pas, ne protège pas et ne transfère pas les fonds. La plateforme peut uniquement enregistrer des informations de suivi, notamment le montant prévu, le moyen déclaré, l’indication « envoyé » du client et la confirmation « reçu » du professionnel. Ces statuts sont déclaratifs et ne remplacent pas une preuve bancaire. Chaque partie demeure responsable de conserver ses preuves et de respecter ses obligations fiscales et contractuelles.',
  },
  {
    title: '6. Utilisation acceptable',
    content: 'Il est interdit d’usurper une identité, de publier du contenu faux ou illicite, de contourner les contrôles d’accès, de téléverser un logiciel malveillant, de harceler un utilisateur, de collecter massivement des données ou d’utiliser la plateforme pour une fraude. Les documents téléversés doivent vous appartenir ou être utilisés avec autorisation.',
  },
  {
    title: '7. Contenu et propriété intellectuelle',
    content: 'Vous conservez vos droits sur votre contenu et accordez à BâtirNet l’autorisation limitée de l’héberger, le traiter et l’afficher afin d’exploiter le service. La plateforme, son identité visuelle et son code demeurent protégés par les droits applicables.',
  },
  {
    title: '8. Confidentialité',
    content: 'Le traitement des renseignements personnels est décrit dans la Politique de confidentialité. Le courriel professionnel peut être affiché publiquement comme moyen de contact commercial. Ne publiez pas dans les zones publiques de pièces d’identité, coordonnées bancaires ou documents confidentiels qui n’y sont pas nécessaires.',
  },
  {
    title: '9. Suspension et fermeture',
    content: 'BâtirNet peut limiter ou suspendre un compte pour protéger les utilisateurs, enquêter sur un incident, respecter la loi ou faire cesser une violation. Vous pouvez demander la fermeture de votre compte, sous réserve des données qui doivent être conservées pour la sécurité, les contrats, les litiges ou les obligations légales.',
  },
  {
    title: '10. Disponibilité et responsabilité',
    content: 'Le service est fourni selon sa disponibilité et peut évoluer, notamment pendant une phase bêta. Dans les limites permises par la loi, BâtirNet ne garantit ni un résultat commercial ni la qualité des travaux d’un utilisateur. Rien dans ces conditions ne limite un droit auquel un consommateur ne peut légalement renoncer.',
  },
  {
    title: '11. Droit applicable et modifications',
    content: 'Ces conditions sont régies par les lois applicables au Québec et au Canada. Une modification importante sera signalée et une nouvelle acceptation pourra être demandée. La version applicable est celle acceptée au moment de l’utilisation concernée.',
  },
];

export default function TermsOfService() {
  useEffect(() => window.scrollTo(0, 0), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold">Conditions d’utilisation</h1>
          <p className="mt-3 text-muted-foreground">Version du 11 août 2026</p>
        </header>

        <Card className="mb-6">
          <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
            En créant un compte ou en utilisant BâtirNet, vous acceptez ces conditions. Si vous utilisez la plateforme pour une entreprise, vous confirmez être autorisé à l’engager.
          </CardContent>
        </Card>

        <div className="space-y-5">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="leading-relaxed text-muted-foreground">
                {section.content}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">12. Nous joindre</CardTitle>
            </CardHeader>
            <CardContent className="leading-relaxed text-muted-foreground">
              Questions sur ces conditions :{' '}
              <a className="text-primary underline" href="mailto:privacy@batirnet.com">
                privacy@batirnet.com
              </a>.
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}