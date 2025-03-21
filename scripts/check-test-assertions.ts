import ts from "npm:typescript";

const isVerbose = Deno.args.includes("-v");

function verbose(msg: string): void {
  if (isVerbose) {
    console.log(msg);
  }
}

verbose("=======================");
verbose("Verbose logging enabled");
verbose("=======================");

interface TestCase {
  name: string;
  body: string;
  hasAssertion: boolean;
}

function findTestCases(sourceCode: string): TestCase[] {
  const sourceFile = ts.createSourceFile(
    "test.ts",
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
  );
  const testCases: TestCase[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "it"
    ) {
      const args = node.arguments;
      if (args.length >= 2) {
        const testName = args[0].getText().replace(/[`'"]/g, "");
        const testFn = args[1];

        let hasAssertion = false;
        // Walk the function body looking for assert calls
        // deno-lint-ignore no-inner-declarations
        function checkForAssertions(node: ts.Node) {
          if (
            ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text.startsWith("assert")
          ) {
            hasAssertion = true;
          }
          ts.forEachChild(node, checkForAssertions);
        }

        ts.forEachChild(testFn, checkForAssertions);

        testCases.push({
          name: testName,
          body: testFn.getText(),
          hasAssertion,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return testCases;
}

// Read .gitignore patterns
const gitignoreContent = await Deno.readTextFile(".gitignore").catch(() => "");
const gitignorePatterns = [
  // Always ignore .git folder
  new RegExp("^.*\\.git.*$"),
  // Parse patterns from .gitignore
  ...gitignoreContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#")) // Filter out empty lines and comments
    .map((pattern) => {
      // Convert .gitignore pattern to regex
      pattern = pattern.replace(/\./g, "\\."); // Escape dots
      pattern = pattern.replace(/\*/g, ".*"); // Convert * to .*
      pattern = pattern.replace(/\?/g, "."); // Convert ? to .
      // Handle directory indicators
      if (pattern.endsWith("/")) {
        pattern += ".*";
      }
      return new RegExp(`^.*${pattern}.*$`);
    }),
];

function isIgnored(path: string): boolean {
  const normalizedPath = path.replace(/\\/g, "/");
  return gitignorePatterns.some((pattern) => pattern.test(normalizedPath));
}

function findTestFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of Deno.readDirSync(dir)) {
    const path = `${dir}/${entry.name}`;

    if (isIgnored(path)) {
      verbose(`Skipping ignored path: ${path}`);
      continue;
    }

    if (entry.isDirectory) {
      files.push(...findTestFiles(path));
    } else if (entry.isFile && entry.name.endsWith(".test.ts")) {
      files.push(path);
    }
  }

  return files;
}

const testFiles = findTestFiles(".")
  .map((path) => ({ name: path }));

if (isVerbose) {
  verbose("Found test files:");
  verbose("------------------");
  verbose(testFiles.map((file) => file.name).join("\n"));
} else {
  console.log(`Found ${testFiles.length} test files`);
}

if (testFiles.length === 0) {
  console.log("No test files found. Exiting wioth error.");
  Deno.exit(1);
}

console.log(`\nChecking ${testFiles.length} test files for assertions:`);
console.log("----------------------------------");

let hasErrors = false;
let skipCount = 0;

for (const file of testFiles) {
  const content = Deno.readTextFileSync(file.name);
  const testCases = findTestCases(content);

  for (const test of testCases) {
    const hasShibboleth = test.name.includes("@INTENTIONAL_NO_ASSERT");

    if (!test.hasAssertion) {
      if (hasShibboleth) {
        verbose(`Skipping test case with @INTENTIONAL_NO_ASSERT: ${test.name}`);
        ++skipCount;
        continue;
      }

      hasErrors = true;
      console.error(`\nError in file: ${file.name}`);
      console.error(`Test case '${test.name}' has no assertions`);
      console.error(`Test body:\n${test.body}\n`);
    } else {
      // if the test has both @INTENTIONAL_NO_ASSERT and assertions, throw an error
      if (hasShibboleth) {
        console.error(`\nError in file: ${file.name}`);
        console.error(
          `Test case '${test.name}' has @INTENTIONAL_NO_ASSERT but also HAS assertions`,
        );
        console.error(`Test body:\n${test.body}\n`);
      }
    }
  }
}

if (hasErrors) {
  console.error(
    "Found test cases without assertions. Each 'it' block must contain at least one assertion.",
  );
  Deno.exit(1);
}

console.log("All test cases contain assertions");

if (skipCount > 0) {
  console.log(`(${skipCount} test cases with @INTENTIONAL_NO_ASSERT)`);
}

Deno.exit(0);
