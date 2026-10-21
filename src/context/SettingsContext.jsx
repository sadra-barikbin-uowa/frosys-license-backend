import { useCallback, useEffect, useMemo, useState } from "react";
import { settingsService } from "../services/settingsService";
import { setExpiringSoonDays } from "../utils/badgeStatus";
import { SettingsContext } from "./contexts";
import { useAuth } from "../hooks/useAuth";

export const SettingsProvider = ({ children }) => {
	const { user } = useAuth();
	const [settings, setSettings] = useState(() => {
		const initial = settingsService.getSettingsSync();
		setExpiringSoonDays(initial.expiringSoonDays);
		return initial;
	});

	useEffect(() => {
		if (!user) return undefined;

		let active = true;
		settingsService
			.getSettings()
			.then((saved) => {
				if (!active) return;
				setExpiringSoonDays(saved.expiringSoonDays);
				setSettings(saved);
			})
			.catch((error) => {
				console.error("تعذر تحميل إعدادات النظام من الخادم", error);
			});

		return () => {
			active = false;
		};
	}, [user]);

	const updateSettings = useCallback(async (updates) => {
		const saved = await settingsService.updateSettings(updates);
		// يجب تحديث عتبة "قريب الانتهاء" قبل إعادة العرض حتى تظهر الحالات الجديدة فورًا
		setExpiringSoonDays(saved.expiringSoonDays);
		setSettings(saved);
		return saved;
	}, []);

	const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);

	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
