import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { getSignedUrl } from "@/lib/storage";

const BUCKET = "chat-attachments";

interface ChatAttachmentProps {
  /** Chemin d'objet (nouveau format) ou URL publique complète (ancien format). */
  attachment: string;
  type: string | null;
  isOwnMessage: boolean;
}

/**
 * Affiche une pièce jointe de messagerie depuis le bucket privé
 * `chat-attachments` via une URL signée à durée de vie limitée.
 */
export function ChatAttachment({ attachment, type, isOwnMessage }: ChatAttachmentProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    getSignedUrl(BUCKET, attachment)
      .then((signed) => {
        if (!active) return;
        if (signed) setUrl(signed);
        else setFailed(true);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [attachment]);

  if (failed) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-4 w-4 flex-shrink-0" />
        Pièce jointe indisponible
      </div>
    );
  }

  if (!url) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement…
      </div>
    );
  }

  return (
    <div className="mt-2">
      {type === "image" ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt="Image partagée"
            className="max-w-xs max-h-48 rounded-lg object-cover border"
          />
        </a>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 text-xs underline ${isOwnMessage ? "text-primary-foreground/80" : "text-primary"}`}
        >
          <FileText className="h-4 w-4 flex-shrink-0" />
          Télécharger le fichier
        </a>
      )}
    </div>
  );
}
