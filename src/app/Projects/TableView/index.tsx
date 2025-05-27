import { useAppSelector } from "@/app/redux";
import Header from "@/components/Header";
import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { dataGridClassNames, dataGridSxStyles } from "@/app/lib/utils";
import { useGetTaskMilestoneQuery } from "@/state/api";

type Props = { id: string; setIsModalNewTaskOpen: (isOpen: boolean) => void };
const columns: GridColDef[] = [
  {
    field: "title",
    headerName: "Title",
    width: 100,
  },
  {
    field: "description",
    headerName: "Description",
    width: 200,
  },
  {
    field: "status",
    headerName: "Status",
    width: 130,
    renderCell: (params) => (
      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
        {params.value}
      </span>
    ),
  },
  {
    field: "priority",
    headerName: "Priority",
    width: 75,
  },
  {
    field: "tag",
    headerName: "Tag",
    width: 130,
  },
  {
    field: "startDate",
    headerName: "Start Date",
    width: 130,
  },
  {
    field: "endDate",
    headerName: "End Date",
    width: 130,
  },

  {
    field: "assignee",
    headerName: "Assignee",
    width: 200,
    renderCell: (params) => {
      // Kiểm tra xem assigneeInfo có tồn tại không
      const assignee = params.row.assigneeInfo;

      // Trả về tên của assignee nếu có, ngược lại hiển thị "Unassigned"
      return assignee?.fullName || "Unassigned";
    },
  },
];
function TableView({ id, setIsModalNewTaskOpen }: Props) {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const {
    data: tasks,
    error,
    isLoading,
  } = useGetTaskMilestoneQuery({ projectID: id });

  if (isLoading) return <div>Loading...</div>;
  if (error || !tasks) return <div>An error occurred while fetching tasks</div>;
  return (
    <div className="h-[540px] w-full px-4 pb-8 xl:px-6">
      <div className="pt-5">
        <Header
          buttonComponent={
            <button
              className="flex items-center rounded bg-blue-primary px-3 py-2 text-white hover:bg-blue-600"
              onClick={() => setIsModalNewTaskOpen(true)}
            >
              Add Task
            </button>
          }
          isSmallText
        />
      </div>
      <DataGrid
        rows={tasks || []}
        columns={columns}
        getRowId={(row) => row.taskID} // Chỉ định taskID làm id
        className={dataGridClassNames}
        sx={dataGridSxStyles(isDarkMode)}
      />
    </div>
  );
}

export default TableView;
