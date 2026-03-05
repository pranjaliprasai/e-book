import express from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import bookRoute from "./book.route.js";
const app = express.Router();

app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/book", bookRoute);

export default app;
