"use client";

import MilestoneTimeline from "@/components/MilestoneTimeline";
import { useParams } from "next/navigation";

export default function ProjectPage() {
  const { id } = useParams(); // Lấy projectId từ URL

  return (
    <div className="p-6">
      <MilestoneTimeline projectID={id as string} />
    </div>
  );
}
