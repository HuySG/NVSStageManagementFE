"use client";
import {
  useGetRequestAssetByDepartmentQuery,
  useGetUserInfoQuery,
} from "@/state/api";
import Link from "next/link";

// Mapping trạng thái (nếu muốn hiện filter trạng thái trong thống kê)
const statusMap: Record<string, { label: string; color: string }> = {
  PENDING_LEADER: {
    label: "Chờ Leader duyệt",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  LEADER_APPROVED: {
    label: "Leader duyệt",
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  },
  LEADER_REJECTED: {
    label: "Leader từ chối",
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  },
  PENDING_AM: {
    label: "Chờ AM duyệt",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  AM_APPROVED: {
    label: "AM duyệt",
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  },
  REJECTED: {
    label: "Từ chối",
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  },
  CANCELLED: {
    label: "Đã huỷ",
    color: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300",
  },
};

const statusKeys = Object.keys(statusMap);

const MyRequestsProjectsPage = () => {
  const { data: user, isLoading: userLoading } = useGetUserInfoQuery();
  const userId = user?.id || "";
  const departmentId = user?.department?.id || "";

  const { data: requests = [], isLoading: reqLoading } =
    useGetRequestAssetByDepartmentQuery(departmentId, { skip: !departmentId });

  // Lọc các request staff hiện tại đã gửi
  const myRequests = requests.filter((req) => req.requesterInfo?.id === userId);

  // Unique project + đếm số lượng request từng project
  const projectMap = new Map<string, { title: string; projectID: string }>();
  const projectRequestCount: Record<string, number> = {};
  const milestoneSet = new Set<string>();

  myRequests.forEach((req) => {
    const p = req.projectInfo;
    if (p?.projectID && !projectMap.has(p.projectID)) {
      projectMap.set(p.projectID, { title: p.title, projectID: p.projectID });
    }
    if (p?.projectID) {
      projectRequestCount[p.projectID] =
        (projectRequestCount[p.projectID] || 0) + 1;
    }
    if (req.task?.milestoneId) {
      milestoneSet.add(req.task.milestoneId);
    }
  });

  const projects = Array.from(projectMap.values());
  const numProject = projects.length;
  const numMilestone = milestoneSet.size;
  const numRequests = myRequests.length;

  // Thống kê số lượng theo từng trạng thái
  const statusCounts = myRequests.reduce<Record<string, number>>((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 px-0 py-0 dark:bg-gray-900">
      {/* Header section */}
      <header className="mb-8 rounded-b-xl border-b border-gray-100 bg-white/95 px-8 pb-4 pt-7 shadow-sm dark:border-gray-700 dark:bg-gray-800/90">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-0.5 text-xl font-bold text-gray-900 dark:text-white">
              Dự án bạn đã gửi yêu cầu
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chọn dự án để xem các milestone và yêu cầu bạn đã gửi.
            </p>
          </div>
          <div className="mt-2 flex gap-6 sm:mt-0">
            <StatItem label="Dự án" value={numProject} color="blue" />
            <StatItem label="Milestone" value={numMilestone} color="indigo" />
            <StatItem label="Yêu cầu" value={numRequests} color="green" />
          </div>
        </div>
        {/* Thống kê trạng thái yêu cầu của staff */}
        <div className="mt-6 flex flex-wrap gap-3">
          {statusKeys.map((status) =>
            statusCounts[status] ? (
              <span
                key={status}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusMap[status].color}`}
              >
                {statusMap[status].label}
                <span className="font-bold">{statusCounts[status]}</span>
              </span>
            ) : null,
          )}
        </div>
      </header>

      {/* Projects grid */}
      <main className="px-10 pb-10">
        {projects.length === 0 ? (
          <div className="py-20 text-center text-xl text-gray-400">
            Bạn chưa gửi yêu cầu ở dự án nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(({ projectID, title }) => (
              <Link
                href={`/myRequests/${projectID}/milestones`}
                key={projectID}
                className="group block rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/90 text-2xl font-black text-white transition group-hover:bg-indigo-500">
                    {title
                      .split(" ")
                      .map((w: string) => w.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="mb-1 flex items-center gap-2 truncate text-lg font-bold text-blue-700 group-hover:text-indigo-600 dark:text-blue-300">
                      {title}
                      <span className="ml-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                        {projectRequestCount[projectID] || 0} yêu cầu
                      </span>
                    </h2>
                    <span className="block truncate text-xs text-gray-400 dark:text-gray-400">
                      ID: {projectID}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-200">
                  Nhấn để xem milestone và các yêu cầu đã gửi trong dự án này.
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

export default MyRequestsProjectsPage;
