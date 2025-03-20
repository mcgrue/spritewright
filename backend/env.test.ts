import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";
import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing/bdd";
import {
  createFileWithContent,
  deleteFileIfExists,
} from "../deno-common/file.ts";
import { envVars, parse, validateEnvData } from "./env.ts";

describe("validateEnvFile", () => {
  it("should parse basic KEY=VALUE pairs", () => {
    const input = "FOO=bar";
    const result = validateEnvData(input);
    assertEquals(result, { FOO: "bar" });
  });

  it("should handle both UNIX and Windows line endings", () => {
    const unixInput = "FOO=bar\nBAR=baz";
    const windowsInput = "FOO=bar\r\nBAR=baz";
    const unixResult = validateEnvData(unixInput);
    const windowsResult = validateEnvData(windowsInput);
    assertEquals(unixResult, { FOO: "bar", BAR: "baz" });
    assertEquals(windowsResult, { FOO: "bar", BAR: "baz" });
  });

  it("should trim trailing whitespace from VALUE and leading whitespace from KEY", () => {
    const input = "  FOO=bar  \n   BAR=baz   ";
    const result = validateEnvData(input);
    assertEquals(result, { FOO: "bar", BAR: "baz" });
  });

  it("should ignore empty lines", () => {
    const input = "\n\nFOO=bar\n\nBAR=baz\n\n";
    const result = validateEnvData(input);
    assertEquals(result, { FOO: "bar", BAR: "baz" });
  });

  it("should ignore lines starting with # or ;", () => {
    const input = `
      # This is a comment      FOO=bar
      ; This is another comment      BAR=baz
			   TACO=CABANA
    `;
    const result = validateEnvData(input);
    assertEquals(result, { "TACO": "CABANA" });
  });

  it("should throw error on invalid format (missing =)", () => {
    const input = "FOO=bar\nBAZbaz";
    assertThrows(
      () => validateEnvData(input),
      Error,
      "Invalid format at line 2: BAZbaz",
    );
  });

  it("should throw error on invalid key format", () => {
    const input = "FOO-BAR=baz";
    assertThrows(
      () => validateEnvData(input),
      Error,
      "Invalid key format at line 1: FOO-BAR",
    );
  });

  it("should throw error on duplicate keys", () => {
    const input = "FOO=bar\nFOO=baz";
    assertThrows(
      () => validateEnvData(input),
      Error,
      "Duplicate key at line 2: FOO",
    );
  });

  it("should allow = in values", () => {
    const input = "FOO=bar=baz";
    const result = validateEnvData(input);
    assertEquals(result, { FOO: "bar=baz" });
  });
  // Test empty value

  it("should NOT allow empty values", () => {
    const input = "FOO=";
    assertThrows(
      () => validateEnvData(input),
      Error,
      "Invalid format at line 1: FOO=",
    );
  });
});

describe("parse", () => {
  const ENV_FILE = ".test-env";

  beforeEach(async () => {
    await deleteFileIfExists(ENV_FILE);
    // Clear any existing env vars that might interfere with tests
    Deno.env.delete("IS_DEVELOPMENT");
    Deno.env.delete("IS_PRODUCTION");
  });

  afterEach(async () => {
    await deleteFileIfExists(ENV_FILE);
    // Clean up env vars
    Deno.env.delete("IS_DEVELOPMENT");
    Deno.env.delete("IS_PRODUCTION");

    assertFalse(await exists(ENV_FILE));
  });

  it("should not have a test env file by default", async () => {
    assertFalse(await exists(ENV_FILE));
  });

  describe(" with .env file", () => {
    beforeEach(async () => {
      await deleteFileIfExists(ENV_FILE);
      await createFileWithContent(
        ENV_FILE,
        "IS_DEVELOPMENT=true\nIS_PRODUCTION=false",
      );
    });

    it("should have a test env file by default in the specific tests", async () => {
      assert(await exists(ENV_FILE));
    });
  });

  it("should throw error when required env vars are missing", async () => {
    const numRequired = envVars.filter((envVar) => envVar.required).length;

    assert(numRequired > 0);

    await assertRejects(
      async () => {
        await parse(ENV_FILE);
      },
      Error,
      `Missing required env vars: ${numRequired}`,
    );
  });

  it("should load values from .env file", async () => {
    await createFileWithContent(
      ENV_FILE,
      "IS_DEVELOPMENT=true\nIS_PRODUCTION=false",
    );

    const env = await parse(ENV_FILE);
    assertEquals(env.IS_DEVELOPMENT, "true");
    assertEquals(env.IS_PRODUCTION, "false");
  });

  it("should prefer system env vars over .env file", async () => {
    await createFileWithContent(
      ENV_FILE,
      "IS_DEVELOPMENT=false\nIS_PRODUCTION=false",
    );

    // Set system env vars
    Deno.env.set("IS_DEVELOPMENT", "true");
    Deno.env.set("IS_PRODUCTION", "true");

    const env = await parse(ENV_FILE);
    assertEquals(env.IS_DEVELOPMENT, "true");
    assertEquals(env.IS_PRODUCTION, "true");
  });

  it("should error on unknown env vars", async () => {
    await createFileWithContent(
      ENV_FILE,
      "IS_DEVELOPMENT=true\nIS_PRODUCTION=false\nUNKNOWN_VAR=test",
    );

    await assertRejects(
      async () => {
        await parse(ENV_FILE);
      },
      Error,
      "Unknown env var: UNKNOWN_VAR",
    );
  });
});
