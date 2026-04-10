// export const API_BASE_URL = "http://localhost:5000/api"; // Use for iOS Simulator
// export const API_BASE_URL = "http://10.0.2.2:5000/api"; // Use for Android Emulator

// Active Tunnel URL (Update this when tunnel restarts)
// Use the fixed ngrok hostname if configured in ngrok.yml
const FORWARED_URL = "https://cresyl-regina-nonfacetiously.ngrok-free.dev";

// Unified Gateway (Recommended for one tunnel connecting both API and Metro)
// const FORWARED_URL = "https://your-unified-tunnel.ngrok-free.dev"; 

export const API_BASE_URL = FORWARED_URL + "/api"; 


export const API_TIMEOUT = 60000;

export const API_ENDPOINTS = {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGET_PASSWORD: "/auth/forget-password",
    RESET_PASSWORD: "/auth/reset-password",
    REFRESH_TOKEN: "/auth/refresh-token", // Added as placeholder for apiClient logic
    GET_BOOKS: "/book",
    GOOGLE_AUTH: "/auth/google-auth",
    GOOGLE_CALLBACK: "/auth/google/callback",
    GOOGLE_TOKEN_LOGIN: "/auth/google/token",
    GOOGLE_CODE_LOGIN: "/auth/google/code",    // PKCE code exchange (mobile)
    EXTERNAL_GUTENBERG: "/book/external/gutenberg",
    EXTERNAL_OPEN_LIBRARY: "/book/external/openlibrary",
    IMPORT_BOOK: "/book/import",
    TOGGLE_FAVORITE: "/user/favorites",
    GET_FAVORITES: "/user/favorites",
    USER: "/user",
    HIGHLIGHT: "/highlight",
    USER_PROGRESS: "/user/progress",
    CURRENT_READING: "/user/current-reading",
    COMPLETED_BOOKS: "/user/completed",
    UPDATE_STATS: "/user/stats/update",
    NOTIFICATIONS: "/notifications",
    KHALTI_INITIATE: "/khalti/initiate",
    KHALTI_VERIFY: "/khalti/verify",
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