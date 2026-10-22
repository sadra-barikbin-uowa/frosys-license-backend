import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Pencil, Ban, Trash2, CheckCircle2, UserCog } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import SearchInput from "../../components/common/SearchInput";
import Button from "../../components/common/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { useToast } from "../../hooks/useToast";
import { useAsyncData } from "../../hooks/useAsyncData";
import { employeeService } from "../../services/employeeService";
import { badgeService } from "../../services/badgeService";
import { matchesQuery } from "../../utils/search";
import { getErrorMessage } from "../../utils/errors";
import { useAuth } from "../../hooks/useAuth";

const StatusPill = ({ active }) => (
	<span
		className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
			active
				? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
				: "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
		}`}
	>
		<span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
		{active ? "فعال" : "موقوف"}
	</span>
);

const roleLabels = {
	admin: "مدير النظام",
	employee: "موظف",
	supervisor: "مشرف",
	viewer: "عرض فقط",
};

const RolePill = ({ role }) => {
	const isAdmin = role === "admin";
	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${
				isAdmin
					? "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
					: "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
			}`}
		>
			{isAdmin ? "★ " : ""}{roleLabels[role] || role}
		</span>
	);
};

const AdminEmployees = () => {
	const { showToast } = useToast();
	const { can } = useAuth();
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);
	const [confirmDelete, setConfirmDelete] = useState(null);

	const { data, loading, error, reload } = useAsyncData(
		async () => {
			const [employees, badges] = await Promise.all([
				employeeService.getEmployees(),
				can("badges.view") ? badgeService.getBadges() : Promise.resolve([]),
			]);
			const badgeCounts = {};
			badges.forEach((b) => {
				badgeCounts[b.createdBy] = (badgeCounts[b.createdBy] || 0) + 1;
			});
			return { employees, badgeCounts };
		},
		[can],
		{ employees: [], badgeCounts: {} },
	);
	const { employees, badgeCounts } = data;

	const filtered = useMemo(
		() =>
			employees.filter((e) => matchesQuery(deferredQuery, e.name, e.username, e.jobTitle)),
		[employees, deferredQuery],
	);

	const openAdd = () => navigate("/admin/employees/add");
	const openEdit = (employee) => navigate(`/admin/employees/${employee.id}/edit`);

	const handleToggle = async (employee) => {
		try {
			await employeeService.toggleEmployeeStatus(employee.id);
			showToast(employee.status === "Active" ? "تم إيقاف حساب الموظف" : "تم تفعيل حساب الموظف");
			reload();
		} catch (err) {
			console.error(err);
			showToast(getErrorMessage(err, "تعذر تغيير حالة الحساب"), "error");
		}
	};

	const handleDelete = async () => {
		await employeeService.deleteEmployee(confirmDelete.id);
		showToast("تم حذف الموظف");
		reload();
	};

	// أزرار الإجراءات: أيقونات في الجدول، وأزرار بنص على بطاقات الجوال
	const actionButtons = (emp, { labelled = false } = {}) => {
		const active = emp.status === "Active";
		if (labelled) {
			return (
				<>
					<Button variant="secondary" size="sm" icon={Pencil} onClick={() => openEdit(emp)}>
						تعديل
					</Button>
					<Button
						variant="secondary"
						size="sm"
						icon={active ? Ban : CheckCircle2}
						onClick={() => handleToggle(emp)}
					>
						{active ? "إيقاف" : "تفعيل"}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						icon={Trash2}
						onClick={() => setConfirmDelete(emp)}
						className="text-rose-600 hover:bg-rose-50"
					>
						حذف
					</Button>
				</>
			);
		}
		const base = "p-1.5 rounded-md transition-colors";
		return (
			<>
				<button
					type="button"
					onClick={() => openEdit(emp)}
					title="تعديل"
					aria-label={`تعديل ${emp.name}`}
					className={`${base} hover:bg-slate-100 text-slate-500`}
				>
					<Pencil size={15} />
				</button>
				<button
					type="button"
					onClick={() => handleToggle(emp)}
					title={active ? "إيقاف" : "تفعيل"}
					aria-label={`${active ? "إيقاف" : "تفعيل"} ${emp.name}`}
					className={`${base} hover:bg-amber-50 text-amber-500`}
				>
					{active ? <Ban size={15} /> : <CheckCircle2 size={15} />}
				</button>
				<button
					type="button"
					onClick={() => setConfirmDelete(emp)}
					title="حذف"
					aria-label={`حذف ${emp.name}`}
					className={`${base} hover:bg-rose-50 text-rose-500`}
				>
					<Trash2 size={15} />
				</button>
			</>
		);
	};

	return (
		<>
			<PageHeader
				title="الموظفون"
				description="إدارة حسابات الموظفين وصلاحياتهم"
				actions={
					<Button icon={UserPlus} onClick={openAdd}>
						إضافة موظف
					</Button>
				}
			/>

			<Card>
				<SearchInput
					value={query}
					onChange={setQuery}
					placeholder="ابحث بالاسم أو اسم المستخدم..."
					className="max-w-sm mb-5"
				/>

				{loading ? (
					<LoadingState />
				) : error ? (
					<ErrorState onRetry={reload} />
				) : filtered.length === 0 ? (
					<EmptyState
						icon={UserCog}
						title={query ? "لا يوجد موظفون مطابقون للبحث" : "لا يوجد موظفون"}
						description={query ? undefined : "أضف أول موظف ليتمكن من تسجيل الدخول وإصدار البطاقات."}
						action={
							!query && (
								<Button icon={UserPlus} size="sm" onClick={openAdd}>
									إضافة موظف
								</Button>
							)
						}
					/>
				) : (
					<>
						<div className="hidden lg:block overflow-x-auto">
							<table className="w-full text-sm min-w-180">
								<thead>
									<tr className="text-right text-xs text-slate-500">
										<th scope="col" className="py-3 px-3 font-medium">الاسم</th>
										<th scope="col" className="py-3 px-3 font-medium">اسم المستخدم</th>
										<th scope="col" className="py-3 px-3 font-medium">المسمى الوظيفي</th>
										<th scope="col" className="py-3 px-3 font-medium">الدور</th>
										<th scope="col" className="py-3 px-3 font-medium">عدد البطاقات</th>
										<th scope="col" className="py-3 px-3 font-medium">الحالة</th>
										<th scope="col" className="py-3 px-3 font-medium">الإجراءات</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((emp) => (
										<tr
											key={emp.id}
											className={`border-b transition-colors hover:bg-slate-50/60 ${
												emp.role === "admin" ? "border-violet-100 bg-violet-50/40" : "border-slate-50"
											}`}
										>
											<td className={`py-3 px-3 font-medium whitespace-nowrap ${emp.role === "admin" ? "text-violet-900" : "text-slate-700"}`}>
												{emp.name}
												{emp.role === "admin" && <span className="mr-2 text-[10px] font-semibold text-violet-600">مدير النظام</span>}
											</td>
											<td className="py-3 px-3 text-slate-600 whitespace-nowrap">{emp.username}</td>
											<td className="py-3 px-3 text-slate-600 whitespace-nowrap">{emp.jobTitle || "—"}</td>
											<td className="py-3 px-3"><RolePill role={emp.role} /></td>
											<td className="py-3 px-3 text-slate-600 whitespace-nowrap">
												{badgeCounts[emp.id] || 0}
											</td>
											<td className="py-3 px-3">
												<StatusPill active={emp.status === "Active"} />
											</td>
											<td className="py-3 px-3">
												<div className="flex items-center gap-1">{actionButtons(emp)}</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<ul className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
							{filtered.map((emp) => (
								<li
									key={emp.id}
									className="rounded-xl border border-slate-100 p-3.5 flex flex-col gap-3"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className={`text-sm font-bold truncate ${emp.role === "admin" ? "text-violet-900" : "text-slate-800"}`}>
												{emp.name}
											</p>
											<p className="text-xs text-slate-500" dir="ltr">
												@{emp.username}
											</p>
										</div>
										<div className="flex flex-col items-end gap-1.5">
											<StatusPill active={emp.status === "Active"} />
											<RolePill role={emp.role} />
										</div>
									</div>
									<dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
										<div>
											<dt className="text-slate-400">المسمى الوظيفي</dt>
											<dd className="text-slate-700">{emp.jobTitle || "—"}</dd>
										</div>
										<div>
											<dt className="text-slate-400">عدد البطاقات</dt>
											<dd className="text-slate-700">{badgeCounts[emp.id] || 0}</dd>
										</div>
									</dl>
									<div className="flex flex-wrap gap-2 pt-1 border-t border-slate-50">
										{actionButtons(emp, { labelled: true })}
									</div>
								</li>
							))}
						</ul>
					</>
				)}
			</Card>

			<ConfirmDialog
				open={!!confirmDelete}
				onClose={() => setConfirmDelete(null)}
				title="حذف الموظف"
				message={`هل أنت متأكد من حذف الموظف "${confirmDelete?.name}"؟ لن يتم حذف البطاقات التي أنشأها.`}
				confirmLabel="حذف"
				onConfirm={handleDelete}
			/>
		</>
	);
};

export default AdminEmployees;
