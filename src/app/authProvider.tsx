"use client";
import { ReactNode, createContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLoginUserMutation } from "@/state/api";

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [loginUser] = useLoginUserMutation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    } else if (pathname !== "/login") {
      router.push("/login"); // Chuyển hướng nếu chưa đăng nhập & không ở trang login
    }
  }, [pathname]);

  const login = async (email: string, password: string) => {
    try {
      const response = await loginUser({ email, password }).unwrap();
      if (response.result.authenticated) {
        localStorage.setItem("token", response.result.token);
        setIsAuthenticated(true);
        router.push("/home");
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    router.push("/login");
  };

  if (!isAuthenticated && pathname !== "/login") {
    return <div>Loading...</div>; // Hiển thị loading trong khi kiểm tra trạng thái đăng nhập
  }

  return (
    <AuthContext.Provider value={{ login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
