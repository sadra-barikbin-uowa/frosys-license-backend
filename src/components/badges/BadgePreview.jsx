import { ShieldCheck, User } from "lucide-react";
import { useSettings } from "../../hooks/useSettings";
import ScaledBadge, { BADGE_HEIGHT, BADGE_WIDTH } from "./ScaledBadge";
import { formatDate } from "../../utils/formatDate";
import {
	badgeStatusLabel,
	computeBadgeStatus,
	BADGE_STATUS,
} from "../../utils/badgeStatus";
import { vehicleTypeLabel } from "../../data/vehicleTypes";
import { personTypeLabel } from "../../data/personTypes";

// البطاقة بنسبة ID Card حقيقية 85.6mm x 54mm (1.586 : 1)
// معروضة هنا بحجم 342×216 بكسل، وتُصغَّر تلقائيًا على الشاشات الضيقة (خاصية fit)
const STATUS_DOT = {
	[BADGE_STATUS.ACTIVE]: "bg-emerald-400",
	[BADGE_STATUS.EXPIRED]: "bg-rose-400",
	[BADGE_STATUS.EXPIRING_SOON]: "bg-amber-400",
	[BADGE_STATUS.SUSPENDED]: "bg-slate-400",
};

const DEFAULT_COLOR = "#0b254e";

const headerBackground = (color) =>
	`linear-gradient(115deg, ${color}, color-mix(in srgb, ${color} 72%, #101828))`;

const LogoMark = ({ logo, size }) => (
	<div
		className="rounded-md bg-white/15 flex items-center justify-center shrink-0 overflow-hidden"
		style={{ width: size, height: size }}
	>
		{logo ? (
			<img
				src={logo}
				alt="شعار المؤسسة"
				className="w-full h-full object-contain bg-white p-0.5"
			/>
		) : (
			<ShieldCheck size={size * 0.6} className="text-white" />
		)}
	</div>
);

const InfoCell = ({ label, value }) => (
	<div className="leading-tight min-w-0">
		<p className="text-[8px] font-bold text-slate-800">{label}</p>
		<p className="text-[10px] font-bold text-slate-950 truncate">{value}</p>
	</div>
);

