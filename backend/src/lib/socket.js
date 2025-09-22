import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

// Store online users
const userSocketMap = {}; // {userId: socketId}

// Apply authentication middleware
io.use(socketAuthMiddleware);

// Helper to get a user's socket ID
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.userId;
  console.log("User connected:", socket.user.fullName);

  // Add user to online list
  userSocketMap[userId] = socket.id;

  // Emit online users to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ---------------- TYPING INDICATOR ----------------
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { senderId: userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStopTyping", { senderId: userId });
    }
  });

  // ---------------- MESSAGE REACTIONS ----------------
  socket.on("reaction", ({ messageId, emoji }) => {
    io.emit("reactionUpdated", { messageId, emoji, userId });
  });

  // ---------------- VOICE & VIDEO CALLS ----------------
  socket.on("startCall", ({ receiverId, type }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        callerId: userId,
        callerName: socket.user.fullName,
        type, // "video" or "voice"
      });
    }
  });

  socket.on("acceptCall", ({ callerId }) => {
    const callerSocketId = userSocketMap[callerId];
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", { receiverId: userId });
    }
  });

  socket.on("rejectCall", ({ callerId }) => {
    const callerSocketId = userSocketMap[callerId];
    if (callerSocketId) {
      io.to(callerSocketId).emit("callRejected", { receiverId: userId });
    }
  });

  socket.on("endCall", ({ otherUserId }) => {
    const otherSocketId = userSocketMap[otherUserId];
    if (otherSocketId) {
      io.to(otherSocketId).emit("callEnded", { userId });
    }
  });

  // ---------------- WEBRTC SIGNALING ----------------
  socket.on("webrtcOffer", ({ receiverId, offer }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtcOffer", { senderId: userId, offer });
    }
  });

  socket.on("webrtcAnswer", ({ receiverId, answer }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtcAnswer", { senderId: userId, answer });
    }
  });

  socket.on("iceCandidate", ({ receiverId, candidate }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("iceCandidate", { senderId: userId, candidate });
    }
  });

  // ---------------- DISCONNECT ----------------
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
