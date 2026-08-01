import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in .env");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);

  console.log(`MongoDB connected -> ${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
}
