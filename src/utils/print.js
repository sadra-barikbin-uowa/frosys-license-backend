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

export const printSticker = async (shape = "rounded", size = { width: 60, height: 30 }) => {
	const element = document.getElementById("print-sticker-area");
	if (!element) return;

	const sticker = element.querySelector(".badge-sticker");
	if (sticker) {
		sticker.classList.remove("sticker-rounded", "sticker-square", "sticker-capsule", "sticker-custom");
		sticker.classList.add(`sticker-${shape || "rounded"}`);
		if (shape === "custom") {
			const width = Number(size.width) || 60;
			const height = Number(size.height) || 30;
			sticker.style.width = `${width}mm`;
			sticker.style.height = `${height}mm`;
			sticker.style.maxWidth = `${width}mm`;
			sticker.style.maxHeight = `${height}mm`;
		}
	}

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
