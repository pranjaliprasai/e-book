import express from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import bookRoute from "./book.route.js";
import highlightRoute from "./highlight.route.js";
import milestoneRoute from "./milestone.route.js";
import notificationRoute from "./notification.route.js";
import khaltiRoute from "./khalti.route.js";
import systemRoute from "./system.route.js";
import commentRoute from "./comment.route.js";
import recommendationRoute from "./recommendation.route.js";
const app = express.Router();

app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/book", bookRoute);
app.use("/highlight", highlightRoute);
app.use("/milestones", milestoneRoute);
app.use("/notifications", notificationRoute);
app.use("/khalti", khaltiRoute);
app.use("/system", systemRoute);
app.use("/comment", commentRoute);
app.use("/recommendation", recommendationRoute);

export default app;
