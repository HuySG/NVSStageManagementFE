"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { LogOut, Settings, Bell, CreditCard, User } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/app/authProvider";

const UserProfile = () => {
  const auth = useContext(AuthContext);

  if (!auth) return null; // Đảm bảo AuthContext có giá trị

  const { user, logout } = auth;

  return (
    <DropdownMenu>
      {/* Nút bấm để mở dropdown */}
      <DropdownMenuTrigger className="w-full">
        <div className="flex cursor-pointer items-center justify-between border-t bg-white p-4 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:hover:bg-gray-800">
          <div className="flex items-center gap-3">
            {/* Avatar của user */}
            <Image
              src={
                user?.pictureProfile ||
                "https://firebasestorage.googleapis.com/v0/b/nvs-system.firebasestorage.app/o/1.png?alt=media&token=3d7aaadf-436e-4bd9-a665-a47986cd6dff"
              } // Ảnh từ user hoặc ảnh mặc định
              alt="User Avatar"
              width={36}
              height={36}
              className="max-h-11 rounded-full object-cover"
            />
            <div>
              {/* Tên người dùng */}
              <h4 className="text-sm font-semibold dark:text-white">
                {" "}
                {user?.fullName || "Unknown User"}
              </h4>
              {/* Email */}
              <p className="text-xs text-gray-500">
                {user?.email || "No Email"}
              </p>
            </div>
          </div>
          {/* Icon dropdown */}
          <Settings className="h-4 w-4 text-gray-500" />
        </div>
      </DropdownMenuTrigger>

      {/* Nội dung dropdown */}
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-semibold">
            {user?.fullName || "Unknown User"}
          </span>
          <span className="text-xs text-gray-500">
            {user?.email || "No Email"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" /> Account
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Bell className="mr-2 h-4 w-4" /> Notifications
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4 text-red-500" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
