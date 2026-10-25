import { Car, CarTaxiFront, Truck } from "lucide-react";

export const VEHICLE_TYPES = [
  { value: "car", label: "سيارة", icon: Car },
  { value: "taxi", label: "أجرة", icon: CarTaxiFront },
  { value: "truck", label: "مركبة نقل", icon: Truck },
];

export const vehicleTypeLabel = (value) =>
  VEHICLE_TYPES.find((v) => v.value === value)?.label || value;

export const vehicleTypeIcon = (value) =>
  VEHICLE_TYPES.find((v) => v.value === value)?.icon || Car;
