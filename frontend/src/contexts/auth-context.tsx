"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  role: "admin" | "guru" | "siswa";
  username: string;
  email: string;
  nama: string;
  nomorIdentitas: string;
  foto?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const userData = localStorage.getItem("user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const demoUser: User = {
        id: "1",
        role: username.startsWith("admin") ? "admin" : username.startsWith("guru") ? "guru" : "siswa",
        username,
        email: `${username}@sekolah.com`,
        nama: username.charAt(0).toUpperCase() + username.slice(1),
        nomorIdentitas: username.startsWith("siswa") ? "123456" : "654321",
      };

      localStorage.setItem("token", "demo-token");
      localStorage.setItem("user", JSON.stringify(demoUser));
      setUser(demoUser);

      const roleRoutes = {
        admin: "/admin",
        guru: "/guru",
        siswa: "/siswa",
      };
      router.push(roleRoutes[demoUser.role]);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/admin-guru");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
