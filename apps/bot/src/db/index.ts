import mongoose from "mongoose";
import { config } from "../config.js";

export async function connectDB() {
  await mongoose.connect(config.mongodb.uri, { dbName: config.mongodb.dbName });
  console.log("[DB] MongoDB connected");
}

export { mongoose };
