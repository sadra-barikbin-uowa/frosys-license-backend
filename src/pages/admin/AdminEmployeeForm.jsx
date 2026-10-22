import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";
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
const permissionOptions = [
	{ value: "drivers.view", label: "عرض السائقين" },
	{ value: "drivers.create", label: "إضافة سائق" },
	{ value: "drivers.edit", label: "تعديل سائق" },
	{ value: "drivers.delete", label: "حذف سائق" },
	{ value: "badges.view", label: "عرض البطاقات" },
	{ value: "badges.create", label: "إنشاء بطاقة" },
	{ value: "badges.edit", label: "تعديل بطاقة" },
	{ value: "badges.delete", label: "حذف بطاقة" },
	{ value: "badges.print", label: "طباعة البطاقات" },
	{ value: "vehicles.view", label: "عرض المركبات" },
	{ value: "vehicles.manage", label: "إدارة المركبات" },
	{ value: "users.manage", label: "إدارة المستخدمين" },
];

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
						<label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
							الصلاحيات الإضافية
							<select
								multiple
								value={values.permissions}
								onChange={(event) =>
									setForm((current) => ({
										...(current ?? values),
										permissions: Array.from(event.target.selectedOptions, (option) => option.value),
									}))
								}
								className="min-h-40 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
							>
								{permissionOptions.map(({ value, label }) => (
									<option key={value} value={value}>{label}</option>
								))}
							</select>
							<span className="text-xs font-normal text-slate-500">استخدم Ctrl أو Command لاختيار عدة صلاحيات. لا تمنح الاختيارات صلاحيات إضافية خارج القائمة المحددة.</span>
						</label>
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
