import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost";
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
  "transition-[transform,background-color,color,border-color] duration-200 ease-[var(--ease-premium)] " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 aria-busy:pointer-events-none";

const sizes: Record<Size, string> = {
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-7 text-base",
};

const variants: Record<Variant, string> = {
  // Gradiens gomb – hover-re lágy gradiens-glow a gomb mögött
  primary: "bg-brand text-white [text-shadow:0_1px_1px_rgb(0_0_0/0.25)]",
  // Visszafogott, keretes gomb sötét felületen
  secondary:
    "border border-line-strong bg-base-800/60 text-fg hover:border-white/25 hover:bg-base-700",
  // Szöveges gomb (pl. „Bejelentkezés” a navbarban)
  ghost: "text-muted hover:text-fg",
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
          className="pointer-events-none absolute -inset-1 -z-10 rounded-[inherit] bg-brand opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-55 group-focus-visible:opacity-55"
        />
      )}
      {loading && <Spinner />}
      <span>{loading && loadingText ? loadingText : children}</span>
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
