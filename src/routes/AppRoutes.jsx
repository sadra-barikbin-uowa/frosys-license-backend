import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../hooks/useAuth";
import ProtectedRoute from "./ProtectedRoute";

const Login = lazy(() => import("../pages/Login"));
const BadgeRequestForm = lazy(() => import("../pages/BadgeRequestForm"));
const NotFound = lazy(() => import("../pages/NotFound"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminBadges = lazy(() => import("../pages/admin/AdminBadges"));
const AdminBadgeRequests = lazy(() => import("../pages/admin/AdminBadgeRequests"));
const AdminBadgeDetails = lazy(() => import("../pages/admin/AdminBadgeDetails"));
const AdminDrivers = lazy(() => import("../pages/admin/AdminDrivers"));
const AdminDriverDetails = lazy(() => import("../pages/admin/AdminDriverDetails"));
const AdminVehicles = lazy(() => import("../pages/admin/AdminVehicles"));
const AdminEmployees = lazy(() => import("../pages/admin/AdminEmployees"));
const AdminEmployeeForm = lazy(() => import("../pages/admin/AdminEmployeeForm"));
const AdminReports = lazy(() => import("../pages/admin/AdminReports"));
const AdminSearch = lazy(() => import("../pages/admin/AdminSearch"));
const AdminSettings = lazy(() => import("../pages/admin/AdminSettings"));
const Drivers = lazy(() => import("../pages/employee/Drivers"));
const AddDriver = lazy(() => import("../pages/employee/AddDriver"));
const DriverDetails = lazy(() => import("../pages/employee/DriverDetails"));
const EditDriver = lazy(() => import("../pages/employee/EditDriver"));
const Vehicles = lazy(() => import("../pages/employee/Vehicles"));
const MyBadges = lazy(() => import("../pages/employee/MyBadges"));
const CreateBadge = lazy(() => import("../pages/employee/CreateBadge"));
const BadgeDetails = lazy(() => import("../pages/employee/BadgeDetails"));
const EmployeeSearch = lazy(() => import("../pages/employee/EmployeeSearch"));

const EmployeeHome = () => {
	const { can } = useAuth();
	if (can("drivers.view")) return <Navigate to="/employee/drivers" replace />;
	if (can("badges.view")) return <Navigate to="/employee/badges" replace />;
	return <p role="alert" className="surface p-6 text-center text-sm text-rose-700">ليس لديك صلاحية الوصول إلى صفحات النظام.</p>;
};

const AdminHome = () => {
	const { can } = useAuth();
	return can("users.manage")
		? <Navigate to="/admin/dashboard" replace />
		: <Navigate to="/employee" replace />;
};

const permit = (permission, page) => <ProtectedRoute permission={permission}>{page}</ProtectedRoute>;

const AppRoutes = () => (
	<Suspense fallback={<LoadingState className="min-h-dvh" />}>
		<Routes>
			<Route path="/" element={<Navigate to="/login" replace />} />
			<Route path="/login" element={<Login />} />
			<Route path="/badge-request" element={<BadgeRequestForm />} />

			<Route element={<ProtectedRoute />}>
				<Route element={<DashboardLayout />}>
					<Route path="/admin" element={<AdminHome />} />
					<Route path="/admin/dashboard" element={permit("users.manage", <AdminDashboard />)} />
					<Route path="/admin/badges" element={permit("users.manage", <AdminBadges />)} />
					<Route path="/admin/badge-requests" element={permit("users.manage", <AdminBadgeRequests />)} />
					<Route path="/admin/badges/create" element={permit("badges.create", <CreateBadge role="admin" />)} />
					<Route path="/admin/badges/:id" element={permit("badges.view", <AdminBadgeDetails />)} />
					<Route path="/admin/drivers" element={permit("drivers.view", <AdminDrivers />)} />
					<Route path="/admin/drivers/add" element={permit("drivers.create", <AddDriver role="admin" />)} />
					<Route path="/admin/drivers/:id" element={permit("drivers.view", <AdminDriverDetails />)} />
					<Route path="/admin/drivers/:id/edit" element={permit("drivers.edit", <EditDriver role="admin" />)} />
					<Route path="/admin/vehicles" element={permit("vehicles.view", <AdminVehicles />)} />
					<Route path="/admin/employees" element={permit("users.manage", <AdminEmployees />)} />
					<Route path="/admin/employees/add" element={permit("users.manage", <AdminEmployeeForm />)} />
					<Route path="/admin/employees/:id/edit" element={permit("users.manage", <AdminEmployeeForm />)} />
					<Route path="/admin/reports" element={permit("users.manage", <AdminReports />)} />
					<Route path="/admin/search" element={permit("users.manage", <AdminSearch />)} />
					<Route path="/admin/settings" element={permit("users.manage", <AdminSettings />)} />

					<Route path="/employee" element={<EmployeeHome />} />
					<Route path="/employee/dashboard" element={<EmployeeHome />} />
					<Route path="/employee/drivers" element={permit("drivers.view", <Drivers />)} />
					<Route path="/employee/drivers/add" element={permit("drivers.create", <AddDriver />)} />
					<Route path="/employee/drivers/:id" element={permit("drivers.view", <DriverDetails />)} />
					<Route path="/employee/drivers/:id/edit" element={permit("drivers.edit", <EditDriver />)} />
					<Route path="/employee/vehicles" element={permit("vehicles.view", <Vehicles />)} />
					<Route path="/employee/badges" element={permit("badges.view", <MyBadges />)} />
					<Route path="/employee/badges/create" element={permit("badges.create", <CreateBadge />)} />
					<Route path="/employee/badges/:id" element={permit("badges.view", <BadgeDetails />)} />
					<Route path="/employee/search" element={permit(["drivers.view", "badges.view"], <EmployeeSearch />)} />
				</Route>
			</Route>

			<Route path="*" element={<NotFound />} />
		</Routes>
	</Suspense>
);

export default AppRoutes;
