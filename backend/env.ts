export type EnvVar = {
  name: string;
  description: string;
  required?: boolean;
  defaultValue?: string;
};

export const envVars: EnvVar[] = [
  {
    name: "IS_DEVELOPMENT",
    description: "true if running in development mode",
    required: true,
  },
  {
    name: "IS_PRODUCTION",
    description: "true if running in development mode",
    required: true,
  },
];

export const VALID_ENV_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

// create a union type that's all the name values of envVars
export type EnvVarName = typeof envVars[number]["name"];

/**
 * returns a mapping of KEY=VALUE pairs from the given string.
 * Newline delimited per entry.
 * Parser is unix/dos agnostic.
 * trims all trailing whitespace from the VALUE and all leading whitespace from the KEY.
 * Ignores empty lines.
 * Ignores any line where the key starts with # or ;
 *
 * @param contents the string to parse
 * @returns a dict of KEY=VALUE pairs
 * @throws Error if any of the above cases is invalid
 */
export const validateEnvFile = (contents: string): Record<string, string> => {
  contents = contents + "\n";
  const result: Record<string, string> = {};

  // Split on newlines, handling both UNIX and Windows line endings
  const lines = contents.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith("#") || line.startsWith(";")) {
      continue;
    }

    // Split on first = only
    const parts = line.split(/=(.+)/);
    if (parts.length < 2) {
      throw new Error(`Invalid format at line ${i + 1}: ${line}`);
    }

    const key = parts[0].trimStart();
    const value = parts[1]?.trimEnd() ?? "";

    // Validate key format using the existing regex
    if (!VALID_ENV_NAME_REGEX.test(key)) {
      throw new Error(`Invalid key format at line ${i + 1}: ${key}`);
    }

    // Check for duplicate keys
    if (key in result) {
      throw new Error(`Duplicate key at line ${i + 1}: ${key}`);
    }

    result[key] = value;
  }

  return result;
};

// export const parse(): void {
//   // if there's a .env file in the project's base directory, load it
// 	if (await Deno.stat(".env")) {
// 		console.log("found .env file: loading...");

// 		validate

// 	} else {
// 		console.log("no .env file found");
// 	}
// }

// export const get(name: EnvVarName): string {
//   return Deno.env.get(name);
// }
