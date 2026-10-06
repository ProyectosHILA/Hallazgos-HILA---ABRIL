export type UserRole = 'Admin1' | 'Admin2';

export interface User {
  username: string;
  role: UserRole;
}

export type Criticality = 'Crítica' | 'Moderada' | 'Baja';
export type Status = 'Abierto' | 'En proceso' | 'Cerrado';

export interface Finding {
  id: string;
  fecha: string;
  proceso: string;
  servicio: string;
  tipologia: string;
  tipoHallazgo: string;
  fuente: string;
  descripcion: string;
  causaRaiz: string;
  accion: string;
  consecutivo?: string;
  estadoFinal: Status;
  criticidad: Criticality;
  reincidencia: boolean;
  tiempoACierre?: number; // en días
  calidadAnalisis: 'Alta' | 'Media' | 'Baja';
  palabrasClave: string[];
  faseActual?: string;
  planMejoraPropuesto?: string;
  descripcionTipologia?: string;
}

export interface DashboardStats {
  total: number;
  cerrados: number;
  abiertos: number;
  enProceso: number;
  porcentajeCierre: number;
  criticosAbiertos: number;
}

export type DocumentStatus = 'Activo' | 'Eliminado' | 'Histórico';
export type SourceType = 'ALMERA' | 'ISOTOOLS' | 'GENERIC';

export interface FieldDefinition {
  id: string;
  columnName: string;
  description: string;
}

export interface ManagedDocument {
  id: string;
  name: string;
  uploadDate: string;
  uploadedBy: string;
  recordCount: number;
  status: DocumentStatus;
  sourceType?: SourceType;
  data: Finding[];
}
