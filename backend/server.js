import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World from Pranjali Kathmandu!");
});

const PORT = process.env.PORT || 3000;

console;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
