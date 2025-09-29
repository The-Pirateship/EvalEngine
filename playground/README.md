# LLM Testing Framework - Clean API Example

This example shows the **new, simplified API** with clean separation of concerns.

## File Structure

```
agents/
  productDescription.ts     # LLM function + registration
evals/  
  productDescription.test.ts # Test configuration
test-new-api.ts             # Example usage
```

## How It Works

### 1. Define Your Agent (`agents/productDescription.ts`)

```typescript
// Your normal LLM function (for production)
export const generateProductDescription = async (prompt: string) => {
  return await generateText({ model, prompt })
}

// Register it to get a testing handle
export const productDescriptionHandle = register(generateProductDescription)

// Export instrumented version for testing
export const generateProductDescriptionWithTests = productDescriptionHandle.run
```

### 2. Configure Tests (`evals/productDescription.test.ts`)

```typescript
import { productDescriptionHandle } from "../agents/productDescription"

// Global rules for ALL calls
productDescriptionHandle.for_all((a) => {
  a.ensure_doesnt_contain("VR")
   .ensure_response_time_under(5000)
})

// Rules for specific inputs
productDescriptionHandle.for_all_containing("iPhone", (a) => {
  a.ensure_contains("technology")
})
```

### 3. Use in Your App

```typescript
// Import test config (sets up assertions)
import "./evals/productDescription.test"

// Import functions
import { 
  generateProductDescription,          // Production 
  generateProductDescriptionWithTests  // Testing
} from "./agents/productDescription"

// In production
const result = await generateProductDescription("iPhone")

// In tests (runs assertions automatically)
const result = await generateProductDescriptionWithTests("iPhone")
```

## Run the Example

```bash
bun test-new-api.ts
```

## Key Benefits

- ✅ **Clean separation** - production code vs test configuration
- ✅ **Simple registration** - `register(func)` returns testing handle
- ✅ **Explicit testing** - use `WithTests` version when you want assertions
- ✅ **Discoverable** - all test files in `evals/` directory
- ✅ **Framework-agnostic** - works with any testing setup

## API Reference

### Registration
```typescript
const handle = register(myFunction)
```

### Assertions
- `handle.for_all(callback)` - Rules for all calls
- `handle.for_prompt(text, callback)` - Rules for exact prompt
- `handle.for_all_containing(text, callback)` - Rules when prompt contains text

### Assertion Methods
- `ensure_contains(text)` - Response must contain text
- `ensure_doesnt_contain(text)` - Response must not contain text  
- `ensure_response_time_under(ms)` - Response time limit
- `ensure_length_over(chars)` - Minimum response length
- `tool_is_used(name)` - Specific tool must be called
- `ensure_no_tools_called()` - No tools should be called