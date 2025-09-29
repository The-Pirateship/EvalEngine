import type { ZodSchema } from 'zod';

export interface ExecutionMetadata<TInput = any, TOutput = any> {
  input: TInput;
  output: TOutput;
  responseTime: number;
  toolsCalled: string[];
}

export type AssertionFunction = (metadata: ExecutionMetadata) => void;

export interface AssertionBuilder {
  ensure_doesnt_contain(text: string): AssertionBuilder;
  ensure_contains(text: string): AssertionBuilder;
  ensure_matches_pattern(pattern: RegExp): AssertionBuilder;
  ensure_response_time_under(ms: number): AssertionBuilder;
  ensure_length_over(chars: number): AssertionBuilder;
  tool_is_used(toolName: string): AssertionBuilder;
  ensure_no_tools_called(): AssertionBuilder;
}

export interface LLMSchema<TInput = any> {
  input: ZodSchema<TInput>;
}


export type LLMFunction<TInput = any, TOutput = any> = (...args: [TInput, ...any[]]) => Promise<TOutput>;