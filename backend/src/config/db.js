import mongoose from "mongoose";
//create function using async and await for long-running tasks
export const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGO_URL;

    if (!mongoURL) {
      throw new Error(" MONGO_URL is not defined");
    }

    await mongoose.connect(mongoURL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000, // Stop waiting for response after 45 seconds
    });

    console.log(" MongoDB Atlas Connected Successfully");

    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "MongoDB connection error:"));
    db.once("open", () => {
      console.log("Connected to MongoDB Atlas database");
    });
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);

    process.exit(1); //stops the server doesnt run
  }
};
//orm obejrct relation mapper
