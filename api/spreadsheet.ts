export default async function handler(
  req: any,
  res: any
) {

  // =====================================================
  // SOLO PERMITIR GET
  // =====================================================

  if (req.method !== "GET") {

    return res.status(405).json({
      success: false,
      error: "Método no permitido"
    });

  }


  try {

    // =====================================================
    // VARIABLES DE VERCEL
    // =====================================================

    const apiUrl =
      process.env.SHEETS_API_URL;

    const apiToken =
      process.env.SHEETS_API_TOKEN;


    if (!apiUrl) {

      throw new Error(
        "SHEETS_API_URL no está configurada en Vercel."
      );

    }


    if (!apiToken) {

      throw new Error(
        "SHEETS_API_TOKEN no está configurado en Vercel."
      );

    }


    // =====================================================
    // CONSTRUIR URL
    // =====================================================

    const separator =
      apiUrl.includes("?")
        ? "&"
        : "?";


    const url =
      `${apiUrl}${separator}token=${encodeURIComponent(apiToken)}`;


    // =====================================================
    // CONSULTAR APPS SCRIPT
    // =====================================================

    const response =
      await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });


    if (!response.ok) {

      throw new Error(
        `Google Apps Script respondió con HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    // =====================================================
    // VALIDAR RESPUESTA
    // =====================================================

    if (!data.success) {

      throw new Error(
        data.error ||
        "Google Sheets no devolvió los datos correctamente."
      );

    }


    // =====================================================
    // ENVIAR A LA APLICACIÓN
    // =====================================================

    return res.status(200).json({
      success: true,
      total:
        data.total ||
        data.data?.length ||
        0,

      data:
        data.data ||
        []
    });


  } catch (error: any) {

    console.error(
      "ERROR SINCRONIZACIÓN GOOGLE SHEETS:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        error?.message ||
        "No fue posible sincronizar Google Sheets."

    });

  }

}
