import Image from "next/image";
import { cn } from "@/lib/cn";
import mark from "../../../public/brand/velyric-mark.png";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  /** false esetén csak a V jel látszik (pl. favicon-szerű helyeken) */
  withWordmark?: boolean;
  /** true: a jel azonnal töltődjön (a navbarban, az első képernyőn) */
  eager?: boolean;
  className?: string;
};

const markHeights = { sm: "h-6", md: "h-7", lg: "h-10" } as const;
const wordSizes = { sm: "text-sm", md: "text-ui", lg: "text-xl" } as const;

// Velyric logó: a V jel (public/brand/velyric-mark.png) + „VELYRIC” wordmark szövegként
export function Logo({ size = "md", withWordmark = true, eager, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src={mark}
        alt={withWordmark ? "" : "Velyric"}
        sizes="64px"
        loading={eager ? "eager" : "lazy"}
        className={cn("w-auto", markHeights[size])}
      />
      {withWordmark && (
        <span className={cn("wordmark leading-none text-ink", wordSizes[size])}>Velyric</span>
      )}
    </span>
  );
}
