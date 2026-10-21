import { storage } from "./storage";
import { mockUsers } from "../data/mockUsers";
import { ensureAllSeeded } from "../data/ensureSeeded";
import { AppError } from "../utils/errors";

const USERS_KEY = "users";
export const CURRENT_USER_KEY = "currentUser";

const ensureUsersSeeded = () => {
	ensureAllSeeded();
	const existing = storage.read(USERS_KEY, null);
	if (!existing) {
		storage.write(USERS_KEY, mockUsers);
		return mockUsers;
	}
	const admin = mockUsers.find((user) => user.id === "ADM-001");
	if (admin && existing.some((user) => user.id === admin.id && user.name !== admin.name)) {
		const updated = existing.map((user) => (user.id === admin.id ? { ...user, name: admin.name } : user));
		storage.write(USERS_KEY, updated);
		return updated;
	}
	return existing;
};

const toSafeUser = (user) => {
	const { password: _password, ...safeUser } = user;
	return safeUser;
};

export const authService = {
	async login(username, password) {
		await storage.delay();
		const users = ensureUsersSeeded();
		const name = username.trim().toLowerCase();
		const user = users.find(
			(u) => u.username.toLowerCase() === name && u.password === password,
		);
		if (!user) {
			throw new AppError("اسم المستخدم أو كلمة المرور غير صحيحة");
		}
		if (user.status === "Inactive") {
			throw new AppError("هذا الحساب موقوف، الرجاء التواصل مع الإدارة");
		}
		const safeUser = toSafeUser(user);
		storage.write(CURRENT_USER_KEY, safeUser);
		return safeUser;
	},

	async logout() {
		await storage.delay(80);
		storage.remove(CURRENT_USER_KEY);
	},

	// يعيد المستخدم الحالي بعد التأكد أنه ما زال موجودًا وفعّالًا؛ فإذا حُذف الحساب
	// أو أُوقف من قبل المدير تنتهي الجلسة بدل بقائها صالحة للأبد
	getCurrentUser() {
		const stored = storage.read(CURRENT_USER_KEY, null);
		if (!stored) return null;
		const record = ensureUsersSeeded().find((u) => u.id === stored.id);
		if (!record || record.status === "Inactive") {
			storage.remove(CURRENT_USER_KEY);
			return null;
		}
		return toSafeUser(record);
	},

	getUsers() {
		return ensureUsersSeeded();
	},
};
