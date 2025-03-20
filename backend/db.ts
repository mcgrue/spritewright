import { ensureDirSync } from "https://deno.land/std/fs/ensure_dir.ts";
import { DataTypes, Model, Sequelize } from "npm:sequelize";
import "npm:sqlite3";
import { deleteFileIfExists } from "../deno-common/file.ts";

const DB_DIR = "./db";
const DB_PATH = `${DB_DIR}/database.sqlite`;

// Define the Dinosaur interface
interface DinosaurAttributes {
  name: string;
  description: string;
}

// Define the Dinosaur model with proper typing
interface DinosaurInstance
  extends Model<DinosaurAttributes, DinosaurAttributes>, DinosaurAttributes {}

export const create = async () => {
  try {
    const stats = await Deno.stat(DB_DIR);
    if (!stats.isDirectory) {
      await deleteFileIfExists(DB_DIR);
    }
  } catch (_) {
    // If stat fails, the path doesn't exist, which is fine
  }

  ensureDirSync(DB_DIR);

  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: DB_PATH,
    logging: false,
  });

  const Dinosaur = sequelize.define<DinosaurInstance>("dinosaur", {
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  await Dinosaur.sync();
  return { sequelize, Dinosaur };
};

export const test = async () => {
  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: DB_PATH,
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  } finally {
    await sequelize.close();
  }
};

export const cleanup = async () => {
  await deleteFileIfExists(DB_PATH);
};

/**
 * inserts a dinosaur into the database if the name doesn't exist; otherwise updates it
 *
 * @param name Dino's name
 * @param description Dino's description
 */
export const insertDinosaurs = async (name: string, description: string) => {
  const { Dinosaur } = await create();

  const dino = await Dinosaur.findOne({ where: { name } });

  if (dino) {
    await dino.update({ description });
  } else {
    await Dinosaur.create({ name, description });
  }
};

/**
 * returns all dinosaurs in the database
 */
export const getAllDinosaurs = async () => {
  const { Dinosaur } = await create();
  return await Dinosaur.findAll();
};
