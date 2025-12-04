// Gemini Processor Module
// Handles interaction with Google's Gemini API

const { GoogleGenAI } = require("@google/genai");

// Configuration
const CONFIG = {
  modelId: "gemini-2.0-flash", // Using a fast, capable model
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  }
};

/**
 * Generates a 360-degree overview of an article based on its headline and source.
 *
 * @param {string} headline - The headline of the article.
 * @param {string} source - The source/publisher of the article.
 * @param {string} apiKey - The Google Gemini API key.
 * @returns {Promise<string>} - The generated text overview.
 */
async function generateArticleReview(headline, source, apiKey) {
  if (!apiKey) {
    throw new Error("Gemini API key is required");
  }

  if (!headline || !source) {
    throw new Error("Headline and source are required");
  }

  console.log(`🧠 [GEMINI] Generating review for: "${headline}" from ${source}`);

  try {
    const genAI = new GoogleGenAI({ apiKey: apiKey });

    // Construct the prompt based on user requirements
    const systemPrompt = "This is the title and source of the article that I found and that I'm curious in reading but it's behind a pay wall and I don't really trust any single media publisher. Can you give me a 360 overview of how the story is being covered by the left right and center how it's being spun and how the truth appears to land throughout the spinning.";

    const userContent = `Title: ${headline}\nSource: ${source}`;

    const prompt = `${systemPrompt}\n\n${userContent}`;

    const response = await genAI.models.generateContent({
      model: CONFIG.modelId,
      contents: prompt,
      config: CONFIG.generationConfig
    });

    const text = response.text();

    console.log(`🧠 [GEMINI] Generated ${text.length} characters of text`);

    return text;

  } catch (error) {
    console.error("❌ [GEMINI] Error generating content:", error);
    throw new Error(`Gemini generation failed: ${error.message}`);
  }
}

module.exports = {
  generateArticleReview
};
