"use client";

import { useGetAssetQuery } from "@/state/api";
import { useRouter } from "next/navigation";

interface BorrowedAsset {
  assetId: string;
  assetName: string;
  borrowTime: string;
  status: string;
  endTime: string;
  taskId: string;
}

interface Props {
  asset: BorrowedAsset;
  projectId: string;
  hasRequestedReturn?: boolean;
}

export default function BorrowedAssetCard({
  asset,
  projectId,
  hasRequestedReturn,
}: Props) {
  const router = useRouter();
  const { data: assetDetail, isLoading } = useGetAssetQuery(asset.assetId);

  const handleClick = () => {
    router.push(`/borrowed-assets/${projectId}/${asset.assetId}`);
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer rounded-2xl border bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
    >
      <h2 className="mb-2 text-lg font-semibold text-gray-800">
        {asset.assetName}
      </h2>
      <ul className="space-y-1 text-sm text-gray-600">
        <li>
          <span className="font-medium text-gray-700">Ngày mượn:</span>{" "}
          {new Date(asset.borrowTime).toLocaleDateString()}
        </li>
        <li>
          <span className="font-medium text-gray-700">Ngày Phải Trả:</span>{" "}
          {new Date(asset.endTime).toLocaleDateString()}
        </li>
        <li>
          <span className="font-medium text-gray-700">Trạng thái:</span>{" "}
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
              asset.status === "IN_USE"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {asset.status}
          </span>
        </li>
        <li>
          <span className="font-medium text-gray-700">Danh mục:</span>{" "}
          {isLoading
            ? "Đang tải..."
            : (assetDetail?.category?.name ?? "Không rõ")}
        </li>
        <li>
          <span className="font-medium text-gray-700">Kiểu:</span>{" "}
          {isLoading
            ? "Đang tải..."
            : (assetDetail?.assetType?.name ?? "Không rõ")}
        </li>
      </ul>

      {hasRequestedReturn && (
        <div className="mt-4">
          <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
            Đã gửi yêu cầu trả
          </span>
        </div>
      )}
    </div>
  );
}
