import type { ReactNode } from "react";
import Image from "next/image";
import mark from "../../../public/brand/velyric-mark.png";

type AuthCardProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

// Központi kártya: fent a V jel, gradiens keret-glow, sötét felület
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="relative w-full max-w-[440px]">
      {/* Lágy márka-glow a kártya mögött */}
      <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[40px] bg-brand opacity-[0.14] blur-3xl" />
      <div className="rounded-[22px] bg-[linear-gradient(135deg,rgb(139_47_232/0.55),rgb(229_35_126/0.25)_45%,rgb(255_122_60/0.45))] p-px shadow-card">
        <div className="rounded-[21px] bg-base-800 px-6 py-8 sm:px-9 sm:py-10">
          <div className="flex flex-col items-center text-center">
            <Image src={mark} alt="Velyric" sizes="56px" className="h-10 w-auto" preload />
            <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h1>
            {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}
