import { AppError } from "../utils/errors";
import { apiRequest } from "./api";

const normalizeUser = (user) => ({
    ...user,
    id: String(user.id),
    jobTitle: user.jobTitle ?? user.job_title ?? "",
});

export const authService = {
    hasToken() {
        return Boolean(localStorage.getItem("authToken"));
    },

    async login(username, password) {
        try {
            const result = await apiRequest("/login", {
                method: "POST",
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                }),
            });

            if (!result?.token || !result?.user) {
                throw new Error("استجابة تسجيل الدخول من الخادم غير مكتملة");
            }

            localStorage.setItem("authToken", result.token);
            return normalizeUser(result.user);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                error.message || "تعذر تسجيل الدخول، تحقق من اتصال الخادم"
            );
        }
    },

    async logout() {
        try {
            if (this.hasToken()) {
                await apiRequest("/logout", {
                    method: "POST",
                });
            }
        } finally {
            localStorage.removeItem("authToken");
        }
    },

    async revalidate() {
        if (!this.hasToken()) {
            return null;
        }

        try {
            const result = await apiRequest("/user");
            const user = result?.user;

            if (!user || user.status === "Inactive") {
                localStorage.removeItem("authToken");
                return null;
            }

            return normalizeUser(user);
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                localStorage.removeItem("authToken");
                return null;
            }

            throw error;
        }
    },
};
