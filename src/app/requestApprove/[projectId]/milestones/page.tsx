"use client";
import { useParams } from "next/navigation";
import {
  useGetRequestAssetByDepartmentQuery,
  useGetUserInfoQuery,
  useGetProjectDetailsQuery,
} from "@/state/api";
import { useMemo } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

const ProjectMilestonePage = () => {
  const { projectId } = useParams() as { projectId: string };
  const { data: user } = useGetUserInfoQuery();
  const departmentId = user?.department?.id ?? "";

  // Lấy toàn bộ request và detail project (lấy milestones)
  const { data: requests = [], isLoading: loadingRequests } =
    useGetRequestAssetByDepartmentQuery(departmentId);
  const { data: projectDetails, isLoading: loadingProject } =
    useGetProjectDetailsQuery(projectId);

  // Map milestoneID => title
  const milestoneTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    if (projectDetails?.milestones) {
      projectDetails.milestones.forEach((m) => {
        map.set(m.milestoneID, m.title);
      });
    }
    return map;
  }, [projectDetails]);

  // Gom milestone, đếm số yêu cầu mỗi milestone
  const milestoneMap = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>();
    requests
      .filter((req) => req.projectInfo.projectID === projectId)
      .forEach((req) => {
        const msId = req.task?.milestoneId ?? "no-milestone";
        const msTitle =
          msId !== "no-milestone"
            ? (milestoneTitleMap.get(msId) ?? msId)
            : "Không có milestone";
        if (!map.has(msId)) {
          map.set(msId, { title: msTitle, count: 1 });
        } else {
          map.get(msId)!.count += 1;
        }
      });
    return Array.from(map.entries());
  }, [requests, projectId, milestoneTitleMap]);

  // Tổng milestone, tổng request
  const numMilestone = milestoneMap.length;
  const numRequest = milestoneMap.reduce(
    (acc, [, { count }]) => acc + count,
    0,
  );

  const projectTitle = projectDetails?.title ?? "Không rõ";

  return (
    <div className="min-h-screen bg-gray-50 px-0 py-0 dark:bg-gray-900">
      {/* Header */}
      <header className="mb-8 rounded-b-xl border-b border-gray-100 bg-white/95 px-8 pb-4 pt-7 shadow-sm dark:border-gray-700 dark:bg-gray-800/90">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Breadcrumb
              items={[
                { label: "Dự án", href: "/requestApprove" },
                { label: projectTitle },
              ]}
            />
            <h1 className="mb-0.5 text-xl font-bold text-gray-900 dark:text-white">
              Milestone của dự án:{" "}
              <span className="text-blue-700 dark:text-blue-300">
                {projectTitle}
              </span>
            </h1>
          </div>
          <div className="mt-2 flex gap-6 sm:mt-0">
            <StatItem label="Milestone" value={numMilestone} color="indigo" />
            <StatItem label="Yêu cầu" value={numRequest} color="green" />
          </div>
        </div>
      </header>
      <main className="px-10 pb-10">
        {loadingRequests || loadingProject ? (
          <div className="py-20 text-center text-lg text-gray-400">
            Đang tải...
          </div>
        ) : milestoneMap.length === 0 ? (
          <div className="py-20 text-center text-lg text-gray-400">
            Không có milestone nào trong dự án này.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {milestoneMap.map(([milestoneId, { title, count }]) => (
              <Link
                href={`/requestApprove/${projectId}/milestones/${milestoneId}/requests`}
                key={milestoneId}
                className="group block rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:border-indigo-400 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/90 text-lg font-black text-white transition group-hover:bg-indigo-700">
                    {title
                      .split(" ")
                      .map((w: string) => w.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="truncate text-lg font-bold text-indigo-700 group-hover:text-indigo-500 dark:text-indigo-300">
                      {title}
                    </h2>
                    <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                      {count} yêu cầu
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-200">
                  Nhấn để xem yêu cầu tài sản chi tiết của milestone này.
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// Thống kê nhỏ
const StatItem = ({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: number;
  color?: "blue" | "indigo" | "green";
}) => {
  const colorClass =
    color === "blue"
      ? "text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-900"
      : color === "indigo"
        ? "text-indigo-700 bg-indigo-100 dark:text-indigo-200 dark:bg-indigo-900"
        : "text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900";
  return (
    <div className="flex flex-col items-center">
      <span
        className={`rounded px-2 py-0.5 text-lg font-extrabold ${colorClass}`}
      >
        {value}
      </span>
      <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-300">
        {label}
      </span>
    </div>
  );
};

export default ProjectMilestonePage;
