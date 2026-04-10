import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

// Auto-attach token to every request if it exists
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["ngrok-skip-browser-warning"] = "true";
    return config;
});

export const getUsersAPI = (params) => API.get("/user", { params });
export const createUserAPI = (data) => API.post("/user", data);
export const deleteUserAPI = (id) => API.delete(`/user/${id}`);
export const updateUserAPI = (id, data) => API.put(`/user/${id}`, data);
export const updateMyProfileAPI = (formData) => API.put("/user/profile", formData);
