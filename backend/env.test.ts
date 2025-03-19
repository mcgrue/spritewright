import { assertEquals, assertThrows } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";
import { validateEnvFile } from "./env.ts";

describe("validateEnvFile", () => {
  // Test basic KEY=VALUE parsing
  it("should parse basic KEY=VALUE pairs", () => {
    const input = "FOO=bar";
    const result = validateEnvFile(input);
    assertEquals(result, { FOO: "bar" });
  });
  // Test newline handling (unix/dos agnostic)
  it("should handle both UNIX and Windows line endings", () => {
    const unixInput = "FOO=bar\nBAR=baz";
    const windowsInput = "FOO=bar\r\nBAR=baz";
    const unixResult = validateEnvFile(unixInput);
    const windowsResult = validateEnvFile(windowsInput);
    assertEquals(unixResult, { FOO: "bar", BAR: "baz" });
    assertEquals(windowsResult, { FOO: "bar", BAR: "baz" });
  });
  // Test whitespace trimming
  it("should trim trailing whitespace from VALUE and leading whitespace from KEY", () => {
    const input = "  FOO=bar  \n   BAR=baz   ";
    const result = validateEnvFile(input);
    assertEquals(result, { FOO: "bar", BAR: "baz" });
  });
  // Test empty line handling
  it("should ignore empty lines", () => {
    const input = "\n\nFOO=bar\n\nBAR=baz\n\n";
    const result = validateEnvFile(input);
    assertEquals(result, { FOO: "bar", BAR: "baz" });
  });
  // Test comment handling
  it("should ignore lines starting with # or ;", () => {
    const input = `
      # This is a comment      FOO=bar
      ; This is another comment      BAR=baz
			   TACO=CABANA
    `;
    const result = validateEnvFile(input);
    assertEquals(result, { "TACO": "CABANA" });
  });
  // Test invalid format handling
  it("should throw error on invalid format (missing =)", () => {
    const input = "FOO=bar\nBAZbaz";
    assertThrows(
      () => validateEnvFile(input),
      Error,
      "Invalid format at line 2: BAZbaz",
    );
  });
  // Test invalid key format
  it("should throw error on invalid key format", () => {
    const input = "FOO-BAR=baz";
    assertThrows(
      () => validateEnvFile(input),
      Error,
      "Invalid key format at line 1: FOO-BAR",
    );
  });
  // Test duplicate keys
  it("should throw error on duplicate keys", () => {
    const input = "FOO=bar\nFOO=baz";
    assertThrows(
      () => validateEnvFile(input),
      Error,
      "Duplicate key at line 2: FOO",
    );
  });
  // Test value with = sign
  it("should allow = in values", () => {
    const input = "FOO=bar=baz";
    const result = validateEnvFile(input);
    assertEquals(result, { FOO: "bar=baz" });
  });
  // Test empty value

  it("should NOT allow empty values", () => {
    const input = "FOO=";
    assertThrows(
      () => validateEnvFile(input),
      Error,
      "Invalid format at line 1: FOO=",
    );
  });
});
