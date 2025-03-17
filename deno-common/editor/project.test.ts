import { assertEquals, assertThrows } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";
import { createProject, type Project, projectToString } from "./project.ts";

describe("project", () => {
  it("should create a project with name and owner", () => {
    const project = createProject({ name: "Test Project", owner: "John Doe" });
    assertEquals(project.name, "Test Project");
    assertEquals(project.owner, "John Doe");
  });

  it("should throw error when creating with empty name", () => {
    assertThrows(
      () => createProject({ name: "", owner: "John Doe" }),
      Error,
      "Project name cannot be empty",
    );
  });

  it("should throw error when creating with empty owner", () => {
    assertThrows(
      () => createProject({ name: "Test Project", owner: "" }),
      Error,
      "Owner name cannot be empty",
    );
  });

  it("should throw error when creating with whitespace-only name", () => {
    assertThrows(
      () => createProject({ name: "   ", owner: "John Doe" }),
      Error,
      "Project name cannot be empty",
    );
  });

  it("should throw error when creating with whitespace-only owner", () => {
    assertThrows(
      () => createProject({ name: "Test Project", owner: "  " }),
      Error,
      "Owner name cannot be empty",
    );
  });

  it("should return correct string representation", () => {
    const project: Project = { name: "Test Project", owner: "John Doe" };
    assertEquals(
      projectToString(project),
      "Project: Test Project (Owner: John Doe)",
    );
  });

  // This test will catch the typo in the original code where 'owner' is misspelled as 'oner'
  it("should correctly assign owner property", () => {
    const project = createProject({ name: "Test", owner: "Alice" });
    assertEquals(
      project.owner,
      "Alice",
      "Owner property should be correctly assigned",
    );
  });
});
