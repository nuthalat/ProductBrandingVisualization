import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface BrandConcept {
  productName: string;
  visualIdentity: string;
  keyFeatures: string[];
}

export async function generateBrandConcept(description: string): Promise<BrandConcept> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on this product description, create a focused visual identity guide for image generation. 
    Focus on specific colors, shapes, materials, and distinct visual markers that should remain consistent. 
    Description: ${description}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          visualIdentity: { 
            type: Type.STRING, 
            description: "A detailed physical description of the product for an image generator." 
          },
          keyFeatures: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-5 key visual attributes (e.g., 'chrome finish', 'matte red circular logo')."
          }
        },
        required: ["productName", "visualIdentity", "keyFeatures"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateProductImage(
  concept: BrandConcept, 
  medium: "billboard" | "newspaper" | "social",
  aspectRatio: "16:9" | "3:4" | "1:1"
): Promise<string> {
  const mediumContexts = {
    billboard: "A massive high-resolution digital billboard in a vibrant city at night. The product is the central focus. High-end advertising photography.",
    newspaper: "A black and white, slightly grainy halftone print in a vintage newspaper. The product is featured in a 1950s style advertisement. Noir aesthetic.",
    social: "A crisp, modern, high-quality social media lifestyle post (Instagram style). Clean studio lighting, minimalist background. The product is center stage."
  };

  const restrictedContent = "No people should be visible in the image. Pure product focus.";
  
  const prompt = `A professional advertisement for ${concept.productName}. 
  ${concept.visualIdentity}. 
  Key details to maintain: ${concept.keyFeatures.join(", ")}. 
  Context: ${mediumContexts[medium]}. 
  ${restrictedContent} 
  High quality, photorealistic, cinematic lighting.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image", // Nano-Banana
    contents: {
      parts: [
        { text: prompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate image");
}
