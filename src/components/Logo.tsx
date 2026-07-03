import { cn } from "@/lib/utils";

interface LogoProps {
  /** Masque le texte et n'affiche que le monogramme (utile en mobile très étroit). */
  markOnly?: boolean;
  className?: string;
  /** Taille du monogramme en pixels (le wordmark s'ajuste). */
  size?: number;
  /** Sur fond sombre : wordmark en blanc + tuile blanche à monogramme bleu. */
  onDark?: boolean;
}

/**
 * Logo BâtirNet : monogramme géométrique « construction » (colonnes + poutre)
 * dans une tuile bleue de marque, + wordmark rendu avec la police du site.
 * Vectoriel, net à toutes les tailles, sans dépendance à un fichier image.
 */
export default function Logo({ markOnly = false, className, size = 36, onDark = false }: LogoProps) {
  const tileFill = onDark ? "#ffffff" : "hsl(var(--primary))";
  const strokeColor = onDark ? "hsl(var(--primary))" : "white";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="flex-shrink-0"
      >
        <rect width="44" height="44" rx="11" fill={tileFill} />
        <path
          d="M13 30.5V20C13 19.4477 13.4477 19 14 19H15.8C16.3523 19 16.8 19.4477 16.8 20V30.5"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20.1 30.5V14.5C20.1 13.9477 20.5477 13.5 21.1 13.5H22.9C23.4523 13.5 23.9 13.9477 23.9 14.5V30.5"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M27.2 30.5V22C27.2 21.4477 27.6477 21 28.2 21H30C30.5523 21 31 21.4477 31 22V30.5"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10.5 30.75H33.5" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {!markOnly && (
        <span
          className={cn(
            "font-ui font-semibold tracking-tight text-[1.15rem] leading-none",
            onDark ? "text-white" : "text-foreground"
          )}
        >
          Bâtir<span className={onDark ? "text-white/80" : "text-primary"}>Net</span>
        </span>
      )}
    </span>
  );
}
