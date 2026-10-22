import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard, FilePlus2 } from "lucide-react";
import SearchInput from "../../components/common/SearchInput";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import BadgeCard from "../../components/badges/BadgeCard";
import { useAuth } from "../../hooks/useAuth";
import { useAsyncData } from "../../hooks/useAsyncData";
import { badgeService } from "../../services/badgeService";
import { BADGE_STATUS_LABELS } from "../../utils/badgeStatus";
import { matchesQuery } from "../../utils/search";

const statusOptions = Object.entries(BADGE_STATUS_LABELS).map(([value, label]) => ({
	value,
	label,
}));

const MyBadges = () => {
	const { user, can } = useAuth();
	// الحالة تُحفظ في الرابط (?status=Expired) فتعمل الروابط القادمة من لوحة التحكم
	const [searchParams, setSearchParams] = useSearchParams();
	const status = searchParams.get("status") || "";
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);
	const {
		data: badges,
		loading,
		error,
		reload,
	} = useAsyncData(() => badgeService.getBadgesByEmployee(user.id), [user.id], []);

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
					(!status || b.status === status),
			),
		[badges, deferredQuery, status],
	);

	const handleStatusChange = (value) =>
		setSearchParams(value ? { status: value } : {}, { replace: true });

	return (
		<>
			<PageHeader
				title="البطاقات الخاصة بي"
				description="جميع البطاقات التعريفية التي أنشأتها"
				actions={
					can("badges.create") && (
						<Button to="/employee/badges/create" icon={FilePlus2}>
							إصدار بطاقة
						</Button>
					)
				}
			/>

			<div className="flex flex-col sm:flex-row gap-3 mb-5">
				<SearchInput
					value={query}
					onChange={setQuery}
					placeholder="ابحث بالاسم أو رقم البطاقة..."
					className="sm:flex-1 sm:max-w-sm"
				/>
				<Select
					value={status}
					onChange={(e) => handleStatusChange(e.target.value)}
					options={statusOptions}
					placeholder="كل الحالات"
					className="sm:w-48"
				/>
			</div>

			{loading ? (
				<LoadingState />
			) : error ? (
				<ErrorState onRetry={reload} />
			) : filtered.length === 0 ? (
				<div className="surface">
					<EmptyState
						icon={CreditCard}
						title={query || status ? "لا توجد بطاقات مطابقة" : "لم تقم بإنشاء أي بطاقة بعد"}
					/>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{filtered.map((b) => (
						<BadgeCard key={b.id} badge={b} />
					))}
				</div>
			)}
		</>
	);
};

export default MyBadges;
