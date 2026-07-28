import axios from "axios";
import { INFOVEAVE_BASE_URL } from "@/config/infoveave";
import { User, UserRole } from "@/types/auth";

type CurrentUserResponse = {
  id?: string | number;
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roleName?: string;
  company?: string;
  createdOn?: string;
};

const toAppRole = (roleName?: string): UserRole => {
  const role = (roleName ?? "").toLowerCase();
  if (role.includes("admin")) return "admin";
  if (role.includes("manager")) return "manager";
  if (role.includes("analyst")) return "analyst";
  if (role.includes("agent")) return "agent";
  return "sdr";
};

export const getCurrentUser = async (token: string): Promise<User> => {
  const { data } = await axios.get<CurrentUserResponse>(
    `${INFOVEAVE_BASE_URL}/api/v10/administration/users/current-user`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return {
    id: `${data.id ?? data.userName ?? data.email ?? "user"}`,
    email: data.email ?? "",
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    username: data.userName ?? "",
    role: toAppRole(data.roleName),
    company: data.company ?? "Infoveave",
    createdAt: data.createdOn ?? new Date().toISOString(),
  };
};
