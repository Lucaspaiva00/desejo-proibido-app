import axios from "axios";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "https://desejoproibido.app/api",
  timeout: 20000,
});
