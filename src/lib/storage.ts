import { supabase } from "@/integrations/supabase/client";

/**
 * Helpers pour lire des fichiers stockés dans des buckets Supabase PRIVÉS.
 *
 * Les documents sensibles (pièces d'identité, licences RBQ, certificats
 * d'assurance, pièces jointes de messagerie) vivent dans des buckets privés.
 * On ne peut donc pas utiliser getPublicUrl() : il faut générer une URL signée
 * à durée de vie limitée, autorisée par les politiques RLS du bucket.
 *
 * Les valeurs stockées historiquement contenaient parfois l'URL publique
 * complète (`.../storage/v1/object/public/<bucket>/<path>`). Ces helpers
 * savent en extraire le chemin d'objet, pour rester compatibles avec les
 * anciennes lignes.
 */

/** Extrait le chemin d'objet (`<user>/<file>`) d'une valeur stockée. */
export function extractStoragePath(bucket: string, stored: string): string {
  if (!stored) return stored;
  // URL publique ou signée : .../object/(public|sign)/<bucket>/<path>?...
  const marker = `/${bucket}/`;
  const idx = stored.indexOf(marker);
  if (idx !== -1) {
    const path = stored.slice(idx + marker.length);
    return path.split("?")[0];
  }
  // Sinon on suppose que c'est déjà un chemin d'objet.
  return stored.split("?")[0];
}

/** Vrai si la valeur ressemble à une URL de stockage (et non à du texte libre). */
export function isStorageUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return /\/storage\/v1\/object\//.test(value) || /^https?:\/\//.test(value);
}

/**
 * Génère une URL signée pour un objet d'un bucket privé.
 * Retourne null si la signature échoue (droits insuffisants, objet absent).
 */
export async function getSignedUrl(
  bucket: string,
  stored: string | null | undefined,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!stored) return null;
  const path = extractStoragePath(bucket, stored);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Ouvre un document privé dans un nouvel onglet via une URL signée.
 * `onError` permet d'afficher un toast en cas d'échec.
 */
export async function openSignedDocument(
  bucket: string,
  stored: string | null | undefined,
  onError?: () => void,
): Promise<void> {
  const url = await getSignedUrl(bucket, stored);
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    onError?.();
  }
}
