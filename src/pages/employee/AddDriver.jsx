import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import DriverForm from "../../components/drivers/DriverForm";
import BadgePreview from "../../components/badges/BadgePreview";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useSettings } from "../../hooks/useSettings";
import { driverService } from "../../services/driverService";
import { vehicleService } from "../../services/vehicleService";
import { badgeService } from "../../services/badgeService";
import { validateDriverForm } from "../../utils/validation";
import { addYears, todayISO } from "../../utils/formatDate";
import { getErrorMessage } from "../../utils/errors";

const initialState = {
	fullName: "",
	jobTitle: "",
	personType: "",
	birthDate: "",
	phone: "",
	address: "",
	nationalId: "",
	photo: null,
	licenseNumber: "",
	licenseIssue: "",
	licenseExpiry: "",
	vehicleType: "",
	vehicleNumber: "",
	model: "",
	year: "",
	color: "",
	vehiclePhoto: null,
};

const AddDriver = ({ role = "employee" }) => {
	const { user } = useAuth();
	const { settings } = useSettings();
	const { showToast } = useToast();
	const navigate = useNavigate();
	const [data, setData] = useState(initialState);
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);

	const handleChange = (field, value) => {
		setData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
	};

	const validityYears = Number(settings.badgeValidityYears) || 1;

	const handleSubmit = async () => {
		if (submitting) return;
		const { isValid, errors: validationErrors } = validateDriverForm(data);
		setErrors(validationErrors);
		if (!isValid) {
			showToast("الرجاء تعبئة جميع الحقول المطلوبة بشكل صحيح", "error");
			// ننقل التركيز إلى أول حقل فيه خطأ ليراه المستخدم دون بحث
			requestAnimationFrame(() =>
				document.querySelector('[aria-invalid="true"]')?.focus({ preventScroll: false }),
			);
			return;
		}

		setSubmitting(true);
		let createdDriverId = null;
		let createdVehicleId = null;
		try {
			const newDriver = await driverService.createDriver({
				fullName: data.fullName.trim(),
				jobTitle: data.jobTitle.trim(),
				personType: data.personType,
				birthDate: data.birthDate,
				phone: data.phone.trim(),
				address: data.address,
				nationalId: data.nationalId.trim(),
				photo: data.photo,
				licenseNumber: data.licenseNumber.trim(),
				licenseIssue: data.licenseIssue,
				licenseExpiry: data.licenseExpiry,
				createdBy: user.id,
				createdByName: user.name,
			});
			createdDriverId = newDriver.id;

			const newVehicle = await vehicleService.createVehicle({
				vehicleNumber: data.vehicleNumber.trim(),
				vehicleType: data.vehicleType,
				model: data.model,
				year: data.year,
				color: data.color,
				photo: data.vehiclePhoto,
				driverId: newDriver.id,
				createdBy: user.id,
			});
			createdVehicleId = newVehicle.id;

			const issueDate = todayISO();
			const newBadge = await badgeService.createBadge({
				driverId: newDriver.id,
				vehicleId: newVehicle.id,
				driverName: data.fullName.trim(),
				jobTitle: data.jobTitle.trim(),
				personType: data.personType,
				driverPhoto: data.photo,
				nationalId: data.nationalId.trim(),
				licenseNumber: data.licenseNumber.trim(),
				vehicleType: data.vehicleType,
				vehicleNumber: data.vehicleNumber.trim(),
				vehicleModel: data.model,
				vehicleColor: data.color,
				issueDate,
				expiryDate: addYears(issueDate, validityYears),
				createdBy: user.id,
				createdByName: user.name,
			});

			showToast("تم إنشاء السائق والبطاقة بنجاح", "success");
			navigate(`/${role}/badges/${newBadge.id}`);
		} catch (err) {
			console.error(err);
			if (createdVehicleId) {
				try {
					await vehicleService.deleteVehicle(createdVehicleId);
				} catch (rollbackError) {
					console.error("تعذر التراجع عن إنشاء المركبة", rollbackError);
				}
			}
			if (createdDriverId) {
				try {
					await driverService.deleteDriver(createdDriverId);
				} catch (rollbackError) {
					console.error("تعذر التراجع عن إنشاء السائق", rollbackError);
				}
			}
			showToast(getErrorMessage(err, "حدث خطأ أثناء إنشاء البطاقة، حاول مرة أخرى"), "error");
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageHeader
				title="إضافة سائق جديد"
				description="أدخل بيانات السائق والمركبة، وستظهر معاينة البطاقة مباشرة أثناء الكتابة"
			/>

			<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
				<DriverForm data={data} errors={errors} onChange={handleChange} />

				<div className="lg:sticky lg:top-6 flex flex-col gap-4 min-w-0">
					<Card>
						<div className="flex items-center gap-2 mb-4">
							<Sparkles size={16} className="text-indigo-500" />
							<h2 className="text-sm font-bold text-slate-800">معاينة البطاقة</h2>
						</div>
						<BadgePreview
							fit
							data={{
								...data,
								issueDate: todayISO(),
								expiryDate: addYears(todayISO(), validityYears),
								vehicleColor: data.color,
							}}
						/>
						<p className="text-[11px] text-slate-500 text-center mt-4">
							يتم توليد رقم البطاقة تلقائيًا عند الضغط على "إنشاء البطاقة"
						</p>
					</Card>

					<Button onClick={handleSubmit} loading={submitting} size="lg" className="w-full">
						إنشاء البطاقة
					</Button>
				</div>
			</div>
		</>
	);
};

export default AddDriver;
