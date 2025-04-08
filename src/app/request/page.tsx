"use client";
import { useState } from "react";
import {
  AssetRequest,
  useGetRequestAssetByDepartmentQuery,
  useGetUserInfoQuery,
  useUpdateAssetStatusMutation,
} from "@/state/api";
import { useAppSelector } from "@/app/redux";
import {
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { toast } from "react-toastify";
import Link from "next/link";
import { MoreVerticalIcon } from "lucide-react";

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
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(
    null,
  );
  const [anchorEl, setAnchorEl] = useState<{
    [key: string]: HTMLElement | null;
  }>({});
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  if (isLoading) return <div className="py-4 text-center">Loading...</div>;
  if (error)
    return (
      <div className="py-4 text-center text-red-500">
        Error loading asset requests
      </div>
    );
  // 🚫 Chặn Staff không vào được trang
  if (user?.role?.roleName === "Staff") {
    return (
      <div className="py-10 text-center text-xl font-semibold text-red-500">
        You are not authorized to access this page.
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
      toast.success("Request Approved Successfully!");
    } catch (error) {
      toast.error("Failed to approve request.");
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
      toast.error("Request Rejected!");
    } catch (error) {
      toast.error("Failed to reject request.");
    }
    setLoadingRequestId(null);
  };

  const statusMapping: Record<string, string> = {
    PENDING_LEADER: "Pending Leader Approval",
    LEADER_APPROVED: "Leader Approved, Pending AM",
    LEADER_REJECTED: "Leader Rejected",
    PENDING_AM: "Pending Asset Manager Approval",
    AM_APPROVED: "Asset Manager Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };
  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING_LEADER",
  );
  // 🧠 Group theo projectID
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
      className={`container mx-auto p-6 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <h1 className="mb-6 text-center text-3xl font-bold">
        Pending Asset Requests (Leader)
      </h1>

      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">Error loading requests</div>
      ) : Object.keys(requestsGroupedByProject).length === 0 ? (
        <div className="text-center text-gray-500">No pending requests.</div>
      ) : (
        Object.entries(requestsGroupedByProject).map(
          ([projectId, projectRequests]) => {
            const project = projectRequests[0].projectInfo;
            const assetBased = projectRequests.filter((r) => r.asset !== null);
            const categoryBased = projectRequests.filter(
              (r) => r.asset === null,
            );

            return (
              <div
                key={projectId}
                className="mb-8 rounded-lg border p-4 shadow-md"
              >
                <h2 className="mb-2 text-xl font-semibold">
                  Project: {project.title}
                </h2>

                {assetBased.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-lg font-medium text-blue-600">
                      Asset-based Requests
                    </h3>
                    <table className="mb-4 w-full border-collapse text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="border px-3 py-2">Description</th>
                          <th className="border px-3 py-2">Asset</th>
                          <th className="border px-3 py-2">Time Period</th>
                          <th className="border px-3 py-2">Requester</th>
                          <th className="border px-3 py-2">Task</th>
                          <th className="border px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetBased.map((req) => (
                          <tr
                            key={req.requestId}
                            className="hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <td className="border px-3 py-2">
                              {req.description}
                            </td>
                            <td className="border px-3 py-2">
                              {req.asset?.assetName}
                            </td>
                            <td className="border px-3 py-2">
                              <p>
                                Start:{" "}
                                {new Date(req.startTime).toLocaleDateString()}
                              </p>
                              <p>
                                End:{" "}
                                {new Date(req.endTime).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="border px-3 py-2">
                              {req.requesterInfo?.fullName}
                            </td>
                            <td className="border px-3 py-2">
                              {req.task ? (
                                <Link
                                  className="text-blue-500 hover:underline"
                                  href={`/Projects/${project.projectID}/milestones/${req.task.milestoneId}?taskId=${req.task.taskID}`}
                                >
                                  {req.task.title}
                                </Link>
                              ) : (
                                "No Task"
                              )}
                            </td>
                            <td className="space-x-2 border px-3 py-2">
                              <Button
                                variant="outlined"
                                size="small"
                                color="success"
                                disabled={loadingRequestId === req.requestId}
                                onClick={() => handleApprove(req.requestId)}
                              >
                                {loadingRequestId === req.requestId ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  "Approve"
                                )}
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                disabled={loadingRequestId === req.requestId}
                                onClick={() => handleReject(req.requestId)}
                              >
                                Reject
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {categoryBased.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-lg font-medium text-green-600">
                      Category-based Requests
                    </h3>
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="border px-3 py-2">Description</th>
                          <th className="border px-3 py-2">Time Period</th>
                          <th className="border px-3 py-2">Requester</th>
                          <th className="border px-3 py-2">Task</th>
                          <th className="border px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryBased.map((req) => (
                          <tr
                            key={req.requestId}
                            className="hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <td className="border px-3 py-2">
                              {req.description}
                            </td>
                            <td className="border px-3 py-2">
                              <p>
                                Start:{" "}
                                {new Date(req.startTime).toLocaleDateString()}
                              </p>
                              <p>
                                End:{" "}
                                {new Date(req.endTime).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="border px-3 py-2">
                              {req.requesterInfo?.fullName}
                            </td>
                            <td className="border px-3 py-2">
                              {req.task ? (
                                <Link
                                  className="text-blue-500 hover:underline"
                                  href={`/Projects/${project.projectID}/milestones/${req.task.milestoneId}?taskId=${req.task.taskID}`}
                                >
                                  {req.task.title}
                                </Link>
                              ) : (
                                "No Task"
                              )}
                            </td>
                            <td className="space-x-2 border px-3 py-2">
                              <Button
                                variant="outlined"
                                size="small"
                                color="success"
                                disabled={loadingRequestId === req.requestId}
                                onClick={() => handleApprove(req.requestId)}
                              >
                                {loadingRequestId === req.requestId ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  "Approve"
                                )}
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                disabled={loadingRequestId === req.requestId}
                                onClick={() => handleReject(req.requestId)}
                              >
                                Reject
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          },
        )
      )}
    </div>
  );
};

export default LeaderAssetApproval;
