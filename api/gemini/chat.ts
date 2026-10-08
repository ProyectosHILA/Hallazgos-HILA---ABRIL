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
      message,
      history = [],
      level = "medium",
      allFindings = [],
    } = req.body || {};

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Falta el mensaje de usuario",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const contextSample =
      Array.isArray(allFindings)
        ? allFindings.slice(0, 80)
        : [];

    const summaryStats = {
      total: Array.isArray(allFindings)
        ? allFindings.length
        : 0,

      procesos: [
        ...new Set(
          contextSample
            .map((f: any) => f.proceso)
            .filter(Boolean)
        ),
      ].slice(0, 15),

      tipologias: [
        ...new Set(
          contextSample
            .map((f: any) => f.tipologia)
            .filter(Boolean)
        ),
      ].slice(0, 15),
    };

    let detailInstructions = "";

    if (level === "short") {
      detailInstructions =
        "Responde de manera breve y directa.";
    } else if (level === "detailed") {
      detailInstructions =
        "Responde con análisis amplio, estructurado y detallado.";
    } else {
      detailInstructions =
        "Responde con nivel de detalle moderado y estructura clara.";
    }

    const systemInstruction = `
Eres el Asistente de Inteligencia de Hallazgos "Abril"
del Hospital Infantil Los Ángeles.

Actúas como auditor y analista experto en calidad,
seguridad del paciente pediátrico y mejoramiento continuo.

REGLAS:

- Basa tus respuestas exclusivamente en los datos proporcionados.
- No inventes cifras, hechos ni eventos.
- Si no hay información suficiente, indícalo claramente.
- Utiliza lenguaje profesional e institucional.

ESTADÍSTICAS:

Total de hallazgos: ${summaryStats.total}

Procesos:
${summaryStats.procesos.join(", ")}

Tipologías:
${summaryStats.tipologias.join(", ")}

MUESTRA DE DATOS:

${JSON.stringify(contextSample)}

NIVEL DE DETALLE:

${detailInstructions}
`;

    const contents: any[] = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-10)) {
        contents.push({
          role:
            item.role === "user"
              ? "user"
              : "model",

          parts: [
            {
              text: String(item.text || ""),
            },
          ],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [
        {
          text: message,
        },
      ],
    });

    const response =
      await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
        },
      });

    return res.status(200).json({
      success: true,
      text:
        response.text ||
        "No fue posible generar una respuesta.",
    });
  } catch (error: any) {
    console.error(
      "ERROR GEMINI CHAT:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "No fue posible comunicarse con Gemini.",
    });
  }
}
