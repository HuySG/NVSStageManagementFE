import { useGetTasksQuery } from "@/state/api";
import { useMemo } from "react";

export const useTasksForProjects = (projectIds: string[]) => {
  const taskQueries = projectIds.map((projectId) =>
    useGetTasksQuery({ projectId }),
  );

  // Gộp tất cả tasks từ các queries
  const tasks = useMemo(
    () => taskQueries.flatMap((query) => query.data || []),
    [taskQueries],
  );

  // Kiểm tra xem có query nào đang loading hoặc bị lỗi không
  const isLoading = taskQueries.some((query) => query.isLoading);
  const isError = taskQueries.some((query) => query.isError);

  return { tasks, isLoading, isError };
};
