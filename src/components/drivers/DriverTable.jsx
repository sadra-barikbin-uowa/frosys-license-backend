import { Link } from "react-router-dom";
import { Eye, User } from "lucide-react";
import Avatar from "../common/Avatar";
import EmptyState from "../common/EmptyState";
import DriverCard from "./DriverCard";
import { formatDate } from "../../utils/formatDate";

// الجدول على الشاشات الكبيرة، وبطاقات قابلة للنقر على الجوال والأجهزة اللوحية
const DriverTable = ({
	drivers,
	basePath = "/employee/drivers",
	showEmployee = false,
	emptyText = "لا يوجد سائقون مسجلون",
}) => {
	if (!drivers.length) {
		return <EmptyState icon={User} title={emptyText} />;
	}

	return (
		<>
			<div className="hidden lg:block overflow-x-auto">
				<table className="w-full text-sm min-w-170">
					<thead>
						<tr className="text-right text-xs text-slate-500">
							<th scope="col" className="py-3 px-3 font-medium">السائق</th>
							<th scope="col" className="py-3 px-3 font-medium">رقم الهوية</th>
							<th scope="col" className="py-3 px-3 font-medium">الهاتف</th>
							{showEmployee && (
								<th scope="col" className="py-3 px-3 font-medium">أضيف بواسطة</th>
							)}
							<th scope="col" className="py-3 px-3 font-medium">تاريخ الإضافة</th>
							<th scope="col" className="py-3 px-3 font-medium">
								<span className="sr-only">الإجراءات</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{drivers.map((driver) => (
							<tr
								key={driver.id}
								className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
							>
								<td className="py-3 px-3">
									<div className="flex items-center gap-2.5">
										<Avatar src={driver.photo} alt={driver.fullName} />
										<Link
											to={`${basePath}/${driver.id}`}
											className="font-medium text-slate-700 whitespace-nowrap hover:text-indigo-600"
										>
											{driver.fullName}
										</Link>
									</div>
								</td>
								<td className="py-3 px-3 text-slate-600 whitespace-nowrap">{driver.nationalId}</td>
								<td className="py-3 px-3 text-slate-600 whitespace-nowrap">{driver.phone}</td>
								{showEmployee && (
									<td className="py-3 px-3 text-slate-600 whitespace-nowrap">
										{driver.createdByName}
									</td>
								)}
								<td className="py-3 px-3 text-slate-500 whitespace-nowrap">
									{formatDate(driver.createdAt)}
								</td>
								<td className="py-3 px-3">
									<Link
										to={`${basePath}/${driver.id}`}
										title="عرض"
										aria-label={`عرض بيانات ${driver.fullName}`}
										className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 inline-block"
									>
										<Eye size={15} />
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<ul className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
				{drivers.map((driver) => (
					<li key={driver.id} className="contents">
						<DriverCard driver={driver} basePath={basePath} showEmployee={showEmployee} />
					</li>
				))}
			</ul>
		</>
	);
};

export default DriverTable;