const BadgeFront = ({ data, id, settings }) => {
	const status = computeBadgeStatus(data);
	const photo = data.photo || data.driverPhoto;
	const accent = settings.badgeColor || DEFAULT_COLOR;

	return (
		<div
			id={id}
			className="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 mx-auto select-none badge-face"
			style={{ width: BADGE_WIDTH, height: BADGE_HEIGHT }}
			dir="rtl"
		>
			{/* علامة مائية خفيفة */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 flex items-center justify-center -rotate-12 text-[22px] font-black whitespace-nowrap opacity-[0.04]"
				style={{ color: accent }}
			>
				{settings.systemName}
			</div>

			{/* شريط علوي */}
			<div
				className="absolute inset-x-0 top-0 h-[52px] px-3.5 pt-2.5 flex items-start justify-between text-white overflow-hidden"
				style={{ background: headerBackground(accent) }}
			>
				<div className="flex items-center gap-2 min-w-0">
					<LogoMark logo={settings.logo} size={28} />
					<div className="min-w-0">
						<p className="text-[10px] font-bold leading-tight truncate max-w-[130px]">
							{settings.systemName}
						</p>
					</div>
				</div>
				<div className="text-left shrink-0">
					<p className="text-[10px] font-bold leading-tight">بطاقة تعريف سائق</p>
				</div>
				<div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full border border-white/15" />
				<div className="absolute -bottom-10 left-10 w-16 h-16 rotate-45 border border-white/10" />
			</div>

			{/* الصورة */}
			<div className="absolute right-3.5 top-[34px] w-[66px] h-[80px] rounded-lg overflow-hidden ring-[3px] ring-white bg-slate-100 shadow-md">
				{photo ? (
					<img
						src={photo}
						alt="صورة السائق"
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-slate-300">
						<User size={28} />
					</div>
				)}
			</div>

			{/* بيانات حامل البطاقة */}
			<div className="absolute top-[58px] right-[92px] left-3.5">
				<p className="text-[14px] font-extrabold text-slate-950 truncate leading-tight">
					{data.driverName || data.fullName || "اسم السائق الثلاثي"}
				</p>
				<p
					className="mt-0.5 text-[9px] font-bold"
					style={{ color: accent }}
				>
					{personTypeLabel(data.personType)}
				</p>
				<p className="text-[9px] font-semibold text-slate-700 leading-snug truncate">
					العنوان الوظيفي:{" "}
					<span className="font-bold text-slate-900">
						{data.jobTitle || "—"}
					</span>
				</p>
				<p className="mt-1 text-[9px] font-semibold text-slate-700 leading-snug truncate">
					رقم الهوية:{" "}
					<span className="font-bold text-slate-950">
						{data.nationalId || "—"}
					</span>
				</p>
				<p className="text-[9px] font-semibold text-slate-700 leading-snug truncate">
					رقم البطاقة:{" "}
					<span className="font-bold text-slate-950" style={{ color: accent }}>
						{data.badgeNumber || "سيتم توليده تلقائيًا"}
					</span>
				</p>
			</div>

			{/* معلومات المركبة */}
			<div className="absolute inset-x-3.5 top-[136px] grid grid-cols-4 gap-x-1">
				<InfoCell
					label="نوع المركبة"
					value={data.vehicleType ? vehicleTypeLabel(data.vehicleType) : "—"}
				/>
				<InfoCell label="رقم المركبة" value={data.vehicleNumber || "—"} />
				<InfoCell
					label="لون المركبة"
					value={data.vehicleColor || data.color || "—"}
				/>
				<InfoCell
					label="موديل المركبة"
					value={data.vehicleModel || data.model || "—"}
				/>
			</div>

			{/* الأسفل: الحالة والتواريخ والتوقيع */}
			<div className="absolute bottom-0 inset-x-0 h-[48px] px-3.5 flex items-center justify-between bg-slate-50 border-t border-slate-100">
				<div>
					<div className="print-hide-status flex items-center gap-1.5">
						<span
							className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`}
						/>
						<span className="text-[9px] font-bold text-slate-800">
							بطاقة {badgeStatusLabel(data)}
						</span>
					</div>
					<p className="mt-0.5 text-[8px] font-bold text-slate-800">
						إصدار: {formatDate(data.issueDate)} &nbsp;•&nbsp; انتهاء:{" "}
						{formatDate(data.expiryDate)}
					</p>
				</div>
				<div className="text-center">
					<div className="relative flex h-8 w-[80px] items-center justify-center">
						{settings.managerSignature && (
							<img
								src={settings.managerSignature}
								alt="توقيع المدير"
								className="h-8 w-full object-contain"
							/>
						)}
						<div className="absolute inset-x-0 bottom-0 border-b border-slate-500" />
					</div>
					<p className="text-[8px] font-bold text-slate-700">توقيع المدير</p>
				</div>
			</div>
		</div>
	);
};

const BadgeBack = ({ id, data, settings }) => {
	const accent = settings.badgeColor || DEFAULT_COLOR;

	return (
		<div
			id={id}
			className="relative overflow-hidden rounded-2xl bg-slate-50 shadow-xl ring-1 ring-slate-200 mx-auto select-none badge-face"
			style={{ width: BADGE_WIDTH, height: BADGE_HEIGHT }}
			dir="rtl"
		>
			<div
				className="relative px-4 py-3 text-white"
				style={{ background: headerBackground(accent) }}
			>
				<div className="flex items-center gap-2">
					{settings.logo && (
						<img
							src={settings.logo}
							alt="شعار المؤسسة"
							className="h-6 w-6 rounded object-contain bg-white p-0.5"
						/>
					)}
					<p className="text-[11px] font-bold truncate">
						{settings.systemName}
					</p>
				</div>
				{/* <p className="text-[7px] opacity-80" dir="ltr">
					INSTRUCTIONS / GUIDELINES
				</p> */}
			</div>
			<div className="p-4">
				<div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
					<p
						aria-hidden="true"
						className="absolute left-4 top-5 -rotate-12 text-[16px] font-black whitespace-nowrap opacity-[0.06]"
						style={{ color: accent }}
					>
						{settings.systemName}
					</p>
					<p className="text-[10px] font-bold text-slate-900">
						تعليمات الاستخدام
					</p>
					<ul className="mt-2 space-y-1 pr-4 text-[8px] leading-[1.4] font-semibold text-slate-700 list-disc">
						<li>يرجى إبقاء البطاقة داخل المركبة أثناء الحركة.</li>
						<li>يجب إظهار البطاقة عند الدخول والخروج من الموقع.</li>
						<li>استخدم البطاقة فقط لصاحبها وعدم إعارتها لأي شخص.</li>
						<li>في حال فقدان أو تلف البطاقة، تواصل مع الإدارة فورًا.</li>
					</ul>
				</div>
				<div className="mt-2 flex items-center justify-between gap-2 text-[8px] font-semibold text-slate-700">
					<span>رقم البطاقة: {data.badgeNumber || "—"}</span>
					<span className="truncate">{settings.contactInfo}</span>
				</div>
			</div>
		</div>
	);
};

// `fit`: تصغير تلقائي ليناسب عرض الحاوية (للعرض على الشاشة). في الطباعة نتركه false.
// `settings`: لعرض إعدادات مختلفة عن المحفوظة (معاينة مباشرة في صفحة الإعدادات).
const BadgePreview = ({
	data,
	id = "badge-preview",
	side = "front",
	fit = false,
	settings,
}) => {
	const { settings: savedSettings } = useSettings();
	const effective = { ...savedSettings, ...settings };
	const face =
		side === "back" ? (
			<BadgeBack data={data} id={id} settings={effective} />
		) : (
			<BadgeFront data={data} id={id} settings={effective} />
		);

	return fit ? <ScaledBadge>{face}</ScaledBadge> : face;
};

export default BadgePreview;
