// MIT License. Author: Gabriel Dottl, 9/9/24.
import { jsonrepair } from 'jsonrepair'; // Import the jsonrepair library
import { z } from 'zod';

export class IncrementalJsonParser {
  constructor() {
    // Field to store the partial JSON string
    this.partialString = '';
  }

  // Appends a new chunk and attempts to parse it
  parseChunk(newChunk) {
    this.partialString += newChunk; // Append the new chunk
    console.info('Partial JSON:', this.partialString);
    try {
      // Attempt to parse the partial string as JSON
      return JSON.parse(this.partialString);
    } catch (error) {
      // If it's a syntax error, attempt to repair the JSON
      if (error instanceof SyntaxError) {
        try {
          // Attempt to repair the JSON string
          return extendedJsonRepair(this.partialString);
        } catch (repairError) {
          console.warn(`Failed to parse JSON:\n${this.partialString}\n\n${repairError}`);
          // If repair fails, throw the repair error
          throw repairError;
        }
      }
      // If it's another type of error, rethrow it
      throw error;
    }
  }
}

export class IncrementalStructuredOutputParser {
  constructor({ zodSchema, coerce = true }) {
    // Initialize the IncrementalJsonParser
    this.jsonParser = new IncrementalJsonParser();
    // Coerce the Zod schema to handle defaults and type coercion, if needed
    this.schema = coerce ? coerceSchema(zodSchema) : zodSchema;
  }

  // Appends a new chunk, parses it, and validates the result using the Zod schema
  parseChunk(newChunk) {
    const parsedJson = this.jsonParser.parseChunk(newChunk); // Parse using the JSON parser

    if (parsedJson === null) {
      // If the JSON is incomplete, return null and wait for more chunks
      return null;
    }

    // Use the Zod schema to coerce and validate the parsed JSON
    return this.schema.parse(parsedJson);
  }
}

// Helper function to coerce the schema (as shown in the previous example)
function coerceSchema(schema) {
  if (schema instanceof z.ZodObject) {
    const coercedShape = {};
    for (const [key, value] of Object.entries(schema.shape)) {
      coercedShape[key] = coerceSchema(value);
    }
    return z.object(coercedShape);
  } else if (schema instanceof z.ZodString) {
    return z.coerce.string().default('');
  } else if (schema instanceof z.ZodNumber) {
    return z.coerce.number().default(0);
  } else if (schema instanceof z.ZodBoolean) {
    return z.coerce.boolean().default(true);
  } else if (schema instanceof z.ZodArray) {
    return z.array(coerceSchema(schema.element)).default([]);
  } else if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return schema._def.innerType ? coerceSchema(schema._def.innerType).optional() : schema;
  }

  return schema;
}

export function extendedJsonRepair(brokenJson, attempts = 3) {
  try {
    return jsonrepair(brokenJson);
  } catch (error) {
    if (attempts <= 1) {
      throw error;
    }
    console.warn(`Failed to repair JSON (${brokenJson}): ${error.message}`);
    const partiallyFixedJson = repairUnclosedStrings(extractEscapedCode(brokenJson));
    return extendedJsonRepair(partiallyFixedJson, attempts - 1);
  }
}

function repairUnclosedStrings(jsonStr) {
  const quoteMatches = jsonStr.match(/"/g);
  if (quoteMatches && quoteMatches.length % 2 !== 0) {
    // const lastQuoteIndex = jsonStr.lastIndexOf('"');
    return jsonStr + '"';
  }
  return jsonStr;
}

// Function to extract the code block enclosed in triple backticks
function extractEscapedCode(str) {
  const matches = str.match(/```([^`]*)```/s); // Matches content between triple backticks
  if (matches?.[1]) {
    return matches[1].trim(); // Return the extracted JSON
  }
  return str;
}

// Example Usage

const brokenJson = `{
  "message": "Love is a complex set of emotions, behaviors, and beliefs associated with strong feelings of affection, protectiveness, warmth,`;


const jsonWithBackticks = `
\`\`\`
{
  "message": "Love is a complex set of emotions, behaviors, and beliefs associated with strong feelings of affection, protectiveness, warmth,
\`\`\`
`;


const jsonWithJsonBackticks = `json
\`\`\`
{
  "message": "Love is a complex set of emotions, behaviors, and beliefs associated with strong feelings of affection, protectiveness, warmth,
\`\`\`
`;

// Example incomplete structured output chunks
const incompleteJsonChunks = [
  '{"message": "This is a test", "count": 10, ',
  '"isActive": tru',
  'e}',
];

// console.log(extendedJsonRepair(brokenJson));
// console.log(extendedJsonRepair(jsonWithBackticks));
// console.log(extendedJsonRepair(jsonWithJsonBackticks));

// Define the expected structured output schema
const structuredOutputFormat = z.object({
  message: z.string(),
  count: z.number(),
  isActive: z.boolean().optional(),
});
const parser = new IncrementalStructuredOutputParser({ zodSchema: structuredOutputFormat });

// Process the chunks using the incremental parser
incompleteJsonChunks.forEach((chunk) => {
  try {
    const parsedOutput = parser.parseChunk(chunk);
    if (parsedOutput) {
      console.log('Parsed and validated output:', parsedOutput);
    } else {
      console.log('Waiting for more chunks...');
    }
  } catch (error) {
    console.error('Failed to parse or validate structured output:', error.message);
  }
});
