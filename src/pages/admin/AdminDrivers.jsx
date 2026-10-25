import { useDeferredValue, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import SearchInput from "../../components/common/SearchInput";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import DriverTable from "../../components/drivers/DriverTable";
import { useAsyncData } from "../../hooks/useAsyncData";
import { driverService } from "../../services/driverService";
import { matchesQuery } from "../../utils/search";
import { useAuth } from "../../hooks/useAuth";

const AdminDrivers = () => {
	const { can } = useAuth();
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);
	const {
		data: drivers,
		loading,
		error,
		reload,
	} = useAsyncData(() => driverService.getDrivers(), [], []);

	const filtered = useMemo(
		() =>
			drivers.filter((d) =>
				matchesQuery(deferredQuery, d.fullName, d.jobTitle, d.nationalId, d.phone),
			),
		[drivers, deferredQuery],
	);

	return (
		<>
			<PageHeader
				title="السائقون"
				description="جميع السائقين المسجّلين في النظام"
				actions={
					can("drivers.create") && (
						<Button to="/admin/drivers/add" icon={UserPlus}>
							إضافة سائق
						</Button>
					)
				}
			/>

			<Card>
				<SearchInput
					value={query}
					onChange={setQuery}
					placeholder="ابحث بالاسم أو رقم الهوية أو الهاتف..."
					className="max-w-sm mb-5"
				/>
				{loading ? (
					<LoadingState />
				) : error ? (
					<ErrorState onRetry={reload} />
				) : (
					<DriverTable
						drivers={filtered}
						basePath="/admin/drivers"
						showEmployee
						emptyText={query ? "لا يوجد سائقون مطابقون للبحث" : "لا يوجد سائقون مسجلون"}
					/>
				)}
			</Card>
		</>
	);
};

export default AdminDrivers;
