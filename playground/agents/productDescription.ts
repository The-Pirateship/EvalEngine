import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { register } from "eval-engine";
import { z } from "zod";

/**
 * Raw generator for production use
 * This is your normal LLM function - nothing special here
 */
export const generateProductDescription = async (
  prompt: string
): Promise<string> => {
  const result = await generateText({
    model: openai("gpt-3.5-turbo"),
    prompt: `Create a compelling product description for: ${prompt}. 
             Make it engaging, highlight key benefits, and include a call to action.`,
  });
  return result.text;
};

// Example usage (commented out to avoid noise during tests):
// generateProductDescription("Sample Product").then(console.log);

/**
 * Schema definition for input validation
 */
const productDescriptionSchema = {
  input: z.string().min(1, "Product name cannot be empty"),
};

/**
 * Instrumented handle for tests/evals
 * This creates a testing-enabled version of your function
 */
export const productDescriptionHandle = register(
  generateProductDescription,
  productDescriptionSchema
);
