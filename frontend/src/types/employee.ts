// Соответствует dto/employee/EmployeeResponse.java и EmployeeRequest.java
export interface EmployeeResponse {
  id: number;
  fullName: string;
  position: string | null;
  department: string | null;
  internalPhone: string | null;
  email: string | null;
  isActive: boolean | null;
}

export interface EmployeeRequest {
  fullName: string;
  position: string | null;
  department: string | null;
  internalPhone: string | null;
  email: string | null;
  isActive: boolean | null;
}
