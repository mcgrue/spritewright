import { assertEquals } from "jsr:@std/assert/equals";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { cleanup, create, test } from "./db.ts";

describe("db", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("should connect to the database", async () => {
    const { sequelize } = await create();
    await test();
    await sequelize.close();
    assertEquals(true, true);
  });

  it("should create and find dinosaurs", async () => {
    const { Dinosaur, sequelize } = await create();

    // Create a test dinosaur
    await Dinosaur.create({
      name: "TestDino",
      description: "A test dinosaur",
    });

    // Find all dinosaurs
    const dinosaurs = await Dinosaur.findAll();

    // Convert to plain objects for easier testing
    const plainDinosaurs = dinosaurs.map((dino) => dino.get({ plain: true }));

    assertEquals(plainDinosaurs.length, 1);
    assertEquals(plainDinosaurs[0].name, "TestDino");
    assertEquals(plainDinosaurs[0].description, "A test dinosaur");

    await sequelize.close();
  });

  it("should update dinosaurs", async () => {
    const { Dinosaur, sequelize } = await create();
    await Dinosaur.create({
      name: "TestDino",
      description: "A test dinosaur",
    });
    const dino = await Dinosaur.findOne({ where: { name: "TestDino" } });
    await dino?.update({ description: "Updated description" });
    const updatedDino = await Dinosaur.findOne({ where: { name: "TestDino" } });
    assertEquals(updatedDino?.description, "Updated description");
    await sequelize.close();
  });

  it("can return 3 dinosaurs", async () => {
    const { Dinosaur, sequelize } = await create();
    await Dinosaur.create({
      name: "TestDino1",
      description: "A test dinosaur",
    });
    await Dinosaur.create({
      name: "TestDino2",
      description: "A test dinosaur",
    });
    await Dinosaur.create({
      name: "TestDino3",
      description: "A test dinosaur",
    });
    const dinosaurs = await Dinosaur.findAll();
    assertEquals(dinosaurs.length, 3);
    await sequelize.close();
  });
});
