
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

console.log(extendedJsonRepair(brokenJson));
console.log(extendedJsonRepair(jsonWithBackticks));
console.log(extendedJsonRepair(jsonWithJsonBackticks));

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