import { toLines } from "@std/streams/unstable-to-lines";
import { walk } from "jsr:@std/fs/walk";
import { relative } from "jsr:@std/path";

async function readGitignorePatterns(): Promise<string[]> {
  const patterns: string[] = [];
  try {
    const file = await Deno.open(".gitignore");
    const lines = toLines(file.readable);
    for await (const line of lines) {
      if (line && !line.startsWith("#")) {
        patterns.push(line);
      }
    }
    file.close();
  } catch {
    // File doesn't exist, return empty array
  }
  return patterns;
}

async function readNoTestPatterns(): Promise<string[]> {
  try {
    const content = await Deno.readTextFile(".no-test.json");
    const patterns = JSON.parse(content) as string[];

    // Validate that all files in .no-test.json exist
    const missingFiles: string[] = [];
    for (const pattern of patterns) {
      try {
        await Deno.stat(pattern);
      } catch {
        missingFiles.push(pattern);
      }
    }

    if (missingFiles.length > 0) {
      console.log("The following files in .no-test.json do not exist:");
      missingFiles.forEach((file) => console.log(`  ${file}`));
      throw new Error("Please remove non-existent files from .no-test.json");
    }

    return patterns;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    throw error;
  }
}

function convertGitignoreToRegex(pattern: string): RegExp {
  let regexPattern = pattern.trim()
    .replace(/\./g, "\\.") // Escape dots
    .replace(/\*/g, ".*") // Convert * to .*
    .replace(/\?/g, "."); // Convert ? to .

  // Handle directory indicators
  if (regexPattern.endsWith("/")) {
    regexPattern += ".*";
  }

  return new RegExp(`^.*${regexPattern}.*$`);
}

async function main() {
  const gitignorePatterns = await readGitignorePatterns();
  const noTestPatterns = await readNoTestPatterns();
  const regexPatterns = gitignorePatterns.map(convertGitignoreToRegex);

  const missingTests: string[] = [];
  const cwd = Deno.cwd();

  // Find all .ts and .tsx files
  for await (
    const entry of walk(cwd, {
      exts: ["ts", "tsx"],
      skip: [/\.test\.(ts|tsx)$/, /node_modules/, /dist/],
    })
  ) {
    if (!entry.isFile) continue;

    const relativePath = relative(cwd, entry.path).replace(/\\/g, "/");

    // Check if file matches any gitignore pattern
    const isIgnored = regexPatterns.some((pattern) =>
      pattern.test(relativePath)
    ) ||
      noTestPatterns.includes(relativePath);

    if (!isIgnored) {
      // Construct the expected test file path
      const testFile = entry.path.replace(/\.(ts|tsx)$/, ".test.$1");
      try {
        await Deno.stat(testFile);
      } catch {
        missingTests.push(relativePath);
      }
    }
  }

  if (missingTests.length > 0) {
    console.log("The following files are missing test files:");
    missingTests.forEach((file) => console.log(`  ${file}`));
    throw new Error("Please add test files for the above files.");
  }

  console.log("All source files have corresponding test files");
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.stack);
    } else {
      console.error(error);
    }
    Deno.exit(1);
  }
}
