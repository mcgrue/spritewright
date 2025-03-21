import { assertEquals, assertRejects } from "jsr:@std/assert";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing/bdd";
import {
  createFileWithContent,
  deleteFileIfExists,
  readFileContents,
} from "./file.ts";

describe("file utilities", () => {
  const TEST_FILE = "test_file.txt";
  const TEST_CONTENT = "Hello, World!";

  // Clean up before each test
  beforeEach(async () => {
    await deleteFileIfExists(TEST_FILE);
  });

  // Clean up after each test
  afterEach(async () => {
    await deleteFileIfExists(TEST_FILE);
  });

  describe("createFileWithContent", () => {
    it("should create a file with given content", async () => {
      await createFileWithContent(TEST_FILE, TEST_CONTENT);
      const content = await Deno.readTextFile(TEST_FILE);
      assertEquals(content, TEST_CONTENT);
    });

    it("should overwrite existing file", async () => {
      await createFileWithContent(TEST_FILE, "old content");
      await createFileWithContent(TEST_FILE, TEST_CONTENT);
      const content = await Deno.readTextFile(TEST_FILE);
      assertEquals(content, TEST_CONTENT);
    });
  });

  describe("readFileContents", () => {
    it("should read file contents correctly", async () => {
      await createFileWithContent(TEST_FILE, TEST_CONTENT);
      const content = await readFileContents(TEST_FILE);
      assertEquals(content, TEST_CONTENT);
    });

    it("should throw error for non-existent file", async () => {
      await assertRejects(
        async () => {
          await readFileContents("non_existent_file.txt");
        },
        Error,
      );
    });
  });

  describe("deleteFileIfExists", () => {
    it("should delete existing file", async () => {
      // Create file
      await createFileWithContent(TEST_FILE, TEST_CONTENT);

      // Verify file exists
      const exists = await Deno.stat(TEST_FILE)
        .then(() => true)
        .catch(() => false);
      assertEquals(exists, true);

      // Delete file
      await deleteFileIfExists(TEST_FILE);

      // Verify file no longer exists
      const existsAfterDelete = await Deno.stat(TEST_FILE)
        .then(() => true)
        .catch(() => false);
      assertEquals(existsAfterDelete, false);
    });

    it("should not throw error for non-existent file", async () => {
      let errored = false;

      try {
        await deleteFileIfExists("non_existent_file.txt");
      } catch (e) {
        console.error(e);
        errored = true;
      }

      assertEquals(errored, false);
    });
  });

  describe("integration", () => {
    it("should handle full file lifecycle", async () => {
      // Create
      await createFileWithContent(TEST_FILE, TEST_CONTENT);

      // Read
      const content = await readFileContents(TEST_FILE);
      assertEquals(content, TEST_CONTENT);

      // Delete
      await deleteFileIfExists(TEST_FILE);

      // Verify deleted
      await assertRejects(
        async () => {
          await readFileContents(TEST_FILE);
        },
        Error,
      );
    });
  });
});
