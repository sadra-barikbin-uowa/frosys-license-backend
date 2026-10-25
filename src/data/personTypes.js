export const PERSON_TYPES = [
  { value: "teaching_staff", label: "تدريسي" },
  { value: "employee", label: "موظف" },
  { value: "teaching_assistant", label: "معيد" },
  { value: "external_lecturer", label: "محاضر خارجي" },
  { value: "student", label: "طالب" },
];

export const personTypeLabel = (value) =>
  PERSON_TYPES.find((type) => type.value === value)?.label || "—";