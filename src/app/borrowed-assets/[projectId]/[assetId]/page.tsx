"use client";

import {
  useGetAssetQuery,
  useGetProjectDetailsQuery,
  useGetReturnRequestsByStaffIdQuery,
  useGetStaffBorrowedAssetsQuery,
  useGetUserInfoQuery,
  useReturnAssetMutation,
} from "@/state/api";
import { useParams } from "next/navigation";
import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import Image from "next/image";
import ViewTaskModal from "@/components/ViewTaskModal"; // Nếu đã tạo
import { toast } from "react-toastify";
import { uploadSingleImage } from "@/lib/uploadImages";

export default function ReturnRequestFormPage() {
  const { projectId, assetId } = useParams<{
    projectId: string;
    assetId: string;
  }>();

  const { data: me } = useGetUserInfoQuery();
  const staffId = me?.id ?? "";

  const { data: borrowedAssets = [] } = useGetStaffBorrowedAssetsQuery(
    staffId,
    {
      skip: !staffId,
    },
  );

  const { data: assetDetail, isLoading: isAssetLoading } = useGetAssetQuery(
    assetId,
    {
      skip: !assetId,
    },
  );

  const { data: project } = useGetProjectDetailsQuery(projectId, {
    skip: !projectId,
  });

  const borrowedInfo = borrowedAssets.find((a) => a.assetId === assetId);

  const [description, setNote] = useState("");
  const [conditionNote, setConditionNote] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [submitReturnRequest, { isLoading }] = useReturnAssetMutation();

  // State cần dùng
  const [image, setImage] = useState<File | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Handler cập nhật ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  const handleSubmit = async () => {
    if (!assetId) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    try {
      let imageUrl = "";
      if (image) {
        imageUrl = await uploadSingleImage(image);
      }

      await submitReturnRequest({
        staffId,
        payload: {
          assetId,
          taskId: borrowedInfo?.taskId,
          description,
          conditionNote,
          imageUrl,
        },
      });

      toast.success("Yêu cầu trả tài sản đã được gửi.");
      setNote("");
      setConditionNote("");
      setImage(null);
    } catch (err) {
      toast.error("Gửi yêu cầu thất bại.");
      console.error(err);
    }
  };
  const { data, isLoading: isLoadingReturns } =
    useGetReturnRequestsByStaffIdQuery(staffId, {
      skip: !staffId,
    });

  const returnRequests = data?.result ?? [];

  const filteredRequests = returnRequests.filter(
    (r) => r.assetId === assetId && r.taskId === borrowedInfo?.taskId,
  );

  return (
    <div className="min-h-screen space-y-12 bg-gray-50 px-6 py-10 md:px-16">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Tài sản đang mượn", href: "/borrowed-assets" },
          {
            label: project?.title ?? "Dự án",
            href: `/borrowed-assets/${projectId}`,
          },
          {
            label: assetDetail?.assetName ?? "Tài sản",
            href: `/borrowed-assets/${projectId}/${assetId}`,
          },
        ]}
      />

      {/* Tiêu đề trang */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Trả tài sản</h1>
        <p className="text-gray-600">
          Vui lòng xác nhận thông tin tài sản và gửi ảnh minh họa nếu cần.
        </p>
      </header>

      {/* Thông tin tài sản */}
      <section className="flex flex-col items-start gap-6 rounded-xl bg-white p-6 shadow-sm md:flex-row">
        <div className="flex-1 space-y-2">
          <h2 className="text-2xl font-semibold text-gray-800">
            {assetDetail?.assetName}
          </h2>
          <p className="text-sm text-gray-500">{assetDetail?.description}</p>
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-gray-700 sm:grid-cols-2">
            <p>
              <strong>Loại:</strong> {assetDetail?.assetType?.name}
            </p>
            <p>
              <strong>Danh mục:</strong> {assetDetail?.category?.name}
            </p>
          </div>
          {borrowedInfo?.taskTitle && (
            <button
              onClick={() => setTaskModalOpen(true)}
              className="mt-3 text-sm text-indigo-600 underline hover:text-indigo-800"
            >
              Xem nhiệm vụ: {borrowedInfo.taskTitle}
            </button>
          )}
        </div>
        {assetDetail?.image && (
          <div className="flex-shrink-0">
            <img
              src={assetDetail.image}
              alt="Asset"
              className="h-40 w-40 rounded-lg border object-cover"
            />
          </div>
        )}
      </section>

      {/* Upload ảnh minh họa */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Ảnh minh họa (tùy chọn)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="text-sm"
        />

        {/* Hiển thị ảnh preview */}
        {image && (
          <div className="relative mt-4 h-32 w-32">
            <Image
              src={URL.createObjectURL(image)}
              alt="preview"
              fill
              className="rounded-lg border object-cover"
              onClick={() => setPreviewImage(URL.createObjectURL(image))}
            />
            <button
              onClick={handleRemoveImage}
              className="absolute right-1 top-1 rounded-full bg-black bg-opacity-60 p-1 text-white hover:bg-opacity-80"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Nút submit */}
      <div className="text-right">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                />
              </svg>
              Đang gửi...
            </>
          ) : (
            "Gửi yêu cầu trả"
          )}
        </button>
      </div>

      {/* Modal xem task */}
      {borrowedInfo?.taskId && taskModalOpen && (
        <ViewTaskModal
          taskId={borrowedInfo.taskId}
          open={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
        />
      )}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Full preview"
            className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-xl"
          />
        </div>
      )}
      {!isLoadingReturns && (
        <section className="mt-16 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Lịch sử yêu cầu trả tài sản
          </h2>

          {filteredRequests.length === 0 ? (
            <p className="text-sm text-gray-500">
              Bạn chưa gửi yêu cầu trả tài sản nào cho tài sản này.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredRequests.map((req) => (
                <div
                  key={req.requestId}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow transition hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {req.requestTime
                        ? new Date(req.requestTime).toLocaleString()
                        : "Chưa rõ thời gian"}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        req.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : req.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      ● {req.status}
                    </span>
                  </div>

                  {req.imageUrl && (
                    <div className="relative mt-3 h-32 w-full overflow-hidden rounded-lg border">
                      <img
                        src={req.imageUrl}
                        alt="Ảnh minh họa"
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    </div>
                  )}

                  {req.rejectReason && (
                    <div className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                      <strong>Lý do từ chối:</strong> {req.rejectReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
