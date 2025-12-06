import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGO_URL;

    if (!mongoURL) {
      throw new Error("❌ MONGO_URL is not defined");
    }

    await mongoose.connect(mongoURL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB Atlas Connected Successfully");

    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "MongoDB connection error:"));
    db.once("open", () => {
      console.log("Connected to MongoDB Atlas database");
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);

    if (error.name === "MongooseServerSelectionError") {
      console.error("\n⚠️  Possible issues:");
      console.error("1. Check your MongoDB Atlas cluster is running");
      console.error("2. Verify your IP is whitelisted in MongoDB Atlas");
      console.error("3. Check your username/password in the connection string");
    }

    process.exit(1);
  }
};
