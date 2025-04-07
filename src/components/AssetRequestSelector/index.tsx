import React, { useState } from "react";
import RequestAssetModal from "../RequestAssetModal"; // Modal yêu cầu tài sản bình thường
import RequestBookingAssetModal from "../RequestBookingAssetModal"; // Modal yêu cầu tài sản theo Booking
import RequestCategoryAssetModal from "../RequestCategoryAssetModal"; // Modal yêu cầu tài sản theo danh mục

type RequestAssetModalProps = {
  taskId: string;
  onClose: () => void;
};

const AssetRequestSelector = ({ taskId, onClose }: RequestAssetModalProps) => {
  const [selectedRequestType, setSelectedRequestType] = useState<string>("");

  // Xử lý sự thay đổi loại yêu cầu tài sản
  const handleChangeRequestType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRequestType(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-dark-secondary">
        <h2 className="mb-4 text-center text-lg font-bold dark:text-white">
          Select Asset Request Type
        </h2>

        {/* Dropdown chọn loại yêu cầu tài sản */}
        <div className="mb-4">
          <label
            htmlFor="request-type"
            className="block text-sm text-gray-700 dark:text-white"
          >
            Choose the type of asset request:
          </label>
          <select
            id="request-type"
            className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
            onChange={handleChangeRequestType}
            value={selectedRequestType}
          >
            <option value="">Select Request Type</option>
            <option value="normal">Normal Request</option>
            <option value="booking">Request by Booking</option>
            <option value="category">Request by Category</option>
          </select>
        </div>

        {/* Hiển thị modal tương ứng với lựa chọn */}
        {selectedRequestType === "normal" && (
          <RequestAssetModal taskId={taskId} onClose={onClose} />
        )}
        {selectedRequestType === "booking" && (
          <RequestBookingAssetModal taskId={taskId} onClose={onClose} />
        )}
        {selectedRequestType === "category" && (
          <RequestCategoryAssetModal taskId={taskId} onClose={onClose} />
        )}

        {/* Các nút hành động */}
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-400 px-5 py-2 text-white transition hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetRequestSelector;
