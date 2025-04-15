"use client";

import React, { useState } from "react";
import {
  useGetBorrowedAssetsQuery,
  useGetAssetRequestsForManagerQuery,
  BorrowedAsset,
  useGetUserInfoQuery,
} from "@/state/api";
import { Card, CardContent, CircularProgress } from "@mui/material";
import BorrowedAssetDetailModal from "@/components/BorrowedAssetDetailModal";

const BorrowedAssetManagementPage = () => {
  const {
    data: borrowedAssets,
    isLoading,
    error,
  } = useGetBorrowedAssetsQuery();
  const { data: assetRequests } = useGetAssetRequestsForManagerQuery();
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useGetUserInfoQuery();
  const currentDepartmentId = user?.department?.id;

  const [selectedBorrowedAsset, setSelectedBorrowedAsset] =
    useState<BorrowedAsset | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const handleRowClick = (asset: BorrowedAsset) => {
    setSelectedBorrowedAsset(asset);
    setOpenModal(true);
  };

  const satusName: Record<string, string> = {
    IN_USE: "In Use",
  };

  if (isLoading || isUserLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (error || userError) {
    return <div className="p-4 text-red-500">Failed to load data.</div>;
  }

  // Filter and group by project for only "DL" department
  const groupedByProjectAndDepartment: {
    [projectId: string]: {
      title: string;
      departments: {
        [departmentId: string]: {
          name: string;
          assets: BorrowedAsset[];
        };
      };
    };
  } = {};

  borrowedAssets?.forEach((asset) => {
    const request = assetRequests?.find((r) => r.task?.taskID === asset.taskID);
    const projectId = request?.projectInfo?.projectID ?? "unknown";
    const projectTitle = request?.projectInfo?.title ?? "Unknown Project";
    const departmentId = request?.requesterInfo?.department?.id ?? "unknown";
    const departmentName =
      request?.requesterInfo?.department?.name ?? "Unknown Department";

    if (departmentId !== currentDepartmentId) return;

    if (!groupedByProjectAndDepartment[projectId]) {
      groupedByProjectAndDepartment[projectId] = {
        title: projectTitle,
        departments: {},
      };
    }

    if (!groupedByProjectAndDepartment[projectId].departments[departmentId]) {
      groupedByProjectAndDepartment[projectId].departments[departmentId] = {
        name: departmentName,
        assets: [],
      };
    }

    groupedByProjectAndDepartment[projectId].departments[
      departmentId
    ].assets.push(asset);
  });

  const getBorrowerName = (taskId: string): string => {
    const request = assetRequests?.find((r) => r.task?.taskID === taskId);
    return request?.requesterInfo?.fullName ?? "Unknown";
  };

  const getTaskTitle = (taskId: string): string => {
    const request = assetRequests?.find((r) => r.task?.taskID === taskId);
    return request?.task?.title ?? taskId;
  };
  if (Object.keys(groupedByProjectAndDepartment).length === 0) {
    return (
      <div className="mt-8 text-center text-gray-500">
        No borrowed assets found for department "DL".
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <h1 className="mb-6 text-center text-3xl font-bold">
        Borrowed Assets Management - DL Department
      </h1>

      {Object.entries(groupedByProjectAndDepartment).map(
        ([projectId, projectData]) => (
          <div key={projectId} className="mb-10">
            <h2 className="mb-3 text-2xl font-bold text-blue-800">
              Project: {projectData.title}
            </h2>

            {Object.entries(projectData.departments).map(
              ([departmentId, departmentData]) => (
                <div key={departmentId} className="mb-6 ml-4">
                  <h3 className="mb-2 text-lg font-semibold text-green-700">
                    Department: {departmentData.name}
                  </h3>
                  <Card>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border text-sm">
                          <thead>
                            <tr className="bg-gray-200">
                              <th className="p-2">Asset ID</th>
                              <th className="p-2">Task</th>
                              <th className="p-2">Borrower</th>
                              <th className="p-2">Borrow Time</th>
                              <th className="p-2">End Time</th>
                              <th className="p-2">Status</th>
                              <th className="p-2">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {departmentData.assets.map((item) => (
                              <tr
                                key={item.borrowedId}
                                className="cursor-pointer border-t hover:bg-gray-100"
                                onClick={() => handleRowClick(item)}
                              >
                                <td className="p-2">{item.assetID}</td>
                                <td className="p-2">
                                  {getTaskTitle(item.taskID)}
                                </td>
                                <td className="p-2">
                                  {getBorrowerName(item.taskID)}
                                </td>
                                <td className="p-2">
                                  {new Date(item.borrowTime).toLocaleString()}
                                </td>
                                <td className="p-2">
                                  {new Date(item.endTime).toLocaleString()}
                                </td>
                                <td className="p-2">
                                  {satusName[item.status]}
                                </td>
                                <td className="p-2">{item.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ),
            )}
          </div>
        ),
      )}
      {selectedBorrowedAsset && (
        <BorrowedAssetDetailModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          borrowedAsset={selectedBorrowedAsset}
        />
      )}
    </div>
  );
};

export default BorrowedAssetManagementPage;
