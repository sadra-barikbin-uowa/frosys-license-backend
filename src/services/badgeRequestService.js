import { apiRequest } from "./api";
import { createApiBody, getApiCollection, imageUrl, normalizeApiId } from "./apiResources";

const normalizeRequest = (request) => ({
	...request,
	id: normalizeApiId(request.id),
	fullName: request.full_name ?? "",
	jobTitle: request.job_title ?? "",
	personType: request.person_type ?? "",
	nationalId: request.national_id ?? "",
	birthDate: request.birth_date ?? "",
	vehicleType: request.vehicle_type ?? "",
	vehicleNumber: request.vehicle_number ?? "",
	photo: imageUrl(request.photo),
	identityDocument: imageUrl(request.identity_document),
	identityDocumentBack: imageUrl(request.identity_document_back),
	identityDocumentType: request.identity_document_type ?? "administrative_order",
	vehicleRegistrationFront: imageUrl(request.vehicle_registration_front),
	vehicleRegistrationBack: imageUrl(request.vehicle_registration_back),
	driverId: normalizeApiId(request.driver_id),
	vehicleId: normalizeApiId(request.vehicle_id),
	badgeId: normalizeApiId(request.badge_id),
	reviewerName: request.reviewer?.name ?? "",
});

const requestFields = {
	fullName: "full_name",
	jobTitle: "job_title",
	personType: "person_type",
	nationalId: "national_id",
	birthDate: "birth_date",
	vehicleType: "vehicle_type",
	vehicleNumber: "vehicle_number",
	identityDocumentBack: "identity_document_back",
	identityDocument: "identity_document",
	identityDocumentType: "identity_document_type",
	vehicleRegistrationFront: "vehicle_registration_front",
	vehicleRegistrationBack: "vehicle_registration_back",
};

export const badgeRequestService = {
	async createRequest(data) {
		const body = await createApiBody(data, requestFields);
		const result = await apiRequest("/badge-requests", { method: "POST", body });
		return result?.request ? normalizeRequest(result.request) : null;
	},
	async getRequests() {
		return (await getApiCollection("/badge-requests")).map(normalizeRequest);
	},
	async getPendingCount() {
		const result = await apiRequest("/badge-requests/pending-count");
		return Number(result?.count) || 0;
	},
	async approveRequest(id) {
		const result = await apiRequest(`/badge-requests/${encodeURIComponent(id)}/approve`, {
			method: "POST",
		});
		return result?.request ? normalizeRequest(result.request) : null;
	},
	async deleteRequest(id) {
		await apiRequest(`/badge-requests/${encodeURIComponent(id)}`, { method: "DELETE" });
	},
};
