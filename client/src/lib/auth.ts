import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  name: string;
  role: "admin" | "staff";
}

export async function login(username: string, password: string): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/login", { username, password });
  return response.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error("Failed to get current user");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
