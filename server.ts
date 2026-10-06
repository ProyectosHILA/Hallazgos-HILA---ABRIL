import express from "express";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini client on the server side
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Set high limits for JSON payload to handle base64 images and large datasets
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // GET /api/logo - Retrieve the globally stored logo as base64
  app.get("/api/logo", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "uploaded-logo.txt");
      if (fs.existsSync(filePath)) {
        const logo = fs.readFileSync(filePath, "utf-8");
        return res.json({ logo });
      }
      return res.json({ logo: "" });
    } catch (err: any) {
      console.error("Error reading logo file:", err);
      return res.status(500).json({ error: err.message || "Failed to read logo" });
    }
  });

  // POST /api/logo - Save the uploaded logo base64 on the server
  app.post("/api/logo", (req, res) => {
    try {
      const { logo } = req.body;
      if (!logo && logo !== "") {
        return res.status(400).json({ error: "No logo data received" });
      }
      const filePath = path.join(process.cwd(), "uploaded-logo.txt");
      fs.writeFileSync(filePath, logo, "utf-8");
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Error writing logo file:", err);
      return res.status(500).json({ error: err.message || "Failed to save logo" });
    }
  });

  // GET /api/spreadsheet - Fetch and parse the Google Sheet as Excel
  app.get("/api/spreadsheet", async (req, res) => {
    try {
      const spreadsheetUrl = "https://docs.google.com/spreadsheets/d/121VsVVt0FOZZH2o0ZVl9YIKTkJAefR2OA4ft0M1WwPQ/export?format=xlsx";
      
      const response = await fetch(spreadsheetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch spreadsheet from Google Sheets: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: "array" });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        throw new Error("Worksheet not found in Google Sheets");
      }
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Robust key-matching helper
      const processedRows = jsonData.map((row, idx) => {
        const keys = Object.keys(row);
        
        const findValue = (possibleKeys: string[], excludeSubstrings: string[] = []) => {
          for (const k of keys) {
            const kLow = k.toLowerCase().trim();
            if (excludeSubstrings.some(sub => kLow.includes(sub))) continue;
            if (possibleKeys.some(pk => kLow === pk.toLowerCase().trim() || kLow.includes(pk.toLowerCase().trim()))) {
              return String(row[k] || '').trim();
            }
          }
          return '';
        };

        const getValByIndex = (r: any, index: number) => {
          const rowKeys = Object.keys(r);
          if (index < rowKeys.length) {
            return String(r[rowKeys[index]] || '').trim();
          }
          return '';
        };

        const desc_tipologia = findValue(['descripción de tipología', 'descripcion de tipologia', 'descripción de tipologia', 'desc. de tipología', 'desc. de tipologia', 'desc tipologia', 'descripción de la tipología']);
        const acto_inseguro = findValue(['acto inseguro final relacionado con', 'acto inseguro final', 'acto inseguro', 'acto', 'inseguro']);
        const proceso = findValue(['proceso o área relacionado con el hallazgo', 'proceso o area relacionado con el hallazgo', 'proceso o área relacionado', 'proceso o área', 'proceso o area', 'proceso', 'área', 'area']);
        const descripcion = findValue(['descripción del hallazgo', 'descripcion del hallazgo', 'descripción hallazgo', 'descripcion hallazgo', 'descripción', 'descripcion', 'hallazgo'], ['tipologia', 'tipología', 'proceso', 'acto']);
        const tipologia = findValue(['tipología', 'tipologia'], ['descripción', 'descripcion', 'desc']);

        return {
          id: idx + 1,
          descripcion: descripcion || getValByIndex(row, 0),
          proceso: proceso || getValByIndex(row, 1),
          tipologia: tipologia || getValByIndex(row, 2),
          desc_tipologia: desc_tipologia || getValByIndex(row, 3),
          acto_inseguro: acto_inseguro || getValByIndex(row, 4)
        };
      });

      return res.json({ success: true, data: processedRows });
    } catch (err: any) {
      console.error("Error fetching or parsing spreadsheet:", err);
      return res.status(500).json({ error: err.message || "Failed to parse Google Sheet" });
    }
  });

  // POST /api/gemini/analyze - Detailed auditor analysis of a selected finding
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { finding, allFindings } = req.body;
      if (!finding) {
        return res.status(400).json({ error: "Falta el hallazgo para analizar" });
      }

      // Find similar findings based on same process or typology
      const similar = (allFindings || [])
        .filter((f: any) => f.id !== finding.id && (f.tipologia === finding.tipologia || f.proceso === finding.proceso))
        .slice(0, 5);

      const prompt = `
Eres un analista de auditoría de hallazgos y experto en Calidad en Salud y Seguridad del Paciente del Hospital Infantil Los Ángeles (HILA).
Tu misión es analizar de forma rigurosa, profesional y como auditor experto el siguiente hallazgo seleccionado de la base de datos institucional.

LIMITACIÓN CRÍTICA: Debes limitarte ESTRICTAMENTE a la información provista. No inventes datos ficticios ni alucines hechos no descritos. Tu análisis debe ser objetivo, técnico y con visión de mejora continua y acreditación en salud.

HALLAZGO SELECCIONADO:
- ID: ${finding.id}
- Descripción del Hallazgo: ${finding.descripcion}
- Proceso o Área Relacionada: ${finding.proceso}
- Tipología: ${finding.tipologia}
- Descripción de Tipología: ${finding.desc_tipologia}
- Acto Inseguro Relacionado: ${finding.acto_inseguro}

HALLAZGOS SIMILARES ENCONTRADOS (Contexto de recurrencia en el hospital):
${similar.length > 0 ? similar.map((s: any) => `- ID ${s.id}: [Proceso: ${s.proceso}] [Tipología: ${s.tipologia}] - ${s.descripcion}`).join('\n') : 'No se encontraron hallazgos similares directos en la muestra actual.'}

Por favor, genera un análisis detallado estructurado exactamente en las siguientes secciones (devuelve texto con formato Markdown limpio):

### 1. ¿Por qué sucede? (Análisis de Causa Raíz)
Realiza un análisis detallado de la causa raíz de este hallazgo específico basándote en la relación entre la descripción del hallazgo, el área de proceso involucrada, la tipología asignada y el acto inseguro reportado. Explica la brecha operativa, de protocolo o conductual.

### 2. Análisis Temporal y Factores de Frecuencia
Analiza la temporalidad, la frecuencia típica y los factores situacionales (como picos de demanda pediátrica, turnos nocturnos, fatiga del personal, transición de guardia o alta rotación) que suelen asociarse con este tipo de incidentes en un entorno hospitalario pediátrico de alta complejidad.

### 3. Correlación y Patrones Sistémicos (Hallazgos Similares)
Determina si este hallazgo representa un evento aislado o si existe un patrón sistémico o de recurrencia con base en los hallazgos similares provistos. Si no hay similares, analiza el riesgo de que se convierta en un patrón sistémico recurrente si no se mitiga a tiempo.

### 4. Recomendaciones de Gestión y Prevención de Recurrencia
Proporciona recomendaciones de auditoría y gestión concretas, realistas y alineadas con los estándares de acreditación en salud para evitar que este evento vuelva a suceder. Divide las propuestas en:
- **Acciones inmediatas de mitigación (Barreras de seguridad)**: Acciones reactivas o controles que se deben poner ya mismo.
- **Acciones de mediano y largo plazo**: Ajustes a procesos, capacitación al personal clínico/administrativo, o incorporación de tecnología.
`.trim();

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return res.json({ success: true, analysis: response.text || "No se pudo generar el análisis." });
    } catch (err: any) {
      console.error("Error in Gemini analysis endpoint:", err);
      return res.status(500).json({ error: err.message || "Failed to generate AI analysis" });
    }
  });

  // POST /api/gemini/chat - Chatbot to discuss findings with customizable filters and chips
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history, level, allFindings } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Falta el mensaje de usuario" });
      }

      // Take first 80 rows to provide rich but cost-effective sample context of the sheet
      const contextSample = (allFindings || []).slice(0, 80);
      const summaryStats = {
        total: (allFindings || []).length,
        procesos: [...new Set((allFindings || []).map((f: any) => f.proceso).filter(Boolean))].slice(0, 15),
        tipologias: [...new Set((allFindings || []).map((f: any) => f.tipologia).filter(Boolean))].slice(0, 15),
      };

      // Set target length and detail instructions
      let detailInstructions = "";
      if (level === 'short') {
        detailInstructions = "Sé sumamente conciso, directo al grano y muy breve (máximo 1 o 2 párrafos cortos). Usa viñetas breves.";
      } else if (level === 'medium') {
        detailInstructions = "Proporciona una respuesta de longitud moderada, balanceada y bien estructurada (3 o 4 párrafos o viñetas detalladas).";
      } else {
        detailInstructions = "Proporciona una respuesta a detalle, profunda, exhaustiva y muy analítica. Utiliza secciones claras, análisis de riesgos y explicaciones completas.";
      }

      const systemInstruction = `
Eres el Asistente de Inteligencia de Hallazgos "Abril" del Hospital Infantil Los Ángeles (HILA).
Tu rol es actuar como un auditor senior y analista experto en Calidad de Salud y Seguridad del Paciente Pediátrico.

LIMITACIONES CRÍTICAS DE RESPUESTA:
- Concéntrate exclusivamente en el análisis de hallazgos de seguridad, procesos hospitalarios, tipologías y actos inseguros basados en la tabla proporcionada.
- Basa tus respuestas ESTRICTAMENTE en los datos de la tabla de hallazgos de auditoría provista. No inventes datos ficticios, ni alucines información no sustentada.
- Si la información solicitada no está en los datos provistos o no se puede deducir lógicamente de ellos, indícalo con franqueza y profesionalismo.

CONTEXTO INSTITUCIONAL ACTUAL (Estadísticas generales):
- Total de Hallazgos Cargados en la Base: ${summaryStats.total}
- Muestra de Áreas/Procesos Registrados: ${summaryStats.procesos.join(', ')}
- Muestra de Tipologías Identificadas: ${summaryStats.tipologias.join(', ')}

MUESTRA REAL DE DATOS DE HALLAZGOS (Primeras 80 filas para responder con propiedad):
${JSON.stringify(contextSample)}

INSTRUCCIÓN DE DETALLE DE RESPUESTA SOLICITADA POR EL USUARIO:
${detailInstructions}

Manten un tono profesional, empático con el personal de salud, constructivo y enfocado en la mejora continua, la reducción de eventos adversos, y la seguridad de los niños hospitalizados.
`.trim();

      // Convert history format to Google GenAI content format
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const h of history) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      return res.json({ success: true, text: response.text || "No se pudo generar una respuesta." });
    } catch (err: any) {
      console.error("Error in Gemini chat endpoint:", err);
      return res.status(500).json({ error: err.message || "Failed to chat with AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
