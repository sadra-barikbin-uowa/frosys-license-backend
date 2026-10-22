import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, AlertCircle, ShieldCheck, Users, CreditCard, Car, UserCog } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useToast } from "../../hooks/useToast";
import { employeeService } from "../../services/employeeService";
import { AppError, getErrorMessage } from "../../utils/errors";

const MIN_PASSWORD = 8;
const roleOptions = [
	{ value: "admin", label: "مدير النظام" },
	{ value: "employee", label: "موظف" },
	{ value: "supervisor", label: "مشرف" },
	{ value: "viewer", label: "مستخدم للعرض فقط" },
];
const permissionGroups = [
	{
		title: "السائقون",
		icon: Users,
		options: [
			{ value: "drivers.view", label: "عرض السائقين" },
			{ value: "drivers.create", label: "إضافة سائق" },
			{ value: "drivers.edit", label: "تعديل سائق" },
			{ value: "drivers.delete", label: "حذف سائق" },
		],
	},
	{
		title: "البطاقات",
		icon: CreditCard,
		options: [
			{ value: "badges.view", label: "عرض البطاقات" },
			{ value: "badges.create", label: "إنشاء بطاقة" },
			{ value: "badges.edit", label: "تعديل بطاقة" },
			{ value: "badges.delete", label: "حذف بطاقة" },
			{ value: "badges.print", label: "طباعة البطاقات" },
		],
	},
	{
		title: "المركبات",
		icon: Car,
		options: [
			{ value: "vehicles.view", label: "عرض المركبات" },
			{ value: "vehicles.manage", label: "إدارة المركبات" },
		],
	},
	{
		title: "المستخدمون",
		icon: UserCog,
		options: [{ value: "users.manage", label: "إدارة المستخدمين" }],
	},
];
const viewerPermissions = ["drivers.view", "badges.view", "vehicles.view"];

const validate = (form, isEditing) => {
	const errors = {};
	if (!form.name.trim()) errors.name = "الاسم مطلوب";
	if (!form.username.trim()) errors.username = "اسم المستخدم مطلوب";
	else if (/\s/.test(form.username.trim())) errors.username = "اسم المستخدم لا يجب أن يحتوي على مسافات";
	if (!form.jobTitle.trim()) errors.jobTitle = "المسمى الوظيفي مطلوب";
	if ((!isEditing || form.password) && form.password.length < MIN_PASSWORD)
		errors.password = `كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD} أحرف`;
	return errors;
};

