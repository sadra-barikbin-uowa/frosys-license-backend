// بانر ترحيبي بتدرّج لوني في أعلى لوحات التحكم
const HeroBanner = ({ title, description, actions, children }) => (
	<section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white p-5 sm:p-7 mb-6 shadow-lg shadow-indigo-600/20">
		<div aria-hidden="true" className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10" />
		<div aria-hidden="true" className="absolute -bottom-24 left-1/3 w-56 h-56 rounded-full bg-white/5" />
		<div aria-hidden="true" className="absolute -top-12 right-1/3 w-36 h-36 rounded-full bg-uowa-gold/15 blur-2xl" />
		<div
			aria-hidden="true"
			className="absolute inset-0 opacity-[0.07]"
			style={{
				backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
				backgroundSize: "18px 18px",
			}}
		/>
		<div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
			<div className="min-w-0">
				<h1 className="text-xl sm:text-2xl font-bold leading-snug">{title}</h1>
				{description && <p className="text-sm text-indigo-100 mt-1.5 max-w-xl">{description}</p>}
			</div>
			{actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
		</div>
		{children && <div className="relative mt-5">{children}</div>}
	</section>
);

export default HeroBanner;
