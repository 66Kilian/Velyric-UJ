import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Nyelv-tudatos navigáció: mindig ezeket használd a next/link és next/navigation helyett
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
