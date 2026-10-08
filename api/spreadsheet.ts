export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido",
    });
  }

  try {
    const apiUrl = process.env.SHEETS_API_URL;
    const apiToken = process.env.SHEETS_API_TOKEN;

    if (!apiUrl) {
      throw new Error(
        "SHEETS_API_URL no está configurada en Vercel."
      );
    }

    if (!apiToken) {
      throw new Error(
        "SHEETS_API_TOKEN no está configurada en Vercel."
      );
    }

    const separator = apiUrl.includes("?") ? "&" : "?";

    const url =
      `${apiUrl}${separator}token=${encodeURIComponent(apiToken)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      redirect: "follow",
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error(
        "Error Apps Script:",
        response.status,
        rawText
      );

      throw new Error(
        `Apps Script respondió HTTP ${response.status}`
      );
    }

    let data: any;

    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(
        "Respuesta no JSON de Apps Script:",
        rawText
      );

      throw new Error(
        "Apps Script no devolvió JSON válido."
      );
    }

    if (!data.success) {
      throw new Error(
        data.error ||
          "Apps Script indicó un error."
      );
    }

    return res.status(200).json({
      success: true,
      total: data.total ?? data.data?.length ?? 0,
      data: Array.isArray(data.data)
        ? data.data
        : [],
    });
  } catch (error: any) {
    console.error(
      "ERROR /api/spreadsheet:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "No fue posible sincronizar Google Sheets.",
    });
  }
}
