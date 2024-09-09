// MIT License. Author: Gabriel Dottl, 9/9/24.
import { IncrementalJsonParser, IncrementalStructuredOutputParser } from "./incremental_parsers";

import OpenAI from "openai";

const DEFAULT_OPENAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function* chatStream({ messages, model = 'gpt-4o', maxTokens = undefined }) {
  try {
    const streamResponse = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens, // Token limit
      stream: true,
    });

    for await (const chunk of streamResponse) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content; // Yield chunks as they arrive
      }
    }
  } catch (e) {
    console.error(`Error in chatStream: ${e.message}\n${e.stack}`);
    throw e;
  }
}

export async function* chatJsonStream({ openai=DEFAULT_OPENAI, model = 'gpt-4o', messages }) {
  const jsonParser = new IncrementalJsonParser();
  try {
    const streamResponse = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      // response_format: { "type": "json_object" }, // Doesn't work (yet) with OpenAI API
    });

    for await (const chunk of streamResponse) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        console.info('Streaming chunk:', content);
        try {
          const parsedJson = jsonParser.parseChunk(content); // Use the incremental JSON parser
          if (parsedJson) {
            yield parsedJson; // Yield parsed JSON if successfully parsed, else skip this chunk
          }
        } catch (repairError) {
          console.error(`Failed to parse/repair JSON chunk: ${repairError.message}`);
        }
      }
    }
  } catch (e) {
    console.error(`Error in chatJsonStream: ${e.message}\n${e.stack}`);
    throw e;
  }
}

export async function* chatStructuredOutputStream({ openai=DEFAULT_OPENAI, model = 'gpt-4o-2024-08-06', messages, structuredOutputFormat }) {
  const structuredParser = new IncrementalStructuredOutputParser({ zodSchema: structuredOutputFormat });

  try {
    const streamResponse = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      // response_format: zodResponseFormat(structuredOutputFormat, "response"), // Doesn't work (yet) with OpenAI API
    });

    for await (const chunk of streamResponse) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        try {
          const parsedOutput = structuredParser.parseChunk(content); // Use the incremental structured output parser
          if (parsedOutput) {
            yield parsedOutput; // Yield parsed structured output if successfully parsed, else skip this chunk
          }
        } catch (repairError) {
          console.error(`Failed to parse/repair structured output chunk: ${repairError.message}`);
        }
      }
    }
  } catch (e) {
    console.error(`Error in chatStructuredOutputStream: ${e.message}\n${e.stack}`);
    throw e;
  }
}
