import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingState from "../components/common/LoadingState";

const Forbidden = () => (
	<div role="alert" className="surface p-6 text-center text-sm text-rose-700">
		ليس لديك صلاحية الوصول إلى هذه الصفحة.
	</div>
);

// حارس المسارات: يتطلب تسجيل الدخول، ويمكنه تقييد الدور أو الصلاحية.
// يُستخدم كـ Layout Route (عبر Outlet) أو يغلّف children مباشرة.
const ProtectedRoute = ({ role, permission, children }) => {
	const { user, revalidate, checkingSession, can } = useAuth();
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

	if (permission && !(Array.isArray(permission) ? permission.some(can) : can(permission))) {
		return <Forbidden />;
	}

	return children ?? <Outlet />;
};

export default ProtectedRoute;
