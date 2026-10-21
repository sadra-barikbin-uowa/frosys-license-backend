import { apiRequest } from "./api";

export const getApiCollection = async (endpoint) => {
    const records = [];
    let page = 1;
    let lastPage = 1;

    do {
        const separator = endpoint.includes("?") ? "&" : "?";
        const result = await apiRequest(`${endpoint}${separator}page=${page}`);
        const pageRecords = Array.isArray(result) ? result : result?.data;

        if (!Array.isArray(pageRecords)) {
            throw new Error("لم يُرجع الخادم قائمة بيانات صالحة");
        }

        records.push(...pageRecords);
        lastPage = Number(result?.last_page) || 1;
        page += 1;
    } while (page <= lastPage);

    return records;
};

export const normalizeApiId = (id) => (id == null ? id : String(id));

export const imageUrl = (path) => {
    if (!path || path.startsWith("data:") || /^https?:\/\//i.test(path)) {
        return path || null;
    }

    const apiUrl = new URL(
        import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
        window.location.origin,
    );
    if (path.startsWith("/storage/")) {
        return `${apiUrl.origin}${path}`;
    }
    return `${apiUrl.origin}/storage/${path.replace(/^\/+/, "")}`;
};

const imageBlob = async (dataUrl) => {
    const response = await fetch(dataUrl);
    return response.blob();
};

export const createApiBody = async (data, fieldMap = {}) => {
    const mapped = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [fieldMap[key] || key, value]),
    );
    const imageFields = ["photo", "driver_photo", "logo", "manager_signature"];
    for (const key of imageFields) {
        if (typeof mapped[key] === "string" && /^https?:\/\//i.test(mapped[key])) {
            delete mapped[key];
        }
    }
    const imageEntries = Object.entries(mapped).filter(
        ([key, value]) => imageFields.includes(key) && typeof value === "string" && value.startsWith("data:"),
    );

    if (imageEntries.length === 0) {
        return JSON.stringify(mapped);
    }

    const body = new FormData();
    for (const [key, value] of Object.entries(mapped)) {
        if (imageFields.includes(key)) {
            if (value === null) {
                body.append(key, "");
            } else if (typeof value === "string" && value.startsWith("data:")) {
                const blob = await imageBlob(value);
                const extension = blob.type === "image/png" ? "png" : "jpg";
                body.append(key, blob, `upload.${extension}`);
            } else if (typeof value === "string" && !/^https?:\/\//i.test(value)) {
                body.append(key, value);
            }
        } else if (value !== undefined && value !== null) {
            body.append(key, String(value));
        }
    }

    return body;
};
