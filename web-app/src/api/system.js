import axios from "axios";

const API = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/system`,
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["ngrok-skip-browser-warning"] = "true";
    return config;
});

export const getSystemSettingsAPI = () => API.get("/");
export const updateSystemSettingsAPI = (data) => API.patch("/", data);
