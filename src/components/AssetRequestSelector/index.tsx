import React, { useState } from "react";
import { Layers, CalendarClock, Layers3, X } from "lucide-react";
import RequestAssetModal from "../RequestAssetModal";
import RequestBookingAssetModal from "../RequestBookingAssetModal";
import RequestCategoryAssetModal from "../RequestCategoryAssetModal";

type RequestAssetModalProps = {
  taskId: string;
  onClose: () => void;
  isOpen: boolean;
};

const requestOptions = [
  // { value: "normal", label: "Yêu cầu thông thường", icon: <Layers size={18} /> },
  {
    value: "booking",
    label: "Yêu cầu theo lịch đặt",
    icon: <CalendarClock size={18} />,
  },
  {
    value: "category",
    label: "Yêu cầu theo danh mục",
    icon: <Layers3 size={18} />,
  },
];

const AssetRequestSelector = ({
  taskId,
  onClose,
  isOpen,
}: RequestAssetModalProps) => {
  const [selectedRequestType, setSelectedRequestType] = useState<string>("");

  const handleChangeRequestType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRequestType(e.target.value);
  };

  // Khi đã chọn một loại thì mở modal con tương ứng, ẩn selector
  if (selectedRequestType === "booking") {
    return (
      <RequestBookingAssetModal
        isOpen={true}
        taskId={taskId}
        onClose={onClose}
      />
    );
  }
  if (selectedRequestType === "category") {
    return <RequestCategoryAssetModal taskId={taskId} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="animate-fade-in relative w-full max-w-md rounded-2xl bg-white px-7 py-8 shadow-xl ring-1 ring-gray-200 dark:bg-dark-secondary dark:ring-dark-tertiary">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-dark-tertiary"
          title="Đóng"
        >
          <X size={22} className="text-gray-500 dark:text-gray-300" />
        </button>

        {/* Tiêu đề */}
        <h2 className="mb-1 text-center text-xl font-bold text-blue-700 dark:text-blue-300">
          Chọn loại yêu cầu tài sản
        </h2>
        <div className="mb-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Vui lòng chọn hình thức yêu cầu phù hợp với công việc của bạn.
        </div>

        {/* Dropdown chọn loại yêu cầu tài sản */}
        <div className="mb-4">
          <label
            htmlFor="request-type"
            className="mb-2 block text-[15px] font-semibold text-gray-700 dark:text-white"
          >
            Loại yêu cầu tài sản:
          </label>
          <select
            id="request-type"
            className="w-full rounded-lg border border-gray-300 bg-white p-3 pr-9 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white"
            onChange={handleChangeRequestType}
            value={selectedRequestType}
          >
            <option value="">-- Chọn loại yêu cầu --</option>
            {requestOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Gợi ý từng loại request */}
        <div className="mt-3 flex flex-col gap-2">
          {requestOptions.map((opt) => (
            <div
              key={opt.value}
              className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-gray-700 dark:bg-dark-tertiary dark:text-white"
            >
              <span>{opt.icon}</span>
              <span className="font-medium">{opt.label}</span>
              {opt.value === "booking" && (
                <span className="ml-auto text-xs text-blue-500">
                  Chọn phòng, khung giờ, lịch đặt
                </span>
              )}
              {opt.value === "category" && (
                <span className="ml-auto text-xs text-blue-500">
                  Chọn tài sản theo nhóm
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Nút đóng */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-400 px-6 py-2 font-semibold text-white shadow transition hover:bg-gray-500"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetRequestSelector;
