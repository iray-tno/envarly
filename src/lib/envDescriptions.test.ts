import { describe, expect, it } from "vitest";
import { lookupEnvDescription } from "./envDescriptions";

describe("lookupEnvDescription", () => {
  it("returns a description for a known variable", () => {
    const desc = lookupEnvDescription("JAVA_HOME");
    expect(desc).not.toBeNull();
    expect(desc?.category).toBe("Java");
    expect(desc?.summary.length).toBeGreaterThan(0);
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

  it("covers PATH with the Windows category", () => {
    const desc = lookupEnvDescription("PATH");
    expect(desc?.category).toBe("Windows");
  });

  it("covers GOPATH with the Go category", () => {
    expect(lookupEnvDescription("GOPATH")?.category).toBe("Go");
  });

  it("covers AWS_ACCESS_KEY_ID with the AWS category", () => {
    expect(lookupEnvDescription("AWS_ACCESS_KEY_ID")?.category).toBe("AWS");
  });

  it("covers DOCKER_HOST with the Docker category", () => {
    expect(lookupEnvDescription("DOCKER_HOST")?.category).toBe("Docker");
  });

  it("covers NODE_ENV with the Node.js category", () => {
    expect(lookupEnvDescription("NODE_ENV")?.category).toBe("Node.js");
  });
});
