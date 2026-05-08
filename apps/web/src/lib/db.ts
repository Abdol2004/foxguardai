import mongoose from "mongoose";

const MONGODB_URI = process.env["MONGODB_URI"]!;

declare global {
  var _mongooseConn: typeof mongoose | undefined;
}

export async function connectDB() {
  if (global._mongooseConn) return global._mongooseConn;
  global._mongooseConn = await mongoose.connect(MONGODB_URI, {
    dbName: process.env["MONGODB_DB_NAME"] ?? "foxguard",
  });
  return global._mongooseConn;
}
