import * as XLSX from 'xlsx';
import { Finding, Criticality, Status } from '../types';

const CRITICAL_KEYWORDS = [
  'gases medicinales', 'quirófano', 'quirofano', 'ucip', 'uci p', 'medicamentos', 
  'infraestructura crítica', 'seguridad del paciente', 'paro', 'reanimación',
  'error de medicación', 'caída', 'infección', 'oxígeno', 'ventilador', 'oxigeno'
];

export const processExcelFile = async (file: File, sourceType: 'ALMERA' | 'ISOTOOLS' | 'GENERIC' = 'GENERIC'): Promise<Finding[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) throw new Error("No se pudo leer el archivo");
        
        const data = new Uint8Array(result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("El archivo Excel no tiene hojas");
        }

        const sheetName = workbook.SheetNames.find(n => n.toUpperCase() === 'REVISADO') || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) throw new Error("No se encontró la hoja de datos");

        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        if (!jsonData || jsonData.length === 0) {
          resolve([]);
          return;
        }

        const processedData: Finding[] = jsonData.map((row, index) => {
          if (!row) return null;

          // Helper to find value by possible keys (case-insensitive and partial)
          const getVal = (r: any, ...keys: string[]) => {
            const rowKeys = Object.keys(r);
            // First try exact match (case insensitive)
            for (const key of keys) {
              const foundKey = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
              if (foundKey) return r[foundKey];
            }
            // If not found, try partial match (column contains both "Descripción" and "Tipología")
            const fallbackKey = rowKeys.find(k => k.toLowerCase().includes('descrip') && k.toLowerCase().includes('tipolo'));
            if (fallbackKey) return r[fallbackKey];
            
            return '';
          };

          let descripcion = '';
          let proceso = '';
          let servicio = '';
          let tipologia = '';
          let tipoHallazgo = '';
          let fuente = '';
          let causaRaiz = '';
          let accion = '';
          let descripcionTipologia = '';
          let prioridadRaw = '';
          let faseActual = '';
          let gestionRaw = '';
          let fechaReporte: any = null;

          if (sourceType === 'ISOTOOLS') {
            descripcion = String(getVal(row, 'Descripción del hallazgo', 'Descripcion del hallazgo', 'Hallazgo')).trim();
            servicio = normalizeText(String(getVal(row, 'proceso o area relacionado con el hallazgo', 'Servicio Relacionado', 'Area Relacionada') || 'General'));
            proceso = normalizeText(String(getVal(row, 'Servicio', 'Proceso', 'Unidad') || 'Calidad'));
            tipologia = normalizeText(String(getVal(row, 'Tipologia', 'Tipo de Incidencia') || 'Operativo'));
            tipoHallazgo = normalizeText(String(getVal(row, 'Tipo de hallazgo', 'Categoría') || 'Mejora'));
            fuente = 'ISOTOOLS';
            causaRaiz = String(getVal(row, 'Causa Raiz', 'Análisis Causal') || 'Análisis pendiente');
            descripcionTipologia = String(getVal(row, 'Descripción de la tipologia', 'Descripcion de la tipologia', 'Descripción Tipología') || '').trim();
            accion = String(getVal(row, 'plan de mejora propuesto', 'Acción Propuesta') || 'Acción por definir');
            faseActual = String(getVal(row, 'Fase actual', 'Estado Actual') || '');
            gestionRaw = String(getVal(row, 'Gestión', 'Gestion') || '');
            fechaReporte = getVal(row, 'Fecha de Reporte', 'Fecha Reporte', 'Fecha');
          } else if (sourceType === 'ALMERA') {
            descripcion = String(getVal(row, 'Descripción del hallazgo', 'Descripción Hallazgo')).trim();
            servicio = normalizeText(String(getVal(row, 'Proceso o área relacionado con el hallazgo', 'Proceso Relacionado') || 'General'));
            proceso = normalizeText(String(getVal(row, 'Proceso o área que reporta', 'Proceso Reporta') || 'Calidad'));
            tipologia = normalizeText(String(getVal(row, 'Tipología', 'Tipologia') || 'Operativo'));
            tipoHallazgo = normalizeText(String(getVal(row, 'Descripción de tipología', 'Descripción Tipología', 'Descripcion Tipologia') || 'Mejora'));
            fuente = 'ALMERA';
            causaRaiz = String(getVal(row, 'Seleccione la técnica de análisis correspondient', 'Causa Raíz') || 'Análisis pendiente');
            descripcionTipologia = String(getVal(row, 'Descripción de tipología', 'Descripcion de tipologia', 'Descripción de la tipologia') || '').trim();
            accion = String(getVal(row, 'Resultado para \nel paciente', 'Impacto', 'Accion') || 'Acción por definir');
            prioridadRaw = String(getVal(row, 'Prioridad de ejecución', 'Prioridad') || '');
            gestionRaw = String(getVal(row, 'Gestion ', 'Gestión') || '');
            faseActual = String(getVal(row, 'Estado', 'Fase Actual') || '');
            fechaReporte = getVal(row, 'Fecha reporte', 'Fecha de reporte', 'Fecha');
          } else {
            descripcion = String(row['Descripción del hallazgo'] || row.Descripcion || row.Hallazgo || '').trim();
            proceso = normalizeText(String(row['Proceso o area relacionado con el hallazgo'] || row.Proceso || 'Calidad'));
            servicio = normalizeText(String(row['Proceso o servicio que reporta'] || row.Servicio || 'General'));
            tipologia = normalizeText(String(row.Tipologia || 'Operativo'));
            tipoHallazgo = normalizeText(String(row['Tipo de hallazgo'] || row.Tipo || 'Mejora'));
            fuente = normalizeText(String(row.Fuente || 'Auditoría'));
            causaRaiz = String(row['Causa Raiz'] || row.Causa || 'Análisis pendiente');
            descripcionTipologia = String(getVal(row, 'Descripción de la tipologia', 'Descripcion de la tipologia', 'Descripción de tipología', 'Descripcion de tipologia', 'Tipología Descripción', 'Tipologia Descripcion') || '').trim();
            accion = String(row.Accion || row['Acción'] || 'Acción por definir');
            prioridadRaw = String(row['Prioridad de Ejecución'] || row.Prioridad || '');
            faseActual = String(row['Fase actual'] || row.Estado || '');
            fechaReporte = row['Fecha de Reporte'];
          }

          const consecutivo = String(row.Consecutivo || row['Código'] || `H-${Date.now()}-${index}`);

          // Lógica de estado final
          let estadoFinal: Status = 'Abierto';
          const statusText = (gestionRaw + ' ' + faseActual).toLowerCase();
          if (statusText.includes('gestionado') || statusText.includes('cerrado') || statusText.includes('completada')) {
            estadoFinal = 'Cerrado';
          } else if (statusText.includes('en proceso') || statusText.includes('seguimiento')) {
            estadoFinal = 'En proceso';
          } else if (statusText.includes('pendiente') || statusText.includes('abierto')) {
            estadoFinal = 'Abierto';
          }

          // Lógica de criticidad
          let criticidad: Criticality = 'Baja';
          const descLower = descripcion.toLowerCase();
          const priorityLower = prioridadRaw.toLowerCase();
          
          if (CRITICAL_KEYWORDS.some(k => descLower.includes(k)) || priorityLower.includes('alta') || priorityLower.includes('crítica')) {
            criticidad = 'Crítica';
          } else if (
            priorityLower.includes('media') || 
            ['riesgo', 'incumple', 'falla', 'incidente'].some(k => descLower.includes(k))
          ) {
            criticidad = 'Moderada';
          }

          // Formateo de fecha seguro
          let finalDate = new Date().toISOString();
          if (fechaReporte) {
            if (fechaReporte instanceof Date) {
              finalDate = fechaReporte.toISOString();
            } else if (typeof fechaReporte === 'number') {
              finalDate = XLSX.SSF.format('yyyy-mm-dd', fechaReporte);
            } else {
              finalDate = String(fechaReporte);
            }
          }

          return {
            id: consecutivo,
            fecha: finalDate,
            proceso: proceso,
            servicio: servicio,
            tipologia: tipologia,
            tipoHallazgo: tipoHallazgo,
            fuente: fuente,
            descripcion: descripcion,
            causaRaiz: causaRaiz,
            accion: accion,
            consecutivo: consecutivo,
            estadoFinal: estadoFinal,
            criticidad: criticidad,
            reincidencia: !!row.Reincidencia,
            tiempoACierre: row.DiasCierre || undefined,
            calidadAnalisis: (row.Calidad || 'Media') as 'Alta' | 'Media' | 'Baja',
            palabrasClave: extractKeywords(descripcion),
            faseActual: faseActual,
            planMejoraPropuesto: String(row['plan de mejora propuesto'] || row['Plan de mejora propuesto'] || '').trim(),
            descripcionTipologia: descripcionTipologia || String(row['Descripción de tipología'] || row['Descripcion de tipologia'] || row['Descripción de la tipologia'] || '').trim()
          };
        }).filter(f => f !== null) as Finding[];

        resolve(processedData);
      } catch (err) {
        console.error("Error en processExcelFile:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => {
      console.error("Error de lectura de archivo:", err);
      reject(err);
    };
    reader.readAsArrayBuffer(file);
  });
};

