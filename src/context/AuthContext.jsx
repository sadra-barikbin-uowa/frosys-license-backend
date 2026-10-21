import { useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { AuthContext } from "./contexts";

const sameUser = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [checkingSession, setCheckingSession] = useState(() => authService.hasToken());

	const revalidate = useCallback(async () => {
		if (!authService.hasToken()) {
			setUser(null);
			return null;
		}

		const fresh = await authService.revalidate();
		setUser((current) => (sameUser(fresh, current) ? current : fresh));
		return fresh;
	}, []);

	useEffect(() => {
		if (!authService.hasToken()) return undefined;

		let active = true;
		Promise.resolve()
			.then(revalidate)
			.catch((error) => {
				console.error("تعذر التحقق من جلسة المستخدم", error);
			})
			.finally(() => {
				if (active) setCheckingSession(false);
			});

		return () => {
			active = false;
		};
	}, [revalidate]);

	useEffect(() => {
		const handleStorage = (event) => {
			if (event.key === null || event.key === "authToken") {
				if (authService.hasToken()) {
					revalidate().catch((error) => {
						console.error("تعذر مزامنة جلسة المستخدم", error);
					});
				} else {
					setUser(null);
				}
			}
		};
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, [revalidate]);

	const login = useCallback(async (username, password) => {
		const loggedInUser = await authService.login(username, password);
		setUser(loggedInUser);
		return loggedInUser;
	}, []);

	const logout = useCallback(async () => {
		try {
			await authService.logout();
		} finally {
			setUser(null);
		}
	}, []);

	const value = useMemo(
		() => ({ user, login, logout, revalidate, checkingSession, isAdmin: user?.role === "admin" }),
		[user, login, logout, revalidate, checkingSession],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
