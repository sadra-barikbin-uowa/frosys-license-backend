import { AppError } from "./errors";

const MAX_INPUT_BYTES = 10 * 1024 * 1024;

const readAsDataURL = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});

const loadImage = (src) =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("image decode failed"));
		image.src = src;
	});

// يصغّر الصورة ويضغطها قبل رفعها إلى الخادم.
// - الصور الشخصية: JPEG بخلفية بيضاء
// - الشعار: PNG للحفاظ على الشفافية
export const prepareImage = async (
	file,
	{ maxSize = 640, quality = 0.82, format = "jpeg" } = {},
) => {
	if (!file.type.startsWith("image/"))
		throw new AppError("الملف المختار ليس صورة صالحة");
	if (file.size > MAX_INPUT_BYTES)
		throw new AppError("حجم الصورة كبير جدًا، الحد الأقصى 10MB");

	const original = await readAsDataURL(file);
	let image;
	try {
		image = await loadImage(original);
	} catch {
		throw new AppError("تعذر قراءة الصورة، جرّب ملفًا آخر");
	}

	const { naturalWidth: width, naturalHeight: height } = image;
	// صور SVG بلا أبعاد صريحة: نحتفظ بها كما هي إن كانت صغيرة
	if (!width || !height) {
		if (file.size <= 200 * 1024) return original;
		throw new AppError("تعذر معالجة هذه الصورة، جرّب صيغة JPG أو PNG");
	}

	const scale = Math.min(1, maxSize / Math.max(width, height));
	if (scale === 1 && file.size <= 60 * 1024) return original;

	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(width * scale));
	canvas.height = Math.max(1, Math.round(height * scale));
	const context = canvas.getContext("2d");
	if (format === "jpeg") {
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, canvas.width, canvas.height);
	}
	context.drawImage(image, 0, 0, canvas.width, canvas.height);

	return format === "png"
		? canvas.toDataURL("image/png")
		: canvas.toDataURL("image/jpeg", quality);
};
