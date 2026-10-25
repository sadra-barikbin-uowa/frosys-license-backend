import { toLatinDigits } from "./search";

export const required = (value) => {
	if (typeof value === "string") return value.trim().length > 0;
	return value !== null && value !== undefined && value !== "";
};

// يتحقق من بيانات السائق والمركبة قبل إنشاء البطاقة
export const validateDriverForm = (
	data,
	{ requireIdentityDocument = true } = {},
) => {
	const errors = {};

	if (!required(data.fullName)) errors.fullName = "الاسم الكامل مطلوب";
	if (!required(data.personType)) errors.personType = "صفة حامل البطاقة مطلوبة";
	if (!required(data.nationalId)) errors.nationalId = "رقم الهوية الوطنية مطلوب";
	if (!required(data.phone)) errors.phone = "رقم الهاتف مطلوب";
	else if (!/^[0-9+\s-]{7,15}$/.test(toLatinDigits(data.phone).trim()))
		errors.phone = "رقم الهاتف غير صحيح";

	if (!required(data.photo)) errors.photo = "صورة السائق مطلوبة";
	if (requireIdentityDocument && !required(data.identityDocument))
		errors.identityDocument = "صورة وجه الهوية الجامعية أو الأمر الإداري مطلوبة";
	if (
		data.identityDocumentType === "university_id" &&
		!required(data.identityDocumentBack)
	)
		errors.identityDocumentBack = "صورة ظهر الهوية الجامعية مطلوبة";
	if (!required(data.vehicleRegistrationFront))
		errors.vehicleRegistrationFront = "صورة وجه سنوية المركبة مطلوبة";
	if (!required(data.vehicleRegistrationBack))
		errors.vehicleRegistrationBack = "صورة ظهر سنوية المركبة مطلوبة";

	if (!required(data.vehicleType)) errors.vehicleType = "نوع المركبة مطلوب";
	if (!required(data.vehicleNumber)) errors.vehicleNumber = "رقم المركبة مطلوب";

	return { isValid: Object.keys(errors).length === 0, errors };
};

// يتحقق من تواريخ البطاقة: الانتهاء يجب أن يكون بعد الإصدار
export const validateBadgeDates = (issueDate, expiryDate) => {
	const errors = {};
	if (!required(issueDate)) errors.issueDate = "تاريخ الإصدار مطلوب";
	if (!required(expiryDate)) errors.expiryDate = "تاريخ الانتهاء مطلوب";
	else if (required(issueDate) && expiryDate <= issueDate)
		errors.expiryDate = "تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار";
	return errors;
};
