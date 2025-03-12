import { useState } from "react";
import { useCreateAssetRequestMutation } from "@/state/api"; // Import mutation

type RequestAssetModalProps = {
  taskId: string;
  onClose: () => void;
};

const RequestAssetModal = ({ taskId, onClose }: RequestAssetModalProps) => {
  const [assetId, setAssetId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Gọi API bằng RTK Query
  const [createAssetRequest, { isLoading, error }] =
    useCreateAssetRequestMutation();

  const handleSubmit = async () => {
    const requestData = {
      taskID: taskId,
      assetID: assetId,
      quantity,
      description,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      requestTime: new Date().toISOString(),
    };

    try {
      await createAssetRequest(requestData).unwrap();
      alert("Asset request submitted successfully!");
      onClose();
    } catch (err) {
      console.error("Error submitting request:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-dark-secondary">
        <h2 className="text-lg font-bold">Request Asset</h2>

        <label className="mt-2 block text-sm font-medium">Asset ID</label>
        <input
          type="text"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          className="w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
        />

        <label className="mt-2 block text-sm font-medium">Quantity</label>
        <input
          type="number"
          value={quantity}
          min="1"
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
        />

        <label className="mt-2 block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-20 w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
        />

        <label className="mt-2 block text-sm font-medium">Start Time</label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
        />

        <label className="mt-2 block text-sm font-medium">End Time</label>
        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded bg-gray-400 px-4 py-2 text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded bg-green-500 px-4 py-2 text-white"
          >
            {isLoading ? "Submitting..." : "Submit Request"}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-red-500">Error submitting request!</p>
        )}
      </div>
    </div>
  );
};

export default RequestAssetModal;
