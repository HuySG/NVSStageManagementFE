"use client";
import { useParams, useRouter } from "next/navigation";
import {
  useGetRequestAssetByDepartmentQuery,
  useGetUserInfoQuery,
  useGetProjectDetailsQuery,
} from "@/state/api";
import Breadcrumb from "@/components/Breadcrumb";
import { Flag, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const statusList = Object.entries(statusMap).map(([value, obj]) => ({
  value,
  label: obj.label,
}));

const PAGE_SIZE = 8;

const MilestoneAssetRequestsPage = () => {
  const { projectId, milestoneId } = useParams() as {
    projectId: string;
    milestoneId: string;
  };
  const router = useRouter();
  const { data: user } = useGetUserInfoQuery();
  const departmentId = user?.department?.id ?? "";
  const { data: requests = [], isLoading: loadingRequests } =
    useGetRequestAssetByDepartmentQuery(departmentId);
  const { data: projectDetails, isLoading: loadingProject } =
    useGetProjectDetailsQuery(projectId);

  // Lấy milestone info
  const milestone = projectDetails?.milestones?.find(
    (m) => m.milestoneID === milestoneId,
  );
  const milestoneTitle = milestone?.title || milestoneId;
  const milestonePeriod = milestone
    ? `Từ ${new Date(milestone.startDate).toLocaleDateString()} đến ${new Date(milestone.endDate).toLocaleDateString()}`
    : "";
  const projectTitle = projectDetails?.title ?? projectId;

  // State cho filter
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [staffFilter, setStaffFilter] = useState<string>("ALL");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Danh sách nhân viên trong milestone này
  const staffList = useMemo(() => {
    const map = new Map<string, string>();
    requests.forEach((req) => {
      if (
        req.projectInfo.projectID === projectId &&
        req.task?.milestoneId === milestoneId &&
        req.requesterInfo
      ) {
        map.set(req.requesterInfo.id, req.requesterInfo.fullName);
      }
    });
    return Array.from(map.entries());
  }, [requests, projectId, milestoneId]);

  // Filter data
  const filteredRequests = useMemo(() => {
    let list = requests.filter(
      (req) =>
        req.projectInfo.projectID === projectId &&
        req.task?.milestoneId === milestoneId,
    );
    if (statusFilter !== "ALL") {
      list = list.filter((req) => req.status === statusFilter);
    }
    if (staffFilter !== "ALL") {
      list = list.filter((req) => req.requesterInfo?.id === staffFilter);
    }
    if (searchText.trim() !== "") {
      const lowerSearch = searchText.trim().toLowerCase();
      list = list.filter(
        (req) =>
          req.requesterInfo?.fullName?.toLowerCase().includes(lowerSearch) ||
          req.description?.toLowerCase().includes(lowerSearch),
      );
    }
    return list;
  }, [requests, projectId, milestoneId, statusFilter, staffFilter, searchText]);

  // Pagination logic
  const totalPage = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const pagedRequests = filteredRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Reset về trang 1 khi filter/milestone thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, staffFilter, searchText, milestoneId]);

  return (
    <div className="min-h-screen bg-gray-50 px-0 py-0 dark:bg-gray-900">
      {/* Header hiện đại */}
      <header className="mb-7 border-none bg-transparent px-0 pb-0 pt-0 shadow-none">
        <div className="px-10 pb-1">
          <Breadcrumb
            items={[
              { label: "Dự án", href: "/requestApprove" },
              {
                label: projectTitle,
                href: `/requestApprove/${projectId}/milestones`,
              },
              { label: milestoneTitle },
            ]}
          />
        </div>
        <div className="flex flex-col gap-4 px-10 pb-7 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 shadow dark:bg-indigo-900">
              <Flag className="h-8 w-8 text-indigo-500 dark:text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-indigo-700 dark:text-indigo-200 sm:text-2xl">
                  {milestoneTitle}
                </h1>
                <span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 shadow-sm dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Milestone
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <CalendarDays className="h-4 w-4 opacity-70" />
                <span>{milestonePeriod}</span>
                <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                <span>
                  Dự án:&nbsp;
                  <span className="font-semibold text-blue-700 dark:text-blue-200">
                    {projectTitle}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center justify-center px-2">
              <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">
                {filteredRequests.length}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-300">
                Yêu cầu
              </span>
            </div>
          </div>
        </div>
      </header>
      <main className="px-10 pb-10">
        {loadingRequests || loadingProject ? (
          <div className="py-20 text-center text-lg text-gray-400">
            Đang tải...
          </div>
        ) : (
          <>
            {/* Bộ lọc và Pagination */}
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Trái: Filter status, staff, search */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Trạng thái */}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Trạng thái:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm outline-none focus:border-blue-400 focus:ring dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="ALL">Tất cả</option>
                  {statusList.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
                {/* Nhân viên */}
                <span className="ml-2 font-medium text-gray-700 dark:text-gray-200">
                  Nhân viên:
                </span>
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm outline-none focus:border-blue-400 focus:ring dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="ALL">Tất cả</option>
                  {staffList.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                {/* Search */}
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm theo mô tả hoặc tên người yêu cầu..."
                  className="ml-2 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm outline-none focus:border-blue-400 focus:ring dark:border-gray-700 dark:bg-gray-800"
                  style={{ minWidth: 220 }}
                />
              </div>
              {/* Pagination controls giữ nguyên */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-semibold text-gray-600 dark:text-gray-200">
                  Trang {currentPage}/{totalPage}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPage, prev + 1))
                  }
                  disabled={currentPage === totalPage}
                  className="rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* Table hoặc empty state */}
            {filteredRequests.length === 0 ? (
              <div className="py-20 text-center text-lg text-gray-400">
                Không có yêu cầu nào trong milestone này.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                <table className="w-full min-w-[900px] divide-y divide-gray-200 text-sm dark:divide-gray-700">
                  <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Người yêu cầu
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Mô tả
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Thời gian
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Task
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Tài sản / Loại
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {pagedRequests.map((req) => (
                      <tr
                        key={req.requestId}
                        className="cursor-pointer transition hover:bg-blue-50 dark:hover:bg-gray-700"
                        onClick={() =>
                          router.push(
                            `/requestApprove/${projectId}/milestones/${milestoneId}/requests/${req.requestId}`,
                          )
                        }
                        tabIndex={0}
                        style={{ cursor: "pointer" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            router.push(
                              `/requestApprove/${projectId}/milestones/${milestoneId}/requests/${req.requestId}`,
                            );
                          }
                        }}
                      >
                        <td className="px-4 py-3 font-medium">
                          {req.requesterInfo?.fullName ?? (
                            <span className="italic text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="max-w-[220px] break-words px-4 py-3">
                          {req.description}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-bold ${statusMap[req.status]?.color ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {statusMap[req.status]?.label ?? req.status}
                          </span>
                        </td>
                        <td className="min-w-[120px] whitespace-nowrap px-4 py-3">
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                              Bắt đầu:
                            </span>{" "}
                            {new Date(req.startTime).toLocaleString("vi-VN")}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                              Kết thúc:
                            </span>{" "}
                            {new Date(req.endTime).toLocaleString("vi-VN")}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {req.task ? (
                            <span className="text-blue-600 underline transition hover:font-bold dark:text-blue-300">
                              {req.task.title}
                            </span>
                          ) : (
                            <span className="italic text-gray-400">
                              No Task
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
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
          </>
        )}
      </main>
    </div>
  );
};

export default MilestoneAssetRequestsPage;
