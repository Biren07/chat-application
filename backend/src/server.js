import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

const __dirname = path.resolve();
const PORT = ENV.PORT || 3000;

// --- Middleware --- //
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// CORS setup: allow local dev + production frontend
const allowedOrigins = [
  "http://localhost:5173",                  // React dev server
  ENV.CLIENT_URL || "https://chat-application-five-bice.vercel.app", // production frontend
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow cookies/auth headers
  })
);

// --- API Routes --- //
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// --- Serve Frontend in Production --- //
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// --- Start Server --- //
server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
  connectDB();
});
