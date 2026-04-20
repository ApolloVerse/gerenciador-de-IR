const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBvwz2ptqo1k9R5hVW0MpGHSOmEe_sZvD0";

export async function parseFinancialPDF(base64Data: string, fileName: string) {
  // Chamada direta via FETCH para a API estável v1, ignorando bugs de versão do SDK
  const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `
    Aja como um especialista em Imposto de Renda do Brasil. 
    Analise o arquivo PDF anexo ("${fileName}") e extraia os dados financeiros.
    
    Responda APENAS com um objeto JSON válido seguindo este formato:
    {
      "institution": "Nome do Banco",
      "documentType": "INFORME_RENDIMENTOS | NOTA_CORRETAGEM | DECLARACAO_IR",
      "year": 2024,
      "positions": [{ "ticker": "ITEM", "name": "NOME", "quantity": 0, "averagePrice": 0, "type": "ACAO|FII|ETF|CRIPTO|OUTRO", "cnpj": "00.000.000/0000-00", "irpfGroup": "03", "irpfCode": "31", "irpfDescription": "DESC" }],
      "transactions": [],
      "rendimentosIsentos": [],
      "rendimentosExclusivos": []
    }
  `;

  try {
    console.log(`Iniciando análise direta (v1/fetch): ${fileName}`);

    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro na API Gemini:", errorData);
      throw new Error(errorData.error?.message || `Erro na API (${response.status})`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("A IA não retornou dados para este arquivo.");
    }

    // Limpeza de blocos de código markdown se existirem
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;

    return JSON.parse(jsonString);
    
  } catch (error: any) {
    console.error("Falha Crítica na Consultoria IA:", error);
    throw new Error(`Falha na Análise: ${error.message || "Conexão interrompida"}`);
  }
}
