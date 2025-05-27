"use client";
import React, { useContext, useState, useEffect, useMemo } from "react";
import {
  Bell,
  CalendarCheck2,
  ClipboardList,
  Package,
  ClipboardCheck,
  User2,
  Clock,
} from "lucide-react";
import { AuthContext } from "@/app/authProvider";
import {
  useGetStaffBorrowedAssetsQuery,
  useGetReturnRequestsByStaffIdQuery,
  useGetTasksByUserQuery,
  useGetNotificationsByUserQuery,
  useGetProjectByMilestoneIdQuery,
  Task,
  Status,
  StaffBorrowedAsset,
  Notification,
} from "@/state/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent } from "@mui/material";

// ===== Paginated Table Component (có thể custom filter) =====
const PaginatedTable = ({
  columns,
  data,
  pageSize = 8,
  getRowClassName,
  children,
}: {
  columns: { title: string; key: string }[];
  data: any[];
  pageSize?: number;
  getRowClassName?: (row: any) => string;
  children?: (row: any) => React.ReactNode;
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPage = Math.ceil(data.length / pageSize);
  const pagedData = data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => setCurrentPage(1), [data]);

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPage, p + 1));

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow dark:bg-gray-900">
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
          ) : children ? (
            pagedData.map(children)
          ) : (
            pagedData.map((row, i) => (
              <tr
                key={i}
                className={
                  (getRowClassName ? getRowClassName(row) : "") +
                  " even:bg-gray-50 hover:bg-blue-50 dark:even:bg-gray-800 dark:hover:bg-gray-700"
                }
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

function getAssetStatusVi(status: "IN_USE" | "OVERDUE") {
  switch (status) {
    case "IN_USE":
      return "Đang sử dụng";
    case "OVERDUE":
      return "Quá hạn";
    default:
      return status;
  }
}
function isTaskOverdue(task: Task) {
  if (!task.endDate) return false;
  const end = new Date(task.endDate).getTime();
  const now = Date.now();
  return end < now && task.status !== Status.Completed;
}
const TaskRow = ({ task }: { task: Task }) => {
  const { data: project } = useGetProjectByMilestoneIdQuery(task.milestoneId, {
    skip: !task.milestoneId,
  });
  const projectTitle = project?.title || "Không xác định";
  const milestoneTitle =
    project?.milestones?.find((m) => m.milestoneID === task.milestoneId)
      ?.title || "Không xác định";
  const overdue = isTaskOverdue(task);
  let statusVi = "";
  switch (task.status) {
    case Status.ToDo:
      statusVi = "Chờ làm";
      break;
    case Status.WorkInProgress:
      statusVi = "Đang thực hiện";
      break;
    case Status.UnderReview:
      statusVi = "Chờ duyệt";
      break;
    case Status.Completed:
      statusVi = "Hoàn thành";
      break;
    default:
      statusVi = task.status || "";
  }
  return (
    <tr
      className={
        (overdue ? "bg-red-100 font-semibold dark:bg-red-900" : "") +
        " even:bg-gray-50 hover:bg-blue-50 dark:even:bg-gray-800 dark:hover:bg-gray-700"
      }
      title={overdue ? "Công việc quá hạn" : ""}
    >
      <td>{task.title}</td>
      <td>{projectTitle}</td>
      <td>{milestoneTitle}</td>
      <td>
        {task.endDate
          ? new Date(task.endDate).toLocaleString("vi-VN")
          : "Không xác định"}
      </td>
      <td>
        {statusVi}
        {overdue && (
          <span className="ml-2 inline-block rounded bg-red-500 px-2 py-0.5 text-xs text-white">
            Quá hạn
          </span>
        )}
      </td>
      <td>{task.priority || ""}</td>
    </tr>
  );
};

const StaffHomePage = () => {
  const auth = useContext(AuthContext);
  const staffId = auth?.user?.id || "";
  const staffName = auth?.user?.fullName || "Nhân viên";
  const staffEmail = auth?.user?.email || "";
  const staffRole = auth?.user?.role?.roleName || "";
  const staffDept = auth?.user?.department?.name || "";

  // Data
  const { data: borrowedAssets = [], isLoading: loadingAssets } =
    useGetStaffBorrowedAssetsQuery(staffId, { skip: !staffId });
  const { data: returnRequests = [], isLoading: loadingRequests } =
    useGetReturnRequestsByStaffIdQuery(staffId, { skip: !staffId });
  const { data: staffTasks = [], isLoading: loadingTasks } =
    useGetTasksByUserQuery(staffId, { skip: !staffId });
  const { data: notifications = [], isLoading: loadingNotifications } =
    useGetNotificationsByUserQuery(staffId, { skip: !staffId });

  // Stats
  const todoTasks = staffTasks.filter(
    (t: Task) => t.status === Status.ToDo,
  ).length;
  const inProgressTasks = staffTasks.filter(
    (t: Task) => t.status === Status.WorkInProgress,
  ).length;
  const underReviewTasks = staffTasks.filter(
    (t: Task) => t.status === Status.UnderReview,
  ).length;
  const completedTasks = staffTasks.filter(
    (t: Task) => t.status === Status.Completed,
  ).length;
  const totalTasks = staffTasks.length;
  const completedPercent = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;
  const overdueBorrowed = borrowedAssets.filter(
    (a: StaffBorrowedAsset) => a.status === "OVERDUE",
  ).length;
  const totalBorrowed = borrowedAssets.length;
  const totalPendingRequests = returnRequests.filter(
    (r: any) => r.status === "PENDING",
  ).length;

  // Table columns
  const assetColumns = [
    { title: "Tên tài sản", key: "assetName" },
    { title: "Thời gian mượn", key: "borrowTime" },
    { title: "Thời gian trả dự kiến", key: "expectedReturnTime" },
    { title: "Trạng thái", key: "status" },
  ];
  const borrowedAssetData = borrowedAssets.map((item: StaffBorrowedAsset) => ({
    assetName: item.assetName || "Không xác định",
    borrowTime: item.borrowTime
      ? new Date(item.borrowTime).toLocaleString("vi-VN")
      : "",
    expectedReturnTime: item.endTime
      ? new Date(item.endTime).toLocaleString("vi-VN")
      : "",
    status: getAssetStatusVi(item.status),
  }));

  const notificationColumns = [
    { title: "Nội dung thông báo", key: "message" },
    { title: "Thời gian", key: "createDate" },
    { title: "Loại", key: "type" },
  ];
  const notificationData = [...notifications]
    .sort(
      (a: Notification, b: Notification) =>
        new Date(b.createDate).getTime() - new Date(a.createDate).getTime(),
    )
    .map((n: Notification) => ({
      message: n.message,
      createDate: n.createDate
        ? new Date(n.createDate).toLocaleString("vi-VN")
        : "",
      type: n.type,
    }));

  const barData = [
    { name: "Chờ làm", value: todoTasks },
    { name: "Đang làm", value: inProgressTasks },
    { name: "Chờ duyệt", value: underReviewTasks },
    { name: "Hoàn thành", value: completedTasks },
  ];

  const taskColumns = [
    { title: "Tiêu đề", key: "title" },
    { title: "Dự án", key: "project" },
    { title: "Milestone", key: "milestone" },
    { title: "Hạn hoàn thành", key: "endDate" },
    { title: "Trạng thái", key: "status" },
    { title: "Ưu tiên", key: "priority" },
  ];

  // ==== Filter state ====
  const [assetFilter, setAssetFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [notificationFilter, setNotificationFilter] = useState("");

  // ==== Filter logic (theo từ khoá tất cả cột) ====
  const filteredAssetData = useMemo(
    () =>
      borrowedAssetData.filter((row) =>
        assetColumns.some((col) =>
          (row[col.key as keyof typeof row] ?? "")
            .toString()
            .toLowerCase()
            .includes(assetFilter.toLowerCase()),
        ),
      ),
    [borrowedAssetData, assetFilter, assetColumns],
  );

  const filteredTaskData = useMemo(
    () =>
      staffTasks.filter((task: Task) =>
        taskColumns.some((col) =>
          (task[col.key as keyof typeof task] ?? "")
            .toString()
            .toLowerCase()
            .includes(taskFilter.toLowerCase()),
        ),
      ),
    [staffTasks, taskFilter, taskColumns],
  );

  const filteredNotificationData = useMemo(
    () =>
      notificationData.filter((row) =>
        notificationColumns.some((col) =>
          (row[col.key as keyof typeof row] ?? "")
            .toString()
            .toLowerCase()
            .includes(notificationFilter.toLowerCase()),
        ),
      ),
    [notificationData, notificationFilter, notificationColumns],
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header cá nhân, avatar, info */}
      <div className="mb-8 flex flex-col items-center gap-4 md:flex-row">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg">
          <User2 className="text-white" size={42} />
        </div>
        <div>
          <h1 className="mb-1 text-2xl font-extrabold text-gray-900 dark:text-white">
            Xin chào,{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {staffName}
            </span>
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 dark:text-gray-300">
            <span>
              Email:{" "}
              <span className="font-medium text-gray-700 dark:text-white">
                {staffEmail}
              </span>
            </span>
            <span>
              Phòng ban:{" "}
              <span className="font-medium text-gray-700 dark:text-white">
                {staffDept}
              </span>
            </span>
            <span>
              Chức vụ:{" "}
              <span className="font-medium text-gray-700 dark:text-white">
                {staffRole}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <Package className="text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Tài sản đang mượn</p>
              <p className="text-lg font-semibold">
                {loadingAssets ? "..." : totalBorrowed}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <Clock className="text-red-400" />
            <div>
              <p className="text-sm text-gray-500">Tài sản quá hạn</p>
              <p className="text-lg font-semibold">{overdueBorrowed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <ClipboardList className="text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Yêu cầu trả (chờ duyệt)</p>
              <p className="text-lg font-semibold">
                {loadingRequests ? "..." : totalPendingRequests}
              </p>
              <p className="text-xs text-gray-400">
                Tổng đã gửi: {returnRequests.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <Bell className="text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Thông báo</p>
              <p className="text-lg font-semibold">
                {loadingTasks ? "..." : notifications.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <ClipboardCheck className="text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Công việc</p>
              <p className="text-lg font-semibold">
                {loadingTasks ? "..." : totalTasks}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-gray-100 px-2 py-1">
                  Chờ làm: {todoTasks}
                </span>
                <span className="rounded bg-gray-100 px-2 py-1">
                  Đang làm: {inProgressTasks}
                </span>
                <span className="rounded bg-gray-100 px-2 py-1">
                  Chờ duyệt: {underReviewTasks}
                </span>
                <span className="rounded bg-gray-100 px-2 py-1">
                  Hoàn thành: {completedTasks}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <CalendarCheck2 className="text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Tiến độ công việc</p>
              <p className="text-lg font-semibold">{completedPercent}%</p>
              <div className="mt-1 h-2 w-24 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-400 transition-all"
                  style={{ width: `${completedPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ và bảng */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow dark:bg-gray-900 md:col-span-1">
          <h2 className="mb-4 text-center text-lg font-semibold">
            Biểu đồ trạng thái công việc
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-6 md:col-span-2">
          <div>
            <h2 className="mb-2 text-lg font-semibold">
              Danh sách tài sản đang mượn
            </h2>
            <div className="mb-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm tài sản..."
                className="w-64 rounded border px-3 py-1 text-sm"
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
              />
              {assetFilter && (
                <button
                  onClick={() => setAssetFilter("")}
                  className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Xoá
                </button>
              )}
            </div>
            <PaginatedTable
              columns={assetColumns}
              data={filteredAssetData}
              pageSize={8}
            />
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold">Danh sách công việc</h2>
            <div className="mb-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm công việc..."
                className="w-64 rounded border px-3 py-1 text-sm"
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
              />
              {taskFilter && (
                <button
                  onClick={() => setTaskFilter("")}
                  className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Xoá
                </button>
              )}
            </div>
            <PaginatedTable
              columns={taskColumns}
              data={filteredTaskData}
              pageSize={8}
            >
              {(task: Task) => <TaskRow task={task} key={task.taskID} />}
            </PaginatedTable>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Thông báo gần nhất</h2>
        <div className="mb-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm thông báo..."
            className="w-64 rounded border px-3 py-1 text-sm"
            value={notificationFilter}
            onChange={(e) => setNotificationFilter(e.target.value)}
          />
          {notificationFilter && (
            <button
              onClick={() => setNotificationFilter("")}
              className="ml-2 text-xs text-gray-400 hover:text-gray-600"
            >
              Xoá
            </button>
          )}
        </div>
        <PaginatedTable
          columns={notificationColumns}
          data={filteredNotificationData}
          pageSize={8}
        />
      </div>
    </div>
  );
};

export default StaffHomePage;
