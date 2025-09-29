// src/assertion-builder.ts
class AssertionBuilderImpl {
  assertions = [];
  ensure_doesnt_contain(text) {
    this.assertions.push({
      method: "ensure_doesnt_contain",
      args: [text],
      message: `Response should not contain "${text}"`
    });
    return this;
  }
  ensure_contains(text) {
    this.assertions.push({
      method: "ensure_contains",
      args: [text],
      message: `Response should contain "${text}"`
    });
    return this;
  }
  ensure_matches_pattern(pattern) {
    this.assertions.push({
      method: "ensure_matches_pattern",
      args: [pattern],
      message: `Response should match pattern ${pattern}`
    });
    return this;
  }
  ensure_response_time_under(ms) {
    this.assertions.push({
      method: "ensure_response_time_under",
      args: [ms],
      message: `Response time should be under ${ms}ms`
    });
    return this;
  }
  ensure_length_over(chars) {
    this.assertions.push({
      method: "ensure_length_over",
      args: [chars],
      message: `Response length should be over ${chars} characters`
    });
    return this;
  }
  tool_is_used(toolName) {
    this.assertions.push({
      method: "tool_is_used",
      args: [toolName],
      message: `Tool "${toolName}" should be used`
    });
    return this;
  }
  ensure_no_tools_called() {
    this.assertions.push({
      method: "ensure_no_tools_called",
      args: [],
      message: "No tools should be called"
    });
    return this;
  }
  getAssertions() {
    return this.assertions;
  }
}

// src/assertion-executor.ts
class AssertionError extends Error {
  assertion;
  constructor(message, assertion) {
    super(message);
    this.assertion = assertion;
    this.name = "AssertionError";
  }
}

class AssertionExecutor {
  static execute(assertions, metadata) {
    for (const assertion of assertions) {
      try {
        this.executeAssertion(assertion, metadata);
      } catch (error) {
        if (error instanceof AssertionError) {
          throw error;
        }
        throw new AssertionError(`Assertion failed: ${assertion.message}. Error: ${error}`, assertion.method);
      }
    }
  }
  static executeAssertion(assertion, metadata) {
    const { method, args, message } = assertion;
    const { response, responseTime, toolsCalled } = metadata;
    switch (method) {
      case "ensure_doesnt_contain":
        if (response.includes(args[0])) {
          throw new AssertionError(`${message}. Found: "${args[0]}" in response.`, method);
        }
        break;
      case "ensure_contains":
        if (!response.includes(args[0])) {
          throw new AssertionError(`${message}. Not found in response.`, method);
        }
        break;
      case "ensure_matches_pattern":
        if (!args[0].test(response)) {
          throw new AssertionError(`${message}. Response: "${response}"`, method);
        }
        break;
      case "ensure_response_time_under":
        if (responseTime >= args[0]) {
          throw new AssertionError(`${message}. Actual: ${responseTime}ms`, method);
        }
        break;
      case "ensure_length_over":
        if (response.length <= args[0]) {
          throw new AssertionError(`${message}. Actual: ${response.length} characters`, method);
        }
        break;
      case "tool_is_used":
        if (!toolsCalled.includes(args[0])) {
          throw new AssertionError(`${message}. Tools called: [${toolsCalled.join(", ")}]`, method);
        }
        break;
      case "ensure_no_tools_called":
        if (toolsCalled.length > 0) {
          throw new AssertionError(`${message}. Tools called: [${toolsCalled.join(", ")}]`, method);
        }
        break;
      default:
        throw new Error(`Unknown assertion method: ${method}`);
    }
  }
}

// src/testing-handle.ts
class TestingHandleImpl {
  rules = [];
  for_all(callback) {
    const builder = new AssertionBuilderImpl;
    callback(builder);
    this._addRule({
      type: "for_all",
      assertions: builder.getAssertions()
    });
    return this;
  }
  for_prompt(prompt, callback) {
    const builder = new AssertionBuilderImpl;
    callback(builder);
    this._addRule({
      type: "for_prompt",
      condition: prompt,
      assertions: builder.getAssertions()
    });
    return this;
  }
  for_all_containing(text, callback) {
    const builder = new AssertionBuilderImpl;
    callback(builder);
    this._addRule({
      type: "for_containing",
      condition: text,
      assertions: builder.getAssertions()
    });
    return this;
  }
  _addRule(rule) {
    this.rules.push(rule);
  }
  _executeAssertions(metadata) {
    for (const rule of this.rules) {
      if (this.shouldApplyRule(rule, metadata)) {
        AssertionExecutor.execute(rule.assertions, metadata);
      }
    }
  }
  _getRules() {
    return this.rules;
  }
  shouldApplyRule(rule, metadata) {
    switch (rule.type) {
      case "for_all":
        return true;
      case "for_prompt":
        return metadata.prompt === rule.condition;
      case "for_containing":
        return typeof rule.condition === "string" && metadata.prompt.includes(rule.condition);
      default:
        return false;
    }
  }
}

// src/register.ts
var agentRegistry = new Map;
function register(name, originalFunction) {
  const handle = new TestingHandleImpl;
  agentRegistry.set(name, handle);
  const instrumentedFunction = async (...args) => {
    const startTime = performance.now();
    try {
      const result = await originalFunction(...args);
      const endTime = performance.now();
      const metadata = extractMetadata(args, result, startTime, endTime);
      handle._executeAssertions(metadata);
      return result;
    } catch (error) {
      throw error;
    }
  };
  return {
    agent: handle,
    run: instrumentedFunction
  };
}
function extractMetadata(args, result, startTime, endTime) {
  const prompt = extractPrompt(args);
  const response = extractResponse(result);
  const toolsCalled = extractToolsCalled(result);
  return {
    prompt,
    response,
    responseTime: endTime - startTime,
    toolsCalled
  };
}
function extractPrompt(args) {
  if (args.length > 0 && typeof args[0] === "string") {
    return args[0];
  }
  if (args.length > 0 && typeof args[0] === "object") {
    const firstArg = args[0];
    if (firstArg.prompt)
      return firstArg.prompt;
    if (firstArg.messages) {
      return firstArg.messages.map((msg) => msg.content || msg.text || "").join(" ");
    }
  }
  return args.map((arg) => typeof arg === "string" ? arg : JSON.stringify(arg)).join(" ");
}
function extractResponse(result) {
  if (!result)
    return "";
  if (typeof result === "string") {
    return result;
  }
  if (result && typeof result === "object" && result.text) {
    return result.text;
  }
  if (result && typeof result === "object" && result.content) {
    return result.content;
  }
  if (result && result.choices && Array.isArray(result.choices) && result.choices[0]) {
    const choice = result.choices[0];
    if (choice.message && choice.message.content) {
      return choice.message.content;
    }
    if (choice.text) {
      return choice.text;
    }
  }
  return JSON.stringify(result);
}
function extractToolsCalled(result) {
  if (!result)
    return [];
  if (result.toolCalls && Array.isArray(result.toolCalls)) {
    return result.toolCalls.map((call) => call.toolName);
  }
  if (result.choices && Array.isArray(result.choices)) {
    const toolCalls = result.choices.flatMap((choice) => choice.message?.tool_calls || []).map((call) => call.function?.name).filter(Boolean);
    return toolCalls;
  }
  return [];
}
function getRegisteredAgents() {
  return agentRegistry;
}
export {
  register,
  getRegisteredAgents
};
