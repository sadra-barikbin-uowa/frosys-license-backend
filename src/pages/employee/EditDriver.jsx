import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowRight, UserX } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import DriverForm from "../../components/drivers/DriverForm";
import Button from "../../components/common/Button";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { useAsyncData } from "../../hooks/useAsyncData";
import { driverService } from "../../services/driverService";
import { vehicleService } from "../../services/vehicleService";
import { validateDriverForm } from "../../utils/validation";
import { getErrorMessage } from "../../utils/errors";

const EditDriver = ({ role = "employee" }) => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { user } = useAuth();
	const basePath = `/${role}/drivers`;
	const [draft, setDraft] = useState(null);
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);

	const {
		data: loaded,
		loading,
		error,
		reload,
	} = useAsyncData(
		async () => {
			const driver =
				role === "admin"
					? await driverService.getDriverById(id)
					: await driverService.getDriverByIdForEmployee(id, user.id);
			if (!driver) return null;
			const vehicle = driver.vehicleId
				? await vehicleService.getVehicleById(driver.vehicleId)
				: null;
			return { driver, vehicle };
		},
		[id, role, user.id],
	);

	// القيم الابتدائية للنموذج مشتقة من البيانات المحمّلة، وأي تعديل يُخزَّن في draft
	const initialData = useMemo(() => {
		if (!loaded) return null;
		const { driver, vehicle } = loaded;
		return {
			fullName: driver.fullName || "",
			jobTitle: driver.jobTitle || "",
			personType: driver.personType || "",
			birthDate: driver.birthDate || "",
			phone: driver.phone || "",
			address: driver.address || "",
			nationalId: driver.nationalId || "",
			photo: driver.photo || null,
			identityDocument: driver.identityDocument || null,
			identityDocumentBack: driver.identityDocumentBack || null,
			identityDocumentType: driver.identityDocumentType || "administrative_order",
			vehicleType: vehicle?.vehicleType || "",
			vehicleNumber: vehicle?.vehicleNumber || "",
			model: vehicle?.model || "",
			year: vehicle?.year || "",
			color: vehicle?.color || "",
			vehicleRegistrationFront: vehicle?.registrationFront || null,
			vehicleRegistrationBack: vehicle?.registrationBack || null,
		};
	}, [loaded]);
	const data = draft ?? initialData;
	const vehicleId = loaded?.vehicle?.id || null;

	const handleChange = (field, value) => {
		setDraft((prev) => ({ ...(prev ?? initialData), [field]: value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
	};

	const handleSave = async () => {
		if (saving) return;
		const { isValid, errors: validationErrors } = validateDriverForm(data, {
			requireIdentityDocument: false,
		});
		setErrors(validationErrors);
		if (!isValid) {
			showToast("الرجاء تعبئة جميع الحقول المطلوبة بشكل صحيح", "error");
			requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
			return;
		}
		setSaving(true);
		try {
			const driverUpdates = {
				fullName: data.fullName.trim(),
				jobTitle: data.jobTitle.trim(),
				personType: data.personType,
				birthDate: data.birthDate,
				phone: data.phone.trim(),
				address: data.address,
				nationalId: data.nationalId.trim(),
				photo: data.photo,
				identityDocument: data.identityDocument,
				identityDocumentBack: data.identityDocumentBack,
				identityDocumentType: data.identityDocumentType,
			};
			const updatedDriver =
				role === "admin"
					? await driverService.updateDriver(id, driverUpdates)
					: await driverService.updateDriverForEmployee(id, user.id, driverUpdates);
			if (!updatedDriver) throw new Error("Driver not found or access denied");
			if (vehicleId) {
				await vehicleService.updateVehicle(vehicleId, {
					vehicleNumber: data.vehicleNumber.trim(),
					vehicleType: data.vehicleType,
					model: data.model,
					year: data.year,
					color: data.color,
					registrationFront: data.vehicleRegistrationFront,
					registrationBack: data.vehicleRegistrationBack,
				});
			}
			showToast("تم حفظ التعديلات بنجاح", "success");
			navigate(`${basePath}/${id}`);
		} catch (err) {
			console.error(err);
			showToast(getErrorMessage(err, "حدث خطأ أثناء الحفظ"), "error");
			setSaving(false);
		}
	};

	if (loading) return <LoadingState />;
	if (error) return <ErrorState onRetry={reload} />;
	if (!loaded) {
		return (
			<div className="surface">
				<EmptyState
					icon={UserX}
					title="لم يتم العثور على السائق"
					description="ربما حُذف هذا السائق أو لا تملك صلاحية تعديله."
					action={
						<Button to={basePath} variant="secondary" size="sm">
							العودة إلى السائقين
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<>
			<Link
				to={`${basePath}/${id}`}
				className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
			>
				<ArrowRight size={16} /> رجوع
			</Link>
			<PageHeader title="تعديل بيانات السائق" />

			<div className="max-w-3xl">
				<DriverForm data={data} errors={errors} onChange={handleChange} />
				<div className="mt-6 flex justify-end gap-2">
					<Button to={`${basePath}/${id}`} variant="secondary" size="lg">
						إلغاء
					</Button>
					<Button onClick={handleSave} loading={saving} size="lg">
						حفظ التعديلات
					</Button>
				</div>
			</div>
		</>
	);
};

export default EditDriver;
