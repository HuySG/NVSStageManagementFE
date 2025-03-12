"use client";
import { useState } from "react";
import { useAppSelector } from "../redux";

type AssetRequest = {
  requestId: string;
  title: string;
  quantity: number;
  description: string;
  startTime: string;
  endTime: string;
  assetID: string;
  taskID: string;
  requestTime: string;
  type: string;
  status: "Pending" | "Approved" | "Rejected";
};

const sampleRequests: AssetRequest[] = [
  {
    requestId: "1",
    title: "Laptop",
    quantity: 2,
    description: "Dùng cho lập trình",
    startTime: "2025-03-12T08:00:00Z",
    endTime: "2025-03-15T18:00:00Z",
    assetID: "A001",
    taskID: "T123",
    requestTime: "2025-03-10T10:00:00Z",
    type: "Laptop",
    status: "Pending",
  },
  {
    requestId: "2",
    title: "Projector",
    quantity: 1,
    description: "Dùng cho họp nhóm",
    startTime: "2025-03-14T10:00:00Z",
    endTime: "2025-03-14T12:00:00Z",
    assetID: "A002",
    taskID: "T456",
    requestTime: "2025-03-11T12:30:00Z",
    type: "Máy Chiếu",
    status: "Pending",
  },
];

const LeaderAssetApproval = () => {
  const [requests, setRequests] = useState<AssetRequest[]>(sampleRequests);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(
    null,
  );

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.requestId === id ? { ...req, status: "Approved" } : req,
      ),
    );
  };

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.requestId === id ? { ...req, status: "Rejected" } : req,
      ),
    );
  };
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  return (
    <div className="min-h-screen p-8 dark:bg-dark-secondary dark:text-white">
      {/* Tiêu đề */}
      <h2 className="text-2xl font-bold text-gray-900 dark:bg-dark-secondary dark:text-white">
        Welcome back!
      </h2>
      <p className="mb-4 text-gray-600 dark:bg-dark-secondary dark:text-white">
        Here’s a list of asset requests!
      </p>

      {/* Bảng yêu cầu tài sản */}
      <div className="overflow-hidden rounded-lg bg-white">
        <table className="w-full text-gray-800">
          <thead className="border-b border-gray-300 bg-gray-100">
            <tr className="text-left">
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, index) => (
              <tr
                key={index}
                className="cursor-pointer border-b border-gray-200 transition hover:bg-gray-50"
                onClick={() => setSelectedRequest(req)}
              >
                <td className="px-4 py-3 font-medium">{req.title}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-gray-200 px-2 py-1 text-sm text-gray-700">
                    {req.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{req.quantity}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-3 py-1 text-sm font-medium ${
                      req.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : req.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {req.status === "Pending" ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(req.requestId);
                        }}
                        className="rounded-md bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(req.requestId);
                        }}
                        className="ml-2 rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                      >
                        ❌ Reject
                      </button>
                    </>
                  ) : (
                    <span className="italic text-gray-500">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal hiển thị chi tiết */}
      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-1/3 rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-xl font-bold">{selectedRequest.title}</h3>
            <p className="text-gray-700">
              <strong>Type:</strong> {selectedRequest.type}
            </p>
            <p className="text-gray-700">
              <strong>Quantity:</strong> {selectedRequest.quantity}
            </p>
            <p className="text-gray-700">
              <strong>Status:</strong> {selectedRequest.status}
            </p>
            <p className="text-gray-700">
              <strong>Description:</strong> {selectedRequest.description}
            </p>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LeaderAssetApproval;
