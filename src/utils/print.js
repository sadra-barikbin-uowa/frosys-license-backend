const waitForImage = (image) => {
	if (image.complete) return Promise.resolve();
	return new Promise((resolve) => {
		image.addEventListener("load", resolve, { once: true });
		image.addEventListener("error", resolve, { once: true });
	});
};

// ينتظر تحميل الصور داخل منطقة الطباعة ثم يفتح نافذة الطباعة
export const printBadge = async (
	element = document.getElementById("print-badge-area"),
) => {
	if (!element) return;

	await Promise.all([...element.querySelectorAll("img")].map(waitForImage));
	await new Promise((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(resolve)),
	);
	window.print();
};

export const printSticker = async () => {
	const element = document.getElementById("print-sticker-area");
	if (!element) return;

	await Promise.all([...element.querySelectorAll("img")].map(waitForImage));
	await new Promise((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(resolve)),
	);
	document.body.classList.add("printing-sticker");
	try {
		window.print();
	} finally {
		document.body.classList.remove("printing-sticker");
	}
};
