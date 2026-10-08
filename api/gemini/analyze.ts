import { GoogleGenAI } from "@google/genai";

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido",
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY no está configurada en Vercel."
      );
    }

    const {
      finding,
      allFindings = [],
    } = req.body || {};

    if (!finding) {
      return res.status(400).json({
        success: false,
        error:
          "Falta el hallazgo para analizar",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const similar =
      Array.isArray(allFindings)
        ? allFindings
            .filter(
              (f: any) =>
                f.id !== finding.id &&
                (
                  f.tipologia === finding.tipologia ||
                  f.proceso === finding.proceso
                )
            )
            .slice(0, 5)
        : [];

    const prompt = `
Eres un auditor experto en Calidad en Salud y
Seguridad del Paciente del Hospital Infantil Los Ángeles.

Analiza exclusivamente la información proporcionada.

HALLAZGO:

ID:
${finding.id}

Descripción:
${finding.descripcion}

Proceso:
${finding.proceso}

Tipología:
${finding.tipologia}

Descripción de tipología:
${finding.desc_tipologia}

Acto inseguro:
${finding.acto_inseguro}

HALLAZGOS RELACIONADOS:

${JSON.stringify(similar)}

Desarrolla el análisis en estas secciones:

### 1. Interpretación del hallazgo

### 2. Posibles factores contribuyentes
Aclara que son hipótesis cuando no exista evidencia directa.

### 3. Recurrencia y patrones
Utiliza únicamente los hallazgos relacionados suministrados.

### 4. Riesgos asociados

### 5. Acciones inmediatas

### 6. Acciones de mejoramiento

### 7. Elementos de verificación para cierre

No inventes fechas, frecuencias, causas ni circunstancias
que no estén disponibles en los datos.
`;

    const response =
      await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

    return res.status(200).json({
      success: true,
      analysis:
        response.text ||
        "No fue posible generar el análisis.",
    });
  } catch (error: any) {
    console.error(
      "ERROR GEMINI ANALYZE:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "No fue posible generar el análisis.",
    });
  }
}
