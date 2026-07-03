import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Paperclip, ExternalLink } from "lucide-react";

export interface ProjectImage {
  id: string;
  project_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}

interface ProjectFilesTabProps {
  images: ProjectImage[];
  onPreview: (url: string) => void;
}

/** Onglet « Fichiers joints » de la page projet : photos et documents uploadés (US-015). */
export default function ProjectFilesTab({ images, onPreview }: ProjectFilesTabProps) {
  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Aucun fichier joint à ce projet.</p>
          <p className="text-sm mt-1">
            Ajoutez des photos ou documents lors de la création ou modification du projet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {images.map((img) => {
        const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(img.image_url);
        return (
          <div
            key={img.id}
            className="border rounded-lg overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => isImage && onPreview(img.image_url)}
          >
            {isImage ? (
              <img
                src={img.image_url}
                alt={img.caption || "Fichier joint"}
                className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-36 bg-muted flex flex-col items-center justify-center gap-2">
                <Paperclip className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground text-center px-2 break-all">
                  {img.image_url.split("/").pop()}
                </span>
              </div>
            )}
            <div className="p-2 flex items-center justify-between gap-1">
              <p className="text-xs text-muted-foreground truncate flex-1">{img.caption || "Sans titre"}</p>
              <a
                href={img.image_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:text-primary/80"
                aria-label={`Ouvrir ${img.caption || "le fichier"} dans un nouvel onglet`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
