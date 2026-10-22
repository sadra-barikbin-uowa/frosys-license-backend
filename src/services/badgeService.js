import { apiRequest } from "./api";
import { computeBadgeStatus } from "../utils/badgeStatus";
import { createApiBody, getApiCollection, imageUrl, normalizeApiId } from "./apiResources";

const normalizeBadge = (badge) => {
  const normalized = {
    ...badge,
    id: normalizeApiId(badge.id),
    badgeNumber: badge.badge_number ?? badge.badgeNumber ?? "",
    driverId: normalizeApiId(badge.driver_id ?? badge.driverId),
    vehicleId: normalizeApiId(badge.vehicle_id ?? badge.vehicleId),
    driverName: badge.driver_name ?? badge.driverName ?? "",
    driverPhoto: imageUrl(badge.driver_photo ?? badge.driverPhoto),
    jobTitle: badge.job_title ?? badge.jobTitle ?? "",
    personType: badge.person_type ?? badge.personType ?? "",
    nationalId: badge.national_id ?? badge.nationalId ?? "",
    licenseNumber: badge.license_number ?? badge.licenseNumber ?? "",
    vehicleType: badge.vehicle_type ?? badge.vehicleType ?? "",
    vehicleNumber: badge.vehicle_number ?? badge.vehicleNumber ?? "",
    vehicleModel: badge.vehicle_model ?? badge.vehicleModel ?? "",
    vehicleColor: badge.vehicle_color ?? badge.vehicleColor ?? "",
    issueDate: badge.issue_date ?? badge.issueDate ?? "",
    expiryDate: badge.expiry_date ?? badge.expiryDate ?? "",
    createdBy: normalizeApiId(badge.created_by ?? badge.createdBy),
    createdByName: badge.creator?.name ?? badge.createdByName ?? "",
  };

  return { ...normalized, status: computeBadgeStatus(normalized) };
};

const badgeFields = {
  badgeNumber: "badge_number",
  driverId: "driver_id",
  vehicleId: "vehicle_id",
  driverName: "driver_name",
  driverPhoto: "driver_photo",
  jobTitle: "job_title",
  personType: "person_type",
  nationalId: "national_id",
  licenseNumber: "license_number",
  vehicleType: "vehicle_type",
  vehicleNumber: "vehicle_number",
  vehicleModel: "vehicle_model",
  vehicleColor: "vehicle_color",
  issueDate: "issue_date",
  expiryDate: "expiry_date",
};

const toPayload = (data) => Object.fromEntries(
  Object.entries(data)
    .filter(([key, value]) => value !== undefined && key !== "photo")
    .map(([key, value]) => [badgeFields[key] || key, value]),
);

const normalizedResponse = (result) => (result?.badge ? normalizeBadge(result.badge) : null);

export const badgeService = {
  async getBadges() {
    return (await getApiCollection("/badges")).map(normalizeBadge);
  },

  async getBadgeById(id) {
    const result = await apiRequest(`/badges/${encodeURIComponent(id)}`);
    return normalizedResponse(result);
  },

  async authorizePrint(id) {
    await apiRequest(`/badges/${encodeURIComponent(id)}/print`, { method: "POST" });
  },

  async getBadgeByIdForEmployee(id) {
    return this.getBadgeById(id);
  },

  async getBadgesByEmployee() {
    return this.getBadges();
  },

  async createBadge(data) {
    const payload = toPayload(data);
    const result = await apiRequest("/badges", {
      method: "POST",
      body: JSON.stringify({
        ...(payload.driver_id !== undefined ? { driver_id: payload.driver_id } : {}),
        ...(payload.vehicle_id !== undefined ? { vehicle_id: payload.vehicle_id } : {}),
        ...(payload.issue_date !== undefined ? { issue_date: payload.issue_date } : {}),
        ...(payload.expiry_date !== undefined ? { expiry_date: payload.expiry_date } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.badge_number !== undefined ? { badge_number: payload.badge_number } : {}),
      }),
    });
    return normalizedResponse(result);
  },

  async updateBadge(id, data) {
    const body = await createApiBody(toPayload(data));
    const result = await apiRequest(`/badges/${encodeURIComponent(id)}`, {
      method: "PUT",
      body,
    });
    return normalizedResponse(result);
  },

  async updateBadgeForEmployee(id, _employeeId, data) {
    return this.updateBadge(id, data);
  },

  async setBadgeStatus(id, status) {
    return this.updateBadge(id, { status });
  },

  async deleteBadge(id) {
    await apiRequest(`/badges/${encodeURIComponent(id)}`, { method: "DELETE" });
    return true;
  },
};
