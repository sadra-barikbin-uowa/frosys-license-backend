import { useDeferredValue, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import SearchInput from "../../components/common/SearchInput";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import DriverTable from "../../components/drivers/DriverTable";
import { useAuth } from "../../hooks/useAuth";
import { useAsyncData } from "../../hooks/useAsyncData";
import { driverService } from "../../services/driverService";
import { matchesQuery } from "../../utils/search";

const Drivers = () => {
	const { user } = useAuth();
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);
	const {
		data: drivers,
		loading,
		error,
		reload,
	} = useAsyncData(() => driverService.getDriversByEmployee(user.id), [user.id], []);

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
				description="قائمة السائقين الذين قمت بإضافتهم"
				actions={
					<Button to="/employee/drivers/add" icon={UserPlus}>
						إضافة سائق
					</Button>
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
						basePath="/employee/drivers"
						emptyText={query ? "لا يوجد سائقون مطابقون للبحث" : "لم تقم بإضافة أي سائق بعد"}
					/>
				)}
			</Card>
		</>
	);
};

export default Drivers;
