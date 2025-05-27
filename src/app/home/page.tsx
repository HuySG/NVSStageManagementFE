"use client";
import { useContext } from "react";
import { AuthContext } from "@/app/authProvider";
import StaffHomePage from "@/components/StaffHomePage";
import LeaderHomePage from "@/components/LeaderHomePage";

export default function HomePage() {
  const auth = useContext(AuthContext);

  if (!auth || !auth.user)
    return (
      <div className="mt-20 text-center text-gray-500">
        Đang tải thông tin người dùng...
      </div>
    );

  const role = auth.user.role?.roleName?.toUpperCase();

  switch (role) {
    case "STAFF":
      return <StaffHomePage />;
    case "LEADER":
      return <LeaderHomePage />;
    default:
      return (
        <div className="mt-10 text-center text-red-500">
          Bạn không có quyền truy cập trang này
        </div>
      );
  }
}
