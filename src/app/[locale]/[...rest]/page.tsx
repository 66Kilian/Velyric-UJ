import { notFound } from "next/navigation";

// Minden ismeretlen útvonal → valódi 404 (a lokalizált not-found oldallal)
export default function CatchAll() {
  notFound();
}
