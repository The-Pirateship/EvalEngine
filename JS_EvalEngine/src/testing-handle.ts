import type {
  ExecutionMetadata,
  AssertionBuilder,
  LLMFunction,
  LLMSchema,
  AssertionFunction,
} from "./types";
import { SimpleAssertionBuilder } from "./assertion-builder";

interface TestCase<TInput> {
  input: TInput;
  assertions: AssertionFunction[];
}

export class TestingHandle<TInput = any, TOutput = any> {
  public globalRules: AssertionFunction[] = [];
  public testCases: TestCase<TInput>[] = [];
  public originalFunction: LLMFunction<TInput, TOutput>;
  public schema: LLMSchema<TInput>;
  public run: LLMFunction<TInput, TOutput> = () => {
    throw new Error("run() is not implemented - use CLI to execute tests");
  };

  private constructor(
    originalFunction: LLMFunction<TInput, TOutput>,
    schema: LLMSchema<TInput>
  ) {
    this.originalFunction = originalFunction;
    this.schema = schema;
  }

  static create<TInput, TOutput>(
    originalFunction: LLMFunction<TInput, TOutput>,
    schema: LLMSchema<TInput>
  ): TestingHandle<TInput, TOutput> {
    return new TestingHandle<TInput, TOutput>(originalFunction, schema);
  }

  for_all(
    callback: (a: AssertionBuilder) => void
  ): TestingHandle<TInput, TOutput> {
    const builder = new SimpleAssertionBuilder();
    callback(builder);
    this.globalRules.push(...builder.getAssertions());
    return this;
  }

  for_input(
    input: TInput,
    callback: (a: AssertionBuilder) => void
  ): TestingHandle<TInput, TOutput> {
    const validatedInput = this.schema.input.parse(input);
    const builder = new SimpleAssertionBuilder();
    callback(builder);
    this.testCases.push({
      input: validatedInput,
      assertions: builder.getAssertions(),
    });
    return this;
  }
}
