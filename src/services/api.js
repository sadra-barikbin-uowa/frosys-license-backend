const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("authToken");

    const headers = {
        Accept: "application/json",
        ...options.headers,
    };

    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const contentType = response.headers.get("content-type");
    const result = contentType?.includes("application/json")
        ? await response.json()
        : null;

    if (!response.ok) {
        const validationErrors = result?.errors
            ? Object.values(result.errors).flat().join("\n")
            : "";

        const error = new Error(
            validationErrors ||
            result?.message ||
            `فشل الاتصال بالخادم (${response.status})`
        );
        error.status = response.status;
        throw error;
    }

    return result;
};
