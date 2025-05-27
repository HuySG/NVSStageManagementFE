"use client";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Flag, Clock } from "lucide-react";
import MilestoneTasksClient from "@/components/MilestoneTasksClient";
import { format, isBefore, isAfter, isWithinInterval } from "date-fns";
import { useGetProjectByMilestoneIdQuery } from "@/state/api";

export default function MilestoneTasksPage() {
  const { milestoneId } = useParams();

  // Lấy thông tin milestone (thực tế trả về cả project)
  const { data, isLoading, error } = useGetProjectByMilestoneIdQuery(
    milestoneId as string,
    { skip: !milestoneId },
  );

  // Định dạng ngày
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "--";
    }
  };

  // Xác định trạng thái milestone
  const getMilestoneStatus = (start?: string, end?: string) => {
    if (!start || !end)
      return { label: "Không xác định", color: "bg-gray-100 text-gray-400" };
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isBefore(now, startDate))
      return { label: "Chưa bắt đầu", color: "bg-gray-300 text-gray-700" };
    if (isWithinInterval(now, { start: startDate, end: endDate }))
      return { label: "Đang diễn ra", color: "bg-blue-100 text-blue-700" };
    if (isAfter(now, endDate))
      return { label: "Đã kết thúc", color: "bg-green-100 text-green-700" };
    return { label: "Không xác định", color: "bg-gray-100 text-gray-400" };
  };

  if (isLoading) return <div className="p-10">Đang tải...</div>;
  if (error || !data)
    return (
      <div className="p-10 text-red-500">Không thể tải dữ liệu milestone</div>
    );

  // Lấy milestone hiện tại từ mảng milestones (nếu có)
  const milestone = data.milestones?.find(
    (m: any) => m.milestoneID === milestoneId,
  ) ?? {
    title: data.title,
    description: data.description,
    startDate: data.startTime,
    endDate: data.endTime,
  };

  const status = getMilestoneStatus(milestone?.startDate, milestone?.endDate);

  return (
    <div className="min-h-screen bg-gray-50 px-0 dark:bg-neutral-900">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-8 pb-2 pt-6 text-sm text-gray-500 dark:text-gray-400">
        <Link
          href="/Projects"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Dự án
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/Projects/${data.projectID}`}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {data.title}
        </Link>

        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-gray-700 dark:text-white">
          {milestone?.title || "Milestone"}
        </span>
      </div>

      {/* Info milestone */}
      <div className="mb-3 flex w-full flex-col gap-4 border-b border-gray-200 bg-white px-8 py-4 dark:border-neutral-700 dark:bg-neutral-800 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Flag className="h-10 w-10 text-blue-500 dark:text-blue-400" />
          <div>
            <div className="text-xl font-bold text-gray-800 dark:text-white">
              {milestone?.title || "Tên milestone"}
            </div>
            <div className="mt-1 text-gray-500 dark:text-gray-400">
              {milestone?.description || "Chưa có mô tả cho milestone này."}
            </div>
            <div className="mt-2 flex gap-4 text-sm">
              <div className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300">
                <Clock className="h-4 w-4" /> Bắt đầu:{" "}
                {formatDate(milestone?.startDate)}
              </div>
              <div className="flex items-center gap-1 font-semibold text-red-700 dark:text-red-300">
                <Clock className="h-4 w-4" /> Kết thúc:{" "}
                {formatDate(milestone?.endDate)}
              </div>
            </div>
          </div>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-xs font-semibold ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      {/* Tab task view của milestone */}
      <div className="p-6">
        <MilestoneTasksClient milestoneId={milestoneId as string} />
      </div>
    </div>
  );
}
