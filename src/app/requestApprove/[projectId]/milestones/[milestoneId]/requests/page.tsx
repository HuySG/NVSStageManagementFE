"use client";
import { useParams } from "next/navigation";
import {
  useGetRequestAssetByDepartmentQuery,
  useGetUserInfoQuery,
  useGetProjectDetailsQuery,
} from "@/state/api";
import Breadcrumb from "@/components/Breadcrumb";
import Link from "next/link";
import { useMemo } from "react";

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

const MilestoneAssetRequestsPage = () => {
  const { projectId, milestoneId } = useParams() as {
    projectId: string;
    milestoneId: string;
  };
  const { data: user } = useGetUserInfoQuery();
  const departmentId = user?.department?.id ?? "";
  const { data: requests = [], isLoading: loadingRequests } =
    useGetRequestAssetByDepartmentQuery(departmentId);
  const { data: projectDetails, isLoading: loadingProject } =
    useGetProjectDetailsQuery(projectId);

  // Map milestoneID => title
  const milestoneTitle =
    projectDetails?.milestones?.find((m) => m.milestoneID === milestoneId)
      ?.title || milestoneId;

  const projectTitle = projectDetails?.title ?? projectId;

  // Lọc các request thuộc milestone này và project này
  const requestsInMilestone = useMemo(
    () =>
      requests.filter(
        (req) =>
          req.projectInfo.projectID === projectId &&
          req.task?.milestoneId === milestoneId,
      ),
    [requests, projectId, milestoneId],
  );

  return (
    <div className="min-h-screen bg-gray-50 px-0 py-0 dark:bg-gray-900">
      <header className="mb-8 rounded-b-xl border-b border-gray-100 bg-white/95 px-8 pb-4 pt-7 shadow-sm dark:border-gray-700 dark:bg-gray-800/90">
        <Breadcrumb
          items={[
            { label: "Dự án", href: "/requestApprove" },
            {
              label: projectTitle,
              href: `/requestApprove/${projectId}/milestones`,
            },
            { label: milestoneTitle, href: "" },
          ]}
        />
        <h1 className="mb-0.5 text-xl font-bold text-gray-900 dark:text-white">
          Yêu cầu tài sản thuộc Milestone:{" "}
          <span className="text-indigo-700 dark:text-indigo-300">
            {milestoneTitle}
          </span>
        </h1>
      </header>
      <main className="px-10 pb-10">
        {loadingRequests || loadingProject ? (
          <div className="py-20 text-center text-lg text-gray-400">
            Đang tải...
          </div>
        ) : requestsInMilestone.length === 0 ? (
          <div className="py-20 text-center text-lg text-gray-400">
            Không có yêu cầu nào trong milestone này.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white shadow-md dark:bg-gray-800">
            <table className="min-w-full divide-y divide-gray-200 bg-white text-sm dark:bg-gray-800">
              <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Mô tả</th>
                  <th className="px-4 py-2 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-4 py-2 text-left font-semibold">
                    Thời gian
                  </th>
                  <th className="px-4 py-2 text-left font-semibold">Task</th>
                  <th className="px-4 py-2 text-left font-semibold">
                    Người yêu cầu
                  </th>
                  <th className="px-4 py-2 text-left font-semibold">
                    Tài sản / Loại
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                {requestsInMilestone.map((req) => (
                  <tr
                    key={req.requestId}
                    className="transition hover:bg-blue-50 dark:hover:bg-gray-700"
                  >
                    <td className="max-w-[180px] break-words px-4 py-2">
                      {req.description}
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${statusMap[req.status]?.color ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {statusMap[req.status]?.label ?? req.status}
                      </span>
                    </td>
                    <td className="min-w-[120px] px-4 py-2">
                      <span className="block text-gray-700 dark:text-gray-300">
                        <strong>Bắt đầu:</strong>{" "}
                        {new Date(req.startTime).toLocaleDateString()}
                      </span>
                      <span className="block text-gray-700 dark:text-gray-300">
                        <strong>Kết thúc:</strong>{" "}
                        {new Date(req.endTime).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {req.task ? (
                        <span className="text-blue-600 underline transition hover:font-bold dark:text-blue-300">
                          {req.task.title}
                        </span>
                      ) : (
                        <span className="italic text-gray-400">No Task</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {req.requesterInfo?.fullName ?? "Unknown"}
                    </td>
                    <td className="px-4 py-2">
                      {req.asset ? (
                        <span className="font-semibold">
                          {req.asset.assetName}
                        </span>
                      ) : req.categories && req.categories.length > 0 ? (
                        <ul className="list-disc pl-5 text-xs text-gray-700 dark:text-gray-300">
                          {req.categories.map((cat) => (
                            <li key={cat.categoryID}>
                              {cat.name} (x{cat.quantity})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="italic text-gray-400">
                          No Categories
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default MilestoneAssetRequestsPage;
