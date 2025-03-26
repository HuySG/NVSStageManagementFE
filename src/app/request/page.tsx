"use client";
import { useState } from "react";
import {
  AssetRequest,
  useGetProjectsDepartmentQuery,
  useGetRequestAssetByDepartmentQuery,
  useGetUserInfoQuery,
} from "@/state/api";
import { useAppSelector } from "@/app/redux";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import { GridRenderCellParams } from "@mui/x-data-grid";

const LeaderAssetApproval = () => {
  const { data: user } = useGetUserInfoQuery();
  const departmentId = user?.department?.id ?? "";

  const {
    data: projects,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useGetProjectsDepartmentQuery(departmentId, {
    skip: !departmentId,
  });

  const {
    data: requests = [],
    isLoading,
    error,
  } = useGetRequestAssetByDepartmentQuery(departmentId);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(
    null,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading asset requests</div>;
  console.log("Asset Requests Data:", requests);

  const columns = [
    {
      field: "assetName",
      headerName: "Asset",
      flex: 1,
      valueGetter: (params: any) => params?.row?.asset?.assetName ?? "N/A",
    },
    {
      field: "assetType",
      headerName: "Type",
      flex: 1,
      valueGetter: (params: any) =>
        params?.row?.asset?.assetType?.name ?? "N/A",
    },
    { field: "quantity", headerName: "Quantity", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params: GridRenderCellParams) =>
        params.row ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setSelectedRequest(params.row)}
          >
            View
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="min-h-screen p-8 dark:bg-dark-secondary dark:text-white">
      <h2 className="text-2xl font-bold">Welcome back!</h2>
      <p className="mb-4">Here’s a list of asset requests!</p>
      <div className="overflow-hidden rounded-lg bg-white">
        <DataGrid
          rows={requests ?? []} // Đảm bảo rows không bị undefined
          columns={columns}
          autoHeight
          getRowId={(row) => row?.requestId ?? ""}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 5 },
            },
          }}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-1/3 rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-xl font-bold">
              {selectedRequest.asset?.assetName || "No Asset"}
            </h3>
            <p>
              <strong>Type:</strong>{" "}
              {selectedRequest.asset?.assetType?.name || "N/A"}
            </p>
            <p>
              <strong>Quantity:</strong> {selectedRequest.quantity}
            </p>
            <p>
              <strong>Status:</strong> {selectedRequest.status}
            </p>
            <p>
              <strong>Description:</strong> {selectedRequest.description}
            </p>

            {/* Thông tin người yêu cầu */}
            {selectedRequest.requesterInfo && (
              <>
                <h4 className="mt-4 text-lg font-bold">Requester Info:</h4>
                <p>
                  <strong>Name:</strong>{" "}
                  {selectedRequest.requesterInfo.fullName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedRequest.requesterInfo.email}
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  {selectedRequest.requesterInfo.phoneNumber}
                </p>
              </>
            )}

            {/* Thông tin Task */}
            <h4 className="mt-4 text-lg font-bold">Task Info:</h4>
            <p>
              <strong>Title:</strong> {selectedRequest.task.title}
            </p>
            <p>
              <strong>Description:</strong> {selectedRequest.task.description}
            </p>
            <p>
              <strong>Status:</strong> {selectedRequest.task.status}
            </p>
            <p>
              <strong>Start Date:</strong> {selectedRequest.task.startDate}
            </p>
            <p>
              <strong>End Date:</strong> {selectedRequest.task.endDate}
            </p>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setSelectedRequest(null)}
                variant="contained"
                color="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderAssetApproval;
