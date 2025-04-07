"use client";
import { useState } from "react";
import {
  AssetRequest,
  useGetRequestAssetByDepartmentQuery,
  useGetUserInfoQuery,
} from "@/state/api";
import { useAppSelector } from "@/app/redux";
import Link from "next/link";

const ApprovedAssetRequests = () => {
  const { data: user } = useGetUserInfoQuery();
  const departmentId = user?.department?.id ?? "";
  const {
    data: requests = [],
    isLoading,
    error,
  } = useGetRequestAssetByDepartmentQuery(departmentId);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const statusMapping: Record<string, string> = {
    PENDING_LEADER: "Pending Leader Approval",
    LEADER_APPROVED: "Leader Approved, Pending AM",
    LEADER_REJECTED: "Leader Rejected",
    PENDING_AM: "Pending Asset Manager Approval",
    AM_APPROVED: "Asset Manager Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  const approvedRequests = requests.filter(
    (request) => request.status === "PENDING_AM",
  );

  if (isLoading) return <div className="py-4 text-center">Loading...</div>;
  if (error)
    return (
      <div className="py-4 text-center text-red-500">
        Error loading asset requests
      </div>
    );

  return (
    <div
      className={`container mx-auto p-6 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <h1 className="mb-6 text-center text-3xl font-bold">
        Approved Asset Requests
      </h1>
      {approvedRequests.length === 0 ? (
        <div className="text-center text-gray-500">
          No approved asset requests.
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
              </tr>
            </thead>
            <tbody>
              {approvedRequests.map((request) => (
                <tr
                  key={request.requestId}
                  className="border hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <td className="border px-4 py-3">{request.description}</td>
                  <td className="border bg-blue-500 bg-opacity-70 px-4 py-3 text-black">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApprovedAssetRequests;
