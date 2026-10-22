import {
	LayoutDashboard,
	CreditCard,
	Users,
	Car,
	UserCog,
	BarChart3,
	Search,
	Settings,
	UserPlus,
	Wallet,
} from "lucide-react";

const adminLinks = [
	{ to: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, permission: "users.manage" },
	{ to: "/admin/badges", label: "جميع البطاقات", icon: CreditCard, permission: "users.manage" },
	{ to: "/admin/badges/create", label: "إنشاء بطاقة", icon: CreditCard, permission: "badges.create" },
	{ to: "/admin/drivers", label: "السائقون", icon: Users, permission: "users.manage" },
	{ to: "/admin/drivers/add", label: "إضافة سائق", icon: UserPlus, permission: "drivers.create" },
	{ to: "/admin/vehicles", label: "المركبات", icon: Car, permission: "users.manage" },
	{ to: "/admin/employees", label: "الموظفون", icon: UserCog, permission: "users.manage" },
	{ to: "/admin/reports", label: "التقارير", icon: BarChart3, permission: "users.manage" },
	{ to: "/admin/search", label: "البحث", icon: Search, permission: "users.manage" },
	{ to: "/admin/settings", label: "الإعدادات", icon: Settings, permission: "users.manage" },
];

const employeeLinks = [
	{ to: "/employee/drivers", label: "السائقون", icon: Users, permission: "drivers.view" },
	{ to: "/employee/drivers/add", label: "إضافة سائق", icon: UserPlus, permission: "drivers.create" },
	{ to: "/employee/vehicles", label: "المركبات", icon: Car, permission: "vehicles.view" },
	{ to: "/employee/badges", label: "البطاقات الخاصة بي", icon: Wallet, permission: "badges.view" },
	{ to: "/employee/badges/create", label: "إصدار بطاقة", icon: CreditCard, permission: "badges.create" },
	{ to: "/employee/search", label: "البحث", icon: Search, permission: ["drivers.view", "badges.view"] },
];

export const getNavLinks = (user, can) => {
	const links = can("users.manage") ? adminLinks : employeeLinks;
	return links.filter(({ permission }) =>
		(Array.isArray(permission) ? permission : [permission]).some(can),
	);
};

// أطول رابط يطابق المسار الحالي هو الرابط النشط، فمثلًا "/employee/drivers/add"
// يفعّل "إضافة سائق" فقط (وليس "السائقون" أيضًا)، و"/employee/drivers/DR-1" يفعّل "السائقون"
export const findActiveLink = (links, pathname) =>
	links
		.filter((link) => pathname === link.to || pathname.startsWith(`${link.to}/`))
		.sort((a, b) => b.to.length - a.to.length)[0];
