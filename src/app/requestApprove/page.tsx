"use client";

import {
  useGetUserInfoQuery,
  useGetRequestAssetByDepartmentQuery,
  AssetRequest,
} from "@/state/api";
import { useAppSelector } from "@/app/redux";
import { useMemo } from "react";

const statusMapping: Record<string, string> = {
  PENDING_LEADER: "Pending Leader Approval",
  LEADER_APPROVED: "Leader Approved, Pending AM",
  LEADER_REJECTED: "Leader Rejected",
  PENDING_AM: "Pending Asset Manager Approval",
  AM_APPROVED: "Asset Manager Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const ViewAssetRequestStatus = () => {
  const { data: user } = useGetUserInfoQuery();
  const departmentId = user?.department?.id ?? "";
  const {
    data: requests = [],
    isLoading,
    error,
  } = useGetRequestAssetByDepartmentQuery(departmentId);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const groupedByProject = useMemo(() => {
    const grouped: Record<
      string,
      {
        projectTitle: string;
        assetBased: AssetRequest[];
        categoryBased: AssetRequest[];
      }
    > = {};

    requests.forEach((request) => {
      const projectId = request.projectInfo.projectID;
      const projectTitle = request.projectInfo.title;
      if (!grouped[projectId]) {
        grouped[projectId] = {
          projectTitle,
          assetBased: [],
          categoryBased: [],
        };
      }

      if (request.asset) {
        grouped[projectId].assetBased.push(request);
      } else {
        grouped[projectId].categoryBased.push(request);
      }
    });

    return grouped;
  }, [requests]);

  if (isLoading) return <div className="py-4 text-center">Loading...</div>;
  if (error)
    return (
      <div className="py-4 text-center text-red-500">
        Error loading requests.
      </div>
    );

  return (
    <div
      className={`p-6 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
    >
      <h1 className="mb-6 text-center text-3xl font-bold">
        Asset Request Status Overview
      </h1>
      {Object.entries(groupedByProject).length === 0 ? (
        <p className="text-center text-gray-500">No requests found.</p>
      ) : (
        Object.entries(groupedByProject).map(
          ([projectId, { projectTitle, assetBased, categoryBased }]) => (
            <div key={projectId} className="mb-10">
              <h2 className="mb-4 text-xl font-semibold">
                Project: {projectTitle}
              </h2>

              {assetBased.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-lg font-medium">
                    Asset-Based Requests
                  </h3>
                  <RequestTable requests={assetBased} />
                </div>
              )}

              {categoryBased.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-medium">
                    Category-Based Requests
                  </h3>
                  <RequestTable requests={categoryBased} />
                </div>
              )}
            </div>
          ),
        )
      )}
    </div>
  );
};

const RequestTable = ({ requests }: { requests: AssetRequest[] }) => {
  return (
    <div className="overflow-x-auto rounded-md border shadow">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm dark:bg-gray-800">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Description</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
            <th className="px-4 py-2 text-left font-medium">Time Period</th>
            <th className="px-4 py-2 text-left font-medium">Task</th>
            <th className="px-4 py-2 text-left font-medium">Requester</th>
            <th className="px-4 py-2 text-left font-medium">
              Asset / Category
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
          {requests.map((req) => (
            <tr
              key={req.requestId}
              className="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td className="px-4 py-2">{req.description}</td>
              <td className="px-4 py-2 font-semibold text-blue-600">
                {statusMapping[req.status] ?? req.status}
              </td>
              <td className="px-4 py-2">
                <p>
                  <strong>Start:</strong>{" "}
                  {new Date(req.startTime).toLocaleDateString()}
                </p>
                <p>
                  <strong>End:</strong>{" "}
                  {new Date(req.endTime).toLocaleDateString()}
                </p>
              </td>
              <td className="px-4 py-2">
                {req.task ? (
                  <a
                    href={`/Projects/${req.projectInfo.projectID}/milestones/${req.task.milestoneId}?taskId=${req.task.taskID}`}
                    className="text-blue-500 underline"
                  >
                    {req.task.title}
                  </a>
                ) : (
                  "No Task"
                )}
              </td>
              <td className="px-4 py-2">
                {req.requesterInfo?.fullName ?? "Unknown"}
              </td>
              <td className="px-4 py-2">
                {req.asset ? (
                  req.asset.assetName
                ) : req.categories && req.categories.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
                    {req.categories.map((cat) => (
                      <li key={cat.categoryID}>
                        {cat.name} (x{cat.quantity})
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No Categories"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewAssetRequestStatus;
