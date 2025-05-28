import {
  useGetUserInfoQuery,
  useGetNotificationsByUserQuery,
} from "@/state/api";
import {
  Bell,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  Undo2,
  PackageCheck,
  PackageX,
  PackageSearch,
} from "lucide-react";
import { useState, useRef, useEffect, JSX } from "react";

const ICONS: Record<string, JSX.Element> = {
  OVERDUE: <AlertCircle className="h-5 w-5 text-red-500" />,
  AUTO_CANCELLED: <XCircle className="h-5 w-5 text-red-400" />,
  INFO: <Info className="h-5 w-5 text-blue-500" />,
  WARNING: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  SYSTEM: <Info className="h-5 w-5 text-gray-500" />,
  ASSET_OVERDUE: <AlertCircle className="h-5 w-5 text-orange-500" />,
  TASK_ASSIGNED: <UserCheck className="h-5 w-5 text-blue-500" />,
  REQUEST_REJECTED: <XCircle className="h-5 w-5 text-red-400" />,
  RETURN_REQUEST: <Undo2 className="h-5 w-5 text-indigo-500" />,
  RETURN_APPROVED: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  RETURN_REJECTED: <XCircle className="h-5 w-5 text-red-400" />,
  ALLOCATION_REQUEST: <PackageSearch className="h-5 w-5 text-indigo-500" />,
  ALLOCATION_APPROVED: <PackageCheck className="h-5 w-5 text-green-500" />,
  ALLOCATION_REJECTED: <PackageX className="h-5 w-5 text-red-400" />,
  ALLOCATION_CANCELLED: <XCircle className="h-5 w-5 text-gray-400" />,
  ALLOCATION_COMPLETED: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  ALLOCATION_FAILED: <XCircle className="h-5 w-5 text-red-400" />,
  ALLOCATION_PREPARING: <PackageSearch className="h-5 w-5 text-yellow-500" />,
  ALLOCATION_READY_TO_DELIVER: (
    <PackageCheck className="h-5 w-5 text-teal-500" />
  ),
};

const COLOR: Record<string, string> = {
  OVERDUE: "bg-red-100 text-red-700",
  AUTO_CANCELLED: "bg-red-100 text-red-700",
  INFO: "bg-blue-100 text-blue-700",
  WARNING: "bg-yellow-100 text-yellow-800",
  SYSTEM: "bg-gray-100 text-gray-800",
  ASSET_OVERDUE: "bg-orange-100 text-orange-700",
  TASK_ASSIGNED: "bg-blue-100 text-blue-700",
  REQUEST_REJECTED: "bg-red-100 text-red-700",
  RETURN_REQUEST: "bg-indigo-100 text-indigo-700",
  RETURN_APPROVED: "bg-green-100 text-green-700",
  RETURN_REJECTED: "bg-red-100 text-red-700",
  ALLOCATION_REQUEST: "bg-indigo-100 text-indigo-700",
  ALLOCATION_APPROVED: "bg-green-100 text-green-700",
  ALLOCATION_REJECTED: "bg-red-100 text-red-700",
  ALLOCATION_CANCELLED: "bg-gray-100 text-gray-700",
  ALLOCATION_COMPLETED: "bg-green-100 text-green-700",
  ALLOCATION_FAILED: "bg-red-100 text-red-700",
  ALLOCATION_PREPARING: "bg-yellow-100 text-yellow-800",
  ALLOCATION_READY_TO_DELIVER: "bg-teal-100 text-teal-700",
};

const LABEL: Record<string, string> = {
  OVERDUE: "Quá hạn",
  AUTO_CANCELLED: "Tự động hủy",
  INFO: "Thông tin",
  WARNING: "Cảnh báo",
  SYSTEM: "Hệ thống",
  ASSET_OVERDUE: "Tài sản quá hạn",
  TASK_ASSIGNED: "Được giao việc",
  REQUEST_REJECTED: "Từ chối yêu cầu",
  RETURN_REQUEST: "Yêu cầu hoàn trả",
  RETURN_APPROVED: "Duyệt hoàn trả",
  RETURN_REJECTED: "Từ chối hoàn trả",
  ALLOCATION_REQUEST: "Yêu cầu cấp phát",
  ALLOCATION_APPROVED: "Duyệt cấp phát",
  ALLOCATION_REJECTED: "Từ chối cấp phát",
  ALLOCATION_CANCELLED: "Hủy cấp phát",
  ALLOCATION_COMPLETED: "Đã hoàn thành",
  ALLOCATION_FAILED: "Cấp phát lỗi",
  ALLOCATION_PREPARING: "Đang chuẩn bị",
  ALLOCATION_READY_TO_DELIVER: "Sẵn sàng giao",
};

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setShowMore(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const { data: currentUser } = useGetUserInfoQuery();
  const userId = currentUser?.id ?? "";
  const { data: notifications, isLoading } = useGetNotificationsByUserQuery(
    userId,
    {
      skip: !userId,
    },
  );

  // Sắp xếp notification mới nhất lên đầu
  const sortedNotifications = (notifications ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createDate).getTime() - new Date(a.createDate).getTime(),
    );

  const DISPLAY_LIMIT = 5;
  const notificationsToShow = showMore
    ? sortedNotifications
    : sortedNotifications.slice(0, DISPLAY_LIMIT);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Thông báo"
      >
        <Bell className="h-6 w-6 text-gray-600 dark:text-white" />
        {notifications && notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div className="animate-fade-in absolute right-0 z-50 mt-3 w-[350px] max-w-sm overflow-hidden rounded-2xl border bg-white shadow-2xl ring-1 ring-black/5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-800">
            <span className="text-base font-semibold text-gray-800 dark:text-white">
              Thông báo
            </span>
            {notifications && notifications.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                {notifications.length} mới
              </span>
            )}
          </div>
          <div className="custom-scrollbar max-h-[370px] overflow-y-auto bg-white dark:bg-neutral-900">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-300">
                Đang tải...
              </div>
            ) : notificationsToShow.length > 0 ? (
              <>
                {notificationsToShow.map((noti) => {
                  const type = noti.type;
                  return (
                    <div
                      key={noti.notificationID}
                      className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 transition last:border-b-0 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${COLOR[type] || "bg-gray-100 text-gray-700"}`}
                      >
                        {ICONS[type] || (
                          <Info className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wide ${COLOR[type] || "bg-gray-100 text-gray-700"} rounded px-2 py-0.5`}
                          >
                            {LABEL[type] || "Thông báo"}
                          </span>
                          <span className="text-[12px] text-gray-400 dark:text-gray-500">
                            {new Date(noti.createDate).toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div className="text-[13px] text-gray-900 dark:text-white">
                          {noti.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sortedNotifications.length > DISPLAY_LIMIT && (
                  <div className="py-2 text-center">
                    <button
                      className="rounded-full bg-blue-100 px-4 py-1 text-xs text-blue-700 transition hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
                      onClick={() => setShowMore((v) => !v)}
                    >
                      {showMore ? "Ẩn bớt" : "Xem thêm"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-300">
                Không có thông báo mới.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
