# EvalEngine

**Unit tests for LLMs** - A testing framework that lets you write assertions for AI functions, just like you would for regular code.

## Quick Start

### 1. Install

```bash
npm install eval-engine
# or
bun install eval-engine
```

### 2. Write an LLM function

```typescript
// agents/productDescription.ts
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { register } from "eval-engine";

// Your normal LLM function
export const generateProductDescription = async (prompt: string): Promise<string> => {
  const result = await generateText({
    model: openai("gpt-3.5-turbo"),
    prompt: `Create a compelling product description for: ${prompt}.`,
  });
  return result.text;
};

// Register it for testing
export const productDescriptionHandle = register(generateProductDescription);
```

### 3. Write test assertions

```typescript
// evals/productDescription.test.ts
import { productDescriptionHandle } from "../agents/productDescription.ts";

// Rules that apply to ALL calls
productDescriptionHandle.for_all((a) => {
  a.ensure_doesnt_contain("VR")
   .ensure_response_time_under(5000)
   .ensure_length_over(50);
});

// Rules for specific inputs
productDescriptionHandle.for_all_containing("iPhone", (a) => {
  a.ensure_contains("iPhone")
   .ensure_contains("technology");
});

// Export the handle for CLI discovery
export { productDescriptionHandle };
```

### 4. Run tests

```bash
# Run all tests
eval-engine

# Run specific test file
eval-engine test evals/productDescription.test.ts

# Pattern matching
eval-engine test --pattern="*product*"

# With timeout
eval-engine test --timeout=10000
```

## How It Works

### Simple 2-File Pattern

**Agent File** (`agents/yourFunction.ts`):
- Contains your LLM function
- Registers it with `register()`
- Exports both the original function and the test handle

**Test File** (`evals/yourFunction.test.ts`):
- Imports the test handle
- Configures assertions using `.for_all()`, `.for_prompt()`, etc.
- Exports the handle for CLI discovery

### Assertion Types

```typescript
handle.for_all((a) => {
  a.ensure_contains("text")              // Response must contain text
   .ensure_doesnt_contain("bad")         // Response must not contain text
   .ensure_matches_pattern(/regex/)      // Response must match regex
   .ensure_response_time_under(1000)     // Must respond within 1000ms
   .ensure_length_over(50)               // Response must be over 50 chars
   .tool_is_used("toolName")             // Must use specific tool
   .ensure_no_tools_called();            // Must not use any tools
});
```

### Conditional Assertions

```typescript
// Apply rules only to prompts containing "iPhone"
handle.for_all_containing("iPhone", (a) => {
  a.ensure_contains("technology");
});

// Apply rules only to exact prompt match
handle.for_prompt("Wireless Earbuds", (a) => {
  a.ensure_contains("wireless");
});
```

## CLI Commands

```bash
eval-engine                    # Run all tests
eval-engine test              # Explicit test command
eval-engine test file.test.ts # Run specific file
eval-engine test --pattern="*product*" # Pattern matching
eval-engine test --timeout=5000       # Custom timeout
eval-engine --help           # Show help
```

## File Discovery

The CLI automatically finds test files matching:
- `evals/**/*.test.{ts,js}`
- `test/**/*.test.{ts,js}`
- `**/*.eval.test.{ts,js}`

## Example Output

```
🧪 Running 1 test suite...

🔍 productDescription
✅ Product description tests configured
  ✅ 3 tests passed (1205ms)

══════════════════════════════════════════════════
🎉 All tests passed!
   3 tests in 1 suite
   Duration: 1207ms
```

## Why EvalEngine?

- **Familiar**: Uses patterns from Vitest, Jest, Playwright
- **Type-safe**: Full TypeScript support
- **Fast**: Efficient test discovery and execution
- **Flexible**: Works with any LLM library (OpenAI, Anthropic, etc.)
- **Simple**: Two-file pattern keeps things organized

## Advanced Usage

### Custom Test Inputs

The CLI automatically generates test inputs based on function names, but you can also export custom test functions:

```typescript
// In your test file
export const customTest = async () => {
  await productDescriptionHandle.run("Custom input");
};
```

### Production vs Testing

```typescript
// In production
import { generateProductDescription } from "./agents/productDescription";
const result = await generateProductDescription("iPhone");

// In tests  
import { productDescriptionHandle } from "./agents/productDescription";
const result = await productDescriptionHandle.run("iPhone"); // Runs with assertions
```