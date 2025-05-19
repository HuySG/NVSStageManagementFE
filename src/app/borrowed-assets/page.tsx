"use client";

import ProjectItem from "@/components/ProjectItem";
import {
  useGetStaffBorrowedAssetsQuery,
  useGetUserInfoQuery,
} from "@/state/api";
import { useRouter } from "next/navigation";
import React from "react";

export default function BorrowedProjectListPage() {
  const router = useRouter();
  const { data: me } = useGetUserInfoQuery();
  const staffId = me?.id;

  const {
    data: assets = [],
    isLoading,
    isError,
  } = useGetStaffBorrowedAssetsQuery(staffId ?? "", {
    skip: !staffId,
  });

  const projectIds = [...new Set(assets.map((a) => a.projectId))];
  const totalAssets = assets.length;

  if (isLoading)
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>;
  if (isError)
    return (
      <div className="p-10 text-center text-red-500">
        Không thể tải dữ liệu.
      </div>
    );

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Dự án đang mượn tài sản
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Danh sách các project có tài sản được mượn bởi bạn.
          </p>
          <p className="mt-1 text-sm font-semibold text-indigo-600">
            Tổng số tài sản đang mượn: {totalAssets}
          </p>
        </div>
      </div>

      {projectIds.length === 0 ? (
        <p className="text-gray-600">Không có tài sản nào đang mượn.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projectIds.map((id) => (
            <ProjectItem
              key={id}
              projectId={id}
              assetCount={assets.filter((a) => a.projectId === id).length}
              onClick={() => router.push(`/borrowed-assets/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
