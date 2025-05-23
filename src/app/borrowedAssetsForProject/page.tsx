"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  useGetBorrowedAssetsQuery,
  useGetAssetRequestsForManagerQuery,
  useGetUserInfoQuery,
} from "@/state/api";
import { groupAssetsByProjectAndDepartment } from "@/lib/utils";
import { Folder } from "lucide-react";

const ProjectListPage = () => {
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useGetUserInfoQuery();
  const {
    data: borrowedAssets,
    isLoading: isAssetsLoading,
    error: assetsError,
  } = useGetBorrowedAssetsQuery();
  const {
    data: assetRequests,
    isLoading: isRequestsLoading,
    error: requestsError,
  } = useGetAssetRequestsForManagerQuery();

  const [searchTerm, setSearchTerm] = useState("");

  const isLoading = isUserLoading || isAssetsLoading || isRequestsLoading;
  const hasError = userError || assetsError || requestsError;
  const currentDepartmentId = user?.department?.id;

  const filteredAssets =
    borrowedAssets?.filter((asset) => {
      const request = assetRequests?.find(
        (r) => r.task?.taskID === asset.taskID,
      );
      return request?.requesterInfo?.department?.id === currentDepartmentId;
    }) || [];

  const groupedByProjectAndDepartment = groupAssetsByProjectAndDepartment(
    filteredAssets,
    assetRequests,
  );

  const totalBorrowedAssets = filteredAssets.filter(
    (a) => a.status !== "RETURNED",
  ).length;

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim())
      return Object.entries(groupedByProjectAndDepartment);
    return Object.entries(groupedByProjectAndDepartment).filter(
      ([_, projectData]) =>
        projectData.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [groupedByProjectAndDepartment, searchTerm]);

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-600">Đang tải dữ liệu...</div>
    );
  }

  if (hasError) {
    return (
      <div className="p-6 text-center font-semibold text-red-600">
        Không thể tải dữ liệu.
      </div>
    );
  }

  if (!currentDepartmentId) {
    return (
      <div className="p-6 text-center font-semibold text-red-600">
        Không tìm thấy thông tin phòng ban của bạn.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-8 py-12 md:px-16 lg:px-24 xl:px-32">
      <header className="mb-6 max-w-full">
        <h1 className="mb-3 text-4xl font-extrabold text-gray-900">
          Danh sách dự án mượn tài sản
        </h1>
        <p className="mb-2 text-lg text-gray-700">
          Chọn dự án để xem chi tiết các tài sản đang mượn của phòng ban bạn.
        </p>
        <p className="text-lg font-semibold text-indigo-600">
          Tổng số tài sản đang mượn: {totalBorrowedAssets}
        </p>
      </header>

      {/* Đường ngăn cách */}
      <hr className="mb-8 border-gray-300" />

      <div className="mb-8 max-w-full">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm dự án..."
          className="w-full max-w-xl rounded-lg border border-gray-300 px-5 py-3 text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-200"
        />
      </div>

      <div className="grid max-w-full gap-y-4 rounded-lg">
        {filteredProjects.length === 0 && (
          <div className="p-10 text-center text-lg text-gray-500">
            Không tìm thấy dự án phù hợp.
          </div>
        )}

        {filteredProjects.map(([projectId, projectData]) => {
          const totalAssets = Object.values(projectData.departments).reduce(
            (sum, dept) =>
              sum + dept.assets.filter((a) => a.status !== "RETURNED").length,
            0,
          );

          const activeDepartmentsCount = Object.values(
            projectData.departments,
          ).filter((dept) =>
            dept.assets.some((a) => a.status !== "RETURNED"),
          ).length;

          return (
            <Link
              key={projectId}
              href={`/borrowedAssetsForProject/${projectId}/${currentDepartmentId}`}
              className="space-y-4cursor-pointer flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:bg-indigo-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label={`Dự án ${projectData.title}, có ${activeDepartmentsCount} phòng ban và ${totalAssets} tài sản đang mượn`}
            >
              <div className="mb-4 flex items-center space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Folder size={24} />
                </div>
                <h2 className="truncate text-lg font-semibold text-indigo-900">
                  {projectData.title}
                </h2>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>{totalAssets} tài sản đang mượn</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectListPage;
