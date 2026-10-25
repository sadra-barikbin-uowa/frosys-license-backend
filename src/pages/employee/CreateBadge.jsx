import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Search, AlertTriangle } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import BadgePreview from "../../components/badges/BadgePreview";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useSettings } from "../../hooks/useSettings";
import { useAsyncData } from "../../hooks/useAsyncData";
import { driverService } from "../../services/driverService";
import { vehicleService } from "../../services/vehicleService";
import { badgeService } from "../../services/badgeService";
import { BADGE_STATUS } from "../../utils/badgeStatus";
import { addYears, todayISO } from "../../utils/formatDate";
import { getErrorMessage } from "../../utils/errors";
import { validateBadgeDates } from "../../utils/validation";

const CreateBadge = ({ role = "employee" }) => {
	const { user, can } = useAuth();
	const { settings } = useSettings();
	const { showToast } = useToast();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const validityYears = Number(settings.badgeValidityYears) || 1;

	// ?driver=ID يحدّد السائق مسبقًا (يأتي من زر "إصدار بطاقة" في صفحة تفاصيل السائق)
	const [selectedId, setSelectedId] = useState(() => searchParams.get("driver") || "");
	const [issueDate, setIssueDate] = useState(todayISO());
	const [expiryDate, setExpiryDate] = useState(() => addYears(todayISO(), validityYears));
	const [expiryEdited, setExpiryEdited] = useState(false);
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);

	const { data: lists, loading } = useAsyncData(
		async () => {
			const [drivers, badges] = await Promise.all([
				role === "admin" ? driverService.getDrivers() : driverService.getDriversByEmployee(user.id),
				can("badges.view")
					? (role === "admin" ? badgeService.getBadges() : badgeService.getBadgesByEmployee(user.id))
					: Promise.resolve([]),
			]);
			return { drivers, badges };
		},
		[user.id, role, can],
		{ drivers: [], badges: [] },
	);
	const { drivers, badges } = lists;
	const selectedDriver = drivers.find((d) => d.id === selectedId);

	const vehicleKey = selectedDriver?.vehicleId || "";
	const { data: loadedVehicle, loading: vehicleLoading } = useAsyncData(
		() => (vehicleKey ? vehicleService.getVehicleById(vehicleKey) : Promise.resolve(null)),
		[vehicleKey],
	);
	const vehicle = vehicleLoading ? null : loadedVehicle;

	// بطاقات سارية لنفس السائق: نحذّر المستخدم قبل إصدار بطاقة مكررة (دون منعه، فقد يكون تجديدًا)
	const currentBadges = badges.filter(
		(b) =>
			b.driverId === selectedId &&
			[BADGE_STATUS.ACTIVE, BADGE_STATUS.EXPIRING_SOON].includes(b.status),
	);

	const handleIssueChange = (value) => {
		setIssueDate(value);
		setErrors((prev) => ({ ...prev, issueDate: undefined, expiryDate: undefined }));
		// ما لم يعدّل المستخدم تاريخ الانتهاء يدويًا، نحسبه تلقائيًا من تاريخ الإصدار
		if (!expiryEdited && value) setExpiryDate(addYears(value, validityYears));
	};

	const previewData = selectedDriver
		? {
				...selectedDriver,
				vehicleType: vehicle?.vehicleType,
				vehicleNumber: vehicle?.vehicleNumber,
				vehicleModel: vehicle?.model,
				vehicleColor: vehicle?.color,
				issueDate,
				expiryDate,
			}
		: null;

	const handleSubmit = async () => {
		if (!selectedDriver) {
			showToast("الرجاء اختيار السائق أولًا", "error");
			return;
		}
		const dateErrors = validateBadgeDates(issueDate, expiryDate);
		setErrors(dateErrors);
		if (Object.keys(dateErrors).length > 0) return;

		setSubmitting(true);
		try {
			const newBadge = await badgeService.createBadge({
				driverId: selectedDriver.id,
				vehicleId: vehicle?.id,
				driverName: selectedDriver.fullName,
				jobTitle: selectedDriver.jobTitle,
				personType: selectedDriver.personType,
				driverPhoto: selectedDriver.photo,
				nationalId: selectedDriver.nationalId,
				vehicleType: vehicle?.vehicleType,
				vehicleNumber: vehicle?.vehicleNumber,
				vehicleModel: vehicle?.model,
				vehicleColor: vehicle?.color,
				issueDate,
				expiryDate,
				createdBy: user.id,
				createdByName: user.name,
			});
			showToast("تم إنشاء البطاقة بنجاح", "success");
			navigate(
				can("badges.view")
					? `/${role}/badges/${newBadge.id}`
					: `/${role}/drivers/${selectedDriver.id}`,
			);
		} catch (err) {
			console.error(err);
			showToast(getErrorMessage(err, "حدث خطأ أثناء إنشاء البطاقة"), "error");
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageHeader
				title="إصدار بطاقة"
				description="اختر سائقًا مسجّلاً مسبقًا لإصدار بطاقة تعريفية جديدة له"
			/>

			<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
				<Card className="flex flex-col gap-4">
					<div className="flex items-center gap-2 mb-1">
						<Search size={16} className="text-indigo-500" />
						<h2 className="text-sm font-bold text-slate-800">اختيار السائق</h2>
					</div>
					<Select
						label="السائق"
						required
						value={selectedId}
						onChange={(e) => setSelectedId(e.target.value)}
						placeholder={loading ? "جارِ تحميل السائقين..." : "اختر سائقًا"}
						options={drivers.map((d) => ({
							value: d.id,
							label: `${d.fullName} — ${d.nationalId}`,
						}))}
					/>

					{!loading && drivers.length === 0 && (
						<p className="text-xs text-slate-500">
							لا يوجد سائقون مسجّلون بعد. قم بإضافة سائق أولًا.
						</p>
					)}

					{selectedDriver && !selectedDriver.vehicleId && (
						<p className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">
							<AlertTriangle size={15} className="shrink-0 mt-px" />
							لا توجد مركبة مرتبطة بهذا السائق، ستُصدر البطاقة بدون بيانات مركبة.
						</p>
					)}

					{currentBadges.length > 0 && (
						<p
							role="status"
							className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5"
						>
							<AlertTriangle size={15} className="shrink-0 mt-px" />
							لدى هذا السائق بطاقة سارية بالفعل ({currentBadges[0].badgeNumber}). تأكد أنك تريد
							إصدار بطاقة جديدة.
						</p>
					)}

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
						<Input
							label="تاريخ الإصدار"
							type="date"
							value={issueDate}
							onChange={(e) => handleIssueChange(e.target.value)}
							error={errors.issueDate}
						/>
						<Input
							label="تاريخ الانتهاء"
							type="date"
							value={expiryDate}
							onChange={(e) => {
								setExpiryDate(e.target.value);
								setExpiryEdited(true);
								setErrors((prev) => ({ ...prev, expiryDate: undefined }));
							}}
							error={errors.expiryDate}
							hint={!expiryEdited ? `يُحسب تلقائيًا: ${validityYears} سنة من تاريخ الإصدار` : undefined}
						/>
					</div>
				</Card>

				<div className="lg:sticky lg:top-6 flex flex-col gap-4 min-w-0">
					<Card>
						<div className="flex items-center gap-2 mb-4">
							<Sparkles size={16} className="text-indigo-500" />
							<h2 className="text-sm font-bold text-slate-800">معاينة البطاقة</h2>
						</div>
						{previewData ? (
							<BadgePreview data={previewData} fit />
						) : (
							<div className="aspect-[1.586/1] rounded-2xl bg-slate-50 ring-1 ring-slate-100 flex items-center justify-center text-xs text-slate-500">
								اختر سائقًا لعرض معاينة البطاقة
							</div>
						)}
					</Card>
					<Button
						onClick={handleSubmit}
						loading={submitting}
						disabled={!selectedDriver}
						size="lg"
						className="w-full"
					>
						إنشاء البطاقة
					</Button>
				</div>
			</div>
		</>
	);
};

export default CreateBadge;
