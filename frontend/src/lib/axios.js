import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://chat-application-2-j309.onrender.com/api" : "/api",
  withCredentials: true,
});
