import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Printer, ArrowRight, CreditCard, Pencil, Trash2, Sticker } from "lucide-react";
import BadgePreview from "./BadgePreview";
import PrintBadge from "./PrintBadge";
import PrintSticker from "./PrintSticker";
import Button from "../common/Button";
import Card from "../common/Card";
import ConfirmDialog from "../common/ConfirmDialog";
import Input from "../common/Input";
import Select from "../common/Select";
import ImageUpload from "../common/ImageUpload";
import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";
import { formatDate } from "../../utils/formatDate";
import { BADGE_STATUS, badgeStatusLabel } from "../../utils/badgeStatus";
import { VEHICLE_TYPES, vehicleTypeLabel } from "../../data/vehicleTypes";
import { PERSON_TYPES, personTypeLabel } from "../../data/personTypes";
import { badgeService } from "../../services/badgeService";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { printBadge, printSticker } from "../../utils/print";
import { getErrorMessage } from "../../utils/errors";
import { required, validateBadgeDates } from "../../utils/validation";

const BadgeDetailView = ({ badge, backPath, isAdmin = false }) => {
	const navigate = useNavigate();
	const { user, can } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const { showToast } = useToast();
	// آخر نسخة محفوظة من البطاقة بعد التعديل (تُتجاهل إذا تغيّرت البطاقة المعروضة)
	const [saved, setSaved] = useState(null);
	const currentBadge = saved?.id === badge?.id ? saved : badge;
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(null);
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [previewSide, setPreviewSide] = useState("front");

	// الرابط ?print=1 يفتح نافذة الطباعة مرة واحدة، ثم نزيل المعامل حتى لا تتكرر الطباعة عند إعادة التحميل
	const shouldPrint = searchParams.get("print") === "1";
	useEffect(() => {
		if (!shouldPrint || !badge || !can("badges.print")) return undefined;
		const timer = setTimeout(async () => {
			try {
				await badgeService.authorizePrint(badge.id);
				await printBadge();
			} catch (error) {
				console.error(error);
				showToast(getErrorMessage(error, "لا تملك صلاحية طباعة هذه البطاقة"), "error");
			} finally {
				setSearchParams({}, { replace: true });
			}
		}, 400);
		return () => clearTimeout(timer);
	}, [shouldPrint, badge, setSearchParams, can, showToast]);

	if (!currentBadge) return null;

	const handlePrint = async () => {
		try {
			await badgeService.authorizePrint(currentBadge.id);
			await printBadge();
		} catch (error) {
			console.error(error);
			showToast(getErrorMessage(error, "لا تملك صلاحية طباعة هذه البطاقة"), "error");
		}
	};

	const handlePrintSticker = async () => {
		try {
			await badgeService.authorizePrint(currentBadge.id);
			await printSticker();
		} catch (error) {
			console.error(error);
			showToast(getErrorMessage(error, "تعذر إنشاء الستيكر"), "error");
		}
	};

	const startEditing = () => {
		setDraft({
			...currentBadge,
			driverName: currentBadge.driverName || currentBadge.fullName || "",
			jobTitle: currentBadge.jobTitle || "",
			photo: currentBadge.driverPhoto || currentBadge.photo || null,
			// الحالة المحسوبة (منتهي/قريب الانتهاء) ليست قيمة يمكن اختيارها؛ المتاح: فعال أو موقوف
			status:
				currentBadge.status === BADGE_STATUS.SUSPENDED
					? BADGE_STATUS.SUSPENDED
					: BADGE_STATUS.ACTIVE,
		});
		setErrors({});
		setEditing(true);
	};

	const setDraftValue = (field) => (event) => {
		setDraft((current) => ({ ...current, [field]: event.target.value }));
		setErrors((current) => ({ ...current, [field]: undefined }));
	};

	const saveChanges = async () => {
		const nextErrors = validateBadgeDates(draft.issueDate, draft.expiryDate);
		if (!required(draft.driverName)) nextErrors.driverName = "اسم السائق مطلوب";
		if (!required(draft.badgeNumber)) nextErrors.badgeNumber = "رقم البطاقة مطلوب";
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		setSaving(true);
		try {
			const payload = {
				badgeNumber: draft.badgeNumber.trim(),
				issueDate: draft.issueDate,
				expiryDate: draft.expiryDate,
				status: draft.status,
			};
			if (can("drivers.edit")) {
				Object.assign(payload, {
					driverName: draft.driverName.trim(),
					jobTitle: draft.jobTitle || "",
					personType: draft.personType,
					nationalId: draft.nationalId,
					driverPhoto: draft.photo || null,
				});
			}
			if (can("vehicles.manage")) {
				Object.assign(payload, {
					vehicleType: draft.vehicleType,
					vehicleNumber: draft.vehicleNumber,
					vehicleModel: draft.vehicleModel,
					vehicleColor: draft.vehicleColor ?? draft.color,
				});
			}
			const updated = isAdmin
				? await badgeService.updateBadge(currentBadge.id, payload)
				: await badgeService.updateBadgeForEmployee(currentBadge.id, user.id, payload);
			if (!updated) throw new Error("Badge not found or access denied");
			setSaved(updated);
			setEditing(false);
			showToast("تم تحديث البطاقة بنجاح", "success");
		} catch (error) {
			console.error(error);
			showToast(getErrorMessage(error, "تعذر حفظ تعديلات البطاقة"), "error");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		await badgeService.deleteBadge(currentBadge.id);
		showToast("تم حذف البطاقة بنجاح", "success");
		navigate(backPath, { replace: true });
	};

	const rows = [
		["اسم السائق", currentBadge.driverName],
		["العنوان الوظيفي", currentBadge.jobTitle],
		["صفة حامل البطاقة", personTypeLabel(currentBadge.personType)],
		["رقم الهوية", currentBadge.nationalId],
		["نوع المركبة", vehicleTypeLabel(currentBadge.vehicleType) || "—"],
		["رقم المركبة", currentBadge.vehicleNumber || "—"],
		["موديل المركبة", currentBadge.vehicleModel || "—"],
		["لون المركبة", currentBadge.vehicleColor || "—"],
		["تاريخ الإصدار", formatDate(currentBadge.issueDate)],
		["رقم البطاقة", currentBadge.badgeNumber],
		["الحالة", badgeStatusLabel(currentBadge)],
		["تاريخ الانتهاء", formatDate(currentBadge.expiryDate)],
	];
	if (isAdmin)
		rows.push([
			"تم الإنشاء بواسطة",
			currentBadge.createdByName
				? `${currentBadge.createdByName} (${currentBadge.createdBy})`
				: currentBadge.createdBy || "—",
		]);

	return (
		<div>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
				<Link
					to={backPath}
					className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 self-start sm:self-auto"
				>
					<ArrowRight size={16} /> رجوع
				</Link>
				<div className="flex flex-wrap items-center gap-2">
					{can("badges.delete") && (
						<Button icon={Trash2} variant="danger" onClick={() => setConfirmDelete(true)}>
							حذف
						</Button>
					)}
					{can("badges.edit") && (
						<Button icon={Pencil} variant="secondary" onClick={startEditing}>
							تعديل بيانات البطاقة
						</Button>
					)}
					{can("badges.print") && (
						<>
							<Button icon={Printer} onClick={handlePrint}>
								طباعة البطاقة
							</Button>
							<Button icon={Sticker} variant="secondary" onClick={handlePrintSticker}>
								إنشاء ستيكر
							</Button>
						</>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-6 items-start">
				<Card padding="p-5 sm:p-6" className="flex flex-col items-center gap-4 min-w-0">
					<div className="w-full">
						<BadgePreview data={currentBadge} side={previewSide} fit />
					</div>
					<div
						className="flex gap-1 rounded-lg bg-slate-100 p-1"
						role="tablist"
						aria-label="وجه البطاقة"
					>
						{[
							["front", "الوجه الأمامي"],
							["back", "الوجه الخلفي"],
						].map(([side, label]) => (
							<button
								key={side}
								type="button"
								role="tab"
								aria-selected={previewSide === side}
								onClick={() => setPreviewSide(side)}
								className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${previewSide === side ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
							>
								{label}
							</button>
						))}
					</div>
					<StatusBadge badge={currentBadge} prefix="بطاقة " size="md" />
					<p className="text-xs text-slate-500 font-medium" dir="ltr">
						{currentBadge.badgeNumber}
					</p>
				</Card>

				<Card padding="p-5 sm:p-6">
					<div className="flex items-center gap-2 mb-5">
						<div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
							<CreditCard size={16} />
						</div>
						<h2 className="text-sm font-bold text-slate-800">تفاصيل البطاقة</h2>
					</div>
					<dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
						{rows.map(([label, value]) => (
							<div key={label} className="min-w-0">
								<dt className="text-xs text-slate-400 mb-0.5">{label}</dt>
								<dd className="text-sm font-medium text-slate-700 wrap-break-word">{value || "—"}</dd>
							</div>
						))}
					</dl>
				</Card>
			</div>

			<PrintBadge data={currentBadge} />
			<PrintSticker data={currentBadge} />

			<Modal
				open={editing}
				onClose={() => setEditing(false)}
				title="تعديل بيانات البطاقة"
				size="xl"
				dismissible={!saving}
				footer={
					<>
						<Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
							إلغاء
						</Button>
						<Button loading={saving} onClick={saveChanges}>
							حفظ التعديلات
						</Button>
					</>
				}
			>
				{draft && (
					<EditBadgeForm
						data={draft}
						errors={errors}
						canEditDriver={can("drivers.edit")}
						canManageVehicle={can("vehicles.manage")}
						onChange={(field, value) =>
							setDraft((current) => ({
								...current,
								[field]: value,
								// الصورة تُقرأ من driverPhoto في البطاقة، فنزامنها لتتحدث المعاينة عند الإزالة أيضًا
								...(field === "photo" ? { driverPhoto: value } : {}),
							}))
						}
						setDraftValue={setDraftValue}
					/>
				)}
			</Modal>

			<ConfirmDialog
				open={confirmDelete}
				onClose={() => setConfirmDelete(false)}
				title="حذف البطاقة"
				message="هل أنت متأكد من حذف هذه البطاقة؟ لا يمكن التراجع عن هذا الإجراء."
				confirmLabel="حذف"
				onConfirm={handleDelete}
			/>
		</div>
	);
};

const EditBadgeForm = ({ data, errors, onChange, setDraftValue, canEditDriver, canManageVehicle }) => (
	<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_342px] gap-6 items-start">
		<div className="flex flex-col gap-5 min-w-0">
			{canEditDriver && <ImageUpload
				label="صورة السائق"
				value={data.photo}
				onChange={(value) => onChange("photo", value)}
				maxSize={480}
			/>}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{canEditDriver && <Input
					label="اسم السائق"
					required
					value={data.driverName || ""}
					onChange={setDraftValue("driverName")}
					error={errors.driverName}
				/>}
				{canEditDriver && <Input
					label="العنوان الوظيفي"
					value={data.jobTitle || ""}
					onChange={setDraftValue("jobTitle")}
				/>}
				{canEditDriver && <Select
					label="صفة حامل البطاقة"
					value={data.personType || ""}
					onChange={setDraftValue("personType")}
					options={PERSON_TYPES}
				/>}
				{canEditDriver && <Input
					label="الرقم الوطني"
					value={data.nationalId || ""}
					onChange={setDraftValue("nationalId")}
				/>}
				<Input
					label="رقم البطاقة"
					required
					value={data.badgeNumber || ""}
					onChange={setDraftValue("badgeNumber")}
					error={errors.badgeNumber}
				/>
				{canManageVehicle && <Select
					label="نوع المركبة"
					value={data.vehicleType || ""}
					onChange={setDraftValue("vehicleType")}
					options={VEHICLE_TYPES.map(({ value, label }) => ({ value, label }))}
				/>}
				{canManageVehicle && <Input
					label="رقم المركبة"
					value={data.vehicleNumber || ""}
					onChange={setDraftValue("vehicleNumber")}
				/>}
				{canManageVehicle && <Input
					label="موديل المركبة"
					value={data.vehicleModel || ""}
					onChange={setDraftValue("vehicleModel")}
				/>}
				{canManageVehicle && <Input
					label="لون المركبة"
					value={data.vehicleColor || data.color || ""}
					onChange={setDraftValue("vehicleColor")}
				/>}
				<Input
					label="تاريخ الإصدار"
					type="date"
					required
					value={data.issueDate || ""}
					onChange={setDraftValue("issueDate")}
					error={errors.issueDate}
				/>
				<Input
					label="تاريخ الانتهاء"
					type="date"
					required
					value={data.expiryDate || ""}
					onChange={setDraftValue("expiryDate")}
					error={errors.expiryDate}
				/>
				<Select
					label="حالة البطاقة"
					value={data.status || BADGE_STATUS.ACTIVE}
					onChange={setDraftValue("status")}
					options={[
						{ value: BADGE_STATUS.ACTIVE, label: "فعال" },
						{ value: BADGE_STATUS.SUSPENDED, label: "موقوف" },
					]}
				/>
			</div>
		</div>
		<div className="lg:sticky lg:top-0 flex flex-col items-center gap-2 min-w-0 w-full">
			<p className="text-xs font-semibold text-slate-500">معاينة مباشرة</p>
			<BadgePreview data={data} id="badge-edit-preview" fit />
		</div>
	</div>
);

export default BadgeDetailView;
