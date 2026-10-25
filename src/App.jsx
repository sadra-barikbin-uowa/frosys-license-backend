import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { SettingsProvider } from "./context/SettingsContext";
import AppRoutes from "./routes/AppRoutes";

// عند الانتقال بين الصفحات نعيد التمرير إلى الأعلى (السلوك الافتراضي في SPA يبقيه مكانه)
const ScrollToTop = () => {
	const { pathname } = useLocation();
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);
	return null;
};

function App() {
	return (
		<BrowserRouter>
			<ScrollToTop />
			<ToastProvider>
				<AuthProvider>
					<SettingsProvider>
						<AppRoutes />
						<footer
							className="px-4 py-4 text-center text-xs text-slate-500"
							dir="rtl"
						>
							© جميع الحقوق محفوظة جامعة وارث الأنبياء - مركز الحاسبة
							الألكترونية - شعبة البرمجيات
						</footer>
					</SettingsProvider>
				</AuthProvider>
			</ToastProvider>
		</BrowserRouter>
	);
}

export default App;
