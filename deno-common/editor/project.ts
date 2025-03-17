export type Project = {
  readonly name: string;
  readonly owner: string;
};

export type CreateProjectInput = {
  name: string;
  owner: string;
};

export const createProject = (input: CreateProjectInput): Project => {
  if (!input.name.trim()) {
    throw new Error("Project name cannot be empty");
  }
  if (!input.owner.trim()) {
    throw new Error("Owner name cannot be empty");
  }

  return {
    name: input.name,
    owner: input.owner,
  };
};

export const projectToString = (project: Project): string => {
  return `Project: ${project.name} (Owner: ${project.owner})`;
};
