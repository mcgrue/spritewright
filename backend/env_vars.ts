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
