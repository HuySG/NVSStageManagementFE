import { useMemo } from "react";
import { useGetTasksQuery } from "@/state/api";

const useGetAllTasks = (projectIds: string[]) => {
  // Chuyển projectIds thành một chuỗi để truyền vào query
  const projectIdString = useMemo(() => projectIds.join(","), [projectIds]);

  // Gọi API chỉ một lần với danh sách projectIds
  const { data, isLoading } = useGetTasksQuery({ projectId: projectIdString });

  // Gom tất cả tasks lại thành danh sách duy nhất
  const tasks = useMemo(() => data || [], [data]);

  return { tasks, isLoading };
};

export default useGetAllTasks;
