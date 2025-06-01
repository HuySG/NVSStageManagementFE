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
import { Briefcase, Box, CheckCircle, Clock, ListChecks } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ----------- Table component -----------
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
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 rounded-t-2xl bg-gray-50 px-4 py-2 dark:bg-gray-800">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-64 rounded border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
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
              <th
                key={col.title}
                className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200"
              >
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
                className="py-6 text-center text-gray-400"
              >
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            pagedData.map((row, i) => (
              <tr
                key={i}
                className="transition even:bg-gray-50 hover:bg-blue-50 dark:even:bg-gray-800 dark:hover:bg-gray-700"
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
        <div className="flex items-center justify-end gap-2 rounded-b-2xl bg-gray-50 px-4 py-2 dark:bg-gray-800">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            &lt;
          </button>
          <span>
            Trang {currentPage}/{totalPage}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPage}
            className="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

// ----------- Status mapping -----------
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

// ----------- Department Task Card -----------
const DepartmentTaskCard = ({
  departmentId,
  userId,
}: {
  departmentId: string;
  userId: string;
}) => {
  const { data: tasks = [], isLoading } = useGetTasksByDepartmentQuery(
    departmentId,
    { skip: !departmentId },
  );

  // Lọc task do leader này tạo
  const filteredTasks = useMemo(
    () => tasks.filter((t: any) => t.createBy === userId),
    [tasks, userId],
  );

  const stats = useMemo(() => {
    return filteredTasks.reduce(
      (acc: Record<string, number>, task: any) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [filteredTasks]);

  return (
    <Card className="border border-gray-200 shadow-none dark:border-gray-800">
      <CardContent className="flex items-center gap-3 p-4">
        <ListChecks className="h-8 w-8 text-fuchsia-500" />
        <div>
          <p className="text-sm text-gray-500">Công việc do bạn tạo</p>
          <p className="text-lg font-semibold">
            {isLoading ? "..." : filteredTasks.length}
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

// ----------- Export Excel đa sheet -----------
function exportMultiSheetExcel(
  sheets: {
    name: string;
    data: any[];
    columns: { title: string; key: string }[];
  }[],
  fileName: string,
) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    // Chỉ lấy cột cần thiết & tiêu đề
    const exportData = sheet.data.map((row) => {
      const obj: any = {};
      sheet.columns.forEach((col) => {
        obj[col.title] =
          typeof row[col.key] === "string" || typeof row[col.key] === "number"
            ? row[col.key]
            : typeof row[col.key]?.props?.children === "string"
              ? row[col.key].props.children
              : Array.isArray(row[col.key]?.props?.children)
                ? row[col.key]?.props?.children
                    .filter(Boolean)
                    .map((c: any) =>
                      typeof c === "string"
                        ? c
                        : typeof c?.props?.children === "string"
                          ? c.props.children
                          : "",
                    )
                    .join(" ")
                : "";
      });
      return obj;
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
}

// ========== MAIN PAGE ==========
const LeaderHomePage = () => {
  const { data: user } = useGetUserInfoQuery();
  const departmentId = user?.department?.id || "";
  const leaderName = user?.fullName || "Leader";
  const userId = user?.id || "";

  // Projects
  const { data: projects = [], isLoading: loadingProjects } =
    useGetProjectsDepartmentQuery(departmentId || "", { skip: !departmentId });

  // Request assets
  const { data: requestAssets = [] } = useGetRequestAssetByDepartmentQuery(
    departmentId || "",
    {
      skip: !departmentId,
    },
  );

  // Borrowed assets
  const { data: borrowedAssets = [] } = useGetBorrowedAssetsQuery();

  // All assets
  const { data: assets = [] } = useGetAllAssetQuery();

  // Tasks
  const { data: tasks = [] } = useGetTasksByDepartmentQuery(departmentId, {
    skip: !departmentId,
  });

  // Lọc task do leader này tạo
  const filteredTasks = useMemo(
    () => tasks.filter((t: any) => t.createBy === userId),
    [tasks, userId],
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
  const taskData = filteredTasks.map((t: any) => ({
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

  // ----------- MAIN UI -----------
  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-10 px-0 py-6 md:px-4">
      {/* Header */}
      <div className="relative mb-6 flex flex-row gap-6 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-pink-100 to-indigo-100 p-8 shadow dark:border-gray-800 dark:from-indigo-950 dark:to-pink-950">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-pink-400 to-indigo-500 shadow-lg">
          <svg width={56} height={56} viewBox="0 0 36 36" fill="none">
            <path
              d="M18 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0 2c-6.6 0-12 3.14-12 7v3h24v-3c0-3.86-5.4-7-12-7Z"
              fill="#fff"
            />
          </svg>
        </div>
        <div>
          <h1 className="mb-2 text-3xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">
            Xin chào,{" "}
            <span className="text-pink-600 dark:text-pink-400">
              {leaderName}
            </span>
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
      {/* Nút xuất tổng hợp Excel */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          onClick={() =>
            exportMultiSheetExcel(
              [
                {
                  name: "DuAn",
                  data: projectData,
                  columns: projectColumns,
                },
                {
                  name: "CongViec",
                  data: taskData,
                  columns: taskColumns,
                },
                {
                  name: "TaiSanDangMuon",
                  data: assetBorrowedData,
                  columns: assetColumns,
                },
                {
                  name: "TaiSanDaTra",
                  data: assetReturnedData,
                  columns: assetColumns,
                },
                {
                  name: "TaiSanQuaHan",
                  data: assetOverdueData,
                  columns: assetColumns,
                },
              ],
              "TongHop_QuanLy.xlsx",
            )
          }
        >
          Xuất File Báo Cáo Excel
        </button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border border-gray-200 shadow-none dark:border-gray-800">
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
        <Card className="border border-gray-200 shadow-none dark:border-gray-800">
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
        <Card className="border border-gray-200 shadow-none dark:border-gray-800">
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
        <Card className="border border-gray-200 shadow-none dark:border-gray-800">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm text-gray-500">Tài sản quá hạn</p>
              <p className="text-lg font-semibold">{assetOverdueData.length}</p>
            </div>
          </CardContent>
        </Card>
        <DepartmentTaskCard departmentId={departmentId} userId={userId} />
      </div>

      {/* Section: Dự án */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
          Danh sách dự án của phòng ban
        </h2>
        <Table columns={projectColumns} data={projectData} pageSize={5} />
      </section>

      {/* Section: Công việc */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
          Danh sách công việc bạn đã tạo
        </h2>
        <Table columns={taskColumns} data={taskData} pageSize={5} />
      </section>

      {/* Section: Tài sản đang mượn */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
          Tài sản đang mượn
        </h2>
        <Table columns={assetColumns} data={assetBorrowedData} pageSize={5} />
      </section>

      {/* Section: Tài sản đã trả */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
          Tài sản đã trả
        </h2>
        <Table columns={assetColumns} data={assetReturnedData} pageSize={5} />
      </section>

      {/* Section: Tài sản quá hạn */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
          Tài sản quá hạn
        </h2>
        <Table columns={assetColumns} data={assetOverdueData} pageSize={5} />
      </section>
    </div>
  );
};

export default LeaderHomePage;
