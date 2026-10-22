import { Link } from "react-router-dom";
import { Eye, Printer, Ban, RotateCcw, Trash2, CreditCard } from "lucide-react";
import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import { formatDate } from "../../utils/formatDate";
import { BADGE_STATUS, computeBadgeStatus } from "../../utils/badgeStatus";
import { vehicleTypeLabel } from "../../data/vehicleTypes";

const iconButton = "p-1.5 rounded-md transition-colors";

// الجدول على الشاشات الكبيرة، وقائمة بطاقات على الجوال والأجهزة اللوحية الصغيرة
const BadgeTable = ({
	badges,
	basePath = "/admin/badges",
	showEmployee = true,
	onSuspend,
	onReactivate,
	onDelete,
	canPrint = false,
	emptyText = "لا توجد بطاقات مسجلة",
}) => {
	if (!badges.length) {
		return <EmptyState icon={CreditCard} title={emptyText} />;
	}

	return (
		<>
			{/* جدول: lg وما فوق */}
			<div className="hidden lg:block overflow-x-auto">
				<table className="w-full text-sm min-w-180">
					<thead>
						<tr className="text-right text-xs text-slate-500">
							<th scope="col" className="py-3 px-3 font-medium">السائق</th>
							<th scope="col" className="py-3 px-3 font-medium">رقم البطاقة</th>
							<th scope="col" className="py-3 px-3 font-medium">نوع المركبة</th>
							<th scope="col" className="py-3 px-3 font-medium">رقم المركبة</th>
							{showEmployee && <th scope="col" className="py-3 px-3 font-medium">الموظف</th>}
							<th scope="col" className="py-3 px-3 font-medium hidden xl:table-cell">تاريخ الإصدار</th>
							<th scope="col" className="py-3 px-3 font-medium">تاريخ الانتهاء</th>
							<th scope="col" className="py-3 px-3 font-medium">الحالة</th>
							<th scope="col" className="py-3 px-3 font-medium">الإجراءات</th>
						</tr>
					</thead>
					<tbody>
						{badges.map((badge) => (
							<tr
								key={badge.id}
								className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
							>
								<td className="py-3 px-3">
									<div className="flex items-center gap-2.5">
										<Avatar src={badge.driverPhoto} alt={badge.driverName} />
										<span className="flex flex-col min-w-0">
											<span className="font-medium text-slate-700 whitespace-nowrap">{badge.driverName}</span>
											<span className="text-xs text-slate-500 truncate">{badge.jobTitle || "—"}</span>
										</span>
									</div>
								</td>
								<td className="py-3 px-3 text-indigo-600 font-medium whitespace-nowrap">
									{badge.badgeNumber}
								</td>
								<td className="py-3 px-3 text-slate-600 whitespace-nowrap">
									{vehicleTypeLabel(badge.vehicleType) || "—"}
								</td>
								<td className="py-3 px-3 text-slate-600 whitespace-nowrap">
									{badge.vehicleNumber || "—"}
								</td>
								{showEmployee && (
									<td className="py-3 px-3 text-slate-600 whitespace-nowrap">
										{badge.createdByName}
									</td>
								)}
								<td className="py-3 px-3 text-slate-500 whitespace-nowrap hidden xl:table-cell">
									{formatDate(badge.issueDate)}
								</td>
								<td className="py-3 px-3 text-slate-500 whitespace-nowrap">
									{formatDate(badge.expiryDate)}
								</td>
								<td className="py-3 px-3">
									<StatusBadge badge={badge} />
								</td>
								<td className="py-3 px-3">
									<div className="flex items-center gap-1">
										<Link
											to={`${basePath}/${badge.id}`}
											title="عرض"
											aria-label={`عرض بطاقة ${badge.driverName}`}
											className={`${iconButton} hover:bg-slate-100 text-slate-500`}
										>
											<Eye size={15} />
										</Link>
										{canPrint && (
											<Link
												to={`${basePath}/${badge.id}?print=1`}
												title="طباعة"
												aria-label={`طباعة بطاقة ${badge.driverName}`}
												className={`${iconButton} hover:bg-slate-100 text-slate-500`}
											>
												<Printer size={15} />
											</Link>
										)}
										{computeBadgeStatus(badge) === BADGE_STATUS.SUSPENDED
											? onReactivate && (
													<button
														type="button"
														onClick={() => onReactivate(badge)}
														title="إعادة التفعيل"
														aria-label={`إعادة تفعيل بطاقة ${badge.driverName}`}
														className={`${iconButton} hover:bg-emerald-50 text-emerald-600`}
													>
														<RotateCcw size={15} />
													</button>
												)
											: onSuspend && (
													<button
														type="button"
														onClick={() => onSuspend(badge)}
														title="إيقاف"
														aria-label={`إيقاف بطاقة ${badge.driverName}`}
														className={`${iconButton} hover:bg-amber-50 text-amber-500`}
													>
														<Ban size={15} />
													</button>
												)}
										{onDelete && (
											<button
												type="button"
												onClick={() => onDelete(badge)}
												title="حذف"
												aria-label={`حذف بطاقة ${badge.driverName}`}
												className={`${iconButton} hover:bg-rose-50 text-rose-500`}
											>
												<Trash2 size={15} />
											</button>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* قائمة بطاقات: أقل من lg */}
			<ul className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
				{badges.map((badge) => {
					const suspended = computeBadgeStatus(badge) === BADGE_STATUS.SUSPENDED;
					return (
						<li
							key={badge.id}
							className="rounded-xl border border-slate-100 p-3.5 flex flex-col gap-3"
						>
							<div className="flex items-start gap-3">
								<Avatar src={badge.driverPhoto} alt={badge.driverName} size="lg" shape="lg" />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-bold text-slate-800 truncate">{badge.driverName}</p>
									<p className="text-xs text-slate-500 truncate">{badge.jobTitle || "—"}</p>
									<p className="text-xs text-indigo-600 font-medium">{badge.badgeNumber}</p>
								</div>
								<StatusBadge badge={badge} />
							</div>
							<dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
								<div>
									<dt className="text-slate-400">المركبة</dt>
									<dd className="text-slate-700 truncate">
										{[vehicleTypeLabel(badge.vehicleType), badge.vehicleNumber]
											.filter(Boolean)
											.join(" — ") || "—"}
									</dd>
								</div>
								{showEmployee && (
									<div>
										<dt className="text-slate-400">الموظف</dt>
										<dd className="text-slate-700 truncate">{badge.createdByName || "—"}</dd>
									</div>
								)}
								<div>
									<dt className="text-slate-400">الإصدار</dt>
									<dd className="text-slate-700">{formatDate(badge.issueDate)}</dd>
								</div>
								<div>
									<dt className="text-slate-400">الانتهاء</dt>
									<dd className="text-slate-700">{formatDate(badge.expiryDate)}</dd>
								</div>
							</dl>
							<div className="flex flex-wrap gap-2 pt-1 border-t border-slate-50 mt-auto">
								<Button to={`${basePath}/${badge.id}`} variant="secondary" size="sm" icon={Eye} className="flex-1">
									عرض
								</Button>
								{canPrint && (
									<Button
										to={`${basePath}/${badge.id}?print=1`}
										variant="outline"
										size="sm"
										icon={Printer}
										className="flex-1"
									>
										طباعة
									</Button>
								)}
								{suspended
									? onReactivate && (
											<Button
												variant="secondary"
												size="sm"
												icon={RotateCcw}
												onClick={() => onReactivate(badge)}
												aria-label={`إعادة تفعيل بطاقة ${badge.driverName}`}
											>
												تفعيل
											</Button>
										)
									: onSuspend && (
											<Button
												variant="secondary"
												size="sm"
												icon={Ban}
												onClick={() => onSuspend(badge)}
												aria-label={`إيقاف بطاقة ${badge.driverName}`}
											>
												إيقاف
											</Button>
										)}
								{onDelete && (
									<Button
										variant="ghost"
										size="sm"
										icon={Trash2}
										onClick={() => onDelete(badge)}
										aria-label={`حذف بطاقة ${badge.driverName}`}
										className="text-rose-600 hover:bg-rose-50"
									>
										حذف
									</Button>
								)}
							</div>
						</li>
					);
				})}
			</ul>
		</>
	);
};

export default BadgeTable;
