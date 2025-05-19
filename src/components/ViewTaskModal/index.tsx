import { useGetTaskByIdQuery } from "@/state/api";
import type { Task } from "@/state/api";
import React from "react";

interface ViewTaskModalProps {
  taskId: string;
  open: boolean;
  onClose: () => void;
}

export default function ViewTaskModal({
  taskId,
  open,
  onClose,
}: ViewTaskModalProps) {
  const {
    data: task,
    isLoading,
    isError,
  } = useGetTaskByIdQuery(taskId, {
    skip: !open,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          className="absolute right-4 top-3 text-2xl text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Đóng"
        >
          ×
        </button>

        <h2 className="mb-5 text-2xl font-bold text-gray-800">
          Chi tiết nhiệm vụ
        </h2>

        {isLoading ? (
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        ) : isError || !task ? (
          <p className="text-red-500">Không thể tải thông tin nhiệm vụ.</p>
        ) : (
          <div className="space-y-4 text-sm text-gray-700">
            <DetailRow label="Tiêu đề" value={task.title} />
            <DetailRow label="Mô tả" value={task.description || "Không có"} />
            <DetailRow
              label="Ngày bắt đầu"
              value={
                task.startDate
                  ? new Date(task.startDate).toLocaleDateString()
                  : "Không rõ"
              }
            />
            <DetailRow
              label="Ngày kết thúc"
              value={
                task.endDate
                  ? new Date(task.endDate).toLocaleDateString()
                  : "Không rõ"
              }
            />
            <DetailRow label="Trạng thái" value={task.status} />

            {task.assigneeInfo && (
              <DetailRow
                label="Người thực hiện"
                value={task.assigneeInfo.fullName}
              />
            )}
            {task.attachments?.length! > 0 && (
              <div>
                <p className="mb-1 font-medium text-gray-800">Tệp đính kèm:</p>
                <ul className="list-inside list-disc text-sm text-blue-600">
                  {task.attachments!.map((file, i) => (
                    <li key={i}>
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {file.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 👇 Helper component
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
      <span className="w-32 shrink-0 font-medium text-gray-800">{label}:</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
