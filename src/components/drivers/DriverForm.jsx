import Input from "../common/Input";
import ImageUpload from "../common/ImageUpload";
import Select from "../common/Select";
import { VEHICLE_TYPES } from "../../data/vehicleTypes";
import { PERSON_TYPES } from "../../data/personTypes";
import { toLatinDigits } from "../../utils/search";
import { User, Car as CarIcon } from "lucide-react";

// نموذج شامل لبيانات السائق والمركبة، يُستخدم في صفحتي
// إضافة سائق وتعديل سائق. البيانات تُدار بالكامل من الصفحة الأب (Controlled)
const Section = ({ title, icon: Icon, children }) => (
	<section className="surface p-4 sm:p-5 flex flex-col gap-4">
		<div className="flex items-center gap-2">
			<div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
				<Icon size={16} />
			</div>
			<h2 className="text-sm font-bold text-slate-800">{title}</h2>
		</div>
		{children}
	</section>
);

const DriverForm = ({ data, errors, onChange }) => {
	const set = (field) => (e) => onChange(field, e.target.value);
	const isUniversityId = data.identityDocumentType === "university_id";
	// حقول الأرقام: نحوّل الأرقام العربية (٠١٢) إلى لاتينية ليبقى البحث والتحقق متسقًا
	const setDigits = (field) => (e) =>
		onChange(field, toLatinDigits(e.target.value));

	return (
		<div className="flex flex-col gap-5">
			<Section title="المعلومات الشخصية" icon={User}>
				<ImageUpload
					label="صورة السائق"
					value={data.photo}
					onChange={(val) => onChange("photo", val)}
					error={errors.photo}
					maxSize={480}
				/>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Input
						label="الاسم الكامل"
						required
						value={data.fullName}
						onChange={set("fullName")}
						error={errors.fullName}
						placeholder="مثال: محمد أحمد الغامدي"
						autoComplete="off"
					/>
					<Input
						label="مكان العمل"
						value={data.jobTitle}
						onChange={set("jobTitle")}
						placeholder="مثال: سائق شاحنة"
					/>
					<Select
						label="العنوان الوظيفي"
						required
						value={data.personType}
						onChange={set("personType")}
						error={errors.personType}
						placeholder="اختر العنوان الوظيفي"
						options={PERSON_TYPES}
					/>
					<Input
						label="رقم الهوية الوطنية"
						value={data.nationalId}
						onChange={setDigits("nationalId")}
						error={errors.nationalId}
						placeholder="10XXXXXXXX"
						inputMode="numeric"
						autoComplete="off"
					/>
					<Input
						label="تاريخ الميلاد"
						type="date"
						value={data.birthDate}
						onChange={set("birthDate")}
					/>
					<Input
						label="رقم الهاتف"
						required
						type="tel"
						value={data.phone}
						onChange={setDigits("phone")}
						error={errors.phone}
						placeholder="05XXXXXXXX"
						inputMode="tel"
						autoComplete="off"
					/>
					<Input
						label="العنوان"
						containerClassName="sm:col-span-2"
						value={data.address}
						onChange={set("address")}
						placeholder="المدينة - الحي - الشارع"
					/>
				</div>
				<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
					<input
						type="checkbox"
						checked={isUniversityId}
						onChange={(event) => {
							const identityDocumentType = event.target.checked
								? "university_id"
								: "administrative_order";
							onChange("identityDocumentType", identityDocumentType);
							if (!event.target.checked) onChange("identityDocumentBack", null);
						}}
						className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
					/>
					لدي هوية جامعية
				</label>
				<div
					className={`grid grid-cols-1 ${isUniversityId ? "sm:grid-cols-2" : ""} gap-4`}
				>
					<ImageUpload
						label={`${isUniversityId ? "وجه الهوية الجامعية" : " الأمر الإداري"} *`}
						value={data.identityDocument}
						onChange={(val) => onChange("identityDocument", val)}
						error={errors.identityDocument}
						maxSize={640}
					/>
					{isUniversityId && (
						<ImageUpload
							label="ظهر الهوية الجامعية *"
							value={data.identityDocumentBack}
							onChange={(val) => onChange("identityDocumentBack", val)}
							error={errors.identityDocumentBack}
							maxSize={640}
						/>
					)}
				</div>
			</Section>

			<Section title="معلومات المركبة" icon={CarIcon}>
				<div role="group" aria-labelledby="vehicle-type-label">
					<span
						id="vehicle-type-label"
						className="text-sm font-medium text-slate-700 mb-2 block"
					>
						نوع المركبة <span className="text-rose-500">*</span>
					</span>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
						{VEHICLE_TYPES.map(({ value, label, icon: Icon }) => {
							const selected = data.vehicleType === value;
							return (
								<button
									type="button"
									key={value}
									onClick={() => onChange("vehicleType", value)}
									aria-pressed={selected}
									className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-all border-2 ${
										selected
											? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
											: errors.vehicleType
												? "border-rose-200 bg-slate-50 text-slate-500 hover:border-rose-300"
												: "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
									}`}
								>
									<Icon size={20} />
									{label}
								</button>
							);
						})}
					</div>
					{errors.vehicleType && (
						<p role="alert" className="text-xs text-rose-500 mt-1.5">
							{errors.vehicleType}
						</p>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Input
						label="رقم المركبة"
						required
						value={data.vehicleNumber}
						onChange={setDigits("vehicleNumber")}
						error={errors.vehicleNumber}
						autoComplete="off"
					/>
					<Input
						label="الموديل"
						value={data.model}
						onChange={set("model")}
						placeholder="مثال: تويوتا كامري"
					/>
					<Input
						label="سنة الصنع"
						value={data.year}
						onChange={setDigits("year")}
						placeholder="مثال: 2023"
						inputMode="numeric"
						maxLength={4}
					/>
					<Input
						label="اللون"
						value={data.color}
						onChange={set("color")}
						placeholder="مثال: أبيض"
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<ImageUpload
						label="وجه سنوية المركبة *"
						value={data.vehicleRegistrationFront}
						onChange={(val) => onChange("vehicleRegistrationFront", val)}
						error={errors.vehicleRegistrationFront}
						maxSize={640}
					/>
					<ImageUpload
						label="ظهر سنوية المركبة *"
						value={data.vehicleRegistrationBack}
						onChange={(val) => onChange("vehicleRegistrationBack", val)}
						error={errors.vehicleRegistrationBack}
						maxSize={640}
					/>
				</div>
			</Section>
		</div>
	);
};

export default DriverForm;
