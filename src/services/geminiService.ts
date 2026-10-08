// src/services/geminiService.ts
import { GoogleGenAI } from "@google/genai";
import { Finding } from "../types";

/**
 * AI Studio + Vite pueden inyectar secretos de distintas formas.
 * Este selector no rompe tu app y aumenta compatibilidad:
 * - import.meta.env.GEMINI_API_KEY (AI Studio / algunos setups)
 * - import.meta.env.VITE_GEMINI_API_KEY (Vite clásico)
 * - process.env.GEMINI_API_KEY (Node / algunos runtimes)
 */
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY no está configurada en el servidor.");
}

const ai = new GoogleGenAI({
  apiKey
});

function buildStats(findings: Finding[]) {
  return {
    total: findings.length,
    abiertos: findings.filter((f) => f.estadoFinal === "Abierto").length,
    enProceso: findings.filter((f) => f.estadoFinal === "En proceso").length,
    cerrados: findings.filter((f) => f.estadoFinal === "Cerrado").length,
    criticos: findings.filter((f) => f.criticidad === "Crítica").length,
    criticosAbiertos: findings.filter(
      (f) => f.criticidad === "Crítica" && f.estadoFinal === "Abierto"
    ).length,
    servicios: [...new Set(findings.map((f) => f.servicio).filter(Boolean))].length,
  };
}

/**
 * En Big Data no es viable pasar TODO el dataset al prompt.
 * Enviamos: estadísticas + muestra + top críticos para mantener contexto y rendimiento.
 */
function buildContext(findings: Finding[]) {
  const stats = buildStats(findings);
  const sample = findings.slice(0, 120);
  const criticosSample = findings
    .filter((f) => f.criticidad === "Crítica")
    .slice(0, 20);

  return { stats, sample, criticosSample };
}

export const analyzeFindings = async (findings: Finding[], prompt: string, analysisInstructions?: string, fieldDefinitions?: any[]) => {
  const { stats, sample, criticosSample } = buildContext(findings);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
Eres un experto en Calidad en Salud y Seguridad del Paciente del Hospital Infantil Los Ángeles (HILA), con enfoque pediátrico.
Tu tarea: analizar los hallazgos cargados institucionalmente y responder a la solicitud del usuario.

Instrucciones institucionales adicionales:
${analysisInstructions || "Analiza con enfoque hospitalario pediátrico, seguridad del paciente, riesgos, recurrencia, causa raíz e intervención"}

Definiciones de campos/columnas (contexto del usuario):
${JSON.stringify(fieldDefinitions || [])}

Solicitud del usuario:
${prompt}

Contexto cuantitativo (estadísticas del dataset completo):
${JSON.stringify(stats)}

Muestra representativa de hallazgos (para análisis cualitativo):
${JSON.stringify(sample)}

Muestra de hallazgos críticos:
${JSON.stringify(criticosSample)}

Reglas:
- Responde SOLO con base en los datos proporcionados.
- Si algo no está en los datos, indícalo con claridad.
- Mantén un tono profesional, institucional, orientado a mejora continua y seguridad del paciente pediátrico.
`.trim()
  });

  return response.text || "No se pudo generar el análisis.";
};

export const getExecutiveSummary = async (findings: Finding[], analysisInstructions?: string, fieldDefinitions?: any[]) => {
  const stats = buildStats(findings);

  const topCriticos = findings
    .filter((f) => f.criticidad === "Crítica")
    .slice(0, 15);

  const topServicios = [...new Set(findings.map((f) => f.servicio))]
    .filter(Boolean)
    .slice(0, 30);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
Genera un Resumen Ejecutivo Institucional para el Hospital Infantil Los Ángeles (HILA), basado exclusivamente en los datos proporcionados.

Instrucciones institucionales adicionales:
${analysisInstructions || "Analiza con enfoque hospitalario pediátrico, seguridad del paciente, riesgos, recurrencia, causa raíz e intervención"}

Definiciones de campos/columnas (contexto del usuario):
${JSON.stringify(fieldDefinitions || [])}

Estadísticas del dataset completo:
${JSON.stringify(stats)}

Servicios detectados (muestra):
${JSON.stringify(topServicios)}

Muestra de hallazgos críticos:
${JSON.stringify(topCriticos)}

El informe debe incluir:
1. Resumen ejecutivo institucional (hallazgos principales).
2. Top riesgos institucionales (priorizar seguridad del paciente pediátrico).
3. Servicios más comprometidos (por recurrencia/criticidad).
4. Hallazgos críticos abiertos y por qué son críticos (con criterios basados en los datos).
5. Recomendaciones a 30-60-90 días (acciones inmediatas vs estructurales).
6. Proyección cualitativa de impacto (seguridad del paciente, continuidad operativa, cumplimiento).

Reglas:
- No inventes datos.
- Si faltan campos para cuantificar algo, dilo y ofrece alternativas.
- Usa tono profesional, acreditado en salud, humano y constructivo.
`.trim()
  });

  return response.text || "No se pudo generar el resumen ejecutivo.";
};

