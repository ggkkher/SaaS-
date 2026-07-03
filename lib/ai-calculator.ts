import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PositionData {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  hourlyRate?: number;
  hours?: number;
}

interface CompanyConfig {
  hourlyRate: number;
  profitMargin: number;
  materialCost: number;
  fixedCosts: number;
}

export async function suggestPrice(
  position: PositionData,
  config: CompanyConfig
): Promise<{ suggestedPrice: number; reasoning: string }> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk_test')) {
    // Demo mode
    return {
      suggestedPrice: position.quantity * (config.hourlyRate / 10),
      reasoning: 'Demo mode - basierend auf Stundensatz',
    };
  }

  try {
    const prompt = `
Du bist ein Experte für Garten- und Landschaftsbau Preiskalkulationen.
Berechne einen fairen Einheitspreis für diese Position basierend auf:

POSITION:
- Name: ${position.name}
- Beschreibung: ${position.description || 'Keine Details'}
- Menge: ${position.quantity} ${position.unit}
- Stundensatz Firma: € ${config.hourlyRate}

FIRMA KOSTEN:
- Gewinnmarge: ${config.profitMargin}%
- Materialkosten: € ${config.materialCost}
- Fixkosten monatlich: € ${config.fixedCosts}

Antworte im JSON-Format:
{
  "suggestedUnitPrice": <Zahl mit 2 Dezimalstellen>,
  "reasoning": "<Kurze Erklärung (max 100 Zeichen)>"
}

Bedenke:
- Marktpreise für die Region
- Aufwand und Komplexität
- Material und Arbeitszeit
- Gewinnmarge berücksichtigen
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0];
    if (!content.message || content.message.content === null) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response
    const jsonMatch = content.message.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      suggestedPrice: parseFloat(result.suggestedUnitPrice),
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('AI calculation error:', error);
    // Fallback to simple calculation
    return {
      suggestedPrice: position.quantity * (config.hourlyRate / 10),
      reasoning: 'Fallback-Berechnung basierend auf Stundensatz',
    };
  }
}

export async function suggestPositions(
  projectDescription: string,
  config: CompanyConfig
): Promise<
  Array<{
    name: string;
    description: string;
    estimatedQuantity: number;
    unit: string;
    estimatedPrice: number;
  }>
> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk_test')) {
    // Demo mode
    return [];
  }

  try {
    const prompt = `
Du bist ein Experte für Garten- und Landschaftsbau.
Basierend auf dieser Projektbeschreibung, erstelle eine Liste typischer Positionen
die für ein Angebot benötigt werden.

PROJEKTBESCHREIBUNG:
${projectDescription}

STUNDENSATZ: € ${config.hourlyRate}

Antworte mit einem JSON-Array mit max 5 Positionen:
[
  {
    "name": "Positionsname",
    "description": "Kurze Beschreibung",
    "estimatedQuantity": <Menge>,
    "unit": "m²|h|Stück",
    "estimatedPrice": <€ Einheitspreis>
  }
]

Nutze realistische Preise für die Region.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0];
    if (!content.message || content.message.content === null) {
      return [];
    }

    const jsonMatch = content.message.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI position suggestion error:', error);
    return [];
  }
}
