import { useEffect, useState } from "react";
import {
  useGetAssetTypesQuery,
  AssetType,
  AssetCategory,
  useCreateAssetRequestCategoryMutation,
} from "@/state/api";

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const { data: assetTypes = [], isLoading: assetTypesLoading } =
    useGetAssetTypesQuery();

  const [createCategoryRequest, { isLoading: isSubmitting, isSuccess, error }] =
    useCreateAssetRequestCategoryMutation();

  // Cập nhật categories khi chọn Asset Type
  useEffect(() => {
    const selectedType = assetTypes.find(
      (type: AssetType) => type.id === selectedAssetTypeId,
    );
    setCategories(selectedType?.categories ?? []);
    setSelectedCategories([]);
  }, [selectedAssetTypeId, assetTypes]);

  // Tự động đóng modal khi thành công
  useEffect(() => {
    if (isSuccess) onClose();
  }, [isSuccess, onClose]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title) errors.title = "Title is required";
    if (!description) errors.description = "Description is required";
    if (!startTime) errors.startTime = "Start time is required";
    if (!endTime) errors.endTime = "End time is required";
    if (!selectedAssetTypeId) errors.assetType = "Asset Type is required";
    if (selectedCategories.length === 0)
      errors.categories = "Select at least one category";

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
      title,
      description,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      categories: selectedCategories.map((id) => ({
        categoryID: id,
        quantity: 1,
      })),
    };

    try {
      await createCategoryRequest(requestData).unwrap();
    } catch (err) {
      console.error("Error submitting category request:", err);
    }
  };

  const getErrorMessage = (field: string) => {
    return validationErrors[field] ? (
      <p className="mt-1 text-sm text-red-500">{validationErrors[field]}</p>
    ) : null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-dark-secondary">
        <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white">
          Request Asset by Category
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
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 dark:bg-dark-tertiary dark:text-white"
          />
          {getErrorMessage("title")}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 dark:bg-dark-tertiary dark:text-white"
          />
          {getErrorMessage("description")}
        </div>

        {/* Asset Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Asset Type
          </label>
          <select
            value={selectedAssetTypeId}
            onChange={(e) => setSelectedAssetTypeId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 dark:bg-dark-tertiary dark:text-white"
            disabled={assetTypesLoading}
          >
            <option value="">Select Asset Type</option>
            {assetTypes.map((type) => (
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
            Categories
          </label>
          <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {categories.map((cat) => (
              <label
                key={cat.categoryID}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.categoryID)}
                  onChange={() => toggleCategory(cat.categoryID)}
                  className="accent-blue-600"
                />
                {cat.name}
              </label>
            ))}
          </div>
          {getErrorMessage("categories")}
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
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 dark:bg-dark-tertiary dark:text-white"
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
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 dark:bg-dark-tertiary dark:text-white"
            />
            {getErrorMessage("endTime")}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-400 px-6 py-2 text-white hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-green-500 px-6 py-2 text-white hover:bg-green-600"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-3 text-sm text-red-500">
            {(error as any)?.data?.message || "Error submitting request!"}
          </p>
        )}
      </div>
    </div>
  );
};

export default RequestAssetCategoryModal;
