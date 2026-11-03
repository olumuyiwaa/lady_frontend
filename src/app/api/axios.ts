import axios from "axios";

// Not currently wired into any page — authFetch.ts (fetch-based, with
// refresh-token rotation) is the client actually in use. Kept consistent
// with the other two API base URLs in case this gets picked up later.
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
        config.headers = config.headers ?? {};

        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;