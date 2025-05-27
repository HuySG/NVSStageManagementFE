"use client";
import React, { useMemo, useState } from "react";
import {
  useGetUserInfoQuery,
  useGetProjectsDepartmentQuery,
  useGetRequestAssetByDepartmentQuery,
  useGetBorrowedAssetsQuery,
  useGetAllAssetQuery,
  useGetTasksByDepartmentQuery,
} from "@/state/api";
import { Card, CardContent } from "@mui/material";
import {
  Briefcase,
  Box,
  Repeat,
  CheckCircle,
  Clock,
  ListChecks,
  User,
} from "lucide-react";

// ---------- Table component ----------
const Table = ({
  columns,
  data,
  pageSize = 10,
}: {
  columns: { title: string; key: string }[];
  data: any[];
  pageSize?: number;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    return data.filter((row) =>
      columns.some((col) =>
        (row[col.key] ?? "")
          .toString()
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    );
  }, [search, data, columns]);

  const totalPage = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  React.useEffect(() => setCurrentPage(1), [search]);
  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPage, p + 1));

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow dark:bg-gray-900">
      <div className="flex items-center gap-2 p-2">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-64 rounded border px-3 py-1 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="ml-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Xoá
          </button>
        )}
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            {columns.map((col) => (
              <th key={col.title} className="px-4 py-2 text-left font-semibold">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-4 text-center text-gray-400"
              >
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            pagedData.map((row, i) => (
              <tr
                key={i}
                className="even:bg-gray-50 hover:bg-blue-50 dark:even:bg-gray-800 dark:hover:bg-gray-700"
              >
                {columns.map((col) => (
                  <td key={col.title} className="px-4 py-2">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {totalPage > 1 && (
        <div className="flex items-center justify-end gap-2 px-4 py-2">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200 disabled:opacity-50"
          >
            &lt;
          </button>
          <span>
            Trang {currentPage}/{totalPage}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPage}
            className="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200 disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

// ---------- Status mapping ----------
const statusName: Record<string, string> = {
  ToDo: "Chờ xử lý",
  WorkInProgress: "Đang thực hiện",
  UnderReview: "Chờ duyệt",
  Completed: "Hoàn thành",
};
const statusColor: Record<string, string> = {
  ToDo: "bg-blue-100 text-blue-700",
  WorkInProgress: "bg-yellow-100 text-yellow-700",
  UnderReview: "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
};

// ---------- Department Task Card ----------
const DepartmentTaskCard = ({ departmentId }: { departmentId: string }) => {
  const { data: tasks = [], isLoading } = useGetTasksByDepartmentQuery(
    departmentId,
    { skip: !departmentId },
  );
  const stats = useMemo(() => {
    return tasks.reduce(
      (acc: Record<string, number>, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [tasks]);
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <ListChecks className="h-8 w-8 text-fuchsia-500" />
        <div>
          <p className="text-sm text-gray-500">Task của phòng ban</p>
          <p className="text-lg font-semibold">
            {isLoading ? "..." : tasks.length}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(stats).map(([status, count]) => (
              <span
                key={status}
                className={`rounded px-2 py-1 text-xs font-semibold ${statusColor[status] || "bg-gray-100 text-gray-700"}`}
              >
                {statusName[status] || status}: {count}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LeaderHomePage = () => {
  const { data: user } = useGetUserInfoQuery();
  const departmentId = user?.department?.id || "";
  const leaderName = user?.fullName || "Leader";

  // Projects
  const { data: projects = [], isLoading: loadingProjects } =
    useGetProjectsDepartmentQuery(departmentId || "", { skip: !departmentId });

  // Request assets
  const { data: requestAssets = [], isLoading: loadingRequestAssets } =
    useGetRequestAssetByDepartmentQuery(departmentId || "", {
      skip: !departmentId,
    });

  // Borrowed assets
  const { data: borrowedAssets = [], isLoading: loadingBorrowed } =
    useGetBorrowedAssetsQuery();

  // All assets
  const { data: assets = [], isLoading: loadingAssets } = useGetAllAssetQuery();

  // Tasks
  const { data: tasks = [], isLoading: loadingTasks } =
    useGetTasksByDepartmentQuery(departmentId, { skip: !departmentId });

  // Project IDs
  const projectIds = useMemo(
    () => projects.map((p: any) => p.projectID),
    [projects],
  );

  // Helper join data
  function enrichAssetData(statusFilter: string) {
    return borrowedAssets
      .filter((b: any) => b.status === statusFilter)
      .map((b: any) => {
        const req = requestAssets.find((r: any) => r.requestId === b.requestId);
        const assetInfo = assets.find((a: any) => a.assetID === b.assetID);
        return {
          assetName: assetInfo?.assetName || req?.asset?.assetName || b.assetID,
          assetID: b.assetID,
          requesterName: req?.requesterInfo?.fullName || "",
          requesterEmail: req?.requesterInfo?.email || "",
          projectTitle: req?.projectInfo?.title || "",
          borrowTime: b.borrowTime
            ? new Date(b.borrowTime).toLocaleString("vi-VN")
            : "",
          returnTime: b.endTime
            ? new Date(b.endTime).toLocaleString("vi-VN")
            : "",
          statusVi:
            statusFilter === "IN_USE"
              ? "Đang mượn"
              : statusFilter === "RETURNED"
                ? "Đã trả"
                : statusFilter === "OVERDUE"
                  ? "Quá hạn"
                  : b.status,
        };
      });
  }
  const assetBorrowedData = enrichAssetData("IN_USE");
  const assetReturnedData = enrichAssetData("RETURNED");
  const assetOverdueData = enrichAssetData("OVERDUE");

  // Project table columns
  const projectColumns = [
    { title: "Tên dự án", key: "title" },
    { title: "Bắt đầu", key: "startTime" },
    { title: "Kết thúc", key: "endTime" },
    { title: "Trạng thái", key: "status" },
  ];
  const projectData = projects.map((p: any) => ({
    ...p,
    startTime: p.startTime
      ? new Date(p.startTime).toLocaleDateString("vi-VN")
      : "",
    endTime: p.endTime ? new Date(p.endTime).toLocaleDateString("vi-VN") : "",
    status: p.status || "",
  }));

  // Asset table columns
  const assetColumns = [
    { title: "Tên tài sản", key: "assetName" },
    { title: "Mã tài sản", key: "assetID" },
    { title: "Người mượn", key: "requesterName" },
    { title: "Email người mượn", key: "requesterEmail" },
    { title: "Dự án", key: "projectTitle" },
    { title: "Ngày mượn", key: "borrowTime" },
    { title: "Ngày trả", key: "returnTime" },
    { title: "Trạng thái", key: "statusVi" },
  ];

  // Task table columns
  const taskColumns = [
    { title: "Tiêu đề", key: "title" },
    { title: "Mô tả", key: "description" },
    { title: "Trạng thái", key: "status" },
    { title: "Người nhận", key: "assigneeName" },
    { title: "Ngày bắt đầu", key: "startDate" },
    { title: "Ngày kết thúc", key: "endDate" },
  ];
  const taskData = tasks.map((t: any) => ({
    ...t,
    assigneeName: t.assigneeInfo?.fullName || "",
    startDate: t.startDate
      ? new Date(t.startDate).toLocaleDateString("vi-VN")
      : "",
    endDate: t.endDate ? new Date(t.endDate).toLocaleDateString("vi-VN") : "",
    status: (
      <span
        className={`rounded px-2 py-1 text-xs font-semibold ${
          statusColor[t.status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {statusName[t.status] || t.status}
      </span>
    ),
  }));

  // --------------- Header with Gradient, Avatar and SVG deco ---------------
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="relative mb-8 flex items-center gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-pink-100 to-indigo-100 p-6 shadow dark:from-indigo-950 dark:to-pink-950">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-pink-400 to-indigo-500 shadow-lg">
          <svg width={56} height={56} viewBox="0 0 36 36" fill="none">
            <path
              d="M18 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0 2c-6.6 0-12 3.14-12 7v3h24v-3c0-3.86-5.4-7-12-7Z"
              fill="#fff"
            />
          </svg>
        </div>
        <div>
          <h1 className="mb-1 text-3xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">
            Xin chào,{" "}
            <span className="text-pink-600 dark:text-pink-400">
              {leaderName}
            </span>{" "}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300">
            Chào mừng bạn đến với trang tổng quan Leader. Quản lý mọi thứ thật
            dễ dàng!
          </p>
        </div>
        {/* SVG deco */}
        <svg
          className="absolute right-8 top-4 opacity-10"
          width={120}
          height={120}
          fill="none"
          viewBox="0 0 120 120"
        >
          <circle cx={60} cy={60} r={50} stroke="#C4B5FD" strokeWidth={6} />
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Briefcase className="h-8 w-8 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">Dự án</p>
              <p className="text-lg font-semibold">
                {loadingProjects ? "..." : projects.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Box className="h-8 w-8 text-pink-500" />
            <div>
              <p className="text-sm text-gray-500">Tài sản đang mượn</p>
              <p className="text-lg font-semibold">
                {assetBorrowedData.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Tài sản đã trả</p>
              <p className="text-lg font-semibold">
                {assetReturnedData.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm text-gray-500">Tài sản quá hạn</p>
              <p className="text-lg font-semibold">{assetOverdueData.length}</p>
            </div>
          </CardContent>
        </Card>
        <DepartmentTaskCard departmentId={departmentId} />
      </div>

      {/* Danh sách dự án */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">
          Danh sách dự án của phòng ban
        </h2>
        <Table columns={projectColumns} data={projectData} pageSize={5} />
      </div>

      {/* Danh sách công việc */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">
          Danh sách công việc phòng ban
        </h2>
        <Table columns={taskColumns} data={taskData} pageSize={5} />
      </div>

      {/* Tài sản đang mượn */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Tài sản đang mượn</h2>
        <Table columns={assetColumns} data={assetBorrowedData} pageSize={5} />
      </div>

      {/* Tài sản đã trả */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Tài sản đã trả</h2>
        <Table columns={assetColumns} data={assetReturnedData} pageSize={5} />
      </div>

      {/* Tài sản quá hạn */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Tài sản quá hạn</h2>
        <Table columns={assetColumns} data={assetOverdueData} pageSize={5} />
      </div>
    </div>
  );
};

export default LeaderHomePage;
