import { describe, expect, it } from "vitest";
import { lookupEnvDescription } from "./envDescriptions";

describe("lookupEnvDescription", () => {
  it("returns a description for a known variable", () => {
    const desc = lookupEnvDescription("JAVA_HOME");
    expect(desc).not.toBeNull();
    expect(desc?.categoryKey).toBe("env_desc.categories.java");
    expect(desc?.summaryKey).toBe("env_desc.JAVA_HOME");
  });

  it("is case-insensitive (lowercase)", () => {
    expect(lookupEnvDescription("java_home")).toEqual(lookupEnvDescription("JAVA_HOME"));
  });

  it("is case-insensitive (mixed case)", () => {
    expect(lookupEnvDescription("Java_Home")).toEqual(lookupEnvDescription("JAVA_HOME"));
  });

  it("returns null for an unknown variable", () => {
    expect(lookupEnvDescription("MY_CUSTOM_VAR_XYZ")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(lookupEnvDescription("")).toBeNull();
  });

  it("covers PATH with the windows category", () => {
    const desc = lookupEnvDescription("PATH");
    expect(desc?.categoryKey).toBe("env_desc.categories.windows");
  });

  it("covers GOPATH with the go category", () => {
    expect(lookupEnvDescription("GOPATH")?.categoryKey).toBe("env_desc.categories.go");
  });

  it("covers AWS_ACCESS_KEY_ID with the aws category", () => {
    expect(lookupEnvDescription("AWS_ACCESS_KEY_ID")?.categoryKey).toBe("env_desc.categories.aws");
  });

  it("covers DOCKER_HOST with the docker category", () => {
    expect(lookupEnvDescription("DOCKER_HOST")?.categoryKey).toBe("env_desc.categories.docker");
  });

  it("covers NODE_ENV with the nodejs category", () => {
    expect(lookupEnvDescription("NODE_ENV")?.categoryKey).toBe("env_desc.categories.nodejs");
  });

  it("covers AI / LLM variables with the ai category", () => {
    expect(lookupEnvDescription("OPENAI_API_KEY")).toEqual({
      categoryKey: "env_desc.categories.ai",
      summaryKey: "env_desc.OPENAI_API_KEY",
    });
    expect(lookupEnvDescription("ANTHROPIC_API_KEY")?.categoryKey).toBe("env_desc.categories.ai");
    expect(lookupEnvDescription("CODEX_HOME")?.categoryKey).toBe("env_desc.categories.ai");
    expect(lookupEnvDescription("GEMINI_API_KEY")?.categoryKey).toBe("env_desc.categories.ai");
    expect(lookupEnvDescription("ANTIGRAVITY_API_KEY")?.categoryKey).toBe("env_desc.categories.ai");
    expect(lookupEnvDescription("HF_TOKEN")?.categoryKey).toBe("env_desc.categories.ai");
    expect(lookupEnvDescription("OLLAMA_HOST")?.categoryKey).toBe("env_desc.categories.ai");
    expect(lookupEnvDescription("DEEPSEEK_API_KEY")?.categoryKey).toBe("env_desc.categories.ai");
    expect(lookupEnvDescription("LANGCHAIN_TRACING_V2")?.categoryKey).toBe("env_desc.categories.ai");
  });
});
