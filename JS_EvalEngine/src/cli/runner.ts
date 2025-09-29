import type { TestSuite } from './discovery';
import { AssertionError } from '../assertion-builder';

export interface TestResult {
  name: string;
  passed: number;
  failed: number;
  failures: string[];
}

// Simple test runner - just import and run test files
export async function runTests(suites: TestSuite[]): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const suite of suites) {
    process.stdout.write(`▶ ${suite.name} `);
    const startTime = performance.now();
    
    const result = await runSuite(suite);
    const duration = Math.round(performance.now() - startTime);
    
    results.push(result);
    
    if (result.failed > 0) {
      console.log(`✗ ${result.failed} failed, ${result.passed} passed (${duration}ms)`);
      result.failures.forEach(f => console.log(`    ${f}`));
    } else {
      console.log(`✓ ${result.passed} passed (${duration}ms)`);
    }
  }

  return results;
}

// Run a single test suite
async function runSuite(suite: TestSuite): Promise<TestResult> {
  const result: TestResult = {
    name: suite.name,
    passed: 0,
    failed: 0,
    failures: []
  };

  try {
    // Import the test file
    const testModule = await import(suite.evalFile);
    
    // Find test handles (objects with originalFunction and testCases)
    const handles = findHandles(testModule);
    
    for (const { name, handle } of handles) {
      await runHandle(name, handle, result);
    }
    
  } catch (error) {
    result.failed++;
    result.failures.push(`${suite.name}: ${error}`);
  }

  return result;
}

// Find test handles in the module
function findHandles(module: any): Array<{ name: string; handle: any }> {
  const handles: Array<{ name: string; handle: any }> = [];
  
  for (const [key, value] of Object.entries(module)) {
    // Look for objects that have originalFunction (registered handles)
    if (value && typeof value === 'object' && 'originalFunction' in value) {
      handles.push({ name: key, handle: value });
    }
  }
  
  return handles;
}

// Run tests for a single handle
async function runHandle(name: string, handle: any, result: TestResult): Promise<void> {
  // Get test inputs (from test cases or generate defaults)
  const inputs = handle.testCases.length > 0 
    ? handle.testCases.map((tc: any) => tc.input)
    : ['Test input'];

  for (const input of inputs) {
    // Suppress console output during test execution
    const originalLog = console.log;
    console.log = () => {};
    
    try {
      // Call the function
      const response = await handle.originalFunction(input);
      
      // Restore console output
      console.log = originalLog;
      
      // Create metadata for assertions
      const metadata = {
        input,
        output: response,
        responseTime: 0,
        toolsCalled: []
      };
      
      // Run global assertions
      for (const assertion of handle.globalRules) {
        assertion(metadata);
      }
      
      // Run test case specific assertions
      const testCase = handle.testCases.find((tc: any) => 
        JSON.stringify(tc.input) === JSON.stringify(input)
      );
      if (testCase) {
        for (const assertion of testCase.assertions) {
          assertion(metadata);
        }
      }
      
      result.passed++;
      
    } catch (error) {
      // Restore console output in case of error
      console.log = originalLog;
      
      result.failed++;
      if (error instanceof AssertionError) {
        result.failures.push(`${name}(${input}): ${error.message}`);
      } else {
        result.failures.push(`${name}(${input}): ${error}`);
      }
    }
  }
}