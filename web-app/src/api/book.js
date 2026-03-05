import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

// Auto-attach token to every request if it exists
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getBooksAPI = () => API.get("/book");

export const addBookAPI = (formData) =>
    API.post("/book", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const updateBookAPI = (id, formData) =>
    API.put(`/book/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const deleteBookAPI = (id) => API.delete(`/book/${id}`);
