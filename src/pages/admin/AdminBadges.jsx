import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FilePlus2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import SearchInput from "../../components/common/SearchInput";
import Select from "../../components/common/Select";
import BadgeTable from "../../components/badges/BadgeTable";
import Button from "../../components/common/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { useToast } from "../../hooks/useToast";
import { useAsyncData } from "../../hooks/useAsyncData";
import { badgeService } from "../../services/badgeService";
import { employeeService } from "../../services/employeeService";
import { VEHICLE_TYPES } from "../../data/vehicleTypes";
import { BADGE_STATUS, BADGE_STATUS_LABELS } from "../../utils/badgeStatus";
import { matchesQuery } from "../../utils/search";
import { useAuth } from "../../hooks/useAuth";

const statusOptions = Object.entries(BADGE_STATUS_LABELS).map(([value, label]) => ({
	value,
	label,
}));
const vehicleOptions = VEHICLE_TYPES.map((v) => ({
	value: v.value,
	label: v.label,
}));

const CONFIRM_TEXT = {
	suspend: {
		title: "إيقاف البطاقة",
		label: "إيقاف",
		variant: "danger",
		message: (name) => `هل تريد إيقاف بطاقة "${name}"؟ يمكنك إعادة تفعيلها لاحقًا.`,
	},
	reactivate: {
		title: "إعادة تفعيل البطاقة",
		label: "إعادة التفعيل",
		variant: "primary",
		message: (name) => `هل تريد إعادة تفعيل بطاقة "${name}"؟`,
	},
	delete: {
		title: "حذف البطاقة",
		label: "حذف",
		variant: "danger",
		message: (name) => `هل أنت متأكد من حذف بطاقة "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
	},
};

const AdminBadges = () => {
	const { can } = useAuth();
	const { showToast } = useToast();
	// الحالة تُحفظ في الرابط (?status=Expired) فتعمل الروابط القادمة من لوحة التحكم
	const [searchParams, setSearchParams] = useSearchParams();
	const status = searchParams.get("status") || "";
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);
	const [vehicleType, setVehicleType] = useState("");
	const [employeeId, setEmployeeId] = useState("");
	const [confirmTarget, setConfirmTarget] = useState(null); // { badge, action }

	const { data, loading, error, reload } = useAsyncData(
		async () => {
			const [badges, employees] = await Promise.all([
				badgeService.getBadges(),
				can("users.manage") ? employeeService.getEmployees() : Promise.resolve([]),
			]);
			return { badges, employees };
		},
		[can],
		{ badges: [], employees: [] },
	);
	const { badges, employees } = data;

	const filtered = useMemo(
		() =>
			badges.filter(
				(b) =>
					matchesQuery(
						deferredQuery,
						b.driverName,
						b.jobTitle,
						b.badgeNumber,
						b.nationalId,
						b.vehicleNumber,
					) &&
					(!vehicleType || b.vehicleType === vehicleType) &&
					(!status || b.status === status) &&
					(!employeeId || b.createdBy === employeeId),
			),
		[badges, deferredQuery, vehicleType, status, employeeId],
	);

	const hasFilters = Boolean(query || vehicleType || status || employeeId);
	const clearFilters = () => {
		setQuery("");
		setVehicleType("");
		setEmployeeId("");
		setSearchParams({}, { replace: true });
	};

	const handleConfirm = async () => {
		const { badge, action } = confirmTarget;
		if (action === "suspend") {
			await badgeService.setBadgeStatus(badge.id, BADGE_STATUS.SUSPENDED);
			showToast("تم إيقاف البطاقة");
		} else if (action === "reactivate") {
			await badgeService.setBadgeStatus(badge.id, BADGE_STATUS.ACTIVE);
			showToast("تمت إعادة تفعيل البطاقة");
		} else if (action === "delete") {
			await badgeService.deleteBadge(badge.id);
			showToast("تم حذف البطاقة");
		}
		reload();
	};

	const confirm = confirmTarget ? CONFIRM_TEXT[confirmTarget.action] : null;

	return (
		<>
			<PageHeader
				title="جميع البطاقات"
				description="عرض ومتابعة جميع البطاقات التي أنشأها الموظفون"
				actions={
					can("badges.create") && (
						<Button to="/admin/badges/create" icon={FilePlus2}>
							إنشاء بطاقة
						</Button>
					)
				}
			/>

			<Card>
				<div className="grid grid-cols-2 lg:grid-cols-[1fr_10rem_10rem_11rem] gap-3 mb-4">
					<SearchInput
						value={query}
						onChange={setQuery}
						placeholder="ابحث بالاسم، رقم البطاقة، رقم الهوية..."
						className="col-span-2 lg:col-span-1"
					/>
					<Select
						value={vehicleType}
						onChange={(e) => setVehicleType(e.target.value)}
						options={vehicleOptions}
						placeholder="نوع المركبة"
					/>
					<Select
						value={status}
						onChange={(e) =>
							setSearchParams(e.target.value ? { status: e.target.value } : {}, { replace: true })
						}
						options={statusOptions}
						placeholder="الحالة"
					/>
					<Select
						value={employeeId}
						onChange={(e) => setEmployeeId(e.target.value)}
						options={employees.map((e) => ({ value: e.id, label: e.name }))}
						placeholder="الموظف"
						containerClassName="col-span-2 lg:col-span-1"
					/>
				</div>

				{!loading && !error && (
					<div className="flex items-center justify-between mb-3 text-xs text-slate-500">
						<span>
							عرض {filtered.length} من {badges.length} بطاقة
						</span>
						{hasFilters && (
							<button
								type="button"
								onClick={clearFilters}
								className="font-medium text-indigo-600 hover:underline"
							>
								مسح الفلاتر
							</button>
						)}
					</div>
				)}

				{loading ? (
					<LoadingState />
				) : error ? (
					<ErrorState onRetry={reload} />
				) : (
					<BadgeTable
						badges={filtered}
						basePath="/admin/badges"
						showEmployee
						emptyText={hasFilters ? "لا توجد بطاقات مطابقة للفلاتر" : "لا توجد بطاقات مسجلة"}
						canPrint={can("badges.print")}
						onSuspend={can("badges.edit") ? (badge) => setConfirmTarget({ badge, action: "suspend" }) : undefined}
						onReactivate={can("badges.edit") ? (badge) => setConfirmTarget({ badge, action: "reactivate" }) : undefined}
						onDelete={can("badges.delete") ? (badge) => setConfirmTarget({ badge, action: "delete" }) : undefined}
					/>
				)}
			</Card>

			<ConfirmDialog
				open={!!confirmTarget}
				onClose={() => setConfirmTarget(null)}
				title={confirm?.title}
				message={confirm?.message(confirmTarget?.badge?.driverName)}
				confirmLabel={confirm?.label}
				variant={confirm?.variant}
				onConfirm={handleConfirm}
			/>
		</>
	);
};

export default AdminBadges;
