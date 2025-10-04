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

  // Determine if we are on localhost or production
  const isLocalhost = NODE_ENV === "development";

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,                  // prevent JS access
    secure: !isLocalhost,            // true in production (HTTPS), false in localhost
    sameSite: "None",                // allow cross-site cookie
  });

  return token;
};
