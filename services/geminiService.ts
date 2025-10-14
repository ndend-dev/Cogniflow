import { GoogleGenAI, Type } from "@google/genai";
import { AISummary, AIGeneratedNote } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = "gemini-2.5-flash";

export const summarizeNoteContent = async (content: string): Promise<AISummary> => {
  const prompt = `Analyze the following note content and provide a structured JSON response. The content is: \n\n---\n${content}\n---\n\nPlease generate a concise summary, a list of key points (as strings), and a list of potential flashcards (front/back questions and answers).`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A concise summary of the note's content.",
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of bullet points highlighting the main ideas.",
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: {
                    type: Type.STRING,
                    description: "The 'question' or 'term' side of the flashcard.",
                  },
                  back: {
                    type: Type.STRING,
                    description: "The 'answer' or 'definition' side of the flashcard.",
                  },
                },
                required: ["front", "back"],
              },
              description: "A list of generated flashcards.",
            },
          },
          required: ["summary", "keyPoints", "flashcards"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result as AISummary;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get summary from AI. Please check your API key and network connection.");
  }
};

export const generateNoteContent = async (title: string, userPrompt: string): Promise<AIGeneratedNote> => {
    const fullPrompt = `Based on the following topic or title: "${title}", and these specific instructions: "${userPrompt}", generate a structured JSON response for a new note. Create a concise, relevant title and detailed, well-structured content for the note body in Markdown format. If the user instructions are empty, just generate content based on the title.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: "A concise and relevant title for the note based on the prompt."
                        },
                        content: {
                            type: Type.STRING,
                            description: "The detailed, well-structured content for the note body, written in Markdown format."
                        }
                    },
                    required: ["title", "content"]
                }
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result as AIGeneratedNote;
    } catch(error) {
        console.error("Error calling Gemini API for note generation:", error);
        throw new Error("Failed to generate note from AI. Please check your API key and network connection.");
    }
}