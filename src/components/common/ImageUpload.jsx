import { useId, useRef, useState } from "react";
import { Camera, Upload, X, RefreshCw, Loader2 } from "lucide-react";
import { prepareImage } from "../../utils/image";
import { getErrorMessage } from "../../utils/errors";

// يصغّر الصور ويضغطها ثم يحوّلها إلى Base64 لإرسالها إلى API.
const ImageUpload = ({
	label,
	value,
	onChange,
	error,
	shape = "square",
	maxSize = 640,
	format = "jpeg",
}) => {
	const inputRef = useRef(null);
	const labelId = useId();
	const [busy, setBusy] = useState(false);
	const [localError, setLocalError] = useState("");

	const handleFile = async (file) => {
		if (!file) return;
		setLocalError("");
		setBusy(true);
		try {
			onChange(await prepareImage(file, { maxSize, format }));
		} catch (err) {
			setLocalError(getErrorMessage(err, "تعذر قراءة الصورة، جرّب ملفًا آخر"));
		} finally {
			setBusy(false);
		}
	};

	const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";
	const shownError = localError || error;

	return (
		<div className="flex flex-col gap-1.5" role="group" aria-labelledby={label ? labelId : undefined}>
			{label && (
				<span id={labelId} className="text-sm font-medium text-slate-700">
					{label}
				</span>
			)}
			<div className="flex items-center gap-4">
				<div
					className={`relative w-24 h-24 ${shapeClass} overflow-hidden bg-slate-50 ring-1 ${
						shownError ? "ring-rose-300" : "ring-slate-200"
					} flex items-center justify-center shrink-0`}
				>
					{busy ? (
						<Loader2 size={24} className="text-indigo-400 animate-spin" />
					) : value ? (
						<img src={value} alt={label || "صورة"} className="w-full h-full object-cover" />
					) : (
						<Camera size={28} className="text-slate-300" />
					)}
				</div>
				<div className="flex flex-col gap-2 min-w-0">
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							disabled={busy}
							onClick={() => inputRef.current?.click()}
							className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
						>
							{value ? <RefreshCw size={14} /> : <Upload size={14} />}
							{value ? "تغيير الصورة" : "رفع صورة"}
						</button>
						{value && (
							<button
								type="button"
								disabled={busy}
								onClick={() => {
									setLocalError("");
									onChange(null);
								}}
								className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
							>
								<X size={14} />
								إزالة
							</button>
						)}
					</div>
					<span className="text-[11px] text-slate-400">
						JPG أو PNG — تُضغط الصورة تلقائيًا
					</span>
				</div>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					className="hidden"
					aria-label={label || "رفع صورة"}
					onChange={(e) => {
						handleFile(e.target.files?.[0]);
						// السماح باختيار الملف نفسه مرة أخرى بعد إزالته
						e.target.value = "";
					}}
				/>
			</div>
			{shownError && (
				<span role="alert" className="text-xs text-rose-500">
					{shownError}
				</span>
			)}
		</div>
	);
};

export default ImageUpload;
