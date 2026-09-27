import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** A töltés alatt megjelenő szöveg (ha nincs megadva, a gomb szövege marad) */
  loadingText?: ReactNode;
  className?: string;
  children: ReactNode;
};

type AsButton = BaseProps &
  Omit<ComponentProps<"button">, keyof BaseProps> & { href?: undefined };
type AsLink = BaseProps &
  Omit<ComponentProps<typeof Link>, keyof BaseProps>;

export type ButtonProps = AsButton | AsLink;

// Alapstílus: min. 48px magas (mobil érintési cél), lekerekített, gyors visszajelzés
const base =
  "group relative isolate inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold " +
  "transition-[transform,background-color,color,border-color] duration-150 ease-out active:scale-[0.98] active:duration-75 " +
  "disabled:pointer-events-none disabled:opacity-60 aria-busy:pointer-events-none";

const sizes: Record<Size, string> = {
  md: "h-12 px-5 text-ui",
  lg: "h-14 px-7 text-base",
};

const variants: Record<Variant, string> = {
  // Gradiens gomb – hover-re lágy gradiens-glow a gomb mögött
  primary: "bg-cta text-white",
  // Visszafogott, keretes gomb sötét felületen
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-ink/25 hover:bg-raised",
  // Fordított gomb színes felületen (pl. a záró CTA panelen)
  inverse: "bg-white text-on-light hover:bg-white/90",
  // Szöveges gomb (pl. „Bejelentkezés” a navbarban)
  ghost: "text-muted hover:text-ink",
};

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    loadingText,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(base, sizes[size], variants[variant], className);

  const content = (
    <>
      {variant === "primary" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-1 -z-10 rounded-[inherit] bg-brand opacity-0 blur-lg transition-opacity duration-200 group-hover:opacity-40"
        />
      )}
      {loading && <Spinner />}
      <span className="inline-flex items-center gap-2">{loading && loadingText ? loadingText : children}</span>
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link className={classes} aria-busy={loading || undefined} {...(rest as Omit<AsLink, keyof BaseProps>)}>
        {content}
      </Link>
    );
  }

  const { type = "button", disabled, ...buttonRest } = rest as Omit<AsButton, keyof BaseProps>;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...buttonRest}
    >
      {content}
    </button>
  );
}
