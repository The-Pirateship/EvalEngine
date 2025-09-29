import type { LLMFunction, LLMSchema } from './types';
import { TestingHandle } from './testing-handle';

export function register<TInput, TOutput>(
  originalFunction: LLMFunction<TInput, TOutput>,
  schema: LLMSchema<TInput>
): TestingHandle<TInput, TOutput> {
  return TestingHandle.create(originalFunction, schema);
}