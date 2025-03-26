"use client";
import { ReactNode, createContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useGetUserInfoQuery, useLoginUserMutation } from "@/state/api";
import { User } from "@/state/api"; // Import interface User

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [loginUser] = useLoginUserMutation();
  // Lấy thông tin user từ API
  const { data: userInfo, refetch } = useGetUserInfoQuery(undefined);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const expireTime = localStorage.getItem("expireTime");

    if (token && expireTime) {
      const now = new Date().getTime();
      if (now > parseInt(expireTime, 10)) {
        logout();
      } else {
        setIsAuthenticated(true);
        if (storedUser) setUser(JSON.parse(storedUser));
        refetch();

        // Thiết lập timeout để tự động logout khi hết hạn
        const timeLeft = parseInt(expireTime, 10) - now;
        setTimeout(() => {
          logout();
        }, timeLeft);
      }
    } else if (pathname !== "/login") {
      router.push("/login");
    }
  }, [pathname]);

  useEffect(() => {
    if (userInfo) {
      setUser(userInfo); // Cập nhật thông tin user
      localStorage.setItem("user", JSON.stringify(userInfo));
    }
  }, [userInfo]);

  const login = async (email: string, password: string) => {
    try {
      const response = await loginUser({ email, password }).unwrap();
      if (response.result.authenticated) {
        const expireTime = new Date().getTime() + 60 * 60 * 1000;
        localStorage.setItem("token", response.result.token);
        localStorage.setItem("expireTime", expireTime.toString());
        setIsAuthenticated(true);

        await refetch(); // ✅ Gọi lại API để cập nhật userInfo

        // Chờ userInfo cập nhật rồi mới set
        if (userInfo) {
          setUser(userInfo);
          localStorage.setItem("user", JSON.stringify(userInfo));

          let redirectPath =
            userInfo.role.roleName === "Staff" ? "/Member" : "/home";
          router.push(redirectPath);
        } else {
          router.push("/home");
        }

        // Tự động logout sau 1 giờ
        setTimeout(
          () => {
            logout();
          },
          60 * 60 * 1000,
        );
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("expireTime");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/login");
  };

  if (!isAuthenticated && pathname !== "/login") {
    return <div>Loading...</div>; // Hiển thị loading trong khi kiểm tra trạng thái đăng nhập
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
