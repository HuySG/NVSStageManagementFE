"use client";

import { useGetAssetByIdQuery } from "@/state/api";

type Props = {
  assetId: string;
};

const AssetNameCell = ({ assetId }: Props) => {
  const { data, isLoading, isError } = useGetAssetByIdQuery(assetId);

  if (isLoading) return <span>Đang tải...</span>;
  if (isError) return <span>Lỗi</span>;
  return <span>{data?.assetName || "Không có tên"}</span>;
};

export default AssetNameCell;
