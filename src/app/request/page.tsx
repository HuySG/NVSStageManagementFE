"use client";
import { useState } from "react";
import {
  AssetRequest,
  useGetRequestAssetByDepartmentQuery,
  useGetUserInfoQuery,
  useUpdateAssetStatusMutation,
} from "@/state/api";
import { useAppSelector } from "@/app/redux";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import Link from "next/link";
import { ClipboardList, Layers, User, Clock } from "lucide-react";
import { toast } from "react-toastify";

const statusMapping: Record<string, string> = {
  PENDING_LEADER: "Chờ duyệt trưởng bộ phận",
  LEADER_APPROVED: "Trưởng bộ phận đã duyệt, chờ AM",
  LEADER_REJECTED: "Trưởng bộ phận từ chối",
  PENDING_AM: "Chờ AM duyệt",
  AM_APPROVED: "AM đã duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã huỷ",
};

const LeaderAssetApproval = () => {
  const { data: user } = useGetUserInfoQuery();
  const departmentId = user?.department?.id ?? "";
  const {
    data: requests = [],
    isLoading,
    error,
  } = useGetRequestAssetByDepartmentQuery(departmentId);
  const [updateRequestStatus] = useUpdateAssetStatusMutation();
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  if (isLoading)
    return <div className="py-4 text-center">Đang tải dữ liệu...</div>;
  if (error)
    return (
      <div className="py-4 text-center text-red-500">
        Có lỗi khi tải yêu cầu mượn tài sản!
      </div>
    );
  if (user?.role?.roleName === "Staff") {
    return (
      <div className="py-10 text-center text-xl font-semibold text-red-500">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const handleApprove = async (requestId: string) => {
    setLoadingRequestId(requestId);
    try {
      await updateRequestStatus({
        requestId,
        status: "PENDING_AM",
        approverId: user?.id!,
      });
      toast.success("Duyệt yêu cầu thành công!");
    } catch {
      toast.error("Không thể duyệt yêu cầu.");
    }
    setLoadingRequestId(null);
  };

  const handleReject = async (requestId: string) => {
    setLoadingRequestId(requestId);
    try {
      await updateRequestStatus({
        requestId,
        status: "REJECTED",
        approverId: user?.id!,
      });
      toast.error("Yêu cầu đã bị từ chối!");
    } catch {
      toast.error("Không thể từ chối yêu cầu.");
    }
    setLoadingRequestId(null);
  };

  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING_LEADER",
  );
  const requestsGroupedByProject = pendingRequests.reduce<
    Record<string, AssetRequest[]>
  >((acc, req) => {
    const projectId = req.projectInfo.projectID;
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(req);
    return acc;
  }, {});

  return (
    <div
      className={`min-h-[90vh] w-full px-0 py-0 transition-colors duration-200 md:px-8 md:py-6 lg:px-14 ${
        isDarkMode ? "bg-[#171923] text-white" : "bg-gray-50 text-black"
      }`}
    >
      {/* HEADER */}
      <div
        className={`mb-8 flex flex-col items-start gap-2 rounded-xl border-b-2 border-blue-300/40 bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 px-6 py-6 shadow-sm backdrop-blur-md dark:border-blue-800/30 dark:from-[#1a233b] dark:via-[#232946] dark:to-[#1a233b] md:px-10`}
      >
        <div className="flex items-center gap-3">
          <ClipboardList
            size={38}
            className="text-blue-600 drop-shadow-md dark:text-blue-300"
            strokeWidth={2.2}
          />
          <span className="text-3xl font-extrabold tracking-tight text-blue-900 dark:text-blue-200">
            Duyệt Yêu Cầu Mượn Tài Sản
          </span>
        </div>
        <div className="mt-1 text-base font-medium tracking-wide text-blue-700 dark:text-blue-300/90">
          Quản lý & phê duyệt các yêu cầu mượn tài sản thuộc dự án của bộ phận
          bạn.
        </div>
      </div>

      {/* NỘI DUNG */}
      <div className="w-full max-w-full">
        {Object.keys(requestsGroupedByProject).length === 0 ? (
          <div className="mt-12 text-center text-base text-gray-500">
            Không có yêu cầu nào cần duyệt.
          </div>
        ) : (
          Object.entries(requestsGroupedByProject).map(
            ([projectId, projectRequests]) => {
              const project = projectRequests[0].projectInfo;
              const assetBased = projectRequests.filter(
                (r) => r.asset !== null,
              );
              const categoryBased = projectRequests.filter(
                (r) => r.asset === null,
              );

              return (
                <div
                  key={projectId}
                  className="mb-10 w-full rounded-xl border border-blue-200 bg-white p-0 shadow-md dark:border-blue-800 dark:bg-[#232946]"
                >
                  {/* Project Header */}
                  <div className="flex items-center gap-2 px-6 pb-1 pt-5">
                    <Layers size={20} className="text-blue-500" />
                    <h2 className="text-xl font-semibold">
                      Dự án: {project.title}
                    </h2>
                  </div>
                  <div className="px-6 pb-2 text-sm text-gray-500">
                    <Clock size={16} className="mr-1 inline-block" />
                    {new Date(project.startTime).toLocaleDateString()} -{" "}
                    {new Date(project.endTime).toLocaleDateString()}
                  </div>

                  {assetBased.length > 0 && (
                    <div className="mb-6 px-0 md:px-6">
                      <h3 className="mb-2 text-lg font-medium text-blue-600">
                        Yêu cầu theo tài sản cụ thể
                      </h3>
                      <div className="overflow-x-auto rounded-lg shadow">
                        <table className="w-full border-collapse bg-white text-sm dark:bg-[#232946]">
                          <thead className="bg-blue-100 dark:bg-[#232946]">
                            <tr>
                              <th className="border px-3 py-2 font-semibold">
                                Mô tả
                              </th>
                              <th className="border px-3 py-2 font-semibold">
                                Tài sản
                              </th>
                              <th className="border px-3 py-2 font-semibold">
                                Thời gian
                              </th>
                              <th className="border px-3 py-2 font-semibold">
                                Người yêu cầu
                              </th>
                              <th className="border px-3 py-2 font-semibold">
                                Tác vụ
                              </th>
                              <th className="border px-3 py-2 font-semibold">
                                Thao tác
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {assetBased.map((req) => (
                              <tr
                                key={req.requestId}
                                className="transition hover:bg-blue-50 dark:hover:bg-gray-800"
                              >
                                <td className="border px-3 py-2">
                                  {req.description}
                                </td>
                                <td className="border px-3 py-2">
                                  <Tooltip title={req.asset?.assetName || ""}>
                                    <span>{req.asset?.assetName}</span>
                                  </Tooltip>
                                </td>
                                <td className="border px-3 py-2">
                                  <span className="block">
                                    Từ:{" "}
                                    {new Date(req.startTime).toLocaleString(
                                      "vi-VN",
                                    )}
                                  </span>
                                  <span className="block">
                                    Đến:{" "}
                                    {new Date(req.endTime).toLocaleString(
                                      "vi-VN",
                                    )}
                                  </span>
                                </td>
                                <td className="border px-3 py-2">
                                  <User
                                    className="mr-1 inline-block"
                                    size={16}
                                  />
                                  {req.requesterInfo?.fullName}
                                </td>
                                <td className="border px-3 py-2">
                                  {req.task ? (
                                    <Link
                                      className="text-blue-600 hover:underline"
                                      href={`/Projects/${project.projectID}/milestones/${req.task.milestoneId}?taskId=${req.task.taskID}`}
                                    >
                                      {req.task.title}
                                    </Link>
                                  ) : (
                                    "Không có tác vụ"
                                  )}
                                </td>
                                <td className="space-x-2 border px-3 py-2">
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="success"
                                    className="rounded-md"
                                    disabled={
                                      loadingRequestId === req.requestId
                                    }
                                    onClick={() => handleApprove(req.requestId)}
                                  >
                                    {loadingRequestId === req.requestId ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      "Duyệt"
                                    )}
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    className="rounded-md"
                                    disabled={
                                      loadingRequestId === req.requestId
                                    }
                                    onClick={() => handleReject(req.requestId)}
                                  >
                                    Từ chối
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {categoryBased.length > 0 && (
                    <div className="px-0 pb-6 md:px-6">
                      <h3 className="mb-2 text-lg font-medium text-green-700">
                        Yêu cầu theo danh mục
                      </h3>
                      <div className="overflow-x-auto rounded-lg shadow">
                        <table className="w-full border-collapse bg-white text-sm dark:bg-[#232946]">
                          <thead className="bg-green-100 dark:bg-[#232946]">
                            <tr>
                              <th className="border px-3 py-2 font-semibold">
                                Mô tả
                              </th>
                              <th className="border px-3 py-2 font-semibold">
                                Danh mục
                              </th>
                              <th className="border px-3 py-2 font-semibold">
                                Thời gian
                              </th>
                              <th className="border px-3 py-2 font-semibold">
                                Người yêu cầu
                              </th>
                              <th className="border px-3 py-2 font-semibold">
                                Tác vụ
                              </th>
                              <th className="border px-3 py-2 font-semibold">
                                Thao tác
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryBased.map((req) => (
                              <tr
                                key={req.requestId}
                                className="transition hover:bg-green-50 dark:hover:bg-gray-800"
                              >
                                <td className="border px-3 py-2">
                                  {req.description}
                                </td>
                                <td className="border px-3 py-2">
                                  {req.categories?.length! > 0 ? (
                                    <ul className="list-disc pl-4">
                                      {req.categories?.map((cat) => (
                                        <li key={cat.categoryID}>
                                          {cat.name} - {cat.quantity}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    "Không có danh mục"
                                  )}
                                </td>
                                <td className="border px-3 py-2">
                                  <span className="block">
                                    Từ:{" "}
                                    {new Date(req.startTime).toLocaleString(
                                      "vi-VN",
                                    )}
                                  </span>
                                  <span className="block">
                                    Đến:{" "}
                                    {new Date(req.endTime).toLocaleString(
                                      "vi-VN",
                                    )}
                                  </span>
                                </td>
                                <td className="border px-3 py-2">
                                  <User
                                    className="mr-1 inline-block"
                                    size={16}
                                  />
                                  {req.requesterInfo?.fullName}
                                </td>
                                <td className="border px-3 py-2">
                                  {req.task ? (
                                    <Link
                                      className="text-blue-600 hover:underline"
                                      href={`/Projects/${project.projectID}/milestones/${req.task.milestoneId}?taskId=${req.task.taskID}`}
                                    >
                                      {req.task.title}
                                    </Link>
                                  ) : (
                                    "Không có tác vụ"
                                  )}
                                </td>
                                <td className="space-x-2 border px-3 py-2">
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="success"
                                    className="rounded-md"
                                    disabled={
                                      loadingRequestId === req.requestId
                                    }
                                    onClick={() => handleApprove(req.requestId)}
                                  >
                                    {loadingRequestId === req.requestId ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      "Duyệt"
                                    )}
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    className="rounded-md"
                                    disabled={
                                      loadingRequestId === req.requestId
                                    }
                                    onClick={() => handleReject(req.requestId)}
                                  >
                                    Từ chối
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            },
          )
        )}
      </div>
    </div>
  );
};

export default LeaderAssetApproval;
