import React from "react";
import { Card, CardContent } from "@mui/material";
import { useGetTasksByDepartmentQuery } from "@/state/api";

const statusColor: Record<string, string> = {
  ToDo: "bg-blue-100 text-blue-700",
  WorkInProgress: "bg-yellow-100 text-yellow-700",
  UnderReview: "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
};

const statusName: Record<string, string> = {
  ToDo: "Chờ xử lý",
  WorkInProgress: "Đang thực hiện",
  UnderReview: "Chờ duyệt",
  Completed: "Hoàn thành",
};

const DepartmentTaskCard = ({ departmentId }: { departmentId: string }) => {
  const {
    data: tasks = [],
    isLoading,
    isError,
  } = useGetTasksByDepartmentQuery(departmentId);

  const stats = React.useMemo(() => {
    return tasks.reduce(
      (acc: Record<string, number>, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [tasks]);

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">Task của phòng ban</p>
        <p className="text-lg font-semibold">
          {isLoading ? "..." : tasks.length}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(stats).map(([status, count]) => (
            <span
              key={status}
              className={`rounded px-2 py-1 text-xs font-semibold ${statusColor[status] || "bg-gray-100 text-gray-700"}`}
            >
              {statusName[status] || status}: {count}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentTaskCard;
