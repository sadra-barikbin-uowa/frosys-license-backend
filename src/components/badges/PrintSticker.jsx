import { createPortal } from "react-dom";
import { ShieldCheck } from "lucide-react";
import { useSettings } from "../../hooks/useSettings";

const STICKER_VARIANTS = {
	rounded: "sticker-rounded",
	square: "sticker-square",
	capsule: "sticker-capsule",
	custom: "sticker-custom",
};

const PrintSticker = ({ data, shape = "rounded", size = { width: 60, height: 30 } }) => {
	const { settings } = useSettings();
	const variant = STICKER_VARIANTS[shape] || STICKER_VARIANTS.rounded;
	const customSize = shape === "custom"
		? {
				width: Number(size.width) || 60,
				height: Number(size.height) || 30,
			}
		: null;

	return createPortal(
		<div id="print-sticker-area" aria-hidden="true">
			<div
				className={`badge-sticker ${variant}`}
				dir="rtl"
				style={
					customSize
						? {
								width: `${customSize.width}mm`,
								height: `${customSize.height}mm`,
								maxWidth: `${customSize.width}mm`,
								maxHeight: `${customSize.height}mm`,
							}
						: undefined
				}
			>
				<div className="badge-sticker-logo">
					{settings.logo ? (
						<img src={settings.logo} alt="" />
					) : (
						<ShieldCheck aria-hidden="true" />
					)}
				</div>
				<div className="badge-sticker-details">
					<p className="badge-sticker-name">قسم المتابعة</p>
					<p className="badge-sticker-label">الرقم التسلسلي للبطاقة</p>
					<p className="badge-sticker-number" dir="ltr">{data.badgeNumber || "—"}</p>
				</div>
			</div>
		</div>,
		document.body,
	);
};

export default PrintSticker;
