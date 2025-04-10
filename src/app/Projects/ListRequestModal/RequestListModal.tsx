const RequestListModal = ({
  requests,
  onClose,
}: {
  requests: any[];
  onClose: () => void;
}) => {
  // Hàm ánh xạ trạng thái với màu sắc
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_LEADER":
        return "bg-yellow-100 text-yellow-800";
      case "LEADER_REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING_AM":
        return "bg-blue-100 text-blue-800";
      case "AM_APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const statusMapping: Record<string, string> = {
    PENDING_LEADER: "Pending Leader Approval",
    LEADER_APPROVED: "Leader Approved, Pending AM",
    LEADER_REJECTED: "Leader Rejected",
    PENDING_AM: "Pending Asset Manager Approval",
    AM_APPROVED: "Asset Manager Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  return (
    <div className="relative z-50 flex w-full max-w-lg flex-col rounded-lg bg-white p-6 shadow-lg dark:bg-dark-secondary">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold dark:text-white">Request List</h2>
        <button
      onClick={onClose}
      className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
      </div>

      {/* Legend for status colors */}
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium dark:text-white">Status Legend:</p>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-yellow-800 bg-yellow-100"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Pending Leader Approval
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-red-800 bg-red-100"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Leader Rejected
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-blue-800 bg-blue-100"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Pending Asset Manager Approval
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-green-800 bg-green-100"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Asset Manager Approved
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-gray-800 bg-gray-100"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Cancelled
            </span>
          </span>
        </div>
      </div>

      <div className="mt-4 max-h-96 space-y-4 overflow-y-auto">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div
              key={request.requestId}
              className={`rounded-lg border p-4 shadow-md dark:border-dark-tertiary dark:bg-dark-secondary ${getStatusColor(
                request.status,
              )}`}
            >
              <p className="text-sm dark:text-white">
                <strong>Title:</strong> {request.title}
              </p>
              <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                <strong>Description:</strong> {request.description}
              </p>
              <p className="text-sm">
                <strong>Status:</strong> {statusMapping[request.status]}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No requests found for this task.
          </p>
        )}
      </div>
    </div>
  );
};

export default RequestListModal;
