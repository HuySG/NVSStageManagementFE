"use client";
import { useParams } from "next/navigation";
import {
  useGetRequestAssetByDepartmentQuery,
  useGetUserInfoQuery,
  useGetProjectDetailsQuery,
  useGetAssetRequestsForManagerQuery,
} from "@/state/api";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ClipboardList,
  User,
  Layers,
  ListChecks,
  CalendarDays,
  Package,
  Clock4,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import React, { useMemo } from "react";

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
  PREPARED: {
    label: "Đã chuẩn bị",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  },
};

export default function RequestDetailPage() {
  const { projectId, milestoneId, requestId } = useParams() as {
    projectId: string;
    milestoneId: string;
    requestId: string;
  };
  const { data: user } = useGetUserInfoQuery();
  const departmentId = user?.department?.id ?? "";
  const { data: requests = [], isLoading } =
    useGetRequestAssetByDepartmentQuery(departmentId);
  const { data: projectDetails } = useGetProjectDetailsQuery(projectId);

  // Thêm: Lấy danh sách request cho asset-manager để lấy info duyệt
  const { data: managerRequests = [], isLoading: loadingManager } =
    useGetAssetRequestsForManagerQuery();

  // Map nhanh requestId => approval
  const approvalMap = useMemo(() => {
    const map = new Map<string, any>();
    managerRequests.forEach((req) => map.set(req.requestId, req));
    return map;
  }, [managerRequests]);
  const approval = approvalMap.get(requestId);

  const request = useMemo(
    () => requests.find((r) => r.requestId === requestId),
    [requests, requestId],
  );

  const milestone = projectDetails?.milestones?.find(
    (m) => m.milestoneID === milestoneId,
  );
  const milestoneTitle = milestone?.title || milestoneId;
  const projectTitle = projectDetails?.title ?? projectId;

  if (isLoading || loadingManager) {
    return (
      <div className="py-32 text-center text-lg text-gray-400">Đang tải...</div>
    );
  }
  if (!request) {
    return (
      <div className="py-32 text-center text-lg text-red-500">
        Không tìm thấy yêu cầu!
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-gray-900">
      {/* Breadcrumb */}
      <div className="px-10 pb-2 pt-8">
        <Breadcrumb
          items={[
            { label: "Dự án", href: "/myRequests" },
            {
              label: projectTitle,
              href: `/myRequests/${projectId}/milestones`,
            },
            {
              label: milestoneTitle,
              href: `/myRequests/${projectId}/milestones/${milestoneId}/requests`,
            },
            { label: "Chi tiết yêu cầu" },
          ]}
        />
      </div>

      {/* Header */}
      <section className="px-10">
        <div className="mb-8 flex flex-col gap-6 rounded-2xl bg-white/95 p-8 shadow-lg dark:bg-slate-900/90 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <ClipboardList className="h-11 w-11 shrink-0 text-indigo-600 dark:text-indigo-300" />
            <div className="min-w-0">
              <h1 className="mb-2 truncate text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">
                {request.asset?.assetName ||
                  (request.categories?.length
                    ? request.categories.map((c) => c.name).join(", ")
                    : "Yêu cầu tài sản")}
              </h1>
              <div className="flex flex-wrap gap-6 text-[15px] font-medium text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-2">
                  <Layers className="h-5 w-5 opacity-70" />
                  {projectTitle}
                </span>
                <span className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 opacity-70" />
                  {milestoneTitle}
                </span>
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 opacity-70" />
                  {new Date(request.startTime).toLocaleString(
                    "vi-VN",
                  )} &rarr; {new Date(request.endTime).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
          <span
            className={`whitespace-nowrap rounded-2xl px-5 py-2 text-base font-bold shadow-md ${statusMap[request.status]?.color ?? "bg-gray-100 text-gray-700"}`}
          >
            {statusMap[request.status]?.label ?? request.status}
          </span>
        </div>
      </section>

      {/* Main content with 2 columns */}
      <main className="px-10 pb-16">
        <div className="flex flex-col gap-10 lg:flex-row">
          {/* LEFT: Thông tin tài sản, mô tả, chi tiết, thông tin duyệt */}
          <div className="min-w-[350px] flex-1">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-200">
                <ClipboardList className="h-6 w-6" /> Thông tin tài sản
              </h2>
              <div className="mb-8 grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
                <InfoRow
                  label="Tài sản/Loại"
                  icon={<Package className="h-5 w-5 text-violet-400" />}
                  value={
                    request.asset ? (
                      <span className="font-semibold">
                        {request.asset.assetName}
                      </span>
                    ) : request.categories && request.categories.length > 0 ? (
                      <ul className="list-disc pl-5 text-base text-gray-700 dark:text-gray-300">
                        {request.categories.map((cat) => (
                          <li key={cat.categoryID}>
                            {cat.name} (x{cat.quantity})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="italic text-gray-400">Không có</span>
                    )
                  }
                />
                <InfoRow
                  label="Thời gian mượn"
                  icon={<Clock4 className="h-5 w-5 text-amber-400" />}
                  value={
                    <span>
                      {new Date(request.startTime).toLocaleString("vi-VN")}
                      <span className="mx-2 text-gray-400">→</span>
                      {new Date(request.endTime).toLocaleString("vi-VN")}
                    </span>
                  }
                />
                {request.recurrenceType &&
                  request.recurrenceType !== "NONE" && (
                    <InfoRow
                      label="Lặp"
                      icon={<Clock4 className="h-5 w-5 text-orange-400" />}
                      value={
                        <span>
                          {request.recurrenceType === "DAILY" && "Hằng ngày"}
                          {request.recurrenceType === "WEEKLY" && "Hằng tuần"}
                          {request.recurrenceType === "MONTHLY" && "Hằng tháng"}
                          {request.recurrenceEndDate && (
                            <>
                              {" đến "}
                              {new Date(
                                request.recurrenceEndDate,
                              ).toLocaleDateString("vi-VN")}
                            </>
                          )}
                        </span>
                      }
                    />
                  )}
                <InfoRow
                  label="Task liên quan"
                  icon={<ClipboardList className="h-5 w-5 text-emerald-400" />}
                  value={
                    request.task?.title || (
                      <span className="italic text-gray-400">Không có</span>
                    )
                  }
                />
                <InfoRow
                  label="Trạng thái"
                  icon={<ListChecks className="h-5 w-5 text-lime-400" />}
                  value={
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusMap[request.status]?.color ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {statusMap[request.status]?.label ?? request.status}
                    </span>
                  }
                />
              </div>
            </section>

            {/* Thông tin duyệt */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-200">
                <UserCheck className="h-6 w-6" /> Lịch sử duyệt yêu cầu
              </h2>
              <div className="mb-8 grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
                <InfoRow
                  label="Leader duyệt"
                  icon={<UserCheck className="h-5 w-5 text-blue-400" />}
                  value={
                    approval?.approvedByDLName ? (
                      <div>
                        <div className="font-semibold">
                          <CheckCircle className="mr-1 inline text-green-500" />
                          {approval.approvedByDLName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {approval.approvedByDLTime &&
                            new Date(approval.approvedByDLTime).toLocaleString(
                              "vi-VN",
                            )}
                        </div>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 italic text-gray-400">
                        <XCircle className="inline text-gray-400" />
                        Chưa duyệt
                      </span>
                    )
                  }
                />
                <InfoRow
                  label="AM duyệt"
                  icon={<UserCheck className="h-5 w-5 text-purple-400" />}
                  value={
                    approval?.approvedByAMName ? (
                      <div>
                        <div className="font-semibold">
                          <CheckCircle className="mr-1 inline text-green-500" />
                          {approval.approvedByAMName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {approval.approvedByAMTime &&
                            new Date(approval.approvedByAMTime).toLocaleString(
                              "vi-VN",
                            )}
                        </div>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 italic text-gray-400">
                        <XCircle className="inline text-gray-400" />
                        Chưa duyệt
                      </span>
                    )
                  }
                />
              </div>
            </section>

            {/* Mô tả */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-200">
                <ClipboardList className="h-6 w-6" /> Mô tả chi tiết
              </h2>
              <div className="rounded-xl border border-gray-100 bg-white px-7 py-6 text-[17px] text-gray-800 shadow dark:border-gray-800 dark:bg-slate-900 dark:text-gray-200">
                {request.description || (
                  <span className="italic text-gray-400">Không có mô tả</span>
                )}
              </div>
            </section>
          </div>
          {/* RIGHT: Card người yêu cầu */}
          <div className="w-full flex-shrink-0 lg:w-[400px]">
            <div className="flex flex-col gap-6 rounded-2xl border border-gray-100 bg-white px-8 py-7 shadow-lg dark:border-gray-800 dark:bg-slate-900">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-blue-700 dark:text-blue-200">
                <User className="h-6 w-6" /> Người yêu cầu
              </h3>
              <UserInfo
                label="Họ tên"
                value={request.requesterInfo?.fullName}
              />
              <UserInfo
                label="Email"
                value={
                  request.requesterInfo?.email || (
                    <span className="italic text-gray-400">Không có</span>
                  )
                }
              />
              <UserInfo
                label="Bộ phận"
                value={
                  request.requesterInfo?.department?.name || (
                    <span className="italic text-gray-400">Không có</span>
                  )
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  label,
  icon,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="pt-1">{icon}</div>
      <div>
        <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <div className="text-[16px] font-normal text-gray-900 dark:text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

function UserInfo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="text-base font-semibold text-gray-800 dark:text-gray-100">
        {value}
      </div>
    </div>
  );
}
