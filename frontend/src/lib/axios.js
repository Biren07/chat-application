import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development"
    ? "https://chat-application-6-o3f1.onrender.com/api"
    : "/api",
  withCredentials: true, 
});
