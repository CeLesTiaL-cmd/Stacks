import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";

// Same fix as config/db.js — some networks fail to resolve Atlas SRV records
dns.setServers(["8.8.8.8", "1.1.1.1"]);

await mongoose.connect(process.env.MONGODB_URI);
const result = await mongoose.connection.db.collection("contents").updateMany(
  { visibility: { $nin: ["public", "institutional", "protected"] } },
  { $set: { visibility: "protected", authorizedEmails: [], institutionDomain: "" } }
);
console.log("Updated:", result.modifiedCount);
await mongoose.disconnect();