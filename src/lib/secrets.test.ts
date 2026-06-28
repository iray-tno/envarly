import { describe, expect, it } from "vitest";
import { detectSecret, detectSecretByValue, resolveSecret, isSecretVar } from "./secrets";

describe("detectSecret — exact matches", () => {
  it("recognises well-known exact names", () => {
    expect(detectSecret("AWS_ACCESS_KEY_ID")).toMatchObject({ service: "AWS", label: "AWS Access Key" });
    expect(detectSecret("AWS_SECRET_ACCESS_KEY")).toMatchObject({ service: "AWS" });
    expect(detectSecret("GITHUB_TOKEN")).toMatchObject({ service: "GitHub", label: "GitHub Token" });
    expect(detectSecret("OPENAI_API_KEY")).toMatchObject({ service: "OpenAI" });
    expect(detectSecret("DATABASE_URL")).toMatchObject({ service: "Database" });
    expect(detectSecret("ANTHROPIC_API_KEY")).toMatchObject({ service: "Anthropic" });
  });

  it("is case-insensitive", () => {
    expect(detectSecret("github_token")).toMatchObject({ service: "GitHub" });
    expect(detectSecret("Openai_Api_Key")).toMatchObject({ service: "OpenAI" });
  });
});

describe("detectSecret — prefix + keyword", () => {
  it("matches service prefix combined with a secret keyword", () => {
    expect(detectSecret("GITHUB_SECRET")).toMatchObject({ service: "GitHub" });
    expect(detectSecret("AWS_PRIVATE_KEY")).toMatchObject({ service: "AWS" });
    expect(detectSecret("STRIPE_API_KEY")).toMatchObject({ service: "Stripe" });
    expect(detectSecret("GOOGLE_AUTH_TOKEN")).toMatchObject({ service: "Google" });
  });

  it("does not match prefix alone (no keyword in remainder)", () => {
    expect(detectSecret("GITHUB_REPO")).toBeNull();
    expect(detectSecret("AWS_REGION")).toBeNull();
    expect(detectSecret("STRIPE_ACCOUNT_ID")).toBeNull();
  });
});

describe("detectSecret — generic keyword fallback", () => {
  it("matches any name containing a secret keyword", () => {
    expect(detectSecret("MY_PASSWORD")).toMatchObject({ service: "Generic" });
    expect(detectSecret("APP_SECRET")).toMatchObject({ service: "Generic" });
    expect(detectSecret("X_API_KEY")).toMatchObject({ service: "Generic" });
    expect(detectSecret("DEPLOY_TOKEN")).toMatchObject({ service: "Generic" });
  });

  it("returns null for plain non-secret names", () => {
    expect(detectSecret("PATH")).toBeNull();
    expect(detectSecret("JAVA_HOME")).toBeNull();
    expect(detectSecret("USERNAME")).toBeNull();
    expect(detectSecret("TEMP")).toBeNull();
  });
});

describe("detectSecretByValue — token patterns", () => {
  it("detects GitHub personal access token (ghp_)", () => {
    expect(detectSecretByValue("ghp_abcdefghijklmnopqrst")).toMatchObject({
      service: "GitHub",
      label: "GitHub Personal Access Token",
    });
  });

  it("detects GitHub OAuth / Actions / Refresh tokens", () => {
    expect(detectSecretByValue("gho_abcdefghijklmnopqrst")).toMatchObject({ service: "GitHub" });
    expect(detectSecretByValue("ghs_abcdefghijklmnopqrst")).toMatchObject({ service: "GitHub" });
    expect(detectSecretByValue("ghr_abcdefghijklmnopqrst")).toMatchObject({ service: "GitHub" });
  });

  it("detects Anthropic API key", () => {
    expect(detectSecretByValue("sk-ant-api01-abcdefghijklmnopqrstuvwxyz01234")).toMatchObject({
      service: "Anthropic",
    });
  });

  it("detects OpenAI project key", () => {
    expect(detectSecretByValue("sk-proj-abcdefghijklmnopqrstuvwxyz012345")).toMatchObject({
      service: "OpenAI",
    });
  });

  it("detects Stripe live and test secret keys", () => {
    expect(detectSecretByValue("sk_live_abcdefghijklmnopqrstuvwx")).toMatchObject({
      service: "Stripe",
      label: "Stripe Live Secret Key",
    });
    expect(detectSecretByValue("sk_test_abcdefghijklmnopqrstuvwx")).toMatchObject({
      service: "Stripe",
      label: "Stripe Test Secret Key",
    });
  });

  it("detects AWS access key IDs (AKIA / ASIA prefixes)", () => {
    expect(detectSecretByValue("AKIAIOSFODNN7EXAMPLE")).toMatchObject({ service: "AWS" });
    expect(detectSecretByValue("ASIAIOSFODNN7EXAMPLE")).toMatchObject({ service: "AWS" });
  });

  it("detects npm granular access token", () => {
    expect(detectSecretByValue("npm_abcdefghijklmnopqrstuvwxyz0123456789ab")).toMatchObject({ service: "npm" });
  });

  it("returns null for values shorter than 10 characters", () => {
    expect(detectSecretByValue("ghp_abc")).toBeNull();
    expect(detectSecretByValue("short")).toBeNull();
  });

  it("returns null for unrecognised plain values", () => {
    expect(detectSecretByValue("C:\\Program Files\\Java")).toBeNull();
    expect(detectSecretByValue("localhost,127.0.0.1")).toBeNull();
    expect(detectSecretByValue("this is just a sentence with some words")).toBeNull();
  });
});

describe("resolveSecret", () => {
  it("prefers name-based detection when both name and value match", () => {
    // Name → "GitHub Token" (EXACT), value → "GitHub Personal Access Token"
    const result = resolveSecret("GITHUB_TOKEN", "ghp_abcdefghijklmnopqrst");
    expect(result).toMatchObject({ service: "GitHub", label: "GitHub Token" });
  });

  it("falls back to value pattern when name is not a secret", () => {
    const result = resolveSecret("MY_CONFIG", "ghp_abcdefghijklmnopqrst");
    expect(result).toMatchObject({ service: "GitHub", label: "GitHub Personal Access Token" });
  });

  it("returns null when neither name nor value matches", () => {
    expect(resolveSecret("PATH", "C:\\Windows\\System32")).toBeNull();
    expect(resolveSecret("JAVA_HOME", "C:\\jdk21")).toBeNull();
  });
});

describe("isSecretVar", () => {
  it("returns true for secret variable names", () => {
    expect(isSecretVar("AWS_SECRET_ACCESS_KEY")).toBe(true);
    expect(isSecretVar("GITHUB_TOKEN")).toBe(true);
    expect(isSecretVar("MY_PASSWORD")).toBe(true);
  });

  it("returns false for non-secret variable names", () => {
    expect(isSecretVar("PATH")).toBe(false);
    expect(isSecretVar("JAVA_HOME")).toBe(false);
    expect(isSecretVar("USERNAME")).toBe(false);
  });
});
