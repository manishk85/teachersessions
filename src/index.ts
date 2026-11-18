import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import userRoutes from "./routes/userRoutes";
import teacherRoutes from "./routes/teacherRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import errorHandler from "./middleware/errorHandler";

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "Session booking API is running" });
});

app.use("/users", userRoutes);
app.use("/teachers", teacherRoutes);
app.use("/sessions", sessionRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

const startServer = async () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI is missing in .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
};

startServer();
