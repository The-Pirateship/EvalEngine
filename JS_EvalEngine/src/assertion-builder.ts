import type { AssertionBuilder, AssertionFunction, ExecutionMetadata } from './types';

export class AssertionError extends Error {
  constructor(message: string, public assertion: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export class SimpleAssertionBuilder implements AssertionBuilder {
  private assertions: AssertionFunction[] = [];

  ensure_doesnt_contain(text: string): AssertionBuilder {
    this.assertions.push((metadata: ExecutionMetadata) => {
      const response = String(metadata.output);
      if (response.includes(text)) {
        throw new AssertionError(
          `Response should not contain "${text}". Found: "${text}" in response.`,
          'ensure_doesnt_contain'
        );
      }
    });
    return this;
  }

  ensure_contains(text: string): AssertionBuilder {
    this.assertions.push((metadata: ExecutionMetadata) => {
      const response = String(metadata.output);
      if (!response.includes(text)) {
        throw new AssertionError(
          `Response should contain "${text}". Not found in response.`,
          'ensure_contains'
        );
      }
    });
    return this;
  }

  ensure_matches_pattern(pattern: RegExp): AssertionBuilder {
    this.assertions.push((metadata: ExecutionMetadata) => {
      const response = String(metadata.output);
      if (!pattern.test(response)) {
        throw new AssertionError(
          `Response should match pattern ${pattern}. Response: "${response}"`,
          'ensure_matches_pattern'
        );
      }
    });
    return this;
  }

  ensure_response_time_under(ms: number): AssertionBuilder {
    this.assertions.push((metadata: ExecutionMetadata) => {
      if (metadata.responseTime >= ms) {
        throw new AssertionError(
          `Response time should be under ${ms}ms. Actual: ${metadata.responseTime}ms`,
          'ensure_response_time_under'
        );
      }
    });
    return this;
  }

  ensure_length_over(chars: number): AssertionBuilder {
    this.assertions.push((metadata: ExecutionMetadata) => {
      const response = String(metadata.output);
      if (response.length <= chars) {
        throw new AssertionError(
          `Response length should be over ${chars} characters. Actual: ${response.length} characters`,
          'ensure_length_over'
        );
      }
    });
    return this;
  }

  tool_is_used(toolName: string): AssertionBuilder {
    this.assertions.push((metadata: ExecutionMetadata) => {
      if (!metadata.toolsCalled.includes(toolName)) {
        throw new AssertionError(
          `Tool "${toolName}" should be used. Tools called: [${metadata.toolsCalled.join(', ')}]`,
          'tool_is_used'
        );
      }
    });
    return this;
  }

  ensure_no_tools_called(): AssertionBuilder {
    this.assertions.push((metadata: ExecutionMetadata) => {
      if (metadata.toolsCalled.length > 0) {
        throw new AssertionError(
          `No tools should be called. Tools called: [${metadata.toolsCalled.join(', ')}]`,
          'ensure_no_tools_called'
        );
      }
    });
    return this;
  }

  getAssertions(): AssertionFunction[] {
    return this.assertions;
  }
}