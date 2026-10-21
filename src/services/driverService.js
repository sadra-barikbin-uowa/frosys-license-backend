import { apiRequest } from "./api";
import { createApiBody, getApiCollection, imageUrl, normalizeApiId } from "./apiResources";

const normalizeDriver = (driver) => ({
  ...driver,
  id: normalizeApiId(driver.id),
  fullName: driver.full_name ?? driver.fullName ?? "",
  jobTitle: driver.job_title ?? driver.jobTitle ?? "",
  personType: driver.person_type ?? driver.personType ?? "",
  birthDate: driver.birth_date ?? driver.birthDate ?? "",
  nationalId: driver.national_id ?? driver.nationalId ?? "",
  licenseNumber: driver.license_number ?? driver.licenseNumber ?? "",
  licenseIssue: driver.license_issue ?? driver.licenseIssue ?? "",
  licenseExpiry: driver.license_expiry ?? driver.licenseExpiry ?? "",
  createdBy: normalizeApiId(driver.created_by ?? driver.createdBy),
  createdByName: driver.creator?.name ?? driver.createdByName ?? "",
  vehicleId: normalizeApiId(driver.vehicles?.[0]?.id ?? driver.vehicle_id ?? driver.vehicleId),
  photo: imageUrl(driver.photo),
});

const driverFields = {
  fullName: "full_name",
  jobTitle: "job_title",
  personType: "person_type",
  birthDate: "birth_date",
  nationalId: "national_id",
  licenseNumber: "license_number",
  licenseIssue: "license_issue",
  licenseExpiry: "license_expiry",
};

export const driverService = {
  async getDrivers() {
    return (await getApiCollection("/drivers")).map(normalizeDriver);
  },

  async getDriversByEmployee() {
    return this.getDrivers();
  },

  async getDriverById(id) {
    const result = await apiRequest(`/drivers/${encodeURIComponent(id)}`);
    return result?.driver ? normalizeDriver(result.driver) : null;
  },

  async getDriverByIdForEmployee(id) {
    return this.getDriverById(id);
  },

  async createDriver(data) {
    const body = await createApiBody(data, driverFields);
    const result = await apiRequest("/drivers", { method: "POST", body });
    return normalizeDriver(result.driver);
  },

  async updateDriver(id, data) {
    const body = await createApiBody(data, driverFields);
    const result = await apiRequest(`/drivers/${encodeURIComponent(id)}`, {
      method: "PUT",
      body,
    });
    return result?.driver ? normalizeDriver(result.driver) : null;
  },

  async updateDriverForEmployee(id, _employeeId, data) {
    return this.updateDriver(id, data);
  },

  async deleteDriver(id) {
    await apiRequest(`/drivers/${encodeURIComponent(id)}`, { method: "DELETE" });
    return true;
  },
};
