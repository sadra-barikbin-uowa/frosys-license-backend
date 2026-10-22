import { Suspense, useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import ErrorBoundary from "./ErrorBoundary";
import LoadingState from "../common/LoadingState";
import { findActiveLink, getNavLinks } from "./navigation";
import { useSettings } from "../../hooks/useSettings";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAuth } from "../../hooks/useAuth";

// القالب المشترك لكل صفحات لوحة التحكم. يُستخدم كـ Layout Route فتبقى القائمة الجانبية
// ثابتة أثناء التنقل بين الصفحات، ويظهر مؤشر التحميل داخل منطقة المحتوى فقط
const DashboardLayout = () => {
	const [mobileOpen, setMobileOpen] = useState(false);
	const { settings } = useSettings();
	const { user, can } = useAuth();
	const { pathname } = useLocation();
	const closeMobile = useCallback(() => setMobileOpen(false), []);
	const role = user?.role === "admin" ? "admin" : "employee";
	const links = getNavLinks(user, can);

	usePageTitle(findActiveLink(links, pathname)?.label);

	return (
		<div className="flex min-h-dvh bg-[#f4f6f9]" dir="rtl">
			<a href="#main-content" className="skip-link">
				انتقل إلى المحتوى الرئيسي
			</a>

			<Sidebar role={role} mobileOpen={mobileOpen} onCloseMobile={closeMobile} />

			<div className="flex-1 min-w-0 flex flex-col">
				{/* Mobile top bar */}
				<header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3">
					<button
						type="button"
						onClick={() => setMobileOpen(true)}
						aria-label="فتح القائمة"
						aria-expanded={mobileOpen}
						className="p-2 -mr-2 rounded-lg hover:bg-slate-100 text-slate-600"
					>
						<Menu size={20} />
					</button>
					<p className="text-sm font-bold text-slate-800 truncate">{settings.systemName}</p>
				</header>

				<main
					id="main-content"
					tabIndex={-1}
					className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto outline-none"
				>
					<ErrorBoundary key={pathname}>
						<Suspense fallback={<LoadingState />}>
							<div key={pathname} className="page-enter">
								<Outlet />
							</div>
						</Suspense>
					</ErrorBoundary>
				</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
