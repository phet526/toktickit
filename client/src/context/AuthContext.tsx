import React, { createContext, useContext, useState, useEffect } from "react";
import { User, getMe, login as apiLogin, logout as apiLogout, changePassword as apiChangePassword } from "../api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialUser: User | null = (() => {
    try {
      const id = localStorage.getItem("requesterId");
      const name = localStorage.getItem("requesterName");
      const role = (localStorage.getItem("userRole") as any) || "REQUESTER";
      if (id && name) {
        return {
          id: Number(id),
          name,
          email: `${name.toLowerCase().replace(/\s+/g, ".")}@toktickit.com`,
          role,
          isActive: true,
          mustChangePassword: false
        };
      }
    } catch {
      // localStorage might not be available
    }
    return null;
  })();

  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshUser = async () => {
    try {
      const data = await getMe();
      setUser(data.user);
      if (data.user) {
        localStorage.setItem("requesterId", String(data.user.id));
        localStorage.setItem("requesterName", data.user.name);
        localStorage.setItem("userRole", data.user.role);
      }
    } catch {
      // If we don't have a valid session cookie, clear user
      if (!initialUser) {
        setUser(null);
        localStorage.removeItem("requesterId");
        localStorage.removeItem("requesterName");
        localStorage.removeItem("userRole");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiLogin(email, password);
    setUser(res.user);
    localStorage.setItem("requesterId", String(res.user.id));
    localStorage.setItem("requesterName", res.user.name);
    localStorage.setItem("userRole", res.user.role);
    return res.user;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      localStorage.removeItem("requesterId");
      localStorage.removeItem("requesterName");
      localStorage.removeItem("userRole");
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const res = await apiChangePassword(currentPassword, newPassword, confirmPassword);
    if (user) {
      setUser({ ...user, mustChangePassword: res.mustChangePassword });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    try {
      const storedId = localStorage.getItem("requesterId");
      const storedName = localStorage.getItem("requesterName") || "Requester";
      const storedRole = (localStorage.getItem("userRole") as any) || "REQUESTER";
      return {
        user: storedId
          ? {
              id: Number(storedId),
              name: storedName,
              email: `${storedName.toLowerCase().replace(/\s+/g, ".")}@toktickit.com`,
              role: storedRole,
              isActive: true,
              mustChangePassword: false
            }
          : null,
        loading: false,
        login: async () => ({} as any),
        logout: async () => {},
        changePassword: async () => {},
        refreshUser: async () => {}
      };
    } catch {
      return {
        user: null,
        loading: false,
        login: async () => ({} as any),
        logout: async () => {},
        changePassword: async () => {},
        refreshUser: async () => {}
      };
    }
  }
  return context;
};

