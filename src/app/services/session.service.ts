export const sessionService = {
    getAccessToken() {
        return localStorage.getItem("accessToken");
    },

    getRefreshToken() {
        return localStorage.getItem("refreshToken");
    },

    setTokens(access: string, refresh: string) {
        localStorage.setItem("accessToken", access);
        localStorage.setItem("refreshToken", refresh);
    },

    clearSession() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    },
};