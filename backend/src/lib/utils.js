import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId, res) => {
  const { JWT_SECRET, NODE_ENV } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  const isDev = NODE_ENV === "development";

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: !isDev,                 // ✅ HTTPS only in production
    sameSite: isDev ? "Lax" : "None", // ✅ "None" for cross-site (Vercel <-> Render)
    path: "/",                       // ✅ ensures cookie is sent for all routes
  });

  return token;
};
