import { useDeferredValue, useMemo, useState } from "react";
import { Search as SearchIcon, User, CreditCard } from "lucide-react";
import SearchInput from "../../components/common/SearchInput";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import DriverTable from "../../components/drivers/DriverTable";
import BadgeTable from "../../components/badges/BadgeTable";
import { useAuth } from "../../hooks/useAuth";
import { useAsyncData } from "../../hooks/useAsyncData";
import { driverService } from "../../services/driverService";
import { badgeService } from "../../services/badgeService";
import { matchesQuery } from "../../utils/search";

const EmployeeSearch = () => {
	const { user } = useAuth();
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);
	const { data, loading, error, reload } = useAsyncData(
		async () => {
			const [drivers, badges] = await Promise.all([
				driverService.getDriversByEmployee(user.id),
				badgeService.getBadgesByEmployee(user.id),
			]);
			return { drivers, badges };
		},
		[user.id],
		{ drivers: [], badges: [] },
	);

	const searched = deferredQuery.trim().length > 0;
	const drivers = useMemo(
		() =>
			searched
				? data.drivers.filter((d) =>
						matchesQuery(deferredQuery, d.fullName, d.jobTitle, d.nationalId, d.phone),
					)
				: [],
		[data.drivers, deferredQuery, searched],
	);
	const badges = useMemo(
		() =>
			searched
				? data.badges.filter((b) =>
						matchesQuery(
							deferredQuery,
							b.driverName,
							b.jobTitle,
							b.badgeNumber,
							b.nationalId,
							b.vehicleNumber,
						),
					)
				: [],
		[data.badges, deferredQuery, searched],
	);

	return (
		<>
			<PageHeader title="البحث" description="ابحث عن سائق أو بطاقة تعريفية ضمن بياناتك" />

			<SearchInput
				value={query}
				onChange={setQuery}
				placeholder="ابحث بالاسم، رقم الهوية، رقم البطاقة، أو رقم المركبة..."
				className="max-w-lg mb-8"
			/>

			{loading ? (
				<LoadingState />
			) : error ? (
				<ErrorState onRetry={reload} />
			) : !searched ? (
				<div className="text-center py-16">
					<SearchIcon size={40} className="mx-auto mb-3 text-slate-300" />
					<p className="text-sm text-slate-500">ابدأ بكتابة كلمة للبحث</p>
				</div>
			) : (
				<div className="flex flex-col gap-8">
					<section>
						<div className="flex items-center gap-2 mb-3">
							<User size={16} className="text-indigo-500" />
							<h2 className="text-sm font-bold text-slate-800">السائقون ({drivers.length})</h2>
						</div>
						<Card>
							<DriverTable
								drivers={drivers}
								basePath="/employee/drivers"
								emptyText="لا يوجد سائقون مطابقون"
							/>
						</Card>
					</section>
					<section>
						<div className="flex items-center gap-2 mb-3">
							<CreditCard size={16} className="text-indigo-500" />
							<h2 className="text-sm font-bold text-slate-800">البطاقات ({badges.length})</h2>
						</div>
						<Card>
							<BadgeTable
								badges={badges}
								basePath="/employee/badges"
								showEmployee={false}
								emptyText="لا توجد بطاقات مطابقة"
							/>
						</Card>
					</section>
				</div>
			)}
		</>
	);
};

export default EmployeeSearch;
