import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, Shield, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VerificationCertificate {
  valid: boolean;
  contract_id?: string;
  contract_title?: string;
  contract_status?: string;
  contract_signed_at?: string | null;
  signer_role?: 'client' | 'professional';
  signature_signed_at?: string;
  document_hash?: string;
  signature_hash?: string;
}

const formatTimestamp = (value?: string | null) => {
  if (!value) return '—';
  return format(new Date(value), "d MMMM yyyy 'à' HH:mm", { locale: fr });
};

const shortenedHash = (value?: string) => {
  if (!value) return '—';
  return `${value.slice(0, 12)}…${value.slice(-12)}`;
};

export default function VerifySignature() {
  const { verificationCode } = useParams<{ verificationCode: string }>();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<VerificationCertificate>({ valid: false });

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      setLoading(true);
      if (!verificationCode) {
        setCertificate({ valid: false });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('verify_contract_signature', {
        p_verification_code: verificationCode,
      });

      if (!cancelled) {
        setCertificate(error ? { valid: false } : (data as unknown as VerificationCertificate));
        setLoading(false);
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [verificationCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center" role="status">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p>Vérification en cours…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-3xl py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Shield className="h-8 w-8 text-primary shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <CardTitle>Vérification d’un enregistrement de signature</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground break-all">
                  Code : <span className="font-mono font-semibold">{verificationCode}</span>
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {certificate.valid ? (
              <>
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                  <CheckCircle2 className="h-6 w-6 text-green-700 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="font-semibold text-green-950">Code reconnu</h2>
                    <p className="text-sm text-green-800">
                      Ce code est associé à une signature enregistrée par BâtirNet. Cette page ne constitue pas, à elle seule, un avis juridique sur la validité du contrat.
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Contrat</dt>
                    <dd className="font-medium">{certificate.contract_title || 'Sans titre'}</dd>
                    <dd className="font-mono text-xs break-all mt-1">{certificate.contract_id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Statut</dt>
                    <dd><Badge variant="secondary">{certificate.contract_status || 'inconnu'}</Badge></dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Partie signataire</dt>
                    <dd>{certificate.signer_role === 'client' ? 'Client' : 'Professionnel'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Signature enregistrée</dt>
                    <dd>{formatTimestamp(certificate.signature_signed_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Contrat entièrement signé</dt>
                    <dd>{formatTimestamp(certificate.contract_signed_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Empreinte du document</dt>
                    <dd className="font-mono text-xs" title={certificate.document_hash}>{shortenedHash(certificate.document_hash)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Empreinte de la signature</dt>
                    <dd className="font-mono text-xs" title={certificate.signature_hash}>{shortenedHash(certificate.signature_hash)}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <XCircle className="h-6 w-6 text-red-700 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold text-red-950">Code non reconnu</h2>
                  <p className="text-sm text-red-800">
                    Vérifiez le code ou demandez à l’autre partie de vous transmettre le lien original.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
