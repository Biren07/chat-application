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
const PORT = ENV.PORT || 5000;

// --- Middleware --- //
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// CORS setup: allow local dev + production frontend
const allowedOrigins = [
  "http://localhost:5173", 
  ENV.CLIENT_URL || "https://chat-application-five-bice.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// --- API Routes --- //
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// --- Start Server --- //
server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
  connectDB();
});

// --- Serve Frontend in Production --- //
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}


