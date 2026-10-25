import { useState } from "react";
import { Check, Eye, Trash2 } from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useToast } from "../../hooks/useToast";
import { badgeRequestService } from "../../services/badgeRequestService";
import { formatDate } from "../../utils/formatDate";
import { personTypeLabel } from "../../data/personTypes";
import { vehicleTypeLabel } from "../../data/vehicleTypes";

const Field = ({ label, value }) => (
	<div>
		<p className="text-xs text-slate-400">{label}</p>
		<p className="text-sm font-medium text-slate-700 mt-1">{value || "—"}</p>
	</div>
);

const RequestImage = ({ label, src }) => src && (
	<a href={src} target="_blank" rel="noreferrer" className="block">
		<p className="text-xs text-slate-500 mb-2">{label}</p>
		<img src={src} alt={label} className="w-full h-40 object-cover rounded-xl ring-1 ring-slate-200" />
	</a>
);

const AdminBadgeRequests = () => {
	const { showToast } = useToast();
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [action, setAction] = useState(null);
	const { data: requests, loading, error, reload } = useAsyncData(
		() => badgeRequestService.getRequests(),
		[],
		[],
	);
	const pendingCount = requests.filter((request) => request.status === "pending").length;

	const completeAction = async () => {
		if (action.type === "approve") {
			await badgeRequestService.approveRequest(action.request.id);
			showToast("تمت الموافقة وإصدار البطاقة", "success");
		} else {
			await badgeRequestService.deleteRequest(action.request.id);
			showToast("تم حذف الطلب", "success");
		}
		window.dispatchEvent(new Event("badge-requests-updated"));
		setSelectedRequest(null);
		reload();
	};

	return (
		<>
			<PageHeader
				title="طلبات البطاقات"
				description={`مراجعة الطلبات المقدمة من الزوار${pendingCount ? ` — ${pendingCount} طلب بانتظار الموافقة` : ""}`}
			/>
			<Card>
				{loading ? (
					<LoadingState />
				) : error ? (
					<ErrorState onRetry={reload} />
				) : requests.length === 0 ? (
					<EmptyState title="لا توجد طلبات" description="ستظهر هنا طلبات الحصول على بطاقة عند إرسالها." />
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-right text-sm">
							<thead>
								<tr className="border-b border-slate-100 text-xs text-slate-400">
									<th className="p-3 font-medium">مقدم الطلب</th>
									<th className="p-3 font-medium">الهاتف</th>
									<th className="p-3 font-medium">المركبة</th>
									<th className="p-3 font-medium">تاريخ الطلب</th>
									<th className="p-3 font-medium">الحالة</th>
									<th className="p-3 font-medium">الإجراءات</th>
								</tr>
							</thead>
							<tbody>
								{requests.map((request) => (
									<tr key={request.id} className="border-b border-slate-50 last:border-0">
										<td className="p-3">
											<p className="font-semibold text-slate-700">{request.fullName}</p>
											<p className="text-xs text-slate-400 mt-1">{personTypeLabel(request.personType)}</p>
										</td>
										<td className="p-3 text-slate-600" dir="ltr">{request.phone}</td>
										<td className="p-3 text-slate-600">{request.vehicleNumber} · {vehicleTypeLabel(request.vehicleType)}</td>
										<td className="p-3 text-slate-500">{formatDate(request.created_at)}</td>
										<td className="p-3">
											<span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
												request.status === "approved"
													? "bg-emerald-50 text-emerald-700"
													: "bg-amber-50 text-amber-700"
											}`}>
												{request.status === "approved" ? "تمت الموافقة" : "بانتظار المراجعة"}
											</span>
										</td>
										<td className="p-3">
											<div className="flex items-center gap-1.5">
												<Button size="sm" variant="secondary" icon={Eye} onClick={() => setSelectedRequest(request)}>
													مشاهدة
												</Button>
												{request.status === "pending" && (
													<Button size="sm" icon={Check} onClick={() => setAction({ type: "approve", request })}>
														موافقة
													</Button>
												)}
												<Button
													size="sm"
													variant="danger"
													icon={Trash2}
													aria-label={`حذف طلب ${request.fullName}`}
													onClick={() => setAction({ type: "delete", request })}
												>
													حذف
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			<Modal
				open={Boolean(selectedRequest)}
				onClose={() => setSelectedRequest(null)}
				title="تفاصيل طلب البطاقة"
				size="xl"
			>
				{selectedRequest && (
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							<Field label="الاسم الكامل" value={selectedRequest.fullName} />
							<Field label="الصفة" value={personTypeLabel(selectedRequest.personType)} />
							<Field label="العنوان الوظيفي" value={selectedRequest.jobTitle} />
							<Field label="رقم الهاتف" value={selectedRequest.phone} />
							<Field label="رقم الهوية" value={selectedRequest.nationalId} />
							<Field
								label="نوع المستند"
								value={selectedRequest.identityDocumentType === "university_id" ? "هوية جامعية" : "أمر إداري"}
							/>
							<Field label="تاريخ الميلاد" value={formatDate(selectedRequest.birthDate)} />
							<Field label="العنوان" value={selectedRequest.address} />
							<Field label="نوع المركبة" value={vehicleTypeLabel(selectedRequest.vehicleType)} />
							<Field label="رقم المركبة" value={selectedRequest.vehicleNumber} />
							<Field label="الموديل" value={selectedRequest.model} />
							<Field label="سنة الصنع" value={selectedRequest.year} />
							<Field label="اللون" value={selectedRequest.color} />
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<RequestImage label="صورة السائق" src={selectedRequest.photo} />
							<RequestImage
								label={selectedRequest.identityDocumentType === "university_id" ? "وجه الهوية الجامعية" : "الأمر الإداري"}
								src={selectedRequest.identityDocument}
							/>
							{selectedRequest.identityDocumentType === "university_id" && (
								<RequestImage label="ظهر الهوية الجامعية" src={selectedRequest.identityDocumentBack} />
							)}
							<RequestImage label="وجه سنوية المركبة" src={selectedRequest.vehicleRegistrationFront} />
							<RequestImage label="ظهر سنوية المركبة" src={selectedRequest.vehicleRegistrationBack} />
						</div>
						{selectedRequest.badgeId && (
							<Button to={`/admin/badges/${selectedRequest.badgeId}`} variant="secondary">
								عرض البطاقة الصادرة
							</Button>
						)}
					</div>
				)}
			</Modal>

			<ConfirmDialog
				open={Boolean(action)}
				title={action?.type === "approve" ? "الموافقة على الطلب" : "حذف الطلب"}
				message={action?.type === "approve"
					? "سيتم تسجيل السائق والمركبة وإصدار بطاقة تعريفية بهذه البيانات. هل تريد المتابعة؟"
					: "سيتم حذف هذا الطلب نهائيًا. هل تريد المتابعة؟"}
				confirmLabel={action?.type === "approve" ? "موافقة وإصدار البطاقة" : "حذف الطلب"}
				variant={action?.type === "approve" ? "primary" : "danger"}
				onConfirm={completeAction}
				onClose={() => setAction(null)}
			/>
		</>
	);
};

export default AdminBadgeRequests;
