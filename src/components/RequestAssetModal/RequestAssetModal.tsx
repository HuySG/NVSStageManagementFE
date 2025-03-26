import { useEffect, useState } from "react";
import {
  Asset,
  AssetCategory,
  AssetType,
  useCreateAssetRequestMutation,
  useGetAssetsQuery,
  useGetAssetTypesQuery,
} from "@/state/api"; // Import mutation

type RequestAssetModalProps = {
  taskId: string;
  onClose: () => void;
};

const RequestAssetModal = ({ taskId, onClose }: RequestAssetModalProps) => {
  // State cho selection
  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  // State cho form
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // State cho categories từ Asset Type đã chọn
  const [categories, setCategories] = useState<AssetCategory[]>([]);

  // Fetch danh sách các loại tài sản
  const { data: assetTypes = [], isLoading: assetTypesLoading } =
    useGetAssetTypesQuery();

  // Fetch danh sách tài sản dựa trên category đã chọn
  const { data: assets = [], isLoading: assetsLoading } = useGetAssetsQuery(
    selectedCategoryId
      ? { categoryId: selectedCategoryId }
      : (undefined as never),
    { skip: !selectedCategoryId },
  );
  console.log("asset", assets);

  // Gọi API bằng RTK Query để tạo yêu cầu
  const [createAssetRequest, { isLoading: isSubmitting, error, isSuccess }] =
    useCreateAssetRequestMutation();

  // Khi Asset Type thay đổi, cập nhật danh sách categories
  useEffect(() => {
    if (selectedAssetTypeId) {
      const selectedType = assetTypes.find(
        (type: AssetType) => type.id === selectedAssetTypeId,
      );
      if (selectedType && selectedType.categories) {
        setCategories([selectedType.categories]);
      } else {
        setCategories([]);
      }
      // Reset các lựa chọn phụ thuộc
      setSelectedCategoryId("");
      setSelectedAssetId("");
    } else {
      setCategories([]);
      setSelectedCategoryId("");
      setSelectedAssetId("");
    }
  }, [selectedAssetTypeId, assetTypes]);

  // Reset Asset khi Category thay đổi
  useEffect(() => {
    setSelectedAssetId("");
  }, [selectedCategoryId]);

  // Tự động đóng modal khi tạo yêu cầu thành công
  useEffect(() => {
    if (isSuccess) {
      onClose();
    }
  }, [isSuccess, onClose]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title) errors.title = "Title is required";
    if (!selectedAssetTypeId) errors.assetType = "Asset Type is required";
    if (!selectedCategoryId) errors.category = "Category is required";
    if (!selectedAssetId) errors.asset = "Asset is required";
    if (quantity < 1) errors.quantity = "Quantity must be at least 1";
    if (!description) errors.description = "Description is required";
    if (!startTime) errors.startTime = "Start time is required";
    if (!endTime) errors.endTime = "End time is required";

    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      errors.endTime = "End time must be after start time";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const requestData = {
      taskID: taskId,
      assetID: selectedAssetId,
      title,
      quantity,
      description,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      requestTime: new Date().toISOString(),
      requestId: "", // Server sẽ tạo requestId
    };

    try {
      await createAssetRequest(requestData).unwrap();
    } catch (err) {
      console.error("Error submitting request:", err);
    }
  };

  // Hàm hiển thị lỗi cho từng trường
  const getErrorMessage = (field: string) => {
    return validationErrors[field] ? (
      <p className="mt-1 text-sm text-red-500">{validationErrors[field]}</p>
    ) : null;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-dark-secondary">
        <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white">
          Request Asset
        </h2>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Request Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-tertiary dark:text-white"
            placeholder="Brief title for your request"
          />
          {getErrorMessage("title")}
        </div>

        {/* Asset Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Asset Type
          </label>
          <select
            value={selectedAssetTypeId}
            onChange={(e) => setSelectedAssetTypeId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-tertiary dark:text-white"
            disabled={assetTypesLoading}
          >
            <option value="">Select Asset Type</option>
            {assetTypes.map((type: AssetType) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {getErrorMessage("assetType")}
        </div>

        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-tertiary dark:text-white"
            disabled={!selectedAssetTypeId || categories.length === 0}
          >
            <option value="">Select Category</option>
            {categories.map((category: AssetCategory) => (
              <option key={category.categoryID} value={category.categoryID}>
                {category.name}
              </option>
            ))}
          </select>
          {getErrorMessage("category")}
          {selectedAssetTypeId && categories.length === 0 && (
            <p className="mt-2 text-sm text-amber-500">
              No categories available for this asset type
            </p>
          )}
        </div>

        {/* Asset Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Asset
          </label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-tertiary dark:text-white"
            disabled={assetsLoading || !selectedCategoryId}
          >
            <option value="">Select Asset</option>
            {assets.map((asset: Asset) => (
              <option key={asset.assetID} value={asset.assetID}>
                {asset.assetName}
              </option>
            ))}
          </select>
          {getErrorMessage("asset")}
          {selectedCategoryId && assets.length === 0 && !assetsLoading && (
            <p className="mt-2 text-sm text-amber-500">
              No assets available in this category
            </p>
          )}
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            min="1"
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-tertiary dark:text-white"
          />
          {getErrorMessage("quantity")}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-tertiary dark:text-white"
            placeholder="Explain why you need this asset"
          />
          {getErrorMessage("description")}
        </div>

        {/* Time Range */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-tertiary dark:text-white"
            />
            {getErrorMessage("startTime")}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-tertiary dark:text-white"
            />
            {getErrorMessage("endTime")}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-400 px-6 py-2 text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-green-500 px-6 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-3 text-sm text-red-500">
            {typeof error === "object" && "data" in error
              ? (error.data as any)?.message || "Error submitting request!"
              : "Error submitting request!"}
          </p>
        )}
      </div>
    </div>
  );
};

export default RequestAssetModal;
