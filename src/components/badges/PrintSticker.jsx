import { createPortal } from "react-dom";
import { ShieldCheck } from "lucide-react";
import { useSettings } from "../../hooks/useSettings";

const PrintSticker = ({ data }) => {
	const { settings } = useSettings();

	return createPortal(
		<div id="print-sticker-area" aria-hidden="true">
			<div className="badge-sticker" dir="rtl">
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