export const chatWithData = async (
  findings: Finding[],
  message: string,
  history: { role: string; text: string }[],
  analysisInstructions?: string,
  fieldDefinitions?: any[]
) => {
  const { stats, sample, criticosSample } = buildContext(findings);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: message }]
      }
    ],
    config: {
      systemInstruction: `
Eres el Asistente Inteligente de HALLAZGOS HILA.
Tu objetivo es ayudar al personal del Hospital Infantil Los Ángeles (HILA) a analizar hallazgos de calidad y seguridad del paciente pediátrico.

Instrucciones institucionales adicionales:
${analysisInstructions || "Analiza con enfoque hospitalario pediátrico, seguridad del paciente, riesgos, recurrencia, causa raíz e intervención"}

Definiciones de campos/columnas (contexto del usuario):
${JSON.stringify(fieldDefinitions || [])}

REGLA FUNDAMENTAL:
- SOLO puedes responder basándote en los datos proporcionados.
- Si no está en los datos, dilo honestamente.

Contexto cuantitativo (dataset completo):
${JSON.stringify(stats)}

Muestra de datos (para responder preguntas cualitativas):
${JSON.stringify(sample)}

Muestra de críticos:
${JSON.stringify(criticosSample)}

Estilo:
- Lenguaje profesional, institucional, orientado a mejora.
- Sé preciso con críticos/abiertos/cerrados.
- Si el usuario pide “top”, devuelve lista con conteos cuando sea posible.
`.trim()
    }
  });

  return response.text || "No se pudo generar una respuesta.";
};

export const getFindingAdvice = async (
  finding: Finding,
  analysisInstructions: string,
  fieldDefinitions: any[]
) => {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `
Eres un experto en Calidad en Salud y Seguridad del Paciente del Hospital Infantil Los Ángeles (HILA).
Tu tarea es proporcionar un consejo estratégico para gestionar el siguiente hallazgo.

Instrucciones institucionales:
${analysisInstructions}

Definiciones de campos/columnas proporcionadas por el usuario:
${JSON.stringify(fieldDefinitions)}

Hallazgo a analizar:
${JSON.stringify(finding)}

Por favor, proporciona un consejo breve, estratégico y accionable para este hallazgo específico, considerando el contexto pediátrico y de seguridad del paciente.
`.trim()
  });

  return response.text || "No se pudo generar el consejo estratégico.";
};

export const getServiceGroupAnalyses = async (
  serviceName: string,
  groups: { description: string; count: number; firstFinding: Finding }[],
  analysisInstructions: string,
  fieldDefinitions: any[]
) => {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `
Eres un experto en Calidad en Salud y Seguridad del Paciente del Hospital Infantil Los Ángeles (HILA).
Analiza los siguientes grupos de hallazgos recurrentes para el servicio de "${serviceName}".

Instrucciones institucionales:
${analysisInstructions}

Grupos de hallazgos:
${JSON.stringify(groups.map(g => ({
  descripcion: g.description,
  recurrencia: g.count,
  tipologia: g.firstFinding.tipologia,
  criticidad: g.firstFinding.criticidad,
  proceso: g.firstFinding.proceso
})))}

Para cada grupo, proporciona un análisis estratégico breve (máximo 3 líneas) que sea congruente con el tipo de hallazgo y su impacto en la seguridad del paciente pediátrico. Cada análisis debe ser único, profesional y analítico.

Responde estrictamente en formato JSON con la siguiente estructura:
{
  "analisis": [
    { "descripcion": "...", "texto": "..." },
    ...
  ]
}
`.trim()
  });

  try {
    const text = response.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { analisis: [] };
  } catch (e) {
    console.error("Error parsing AI response:", e);
    return { analisis: [] };
  }
};
