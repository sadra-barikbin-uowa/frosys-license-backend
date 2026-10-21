import { apiRequest } from "./api";
import { createApiBody, imageUrl } from "./apiResources";

export const defaultSettings = {
	systemName: "نظام إدارة السائقين والمركبات",
	logo: "",
	managerSignature: "",
	managerSignatureColor: "#172554",
	managerSignatureWidth: 4,
	badgeColor: "#4338ca",
	contactInfo: "",
	badgeValidityYears: 1,
	expiringSoonDays: 30,
};

let currentSettings = { ...defaultSettings };

const normalizeSettings = (settings) => {
	const data = settings || {};
	const systemName = data.system_name ?? data.systemName ?? defaultSettings.systemName;
	return {
		...defaultSettings,
		systemName,
		organizationName: systemName,
		logo: imageUrl(data.logo),
		managerSignature: imageUrl(data.manager_signature ?? data.managerSignature),
		managerSignatureColor:
			data.manager_signature_color ?? data.managerSignatureColor ?? defaultSettings.managerSignatureColor,
		managerSignatureWidth:
			Number(data.manager_signature_width ?? data.managerSignatureWidth) ||
			defaultSettings.managerSignatureWidth,
		badgeColor: data.badge_color ?? data.badgeColor ?? defaultSettings.badgeColor,
		contactInfo: data.contact_info ?? data.contactInfo ?? "",
		badgeValidityYears:
			Number(data.badge_validity_years ?? data.badgeValidityYears) ||
			defaultSettings.badgeValidityYears,
		expiringSoonDays:
			Number(data.expiring_soon_days ?? data.expiringSoonDays) ||
			defaultSettings.expiringSoonDays,
	};
};

const settingsFields = {
	systemName: "system_name",
	managerSignature: "manager_signature",
	managerSignatureColor: "manager_signature_color",
	managerSignatureWidth: "manager_signature_width",
	badgeColor: "badge_color",
	contactInfo: "contact_info",
	badgeValidityYears: "badge_validity_years",
	expiringSoonDays: "expiring_soon_days",
};

export const settingsService = {
	getSettingsSync() {
		return currentSettings;
	},
	async getSettings() {
		const result = await apiRequest("/settings");
		currentSettings = normalizeSettings(result?.settings);
		return currentSettings;
	},
	async updateSettings(data) {
		const body = await createApiBody(data, settingsFields);
		const result = await apiRequest("/settings", { method: "PUT", body });
		currentSettings = normalizeSettings(result?.settings);
		return currentSettings;
	},
};
