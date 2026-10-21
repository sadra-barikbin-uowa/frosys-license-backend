// أخطاء متوقعة يمكن عرض رسالتها للمستخدم مباشرة (مثل: اسم مستخدم مكرر، تخزين ممتلئ)
export class AppError extends Error {
	constructor(message) {
		super(message);
		this.name = "AppError";
	}
}

export const getErrorMessage = (
	error,
	fallback = "حدث خطأ غير متوقع، حاول مرة أخرى",
) => (error instanceof Error && error.message ? error.message : fallback);
