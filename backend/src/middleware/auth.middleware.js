import jwt from "jsonwebtoken";
import User from "../models/User.js";


export const protectRoute = async (req, res, next) => {
   try {
        const token = req.cookies.token; // make sure cookie name matches
        if (!token) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({
                message: "Invalid token",
                success: false,
            });
        }

        // Fetch user from DB
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        req.user = user; // attach full user
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};
