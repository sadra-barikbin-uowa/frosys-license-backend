import { useDeferredValue, useMemo, useState } from "react";
import { Search as SearchIcon, User, CreditCard, Car } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import SearchInput from "../../components/common/SearchInput";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import DriverTable from "../../components/drivers/DriverTable";
import BadgeTable from "../../components/badges/BadgeTable";
import VehicleTable from "../../components/vehicles/VehicleTable";
import { useAsyncData } from "../../hooks/useAsyncData";
import { driverService } from "../../services/driverService";
import { badgeService } from "../../services/badgeService";
import { vehicleService } from "../../services/vehicleService";
import { matchesQuery } from "../../utils/search";

const EMPTY = { drivers: [], badges: [], vehicles: [] };

const Section = ({ icon: Icon, title, count, children }) => (
	<section>
		<div className="flex items-center gap-2 mb-3">
			<Icon size={16} className="text-indigo-500" />
			<h2 className="text-sm font-bold text-slate-800">
				{title} ({count})
			</h2>
		</div>
		<Card>{children}</Card>
	</section>
);

const AdminSearch = () => {
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);
	const { data, loading, error, reload } = useAsyncData(
		async () => {
			const [drivers, badges, vehicles] = await Promise.all([
				driverService.getDrivers(),
				badgeService.getBadges(),
				vehicleService.getVehicles(),
			]);
			return { drivers, badges, vehicles };
		},
		[],
		EMPTY,
	);

	const searched = deferredQuery.trim().length > 0;
	const results = useMemo(() => {
		if (!searched) return EMPTY;
		return {
			drivers: data.drivers.filter((d) =>
				matchesQuery(deferredQuery, d.fullName, d.jobTitle, d.nationalId, d.phone),
			),
			badges: data.badges.filter((b) =>
				matchesQuery(
					deferredQuery,
					b.driverName,
					b.jobTitle,
					b.badgeNumber,
					b.nationalId,
					b.vehicleNumber,
				),
			),
			vehicles: data.vehicles.filter((v) =>
				matchesQuery(deferredQuery, v.vehicleNumber, v.model, v.color),
			),
		};
	}, [data, deferredQuery, searched]);

	return (
		<>
			<PageHeader
				title="البحث"
				description="ابحث في جميع بيانات السائقين والمركبات والبطاقات"
			/>

			<SearchInput
				value={query}
				onChange={setQuery}
				placeholder="ابحث بالاسم، رقم الهوية، رقم البطاقة، رقم المركبة..."
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
					<Section icon={User} title="السائقون" count={results.drivers.length}>
						<DriverTable
							drivers={results.drivers}
							basePath="/admin/drivers"
							showEmployee
							emptyText="لا يوجد سائقون مطابقون"
						/>
					</Section>
					<Section icon={CreditCard} title="البطاقات" count={results.badges.length}>
						<BadgeTable
							badges={results.badges}
							basePath="/admin/badges"
							showEmployee
							emptyText="لا توجد بطاقات مطابقة"
						/>
					</Section>
					<Section icon={Car} title="المركبات" count={results.vehicles.length}>
						<VehicleTable vehicles={results.vehicles} emptyText="لا توجد مركبات مطابقة" />
					</Section>
				</div>
			)}
		</>
	);
};

export default AdminSearch;
