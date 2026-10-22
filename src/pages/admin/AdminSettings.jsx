import { useState } from "react";
import { Settings as SettingsIcon, Save, RotateCcw, Sparkles, Database } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ImageUpload from "../../components/common/ImageUpload";
import SignaturePad from "../../components/common/SignaturePad";
import BadgePreview from "../../components/badges/BadgePreview";
import { useToast } from "../../hooks/useToast";
import { useSettings } from "../../hooks/useSettings";
import { defaultSettings } from "../../services/settingsService";
import { todayISO, addYears } from "../../utils/formatDate";
import { getErrorMessage } from "../../utils/errors";

const COLOR_PRESETS = ["#0b254e", "#0f766e", "#0369a1", "#be123c", "#b45309", "#334155"];

// بيانات تجريبية لمعاينة شكل البطاقة بالإعدادات الحالية
const SAMPLE_BADGE = {
	driverName: "محمد أحمد الغامدي",
	personType: "employee",
	nationalId: "1012345678",
	badgeNumber: "DRV-2026-00001",
	licenseNumber: "LIC-445566",
	vehicleType: "car",
	vehicleNumber: "ABC 1234",
	vehicleModel: "تويوتا كامري",
	vehicleColor: "أبيض",
	issueDate: todayISO(),
	expiryDate: addYears(todayISO(), 1),
};

const toForm = (settings) => ({
	logo: settings.logo || "",
	managerSignature: settings.managerSignature || "",
	managerSignatureColor: settings.managerSignatureColor || defaultSettings.managerSignatureColor,
	managerSignatureWidth: Number(settings.managerSignatureWidth) || defaultSettings.managerSignatureWidth,
	systemName: settings.systemName,
	contactInfo: settings.contactInfo || "",
	badgeColor: settings.badgeColor,
	badgeValidityYears: String(settings.badgeValidityYears),
	expiringSoonDays: String(settings.expiringSoonDays),
});

const validate = (form) => {
	const errors = {};
	if (!form.systemName.trim()) errors.systemName = "اسم النظام مطلوب";
	const years = Number(form.badgeValidityYears);
	if (!Number.isInteger(years) || years < 1 || years > 20)
		errors.badgeValidityYears = "أدخل عددًا صحيحًا من 1 إلى 20";
	const days = Number(form.expiringSoonDays);
	if (!Number.isInteger(days) || days < 1 || days > 365)
		errors.expiringSoonDays = "أدخل عددًا صحيحًا من 1 إلى 365";
	return errors;
};

