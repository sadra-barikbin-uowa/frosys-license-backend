import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Button from "../components/common/Button";
import DriverForm from "../components/drivers/DriverForm";
import { useSettings } from "../hooks/useSettings";
import { badgeRequestService } from "../services/badgeRequestService";
import { validateDriverForm } from "../utils/validation";
import { getErrorMessage } from "../utils/errors";
import { useToast } from "../hooks/useToast";

const initialData = {
	fullName: "",
	jobTitle: "",
	personType: "",
	birthDate: "",
	phone: "",
	address: "",
	nationalId: "",
	photo: null,
	identityDocument: null,
	identityDocumentBack: null,
	identityDocumentType: "university_id",
	vehicleType: "",
	vehicleNumber: "",
	model: "",
	year: "",
	color: "",
	vehicleRegistrationFront: null,
	vehicleRegistrationBack: null,
};

const BadgeRequestForm = () => {
	const { settings } = useSettings();
	const { showToast } = useToast();
	const [data, setData] = useState(initialData);
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);

	const handleChange = (field, value) => {
		setData((previous) => ({ ...previous, [field]: value }));
		if (errors[field])
			setErrors((previous) => ({ ...previous, [field]: undefined }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (submitting) return;
		const { isValid, errors: validationErrors } = validateDriverForm(data);
		setErrors(validationErrors);
		if (!isValid) {
			showToast("الرجاء تعبئة جميع الحقول المطلوبة بشكل صحيح", "error");
			requestAnimationFrame(() =>
				document
					.querySelector('[aria-invalid="true"]')
					?.focus({ preventScroll: false }),
			);
			return;
		}

		setSubmitting(true);
		try {
			await badgeRequestService.createRequest({
				...data,
				fullName: data.fullName.trim(),
				jobTitle: data.jobTitle.trim(),
				phone: data.phone.trim(),
				nationalId: data.nationalId.trim(),
				vehicleNumber: data.vehicleNumber.trim(),
			});
			setData(initialData);
			setErrors({});
			showToast("تم إرسال طلبك بنجاح، ستتم مراجعته من الإدارة", "success");
		} catch (error) {
			console.error(error);
			showToast(
				getErrorMessage(error, "تعذر إرسال الطلب، حاول مرة أخرى"),
				"error",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<main className="min-h-dvh bg-[#f4f6f9] p-4 sm:p-6 lg:p-8" dir="rtl">
			<div className="max-w-4xl mx-auto">
				<header className="flex items-center justify-between gap-4 mb-8">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
							{settings.logo ? (
								<img
									src={settings.logo}
									alt=""
									className="w-full h-full object-contain bg-white rounded-xl"
								/>
							) : (
								<ShieldCheck size={21} />
							)}
						</div>
						<div>
							<p className="font-bold text-slate-800">{settings.systemName}</p>
							<p className="text-xs text-slate-500">قسم المتابعة</p>
						</div>
					</div>
					<Link
						to="/login"
						className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
					>
						<ArrowRight size={16} /> تسجيل الدخول
					</Link>
				</header>

				<div className="surface p-5 sm:p-7">
					<h1 className="text-xl font-bold text-slate-800">
						طلب الحصول على باج دخول العجلات الخاص بملاك الجامعة
					</h1>
					<p className="text-sm text-slate-500 mt-1 mb-6">
						أدخل بياناتك وارفع وجهي سنوية المركبة. أرفق وجهي الهوية الجامعية، أو
						الأمر الإداري فقط.
					</p>
					<form onSubmit={handleSubmit}>
						<DriverForm
							data={data}
							errors={errors}
							onChange={handleChange}
							showLicenseFields={false}
						/>
						<div className="flex justify-end mt-6">
							<Button type="submit" loading={submitting} size="lg">
								إرسال الطلب
							</Button>
						</div>
					</form>
				</div>
			</div>
		</main>
	);
};

export default BadgeRequestForm;
