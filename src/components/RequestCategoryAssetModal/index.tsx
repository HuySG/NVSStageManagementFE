import { useEffect, useState } from "react";
import {
  useGetAssetTypesQuery,
  AssetType,
  AssetCategory,
  useCreateAssetRequestCategoryMutation,
} from "@/state/api";
import { toast } from "react-toastify";

const ALLOWED_ASSET_TYPE_ID = "de2b478c-a4a4-4b9d-9f39-e3a7ee5b29da";
const ALLOWED_ASSET_TYPE_NAME = "Không gian sử dụng (Phòng/Sân khấu)";

type RequestAssetCategoryModalProps = {
  taskId: string;
  onClose: () => void;
};

const RequestAssetCategoryModal = ({
  taskId,
  onClose,
}: RequestAssetCategoryModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState("");
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<
    { categoryID: string; quantity: number }[]
  >([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const { data: assetTypes = [], isLoading: assetTypesLoading } =
    useGetAssetTypesQuery();
  const [createCategoryRequest, { isLoading: isSubmitting, isSuccess, error }] =
    useCreateAssetRequestCategoryMutation();

  useEffect(() => {
    const selectedType = assetTypes.find(
      (type: AssetType) => type.id === selectedAssetTypeId,
    );
    setCategories(selectedType?.categories ?? []);
    setSelectedCategories([]);
  }, [selectedAssetTypeId, assetTypes]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Gửi yêu cầu thành công!", { autoClose: 4000 });
      onClose();
    }
  }, [isSuccess, onClose]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const exists = prev.find((c) => c.categoryID === categoryId);
      if (exists) {
        return prev.filter((c) => c.categoryID !== categoryId);
      } else {
        return [...prev, { categoryID: categoryId, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (categoryId: string, quantity: number) => {
    setSelectedCategories((prev) =>
      prev.map((c) => (c.categoryID === categoryId ? { ...c, quantity } : c)),
    );
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) errors.title = "Vui lòng nhập tiêu đề";
    if (!description.trim()) errors.description = "Vui lòng nhập mô tả";
    if (!startTime) errors.startTime = "Chọn thời gian bắt đầu";
    if (!endTime) errors.endTime = "Chọn thời gian kết thúc";
    if (!selectedAssetTypeId) errors.assetType = "Chọn loại tài sản";

    // Không cho phép loại tài sản Không gian sử dụng (Phòng/Sân khấu)
    const selectedType = assetTypes.find((t) => t.id === selectedAssetTypeId);
    if (
      selectedType &&
      selectedType.id === ALLOWED_ASSET_TYPE_ID &&
      selectedType.name === ALLOWED_ASSET_TYPE_NAME
    ) {
      errors.assetType =
        "Không được mượn loại tài sản Không gian sử dụng (Phòng/Sân khấu)";
    }

    const now = new Date();
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    if (start && start < now) {
      errors.startTime = "Thời gian bắt đầu phải ở hiện tại hoặc tương lai";
    }
    if (end && end < now) {
      errors.endTime = "Thời gian kết thúc phải ở hiện tại hoặc tương lai";
    }
    if (start && end && start >= end) {
      errors.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu";
    }

    if (selectedCategories.length === 0) {
      errors.categories = "Chọn ít nhất một danh mục";
    }

    selectedCategories.forEach((cat) => {
      if (cat.quantity <= 0 || !Number.isInteger(cat.quantity)) {
        errors[`quantity-${cat.categoryID}`] =
          "Số lượng phải là số nguyên dương";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getServerErrorMessage = (error: any) => {
    if (!error) return null;
    if ("status" in error) {
      if (
        error.data &&
        typeof error.data === "object" &&
        "message" in error.data
      ) {
        return error.data.message;
      }
      if (typeof error.data === "string") {
        return error.data;
      }
      return `Lỗi máy chủ: ${error.status}`;
    }
    if (error.message) {
      return error.message;
    }
    return "Có lỗi xảy ra, vui lòng thử lại.";
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const requestData = {
      taskID: taskId,
      title,
      description,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      categories: selectedCategories.map((c) => {
        const matched = categories.find(
          (cat) => cat.categoryID === c.categoryID,
        );
        return {
          categoryID: c.categoryID,
          quantity: c.quantity,
          name: matched?.name ?? "",
        };
      }),
    };
    try {
      await createCategoryRequest(requestData).unwrap();
    } catch (err: any) {
      toast.error(getServerErrorMessage(err), { autoClose: 4000 });
      console.error("Error submitting category request:", err);
    }
  };

  const getErrorMessage = (field: string) =>
    validationErrors[field] ? (
      <p className="mt-1 text-sm text-red-500">{validationErrors[field]}</p>
    ) : null;

  // Giới hạn min thời gian input là hiện tại
  const nowLocal = new Date();
  const minDateTimeLocal = nowLocal.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-7 shadow-xl dark:bg-dark-secondary">
        {/* Header */}
        <button
          className="absolute right-5 top-5 text-gray-400 hover:text-blue-600"
          onClick={onClose}
          aria-label="Đóng"
        >
          ×
        </button>
        <h2 className="mb-5 text-center text-2xl font-bold text-blue-700 dark:text-blue-300">
          Yêu cầu tài sản theo danh mục
        </h2>
        {/* Title */}
        <div className="mb-3">
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
            Tiêu đề yêu cầu <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-custom"
            placeholder="Nhập tiêu đề"
          />
          {getErrorMessage("title")}
        </div>
        {/* Description */}
        <div className="mb-3">
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-custom"
            placeholder="Nhập mô tả chi tiết"
            rows={2}
          />
          {getErrorMessage("description")}
        </div>
        {/* Time Range */}
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
              Thời gian bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={startTime}
              min={minDateTimeLocal}
              onChange={(e) => setStartTime(e.target.value)}
              className="input-custom"
            />
            {getErrorMessage("startTime")}
          </div>
          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
              Thời gian kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={endTime}
              min={minDateTimeLocal}
              onChange={(e) => setEndTime(e.target.value)}
              className="input-custom"
            />
            {getErrorMessage("endTime")}
          </div>
        </div>
        {/* Asset Type */}
        <div className="mb-3">
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
            Loại tài sản <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedAssetTypeId}
            onChange={(e) => setSelectedAssetTypeId(e.target.value)}
            className="input-custom"
            disabled={assetTypesLoading}
          >
            <option value="">-- Chọn loại tài sản --</option>
            {assetTypes.map((type) => (
              <option
                key={type.id}
                value={type.id}
                disabled={
                  type.id === ALLOWED_ASSET_TYPE_ID &&
                  type.name === ALLOWED_ASSET_TYPE_NAME
                }
              >
                {type.name}
                {type.id === ALLOWED_ASSET_TYPE_ID
                  ? " (Không hỗ trợ mượn)"
                  : ""}
              </option>
            ))}
          </select>
          {getErrorMessage("assetType")}
        </div>
        {/* Category + Quantity */}
        <div className="mb-4">
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
            Danh mục <span className="text-red-500">*</span>
          </label>
          <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-dark-tertiary">
            {categories.map((cat) => {
              const selected = selectedCategories.find(
                (c) => c.categoryID === cat.categoryID,
              );
              return (
                <div
                  key={cat.categoryID}
                  className="flex items-center justify-between gap-2"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!selected}
                      onChange={() => toggleCategory(cat.categoryID)}
                      className="accent-blue-600"
                    />
                    {cat.name}
                  </label>
                  {selected && (
                    <input
                      type="number"
                      min={1}
                      value={selected.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          cat.categoryID,
                          Math.max(1, parseInt(e.target.value) || 1),
                        )
                      }
                      className="w-20 rounded border border-gray-300 p-1 text-center dark:bg-dark-tertiary dark:text-white"
                    />
                  )}
                </div>
              );
            })}
          </div>
          {getErrorMessage("categories")}
          {categories.map((cat) =>
            getErrorMessage(`quantity-${cat.categoryID}`),
          )}
        </div>
        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-6 py-2 font-semibold text-gray-600 shadow-sm transition hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 px-7 py-2 font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-blue-500 ${
              isSubmitting ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
        <style jsx>{`
          .input-custom {
            width: 100%;
            border: 1.5px solid #e0e7ef;
            border-radius: 0.8rem;
            padding: 0.5rem 0.85rem;
            font-size: 1rem;
            outline: none;
            background: #f8fafc;
            margin-bottom: 0;
            transition:
              border 0.15s,
              box-shadow 0.18s;
          }
          .input-custom:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 1.5px #3b82f6;
            background: #fff;
          }
        `}</style>
      </div>
    </div>
  );
};

export default RequestAssetCategoryModal;
