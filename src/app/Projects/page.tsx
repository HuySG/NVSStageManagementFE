"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Briefcase, Clock, Search, ChevronDown } from "lucide-react";
import {
  useGetUserInfoQuery,
  useGetProjectsDepartmentQuery,
} from "@/state/api";
import { format } from "date-fns";

export default function ProjectsPage() {
  const [filter, setFilter] = useState("");
  const [sortType, setSortType] = useState<
    "start-desc" | "start-asc" | "end-asc" | "end-desc"
  >("start-desc");

  const { data: user, isLoading, error } = useGetUserInfoQuery();
  const departmentId = user?.department?.id ?? "";
  const {
    data: projects,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useGetProjectsDepartmentQuery(departmentId, { skip: !departmentId });

  if (isLoading || isProjectsLoading)
    return <div className="p-10">Đang tải...</div>;
  if (error || projectsError || !projects)
    return (
      <div className="p-10 text-red-500">Không thể tải danh sách dự án</div>
    );

  // Định dạng ngày kiểu Việt Nam
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "--";
    }
  };

  // Filter & Sort
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((project) =>
      project.title.toLowerCase().includes(filter.toLowerCase()),
    );
    // Hàm get thời gian, ưu tiên null xuống cuối
    const getTime = (date: string | undefined) =>
      date ? new Date(date).getTime() : -Infinity;

    switch (sortType) {
      case "start-desc":
        return filtered.sort(
          (a, b) => getTime(b.startTime) - getTime(a.startTime),
        );
      case "start-asc":
        return filtered.sort(
          (a, b) => getTime(a.startTime) - getTime(b.startTime),
        );
      case "end-asc":
        return filtered.sort((a, b) => getTime(a.endTime) - getTime(b.endTime));
      case "end-desc":
        return filtered.sort((a, b) => getTime(b.endTime) - getTime(a.endTime));
      default:
        return filtered;
    }
  }, [projects, filter, sortType]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white px-8 py-8 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Danh sách dự án của phòng {user?.department?.name}
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Quản lý tất cả các dự án của phòng, bấm vào từng dự án để xem chi
              tiết.
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 md:mt-0">
            {/* FILTER INPUT */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên dự án..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
              />
            </div>
            {/* SORT DROPDOWN */}
            <div className="relative">
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value as any)}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
              >
                <option value="start-desc">Mới nhất (ngày bắt đầu)</option>
                <option value="start-asc">Cũ nhất (ngày bắt đầu)</option>
                <option value="end-asc">Kết thúc gần nhất</option>
                <option value="end-desc">Kết thúc xa nhất</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Danh sách dự án */}
      <main className="w-full px-8 py-8">
        {filteredProjects.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            Không có dự án phù hợp.
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProjects.map((project) => (
              <Link
                href={`/Projects/${project.projectID}`}
                key={project.projectID}
                className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow transition hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div className="mb-4">
                  <Briefcase className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-lg font-bold text-gray-800 group-hover:text-blue-600 dark:text-white">
                  {project.title}
                </div>
                <div className="mt-2 flex-1 text-sm text-gray-500 dark:text-gray-400">
                  {project.description || "Chưa có mô tả cho dự án này."}
                </div>
                <div className="mt-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      Bắt đầu:&nbsp;
                    </span>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      {formatDate(project.startTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-red-700 dark:text-red-300">
                      Kết thúc:&nbsp;
                    </span>
                    <span className="font-semibold text-red-700 dark:text-red-300">
                      {formatDate(project.endTime)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
