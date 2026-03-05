export const API_BASE_URL = "http://192.168.1.79:5000/api";
export const API_TIMEOUT = 10000;

export const API_ENDPOINTS = {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGET_PASSWORD: "/auth/forget-password",
    RESET_PASSWORD: "/auth/reset-password",
    REFRESH_TOKEN: "/auth/refresh-token", // Added as placeholder for apiClient logic
    GET_BOOKS: "/book",
    GOOGLE_AUTH: "/auth/google-auth",
    GOOGLE_CALLBACK: "/auth/google/callback",
    EXTERNAL_GUTENBERG: "/book/external/gutenberg",
    EXTERNAL_OPEN_LIBRARY: "/book/external/openlibrary",
    IMPORT_BOOK: "/book/import",
    TOGGLE_FAVORITE: "/user/favorites",
    GET_FAVORITES: "/user/favorites",
};

export const EXTERNAL_APIS = {
    GUTENBERG: "https://gutendex.com/books",
    OPEN_LIBRARY: "https://openlibrary.org/search.json",
};

export const STORAGE_KEYS = {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
    USER_DATA: "user_data",
};