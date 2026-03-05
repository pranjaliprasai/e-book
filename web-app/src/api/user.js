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

export const getUsersAPI = () => API.get("/user");
export const deleteUserAPI = (id) => API.delete(`/user/${id}`);
