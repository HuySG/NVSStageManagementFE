"use client";
import React, { useContext } from "react";
import {
  Bell,
  CalendarCheck2,
  ClipboardList,
  Package,
  ClipboardCheck,
  User2,
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

// Hàm chuyển trạng thái tài sản sang tiếng Việt
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

// Hàm kiểm tra task quá hạn
function isTaskOverdue(task: Task) {
  if (!task.endDate) return false;
  const end = new Date(task.endDate).getTime();
  const now = Date.now();
  return end < now && task.status !== Status.Completed;
}

// Table tài sản và thông báo dùng chung
const Table = ({
  columns,
  data,
  getRowClassName,
}: {
  columns: { title: string; key: string }[];
  data: any[];
  getRowClassName?: (row: any) => string;
}) => (
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
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="py-4 text-center text-gray-400"
            >
              Không có dữ liệu
            </td>
          </tr>
        ) : (
          data.map((row, i) => (
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
  </div>
);

// Component dòng task sử dụng RTK Query (Best practice)
const TaskRow = ({ task }: { task: Task }) => {
  const { data: project, isLoading } = useGetProjectByMilestoneIdQuery(
    task.milestoneId,
    { skip: !task.milestoneId },
  );
  const projectTitle = project?.title || "Không xác định";
  const milestoneTitle =
    project?.milestones?.find((m) => m.milestoneID === task.milestoneId)
      ?.title || "Không xác định";
  const overdue = isTaskOverdue(task);
  // Trạng thái tiếng Việt
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
  const staffName = auth?.user?.fullName || auth?.user?.fullName || "Nhân viên";

  // Dữ liệu
  const { data: borrowedAssets = [], isLoading: loadingAssets } =
    useGetStaffBorrowedAssetsQuery(staffId, { skip: !staffId });
  const { data: returnRequests = [], isLoading: loadingRequests } =
    useGetReturnRequestsByStaffIdQuery(staffId, { skip: !staffId });
  const { data: staffTasks = [], isLoading: loadingTasks } =
    useGetTasksByUserQuery(staffId, { skip: !staffId });
  const { data: notifications = [], isLoading: loadingNotifications } =
    useGetNotificationsByUserQuery(staffId, { skip: !staffId });

  // Thống kê task theo status
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

  // Stats khác
  const totalBorrowed = borrowedAssets.length;
  const totalPendingRequests = returnRequests.filter(
    (r: any) => r.status === "PENDING",
  ).length;
  const totalNotifications = notifications.length;

  // Bảng tài sản
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

  // Bảng thông báo
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

  // Biểu đồ cột
  const barData = [
    { name: "Chờ làm", value: todoTasks },
    { name: "Đang làm", value: inProgressTasks },
    { name: "Chờ duyệt", value: underReviewTasks },
    { name: "Hoàn thành", value: completedTasks },
  ];

  // Bảng task (taskColumns cho header, <TaskRow> cho từng dòng)
  const taskColumns = [
    { title: "Tiêu đề", key: "title" },
    { title: "Dự án", key: "project" },
    { title: "Milestone", key: "milestone" },
    { title: "Hạn hoàn thành", key: "endDate" },
    { title: "Trạng thái", key: "status" },
    { title: "Ưu tiên", key: "priority" },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Tiêu đề lớn, avatar + tên */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg">
          <User2 className="text-white" size={38} />
        </div>
        <div>
          <h1 className="mb-1 text-2xl font-extrabold text-gray-900 dark:text-white">
            Xin chào,{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {staffName}
            </span>{" "}
          </h1>
          <p className="text-gray-500 dark:text-gray-300">
            Đây là trang tổng quan nhân viên của bạn
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <ClipboardList className="text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Yêu cầu trả (chờ duyệt)</p>
              <p className="text-lg font-semibold">
                {loadingRequests ? "..." : totalPendingRequests}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <CalendarCheck2 className="text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Lịch booking</p>
              <p className="text-lg font-semibold">0</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <Bell className="text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Thông báo</p>
              <p className="text-lg font-semibold">
                {loadingNotifications ? "..." : totalNotifications}
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
            <Table columns={assetColumns} data={borrowedAssetData} />
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold">Danh sách công việc</h2>
            <div className="overflow-x-auto rounded-xl border bg-white shadow dark:bg-gray-900">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    {taskColumns.map((col) => (
                      <th
                        key={col.title}
                        className="px-4 py-2 text-left font-semibold"
                      >
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffTasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={taskColumns.length}
                        className="py-4 text-center text-gray-400"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    staffTasks.map((task, i) => (
                      <TaskRow task={task} key={task.taskID} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Thông báo gần nhất</h2>
        <Table
          columns={notificationColumns}
          data={notificationData.slice(0, 10)}
        />
      </div>
    </div>
  );
};

export default StaffHomePage;
