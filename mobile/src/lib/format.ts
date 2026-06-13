import type { BusinessType } from "../api/types";

export function formatPrice(value: number): string {
  if (value === 0) return "Gratuit";
  return `${value % 1 === 0 ? value : value.toFixed(2)} €`;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function formatDistance(km?: number | null): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

const DAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

// "lun. 15 juin · 09:00"
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${formatTime(iso)}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// "lun. 15 juin"
export function formatDay(d: Date): string {
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function businessTypeLabel(type: BusinessType): string {
  switch (type) {
    case "SERVICE":
      return "Prestations sur RDV";
    case "PRODUCT":
      return "Boutique";
    case "BOTH":
      return "RDV & Boutique";
  }
}
