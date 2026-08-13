import { cn } from "@/lib/utils";

interface LogoProps {
  markOnly?: boolean;
  className?: string;
  size?: number;
  onDark?: boolean;
}

/** Official BâtirNet artwork supplied by the brand owner. */
export default function Logo({ markOnly = false, className, size = 36, onDark = false }: LogoProps) {
  const renderedHeight = markOnly ? size : Math.round(size * 1.15);
  const renderedWidth = Math.round(renderedHeight * 1.73);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xl transition-transform duration-300 hover:-translate-y-0.5",
        onDark && "bg-white px-2.5 py-1.5 shadow-sm",
        className,
      )}
    >
      <img
        src="/logo-batirnet.png"
        alt="BâtirNet"
        width={renderedWidth}
        height={renderedHeight}
        className={cn("block w-auto object-contain", markOnly ? "max-h-[42px]" : "max-h-[52px]")}
        style={{ height: renderedHeight }}
      />
    </span>
  );
}
