"use client";
import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Sidebarmember from "@/components/member-components/Sidabar-member";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex">
      <Sidebarmember />
      <div className="flex-1">
        <Navbar />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
