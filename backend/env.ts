import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";

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
export const validateEnvData = (contents: string): Record<string, string> => {
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

let _env: Record<string, string> = {};

export const parse = async (
  filePath: string,
): Promise<Record<string, string>> => {
  const parseDotEnvIfPresent = async (): Promise<Record<string, string>> => {
    // if there's a .env file in the project's base directory, load it
    if (await exists(filePath)) {
      console.log(`found ${filePath} file: loading...`);

      const contents = await Deno.readTextFile(filePath);
      return validateEnvData(contents);
    } else {
      console.log(`no ${filePath} file found`);
      return {};
    }
  };

  const dotEnv = await parseDotEnvIfPresent();

  // error if there are any env vars in the .env file that are not in envVars
  Object.keys(dotEnv).forEach((key) => {
    if (!envVars.some((envVar) => envVar.name === key)) {
      throw new Error(`Unknown env var: ${key}`);
    }
  });

  _env = {
    ...dotEnv,
    ...Deno.env.toObject(),
  };

  // prune any keys in _env that are not in envVars
  _env = Object.fromEntries(
    Object.entries(_env).filter(([key]) =>
      envVars.some((envVar) => envVar.name === key)
    ),
  );

  // print out any missing required env vars
  let missing = 0;
  envVars.forEach((envVar) => {
    if (envVar.required && !_env[envVar.name]) {
      console.error(`Missing required env var: ${envVar.name}`);
      ++missing;
    }
  });

  if (missing > 0) {
    throw new Error(`Missing required env vars: ${missing}`);
  }

  envVars.forEach((envVar) => {
    if (_env[envVar.name] && dotEnv[envVar.name] && Deno.env.get(envVar.name)) {
      console.error(
        `Env var '${envVar.name}' in both .env and system environment; using system environment value`,
      );
    }
  });

  return _env;
};

// export const get(name: EnvVarName): string {
//   return Deno.env.get(name);
// }
