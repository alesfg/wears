import { CATEGORIES } from "@/constants/config";

type Category = (typeof CATEGORIES)[number];

export interface GarmentAnalysis {
  name: string;
  brand: string | null;
  category: Category | null;
  color: string | null;
}

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? "";

const PROMPT = `You are analyzing a clothing item photo for a wardrobe tracking app.
Return ONLY a valid JSON object — no explanation, no markdown, just JSON.

{
  "name": "short descriptive name (e.g. 'Black Wool Blazer', 'Floral Midi Dress', 'White Sneakers')",
  "brand": "brand name if clearly visible on label, tag, or logo — otherwise null",
  "category": one of exactly: "outerwear"|"knitwear"|"denim"|"tops"|"dresses"|"skirts"|"pants"|"shoes"|"bags"|"accessories" — pick the closest match, never null,
  "color": "primary color in one or two words"
}`;

export async function analyzeGarment(
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"
): Promise<GarmentAnalysis | null> {
  if (!API_KEY) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mimeType, data: imageBase64 },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? "";

    // Strip any accidental markdown fences
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<GarmentAnalysis>;

    return {
      name: parsed.name ?? "",
      brand: parsed.brand ?? null,
      category: CATEGORIES.includes(parsed.category as Category)
        ? (parsed.category as Category)
        : null,
      color: parsed.color ?? null,
    };
  } catch {
    return null;
  }
}
