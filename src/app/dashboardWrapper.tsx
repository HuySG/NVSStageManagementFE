"use client";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StoreProvider, { useAppSelector } from "./redux";
import AuthProvider from "./AuthProvider";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const pathname = usePathname(); // Lấy đường dẫn hiện tại
  console.log("Current pathname:", pathname);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Kiểm tra nếu đang ở trang login thì ẩn Sidebar và Navbar
  const isLoginPage = pathname === "/login";

  return (
    <div className="flex min-h-screen w-full bg-gray-50 text-gray-900">
      {!isLoginPage && <Sidebar />}
      <main
        className={`flex w-full flex-col bg-gray-50 dark:bg-dark-bg ${
          !isLoginPage && !isSidebarCollapsed ? "md:pl-64" : ""
        }`}
      >
        {!isLoginPage && <Navbar />}
        {children}
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <AuthProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </AuthProvider>
    </StoreProvider>
  );
};

export default DashboardWrapper;
