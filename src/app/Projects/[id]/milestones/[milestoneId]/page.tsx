"use client";
import MilestoneTasksClient from "@/components/MilestoneTasksClient";
import { useParams } from "next/navigation";

export default function MilestoneTasksPage() {
  const { milestoneId } = useParams(); // Lấy milestoneId thay vì id

  return (
    <div className="p-6">
      <MilestoneTasksClient milestoneId={milestoneId as string} />
    </div>
  );
}
