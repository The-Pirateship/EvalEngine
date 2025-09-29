import { glob } from 'glob';

export interface TestSuite {
  evalFile: string;
  name: string;
}

// Simple test discovery - just find *.test.ts files
export async function findTestFiles(): Promise<TestSuite[]> {
  // Look for test files in common locations
  const files = await glob('**/*.test.{ts,js}', {
    ignore: ['**/node_modules/**', '**/dist/**'],
    absolute: true
  });

  return files.map(file => ({
    evalFile: file,
    name: getTestName(file)
  }));
}

// Extract name from file path
function getTestName(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  return fileName.replace(/\.test\.(ts|js)$/, '');
}