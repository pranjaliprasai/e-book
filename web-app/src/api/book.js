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

export const getBooksAPI = (params) => API.get("/book", { params });

export const addBookAPI = (formData) => API.post("/book", formData);

export const updateBookAPI = (id, formData) => API.put(`/book/${id}`, formData);

export const deleteBookAPI = (id) => API.delete(`/book/${id}`);
