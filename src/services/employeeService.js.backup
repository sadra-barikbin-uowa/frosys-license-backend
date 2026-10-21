import { storage } from "./storage";
import { mockUsers } from "../data/mockUsers";
import { ensureAllSeeded } from "../data/ensureSeeded";
import { generateId } from "../utils/generateBadgeNumber";
import { AppError } from "../utils/errors";

const USERS_KEY = "users";

const ensureSeeded = () => {
	ensureAllSeeded();
	const existing = storage.read(USERS_KEY, null);
	if (!existing) {
		storage.write(USERS_KEY, mockUsers);
		return mockUsers;
	}
	return existing;
};

// اسم المستخدم يجب أن يكون فريدًا (بغض النظر عن حالة الأحرف) وإلا يصبح تسجيل الدخول ملتبسًا
const assertUniqueUsername = (users, username, exceptId = null) => {
	const taken = users.some(
		(u) =>
			u.id !== exceptId && u.username.toLowerCase() === username.toLowerCase(),
	);
	if (taken) throw new AppError("اسم المستخدم مستخدم بالفعل، اختر اسمًا آخر");
};

// عند ربط Backend مستقبلاً: استبدل الدوال هنا بطلبات axios
// مثال: getEmployees -> axios.get('/api/employees')
export const employeeService = {
	async getEmployees() {
		await storage.delay();
		return ensureSeeded().filter((u) => u.role === "employee");
	},

	async getEmployeeById(id) {
		await storage.delay();
		return ensureSeeded().find((u) => u.id === id) || null;
	},

	async createEmployee(data) {
		await storage.delay();
		const users = ensureSeeded();
		const username = data.username.trim();
		assertUniqueUsername(users, username);
		const newEmployee = {
			id: generateId("EMP"),
			role: "employee",
			status: "Active",
			...data,
			name: data.name.trim(),
			username,
			jobTitle: data.jobTitle.trim(),
		};
		storage.write(USERS_KEY, [...users, newEmployee]);
		return newEmployee;
	},

	async updateEmployee(id, data) {
		await storage.delay();
		const users = ensureSeeded();
		const changes = { ...data };
		if (changes.username !== undefined) {
			changes.username = changes.username.trim();
			assertUniqueUsername(users, changes.username, id);
		}
		if (changes.name !== undefined) changes.name = changes.name.trim();
		if (changes.jobTitle !== undefined) changes.jobTitle = changes.jobTitle.trim();
		const updated = users.map((u) => (u.id === id ? { ...u, ...changes } : u));
		storage.write(USERS_KEY, updated);

		// الاسم مخزّن أيضًا داخل سجلات السائقين والبطاقات، نحدّثه ليبقى متسقًا
		if (changes.name) {
			["drivers", "badges"].forEach((key) => {
				const records = storage.read(key, []);
				if (records.some((r) => r.createdBy === id && r.createdByName !== changes.name))
					storage.write(
						key,
						records.map((r) =>
							r.createdBy === id ? { ...r, createdByName: changes.name } : r,
						),
					);
			});
		}
		return updated.find((u) => u.id === id);
	},

	async toggleEmployeeStatus(id) {
		await storage.delay();
		const users = ensureSeeded();
		const updated = users.map((u) =>
			u.id === id
				? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
				: u,
		);
		storage.write(USERS_KEY, updated);
		return updated.find((u) => u.id === id);
	},

	async deleteEmployee(id) {
		await storage.delay();
		const users = ensureSeeded();
		const updated = users.filter((u) => u.id !== id);
		storage.write(USERS_KEY, updated);
		return true;
	},
};
