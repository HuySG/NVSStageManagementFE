import { useEffect, useState } from "react";

import {
  useGetAssetTypesQuery,
  AssetType,
  AssetCategory,
  useCreateAssetRequestCategoryMutation,
} from "@/state/api";
import { toast } from "react-toastify";

type RequestAssetCategoryModalProps = {
  taskId: string;
  onClose: () => void;
};

const RequestAssetCategoryModal = ({ taskId, onClose }: RequestAssetCategoryModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState("");
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<{
    categoryID: string;
    quantity: number;
  }[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: assetTypes = [], isLoading: assetTypesLoading } = useGetAssetTypesQuery();
  const [createCategoryRequest, { isLoading: isSubmitting, isSuccess, error }] =
    useCreateAssetRequestCategoryMutation();

  useEffect(() => {
    const selectedType = assetTypes.find((type: AssetType) => type.id === selectedAssetTypeId);
    setCategories(selectedType?.categories ?? []);
    setSelectedCategories([]);
  }, [selectedAssetTypeId, assetTypes]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Request submitted successfully!", { autoClose: 5000 });
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
      prev.map((c) => (c.categoryID === categoryId ? { ...c, quantity } : c))
    );
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) errors.title = "Title is required";
    if (!description.trim()) errors.description = "Description is required";
    if (!startTime) errors.startTime = "Start time is required";
    if (!endTime) errors.endTime = "End time is required";
    if (!selectedAssetTypeId) errors.assetType = "Asset Type is required";

    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      errors.endTime = "End time must be after start time";
    }

    if (selectedCategories.length === 0) {
      errors.categories = "Select at least one category";
    }

    selectedCategories.forEach((cat) => {
      if (cat.quantity <= 0 || !Number.isInteger(cat.quantity)) {
        errors[`quantity-${cat.categoryID}`] = "Quantity must be an integer greater than 0";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getServerErrorMessage = (error: any) => {
    if (!error) return null;

    if ("status" in error) {
      if (error.data && typeof error.data === "object" && "message" in error.data) {
        return error.data.message;
      }
      if (typeof error.data === "string") {
        return error.data;
      }
      return `Server Error: ${error.status}`;
    }

    if (error.message) {
      return error.message;
    }

    return "Something went wrong, please try again.";
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const requestData = {
      taskID: taskId,
      title,
      description,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      categories: selectedCategories.map((c) => ({ categoryID: c.categoryID, quantity: c.quantity })),
    };

    try {
      await createCategoryRequest(requestData).unwrap();
    } catch (err: any) {
      toast.error(getServerErrorMessage(err), { autoClose: 5000 });
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

        {/* Category + Quantity */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Categories
          </label>
          <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {categories.map((cat) => {
              const selected = selectedCategories.find((c) => c.categoryID === cat.categoryID);
              return (
                <div key={cat.categoryID} className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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
                        updateQuantity(cat.categoryID, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-20 rounded border border-gray-300 p-1 text-center dark:bg-dark-tertiary dark:text-white"
                    />
                  )}
                </div>
              );
            })}
          </div>
          {getErrorMessage("categories")}
          {categories.map((cat) => getErrorMessage(`quantity-${cat.categoryID}`))}
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

        {/* Buttons */}
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
      </div>
    </div>
  );
};

export default RequestAssetCategoryModal;