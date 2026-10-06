import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date || 'Fecha no válida');
    
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch (e) {
    return String(date || 'Fecha no válida');
  }
}

export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'cerrado':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'en proceso':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'abierto':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getCriticalityColor(level: string) {
  switch (level?.toLowerCase()) {
    case 'crítica':
    case 'critica':
      return 'bg-rose-500';
    case 'moderada':
      return 'bg-amber-500';
    case 'baja':
      return 'bg-emerald-500';
    default:
      return 'bg-slate-400';
  }
}
