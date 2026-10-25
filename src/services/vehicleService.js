import { apiRequest } from "./api";
import { createApiBody, getApiCollection, imageUrl, normalizeApiId } from "./apiResources";

const normalizeVehicle = (vehicle) => ({
  ...vehicle,
  id: normalizeApiId(vehicle.id),
  vehicleNumber: vehicle.vehicle_number ?? vehicle.vehicleNumber ?? "",
  vehicleType: vehicle.vehicle_type ?? vehicle.vehicleType ?? "",
  model: vehicle.model ?? "",
  driverId: normalizeApiId(vehicle.driver_id ?? vehicle.driverId),
  createdBy: normalizeApiId(vehicle.created_by ?? vehicle.createdBy),
  createdByName: vehicle.creator?.name ?? vehicle.createdByName ?? "",
  photo: imageUrl(vehicle.photo),
  registrationFront: imageUrl(vehicle.registration_front ?? vehicle.registrationFront),
  registrationBack: imageUrl(vehicle.registration_back ?? vehicle.registrationBack),
});

const vehicleFields = {
  vehicleNumber: "vehicle_number",
  vehicleType: "vehicle_type",
  driverId: "driver_id",
  registrationFront: "registration_front",
  registrationBack: "registration_back",
};

export const vehicleService = {
  async getVehicles() {
    return (await getApiCollection("/vehicles")).map(normalizeVehicle);
  },

  async getVehicleById(id) {
    const result = await apiRequest(`/vehicles/${encodeURIComponent(id)}`);
    return result?.vehicle ? normalizeVehicle(result.vehicle) : null;
  },

  async createVehicle(data) {
    const body = await createApiBody(data, vehicleFields);
    const result = await apiRequest("/vehicles", { method: "POST", body });
    return normalizeVehicle(result.vehicle);
  },

  async updateVehicle(id, data) {
    const body = await createApiBody(data, vehicleFields);
    const result = await apiRequest(`/vehicles/${encodeURIComponent(id)}`, {
      method: "PUT",
      body,
    });
    return result?.vehicle ? normalizeVehicle(result.vehicle) : null;
  },

  async deleteVehicle(id) {
    await apiRequest(`/vehicles/${encodeURIComponent(id)}`, { method: "DELETE" });
    return true;
  },
};
