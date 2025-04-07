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

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    requestId: string,
  ) => {
    setAnchorEl((prev) => ({ ...prev, [requestId]: event.currentTarget }));
  };

  const handleCloseMenu = (requestId: string) => {
    setAnchorEl((prev) => ({ ...prev, [requestId]: null }));
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

  return (
    <div
      className={`container mx-auto p-6 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
    >
      <h1 className="mb-6 text-center text-3xl font-bold">
        Asset Request List
      </h1>
      {pendingRequests.length === 0 ? (
        <div className="text-center text-gray-500">
          No pending asset requests available
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="w-full border-collapse bg-white text-sm shadow-md dark:bg-gray-800">
            <thead>
              <tr className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                <th className="border px-4 py-3 text-left">Description</th>
                <th className="border px-4 py-3 text-left">Status</th>
                <th className="border px-4 py-3 text-left">Creation Date</th>
                <th className="border px-4 py-3 text-left">Time Period</th>
                <th className="border px-4 py-3 text-left">Task</th>
                <th className="border px-4 py-3 text-left">Requester</th>
                <th className="border px-4 py-3 text-left">Asset</th>
                <th className="border px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((request) => (
                <tr
                  key={request.requestId}
                  className="border hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <td className="border px-4 py-3">{request.description}</td>

                  <td
                    className={`borde bg-opacity-70 px-4 py-3 text-black ${
                      request.status === "PENDING_LEADER"
                        ? "bg-yellow-500"
                        : request.status === "LEADER_APPROVED"
                          ? "bg-blue-500"
                          : request.status === "AM_APPROVED"
                            ? "bg-green-500"
                            : "bg-red-500"
                    }`}
                  >
                    {statusMapping[request.status]}
                  </td>

                  <td className="border px-4 py-3">
                    {new Date(request.startTime).toLocaleDateString()}
                  </td>
                  <td className="border px-4 py-3">
                    <p>
                      <strong>Start:</strong>{" "}
                      {new Date(request.startTime).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>End:</strong>{" "}
                      {new Date(request.endTime).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="border px-4 py-3">
                    {request.task ? (
                      <Link
                        href={`/Projects/${request.projectInfo.projectID}/milestones/${request.task.milestoneId}?taskId=${request.task.taskID}`}
                        className="text-blue-500 hover:underline"
                      >
                        {request.task.title}
                      </Link>
                    ) : (
                      "No Task"
                    )}
                  </td>
                  <td className="border px-4 py-3">
                    {request.requesterInfo?.fullName ?? "No requester info"}
                  </td>
                  <td className="border px-4 py-3">
                    {request.asset?.assetName ?? "No Asset"}
                  </td>
                  <td className="flex items-center gap-2 px-4 py-6">
                    <IconButton
                      onClick={(event) =>
                        handleOpenMenu(event, request.requestId)
                      }
                    >
                      <MoreVerticalIcon />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl[request.requestId]}
                      open={Boolean(anchorEl[request.requestId])}
                      onClose={() => handleCloseMenu(request.requestId)}
                    >
                      <MenuItem
                        onClick={() => handleApprove(request.requestId)}
                        disabled={loadingRequestId === request.requestId}
                      >
                        Approve
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleReject(request.requestId)}
                        disabled={loadingRequestId === request.requestId}
                      >
                        Reject
                      </MenuItem>
                    </Menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaderAssetApproval;
