import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingState from "../components/common/LoadingState";

// حارس المسارات: يتطلب تسجيل دخول، ويقيّد الدور عند تمرير `role`.
// يُستخدم كـ Layout Route (عبر Outlet) أو يغلّف children مباشرة.
const ProtectedRoute = ({ role, children }) => {
	const { user, revalidate, checkingSession } = useAuth();
	const { pathname } = useLocation();

	// عند كل تنقل نتأكد أن الحساب ما زال موجودًا وفعّالًا (لم يُحذف/يُوقف من المدير)
	useEffect(() => {
		if (checkingSession || !user) return;

		revalidate().catch((error) => {
			console.error("تعذر إعادة التحقق من جلسة المستخدم", error);
		});
	}, [pathname, revalidate, checkingSession, user]);

	if (checkingSession) return <LoadingState />;

	if (!user) return <Navigate to="/login" replace state={{ from: pathname }} />;

	if (role && user.role !== role) {
		return (
			<Navigate
				to={user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard"}
				replace
			/>
		);
	}

	return children ?? <Outlet />;
};

export default ProtectedRoute;
