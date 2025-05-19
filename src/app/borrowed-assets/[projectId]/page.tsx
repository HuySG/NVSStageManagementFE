"use client";

import BorrowedAssetCard from "@/components/BorrowedAssetCard";
import Breadcrumb from "@/components/Breadcrumb";
import {
  useGetProjectDetailsQuery,
  useGetReturnRequestsByStaffIdQuery,
  useGetStaffBorrowedAssetsQuery,
  useGetUserInfoQuery,
} from "@/state/api";
import { useParams } from "next/navigation";
import React from "react";

export default function ProjectBorrowedAssetsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: me } = useGetUserInfoQuery();
  const staffId = me?.id;

  const {
    data: assets = [],
    isLoading,
    isError,
  } = useGetStaffBorrowedAssetsQuery(staffId ?? "", { skip: !staffId });

  const { data: project, isLoading: loadingProject } =
    useGetProjectDetailsQuery(projectId as string, { skip: !projectId });

  const { data: returnData, isLoading: isLoadingReturns } =
    useGetReturnRequestsByStaffIdQuery(staffId!, {
      skip: !staffId,
    });

  const returnRequests = returnData?.result ?? [];

  // Lọc tài sản theo project
  const filteredAssets = assets.filter((a) => a.projectId === projectId);

  return (
    <div className="p-8">
      <Breadcrumb
        items={[
          { label: "Danh Sách Dự Án", href: "/borrowed-assets" },
          {
            label: loadingProject ? "Đang tải..." : (project?.title ?? "Dự án"),
          },
        ]}
      />

      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          {loadingProject ? "Đang tải..." : project?.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Danh sách các tài sản bạn đang mượn trong dự án này.
        </p>
        <p className="mt-1 text-sm font-semibold text-indigo-600">
          Tổng số tài sản: {filteredAssets.length}
        </p>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="text-gray-600">
          Không có tài sản nào đang mượn trong dự án này.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset, index) => {
            const hasRequestedReturn = returnRequests.some(
              (r) =>
                r.assetId === asset.assetId &&
                r.taskId === asset.taskId &&
                r.status !== "REJECTED",
            );

            return (
              <BorrowedAssetCard
                key={`${asset.assetId}-${index}`}
                asset={asset}
                projectId={projectId}
                hasRequestedReturn={hasRequestedReturn}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