const AdminEmployeeForm = () => {
	const { id } = useParams();
	const isEditing = Boolean(id);
	const navigate = useNavigate();
	const { showToast } = useToast();
	const [form, setForm] = useState(null);
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const { data: employee, loading, error, reload } = useAsyncData(
		() => (isEditing ? employeeService.getEmployeeById(id) : Promise.resolve(null)),
		[id],
	);

	const values = form ?? (employee
		? {
				name: employee.name || "",
				username: employee.username || "",
				jobTitle: employee.jobTitle || "",
				role: employee.role || "employee",
				permissions: employee.permissions || [],
				password: "",
			}
		: { name: "", username: "", jobTitle: "", role: "employee", permissions: [], password: "" });

	const setField = (field) => (event) => {
		setForm((current) => ({ ...(current ?? values), [field]: event.target.value }));
		setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
	};

	const handleSave = async (event) => {
		event.preventDefault();
		if (saving) return;
		const nextErrors = validate(values, isEditing);
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		setSaving(true);
		try {
			const payload = {
				name: values.name.trim(),
				username: values.username.trim(),
				jobTitle: values.jobTitle.trim(),
				role: values.role,
				permissions: values.permissions,
			};
			if (values.password) payload.password = values.password;

			if (isEditing) {
				await employeeService.updateEmployee(id, payload);
				showToast("تم تحديث بيانات الموظف بنجاح");
			} else {
				await employeeService.createEmployee({ ...payload, password: values.password });
				showToast("تمت إضافة الموظف بنجاح");
			}
			navigate("/admin/employees");
		} catch (err) {
			if (!(err instanceof AppError)) console.error(err);
			setErrors({ form: getErrorMessage(err, "تعذر حفظ بيانات الموظف") });
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <LoadingState />;
	if (error) return <ErrorState onRetry={reload} />;
	if (isEditing && !employee) {
		return (
			<div className="surface">
				<EmptyState
					title="لم يتم العثور على الموظف"
					description="ربما حُذف هذا الموظف."
					action={
						<Button to="/admin/employees" variant="secondary" size="sm">
							العودة إلى الموظفين
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<>
			<Link
				to="/admin/employees"
				className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
			>
				<ArrowRight size={16} /> رجوع
			</Link>
			<PageHeader
				title={isEditing ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
				description="أدخل بيانات الموظف وحساب تسجيل الدخول"
			/>
			<Card className="max-w-2xl">
				<form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
					{errors.form && (
						<div
							role="alert"
							className="flex items-center gap-2 text-rose-600 bg-rose-50 rounded-lg px-3 py-2.5 text-xs"
						>
							<AlertCircle size={15} className="shrink-0" />
							{errors.form}
						</div>
					)}
					<Input
						label="الاسم الكامل"
						required
						value={values.name}
						onChange={setField("name")}
						error={errors.name}
						autoComplete="off"
					/>
					<Input
						label="اسم المستخدم"
						required
						value={values.username}
						onChange={setField("username")}
						error={errors.username}
						autoComplete="off"
						autoCapitalize="none"
						spellCheck={false}
					/>
					<Input
						label="المسمى الوظيفي"
						required
						value={values.jobTitle}
						onChange={setField("jobTitle")}
						error={errors.jobTitle}
						autoComplete="organization-title"
					/>
					<Select
						label="الدور"
						value={values.role}
						onChange={(event) => {
							const role = event.target.value;
							setForm((current) => ({
								...(current ?? values),
								role,
								permissions: role === "viewer"
									? values.permissions.filter((permission) =>
											["drivers.view", "badges.view", "vehicles.view"].includes(permission),
										)
									: values.permissions,
							}));
						}}
						options={roleOptions}
						required
					/>
					{values.role !== "admin" && (
						<section
							aria-labelledby="additional-permissions-title"
							className="overflow-hidden rounded-2xl border border-indigo-100 bg-slate-50/70"
						>
							<div className="flex items-start justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-4 sm:px-5">
								<div className="flex items-start gap-3">
									<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
										<ShieldCheck size={19} />
									</span>
									<div>
										<h2 id="additional-permissions-title" className="text-sm font-bold text-slate-800">
											الصلاحيات الإضافية
										</h2>
										<p className="mt-1 text-xs leading-5 text-slate-500">
											اختر ما يحتاجه هذا المستخدم إلى جانب صلاحيات دوره الأساسية.
										</p>
									</div>
								</div>
								<span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
									{values.permissions.length} محددة
								</span>
							</div>

							<div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
								{permissionGroups.map(({ title, icon: Icon, options }) => {
									const availableOptions = values.role === "viewer"
										? options.filter(({ value }) => viewerPermissions.includes(value))
										: options;

									if (!availableOptions.length) return null;

									return (
										<fieldset key={title} className="rounded-xl border border-slate-200 bg-white p-3.5">
											<legend className="sr-only">{title}</legend>
											<div className="mb-2.5 flex items-center gap-2 text-xs font-bold text-slate-700">
												<Icon size={15} className="text-indigo-500" />
												{title}
											</div>
											<div className="grid gap-1.5">
												{availableOptions.map(({ value, label }) => {
													const checked = values.permissions.includes(value);
													return (
														<label
															key={value}
															className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
																checked
																	? "border-indigo-200 bg-indigo-50/70 text-indigo-800"
																	: "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"
															}`}
														>
															<input
																type="checkbox"
																checked={checked}
																onChange={() =>
																	setForm((current) => {
																		const currentPermissions = current?.permissions ?? values.permissions;
																		return {
																			...(current ?? values),
																			permissions: checked
																				? currentPermissions.filter((permission) => permission !== value)
																				: [...currentPermissions, value],
																		};
																	})
																}
																className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
															/>
															<span>{label}</span>
														</label>
													);
												})}
											</div>
										</fieldset>
									);
								})}
							</div>
							<p className="px-4 pb-4 text-[11px] leading-5 text-slate-500 sm:px-5">
								{values.role === "viewer"
									? "يمكن منح مستخدم العرض صلاحيات العرض فقط."
									: "الصلاحيات الإضافية تُمنح لهذا المستخدم فقط ولا تغيّر صلاحيات بقية المستخدمين."}
							</p>
						</section>
					)}
					<Input
						label={isEditing ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}
						type="password"
						value={values.password}
						onChange={setField("password")}
						error={errors.password}
						hint={isEditing ? "اتركها فارغة للإبقاء على كلمة المرور الحالية" : undefined}
						autoComplete="new-password"
					/>
					<div className="flex justify-end gap-2 pt-2">
						<Button to="/admin/employees" variant="secondary" disabled={saving}>
							إلغاء
						</Button>
						<Button type="submit" loading={saving}>
							{isEditing ? "حفظ التعديلات" : "إضافة الموظف"}
						</Button>
					</div>
				</form>
			</Card>
		</>
	);
};

export default AdminEmployeeForm;
