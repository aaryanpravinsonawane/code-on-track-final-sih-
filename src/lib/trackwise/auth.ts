import type { Role } from "./types";

export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: "Management" | "Station Master" | "Engineering" | "S&T" | "TRD" | "Control Office";
  department: string;
  station: string;
  division: string;
  permissions: string[];
}

export interface LoginCredentials {
  employeeId: string;
  password: string;
  station: string;
  division: string;
  role: Role;
  rememberDevice: boolean;
}

// Mock user database for simulation
const MOCK_USERS: User[] = [
  {
    id: "USR-001",
    employeeId: "RM-001",
    name: "Rajesh Kumar",
    role: "Management",
    department: "Operations",
    station: "NDG",
    division: "Central Division",
    permissions: ["view_all", "approve_plans", "manage_users", "view_analytics"],
  },
  {
    id: "USR-002",
    employeeId: "SM-001",
    name: "Priya Sharma",
    role: "Station Master",
    department: "Operations",
    station: "NDG",
    division: "Central Division",
    permissions: ["view_station", "approve_station_plans", "manage_maintenance", "view_analytics"],
  },
  {
    id: "USR-003",
    employeeId: "ENG-001",
    name: "Amit Patel",
    role: "Engineering",
    department: "Engineering",
    station: "NDG",
    division: "Central Division",
    permissions: ["view_tms", "manage_track_maintenance", "create_work_orders"],
  },
  {
    id: "USR-004",
    employeeId: "SNT-001",
    name: "Suresh Reddy",
    role: "S&T",
    department: "S&T",
    station: "NDG",
    division: "Central Division",
    permissions: ["view_smms", "manage_signal_maintenance", "create_work_orders"],
  },
  {
    id: "USR-005",
    employeeId: "TRD-001",
    name: "Vijay Singh",
    role: "TRD",
    department: "TRD",
    station: "NDG",
    division: "Central Division",
    permissions: ["view_tdms", "manage_traction_maintenance", "create_work_orders"],
  },
  {
    id: "USR-006",
    employeeId: "COA-001",
    name: "Anita Desai",
    role: "Control Office",
    department: "Operations",
    station: "NDG",
    division: "Central Division",
    permissions: ["view_coa", "manage_train_movement", "create_caution_orders"],
  },
];

export function authenticate(credentials: LoginCredentials): User | null {
  // In a real system, this would validate against a backend
  // For simulation, we'll accept any employee ID and return a user based on role
  const user = MOCK_USERS.find((u) => u.role === credentials.role);
  if (user) {
    return {
      ...user,
      station: credentials.station,
      division: credentials.division,
    };
  }
  return null;
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission) || user.permissions.includes("view_all");
}

export function canAccessModule(user: User | null, module: string): boolean {
  if (!user) return false;
  
  const modulePermissions: Record<string, string[]> = {
    management: ["view_all"],
    station_master: ["view_station", "view_all"],
    tms: ["view_tms", "view_all"],
    tdms: ["view_tdms", "view_all"],
    smms: ["view_smms", "view_all"],
    coa: ["view_coa", "view_all"],
    ai: ["view_all"],
    analytics: ["view_analytics", "view_all"],
    admin: ["manage_users", "view_all"],
  };

  const requiredPerms = modulePermissions[module] || [];
  return requiredPerms.some((perm) => user.permissions.includes(perm));
}
