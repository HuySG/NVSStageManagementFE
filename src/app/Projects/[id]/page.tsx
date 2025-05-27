"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Briefcase, Clock, ListChecks, Flag } from "lucide-react";
import MilestoneTimeline from "@/components/MilestoneTimeline";
import {
  useGetMilestonesByProjectQuery,
  useGetProjectsQuery,
  useGetTasksByProjectIdQuery,
} from "@/state/api";
import { format } from "date-fns";

export default function ProjectPage() {
  const { id } = useParams(); // Lấy projectId từ URL
  const router = useRouter();

  // Lấy info project & milestone & task
  const { data: projects } = useGetProjectsQuery();
  const project = projects?.find((p) => p.projectID === id);

  // Lấy milestones & tasks
  const { data: milestones } = useGetMilestonesByProjectQuery({
    projectID: id as string,
  });
  const { data: tasks } = useGetTasksByProjectIdQuery(id as string, {
    skip: !id,
  });

  // Định dạng ngày kiểu Việt Nam
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "--";
    }
  };

  // Summary
  const totalMilestones = milestones?.length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const completedTasks = useMemo(
    () => (tasks ? tasks.filter((t) => t.status === "Completed").length : 0),
    [tasks],
  );

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
        <span className="font-semibold text-gray-700 dark:text-white">
          {project?.title || "Tên dự án"}
        </span>
      </div>

      {/* Project info */}
      <div className="mb-3 flex w-full flex-col gap-4 border-b border-gray-200 bg-white px-8 py-4 dark:border-neutral-700 dark:bg-neutral-800 md:flex-row md:items-center md:justify-between">
        {/* Info left */}
        <div className="flex items-center gap-4">
          <Briefcase className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          <div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {project?.title}
            </div>
            <div className="mt-1 text-gray-500 dark:text-gray-400">
              {project?.description || "Chưa có mô tả cho dự án này."}
            </div>
            <div className="mt-2 flex gap-4 text-sm">
              <div className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300">
                <Clock className="h-4 w-4" /> Bắt đầu:{" "}
                {formatDate(project?.startTime)}
              </div>
              <div className="flex items-center gap-1 font-semibold text-red-700 dark:text-red-300">
                <Clock className="h-4 w-4" /> Kết thúc:{" "}
                {formatDate(project?.endTime)}
              </div>
            </div>
          </div>
        </div>
        {/* Summary right */}
        <div className="flex flex-row gap-4">
          <div className="flex flex-col items-center rounded-lg border bg-blue-50 px-4 py-2 dark:bg-blue-950">
            <Flag className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold text-blue-700">
              {totalMilestones}
            </span>
            <span className="text-xs text-gray-500">Milestone</span>
          </div>
          <div className="flex flex-col items-center rounded-lg border bg-green-50 px-4 py-2 dark:bg-green-950">
            <ListChecks className="h-5 w-5 text-green-600" />
            <span className="text-lg font-semibold text-green-700">
              {completedTasks}/{totalTasks}
            </span>
            <span className="text-xs text-gray-500">Nhiệm vụ hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="container mx-auto max-w-4xl px-0">
        <MilestoneTimeline projectID={id as string} />
      </div>
    </div>
  );
}