const AdminSettings = () => {
	const { showToast } = useToast();
	const { settings, updateSettings } = useSettings();
	const [draft, setDraft] = useState(null);
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [side, setSide] = useState("front");

	const form = draft ?? toForm(settings);
	const saved = toForm(settings);
	const dirty = Object.keys(form).some((key) => form[key] !== saved[key]);

	const setField = (field, value) => {
		setDraft((current) => ({ ...(current ?? toForm(settings)), [field]: value }));
		setErrors((current) => ({ ...current, [field]: undefined }));
	};

	const handleSave = async (event) => {
		event.preventDefault();
		const nextErrors = validate(form);
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		setSaving(true);
		try {
			const result = await updateSettings({
				...form,
				systemName: form.systemName.trim(),
				contactInfo: form.contactInfo.trim(),
				badgeValidityYears: Number(form.badgeValidityYears),
				expiringSoonDays: Number(form.expiringSoonDays),
			});
			setDraft(toForm(result));
			showToast("تم حفظ الإعدادات بنجاح", "success");
		} catch (error) {
			console.error(error);
			showToast(getErrorMessage(error, "تعذر حفظ الإعدادات"), "error");
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		setDraft(toForm({ ...defaultSettings, logo: "" }));
		setErrors({});
	};

	// البطاقة تُعرض بقيم النموذج الحالية (حتى قبل الحفظ) لتوضيح أثر كل تغيير
	const previewSettings = {
		logo: form.logo,
		managerSignature: form.managerSignature,
		managerSignatureColor: form.managerSignatureColor,
		managerSignatureWidth: form.managerSignatureWidth,
		systemName: form.systemName.trim() || defaultSettings.systemName,
		contactInfo: form.contactInfo,
		badgeColor: form.badgeColor,
	};

	return (
		<>
			<PageHeader title="الإعدادات" description="تخصيص إعدادات النظام والبطاقات التعريفية" />

			<div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
				<form onSubmit={handleSave} noValidate className="flex flex-col gap-6 min-w-0">
					<Card padding="p-5 sm:p-6">
						<div className="flex items-center gap-2 mb-5">
							<div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
								<SettingsIcon size={16} />
							</div>
							<h2 className="text-sm font-bold text-slate-800">الإعدادات العامة</h2>
						</div>

						<div className="flex flex-col gap-4">
							<ImageUpload
								label="شعار المؤسسة"
								value={form.logo}
								onChange={(value) => setField("logo", value || "")}
								maxSize={256}
								format="png"
							/>
							<SignaturePad
								value={form.managerSignature}
								onChange={(value) => setField("managerSignature", value)}
								color={form.managerSignatureColor}
								onColorChange={(value) => setField("managerSignatureColor", value)}
								width={form.managerSignatureWidth}
								onWidthChange={(value) => setField("managerSignatureWidth", value)}
							/>
							<Input
								label="اسم النظام / المؤسسة"
								required
								value={form.systemName}
								onChange={(e) => setField("systemName", e.target.value)}
								error={errors.systemName}
							/>
							<Input
								label="معلومات التواصل"
								value={form.contactInfo}
								onChange={(e) => setField("contactInfo", e.target.value)}
								hint="تظهر على الوجه الخلفي للبطاقة"
							/>

							<div className="flex flex-col gap-2">
								<label htmlFor="badge-color" className="text-sm font-medium text-slate-700">
									لون البطاقة الأساسي
								</label>
								<div className="flex flex-wrap items-center gap-2">
									<input
										id="badge-color"
										type="color"
										value={form.badgeColor}
										onChange={(e) => setField("badgeColor", e.target.value)}
										className="h-10 w-16 rounded-lg border border-slate-200 bg-white p-1 cursor-pointer"
									/>
									{COLOR_PRESETS.map((color) => (
										<button
											key={color}
											type="button"
											onClick={() => setField("badgeColor", color)}
											aria-label={`اختيار اللون ${color}`}
											aria-pressed={form.badgeColor === color}
											className={`w-8 h-8 rounded-full ring-offset-2 transition-shadow ${
												form.badgeColor === color ? "ring-2 ring-slate-800" : "ring-1 ring-slate-200"
											}`}
											style={{ backgroundColor: color }}
										/>
									))}
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Input
									label="مدة صلاحية البطاقة (بالسنوات)"
									type="number"
									min={1}
									max={20}
									inputMode="numeric"
									value={form.badgeValidityYears}
									onChange={(e) => setField("badgeValidityYears", e.target.value)}
									error={errors.badgeValidityYears}
								/>
								<Input
									label="أيام اعتبار البطاقة قريبة من الانتهاء"
									type="number"
									min={1}
									max={365}
									inputMode="numeric"
									value={form.expiringSoonDays}
									onChange={(e) => setField("expiringSoonDays", e.target.value)}
									error={errors.expiringSoonDays}
								/>
							</div>
						</div>

						<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
							<Button variant="ghost" icon={RotateCcw} onClick={handleReset}>
								استعادة الافتراضي
							</Button>
							<div className="flex items-center gap-3">
								{dirty && <span className="text-xs text-amber-600">توجد تغييرات غير محفوظة</span>}
								<Button type="submit" icon={Save} loading={saving} disabled={!dirty}>
									حفظ الإعدادات
								</Button>
							</div>
						</div>
					</Card>

					<Card>
						<div className="flex items-center gap-2 mb-3">
							<Database size={16} className="text-indigo-500" />
							<h2 className="text-sm font-bold text-slate-800">تخزين البيانات</h2>
						</div>
						<p className="text-xs text-slate-500">
							تُحفظ إعدادات النظام والسجلات والصور في قاعدة بيانات وخادم النظام، ولا تعتمد على مساحة
							التخزين في هذا المتصفح.
						</p>
					</Card>
				</form>

				<div className="xl:sticky xl:top-6 min-w-0">
					<Card>
						<div className="flex items-center justify-between gap-2 mb-4">
							<div className="flex items-center gap-2">
								<Sparkles size={16} className="text-indigo-500" />
								<h2 className="text-sm font-bold text-slate-800">معاينة البطاقة</h2>
							</div>
							<div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="وجه البطاقة">
								{[
									["front", "أمامي"],
									["back", "خلفي"],
								].map(([value, label]) => (
									<button
										key={value}
										type="button"
										role="tab"
										aria-selected={side === value}
										onClick={() => setSide(value)}
										className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
											side === value ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
										}`}
									>
										{label}
									</button>
								))}
							</div>
						</div>
						<BadgePreview
							data={SAMPLE_BADGE}
							side={side}
							id="badge-settings-preview"
							settings={previewSettings}
							fit
						/>
						<p className="text-[11px] text-slate-500 text-center mt-4">
							بيانات تجريبية لمعاينة الشكل فقط، ولا تُحفظ.
						</p>
					</Card>
				</div>
			</div>
		</>
	);
};

export default AdminSettings;
