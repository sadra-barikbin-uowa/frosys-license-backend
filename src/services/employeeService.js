import { apiRequest } from "./api";
import { getApiCollection } from "./apiResources";

const normalizeEmployee = (employee) => ({
    ...employee,
    id: String(employee.id),
    jobTitle: employee.job_title ?? employee.jobTitle ?? "",
});

const getEmployeeFromResponse = (result) => {
    const employee = result?.employee;

    if (!employee) {
        throw new Error("لم يُرجع الخادم بيانات الموظف المطلوبة");
    }

    return normalizeEmployee(employee);
};

export const employeeService = {
    async getEmployees() {
        return (await getApiCollection("/employees"))
            .map(normalizeEmployee);
    },

    async getEmployeeById(id) {
        const result = await apiRequest(`/employees/${encodeURIComponent(id)}`);

        if (!result?.employee) {
            return null;
        }

        const employee = normalizeEmployee(result.employee);

        return employee;
    },

    async createEmployee(data) {
        const payload = {
            name: data.name.trim(),
            username: data.username.trim(),
            job_title: data.jobTitle?.trim() ?? data.job_title?.trim() ?? "",
            password: data.password,
            role: data.role || "employee",
            permissions: data.permissions || [],
            status: "Active",
        };

        const result = await apiRequest("/employees", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        return getEmployeeFromResponse(result);
    },

    async updateEmployee(id, data) {
        const payload = {};

        if (data.name !== undefined) {
            payload.name = data.name.trim();
        }

        if (data.username !== undefined) {
            payload.username = data.username.trim();
        }

        if (data.jobTitle !== undefined) {
            payload.job_title = data.jobTitle.trim();
        } else if (data.job_title !== undefined) {
            payload.job_title = data.job_title.trim();
        }

        if (data.password) {
            payload.password = data.password;
        }

        if (data.status !== undefined) {
            payload.status = data.status;
        }

        if (data.role !== undefined) {
            payload.role = data.role;
        }

        if (data.permissions !== undefined) {
            payload.permissions = data.permissions;
        }

        const result = await apiRequest(
            `/employees/${encodeURIComponent(id)}`,
            {
                method: "PUT",
                body: JSON.stringify(payload),
            }
        );

        return getEmployeeFromResponse(result);
    },

    async toggleEmployeeStatus(id) {
        const employee = await this.getEmployeeById(id);

        if (!employee) {
            throw new Error("لم يتم العثور على الموظف");
        }

        return this.updateEmployee(id, {
            status: employee.status === "Active" ? "Inactive" : "Active",
        });
    },

    async deleteEmployee(id) {
        await apiRequest(`/employees/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });

        return true;
    },
};