function normalizeText(text: string): string {
  if (!text || text === 'undefined') return 'No Definido';
  return text.trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractKeywords(text: string): string[] {
  const commonWords = ['el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'de', 'en', 'con', 'por', 'para', 'que', 'del'];
  return text.toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .split(' ')
    .filter(word => word.length > 4 && !commonWords.includes(word))
    .slice(0, 5);
}

export const generateMockFindings = (): Finding[] => {
  const services = ['UCI Pediátrica', 'Urgencias', 'Quirófano', 'Hospitalización 3er Piso', 'Farmacia Central', 'Gases Medicinales', 'Laboratorio Clínico'];
  const processes = ['Gestión Clínica', 'Seguridad del Paciente', 'Apoyo Diagnóstico', 'Gestión Administrativa'];
  const types = ['Seguridad del Paciente', 'Infraestructura', 'Gestión de Medicamentos', 'Procesos Asistenciales', 'Humanización'];
  const descriptions = [
    'Falta de rotulación en bomba de infusión en cubículo 4.',
    'Baja presión detectada en toma de oxígeno de sala 2.',
    'No se evidencia registro de limpieza en área de preparación.',
    'Demora en entrega de medicamentos de control especial.',
    'Personal no porta carnet de identificación visible.',
    'Falla en el sistema de llamado de enfermería habitación 302.',
    'Inconsistencia en el conteo de instrumental quirúrgico.',
    'Adherencia parcial al protocolo de lavado de manos.'
  ];
  
  return Array.from({ length: 40 }).map((_, i) => {
    const status: Status[] = ['Abierto', 'En proceso', 'Cerrado'];
    const s = status[Math.floor(Math.random() * status.length)];
    const desc = descriptions[i % descriptions.length];
    
    let criticidad: Criticality = 'Baja';
    if (CRITICAL_KEYWORDS.some(k => desc.toLowerCase().includes(k))) criticidad = 'Crítica';
    else if (Math.random() > 0.6) criticidad = 'Moderada';
    
    return {
      id: `MOCK-${i}`,
      fecha: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString(),
      proceso: processes[Math.floor(Math.random() * processes.length)],
      servicio: services[Math.floor(Math.random() * services.length)],
      tipologia: types[Math.floor(Math.random() * types.length)],
      tipoHallazgo: 'Oportunidad de Mejora',
      fuente: 'Ronda de Seguridad',
      descripcion: desc,
      causaRaiz: 'Falta de supervisión directa y adherencia a protocolos.',
      accion: 'Refuerzo de capacitación y auditoría de cumplimiento semanal.',
      consecutivo: `MOCK-${i}`,
      estadoFinal: s,
      criticidad: criticidad,
      reincidencia: Math.random() > 0.85,
      tiempoACierre: s === 'Cerrado' ? Math.floor(Math.random() * 20) : undefined,
      calidadAnalisis: Math.random() > 0.5 ? 'Alta' : 'Media',
      palabrasClave: extractKeywords(desc)
    };
  });
};
