"use client";

import { useParams } from "next/navigation";
import { CircularProgress } from "@mui/material";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import Link from "next/link";
import {
  useGetAssetByIdQuery,
  useGetAssetRequestsForManagerQuery,
  useGetBorrowedAssetsQuery,
} from "@/state/api";
import AssetNameCell from "@/components/AssetNameCell";

const BorrowedAssetByDepartmentPage = () => {
  const { projectId, departmentId } = useParams<{
    projectId: string;
    departmentId: string;
  }>();

  const {
    data: borrowedAssets,
    isLoading,
    error,
  } = useGetBorrowedAssetsQuery();
  const { data: assetRequests } = useGetAssetRequestsForManagerQuery();

  if (isLoading)
    return (
      <div className="p-4 text-center">
        <CircularProgress />
      </div>
    );

  const requestMap: Record<string, any> = {};
  assetRequests?.forEach((request) => {
    if (request.task?.taskID) {
      requestMap[request.task.taskID] = request;
    }
  });
  const projectName =
    Object.values(requestMap).find(
      (request) =>
        request?.projectInfo?.projectID === projectId &&
        request?.requesterInfo?.department?.id === departmentId,
    )?.projectInfo?.title ?? "Unknown Project";

  const filteredAssets = borrowedAssets?.filter((asset) => {
    const request = requestMap[asset.taskID];
    return (
      request?.projectInfo?.projectID === projectId &&
      request?.requesterInfo?.department?.id === departmentId &&
      asset.status !== "RETURNED"
    );
  });

  if (!filteredAssets || filteredAssets.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No borrowed assets found for this department.
      </div>
    );
  }
  if (error)
    return <div className="p-4 text-red-500">Failed to load data.</div>;

  return (
    <div className="min-h-screen w-full bg-gray-50 px-10 py-10 lg:px-16">
      <div className="mb-8">
        <Link
          href={`/borrowedAssetsForProject`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Quay lại danh sách Dự án
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-gray-800">
          Tài Sản Mượn Trong Dự Án {projectName}
        </h1>
        <p className="mt-1 text-base text-gray-500">
          Xem tất cả tài sản đang được mượn trong phòng này.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
          <div className="grid grid-cols-6 bg-gray-100 px-6 py-3 text-left text-sm font-semibold text-gray-700">
            <div>STT</div>
            <div>Tên công việc</div>
            <div>Tên tài sản</div>
            <div>Người mượn</div>
            <div>Thời gian mượn</div>
            <div>Thời gian trả</div>
          </div>

          {filteredAssets.map((asset, index) => {
            const request = requestMap[asset.taskID];
            const borrower = request?.requesterInfo?.fullName ?? "Không rõ";
            const taskTitle = request?.task?.title ?? "Không rõ công việc";
            const detailUrl = `/borrowedAssetsForProject/${projectId}/${departmentId}/${asset.borrowedID}`;

            return (
              <Link
                key={asset.borrowedID}
                href={detailUrl}
                className="grid cursor-pointer grid-cols-6 items-center px-6 py-4 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <div>{index + 1}</div>
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="truncate">{taskTitle}</span>
                </div>
                <div className="truncate">
                  <AssetNameCell assetId={asset.assetID} />
                </div>
                <div className="truncate">{borrower}</div>
                <div className="truncate">
                  {format(new Date(asset.borrowTime), "dd MMM yyyy HH:mm")}
                </div>
                <div className="truncate">
                  {format(new Date(asset.endTime), "dd MMM yyyy HH:mm")}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BorrowedAssetByDepartmentPage;
