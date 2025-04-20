import {
  AssigneeInfo,
  TaskUser,
  useArchiveTaskMutation,
  useGetRequestsByTaskQuery,
  useGetTaskMilestoneQuery,
  useGetTasksByUserQuery,
  useGetUserByDepartmentQuery,
  useGetUserInfoQuery,
  useGetUsersQuery,
  User,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
} from "@/state/api";
import React, { useEffect, useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Task as TaskType } from "@/state/api";
import {
  EllipsisVertical,
  MessageSquareMore,
  Plus,
  Trash2,
  X,
  Archive,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import EditTaskModal from "@/components/EditTaskModal";
import { useSearchParams } from "next/navigation";
import RequestListModal from "../ListRequestModal/RequestListModal";

type BoardProps = {
  id: string;
  setIsModaNewTasklOpen: (isOpen: boolean) => void;
};
const taskStatus = ["ToDo", "WorkInProgress", "UnderReview", "Completed"];

const BoardView = ({ id, setIsModaNewTasklOpen }: BoardProps) => {
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const { data: taskRequests, isLoading: isLoadingRequests } =
    useGetRequestsByTaskQuery(
      selectedTaskId ?? "",
      { skip: !selectedTaskId }, // Chỉ fetch khi có taskId
    );

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsRequestModalOpen(true); // Mở modal
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    setSelectedTaskId(null); // Reset taskId
  };

  const {
    data: tasksByMilestone,
    isLoading,
    error,
    refetch,
  } = useGetTaskMilestoneQuery(
    { projectID: id },
    { refetchOnMountOrArgChange: true },
  );

  console.log("id:", id);

  const { data: currentUser } = useGetUserInfoQuery(undefined);
  const userId = currentUser?.id;
  console.log("Current User ID:", userId);
  const departmentUser = currentUser?.department?.id;
  const { data: tasksByUser, error: userTasksError } = useGetTasksByUserQuery(
    userId ?? "",
    { skip: !userId, refetchOnMountOrArgChange: true },
  );

  const userRole = currentUser?.role?.roleName || "Staff"; // Lấy role của user, mặc định là Member
  const tasks =
    userRole === "Leader"
      ? tasksByMilestone
      : tasksByUser?.filter((task) => task.milestoneId === id) || [];
  console.log("User Role:", userRole);
  console.log("Tasks by Milestone:", tasksByMilestone);
  console.log("Tasks by User:", tasksByUser);
  console.log("User Role:", userRole);
  console.log("Tasks:", tasks);
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [updateTask] = useUpdateTaskMutation();
  const { data: users } = useGetUserByDepartmentQuery(departmentUser!);
  console.log("Users data:", users);
  const moveTask = async (taskId: string, toStatus: string) => {
    await updateTaskStatus({ taskId, status: toStatus });
    refetch(); // Fetch lại danh sách task ngay sau khi update
  };
  console.log("Tasks data:", tasks);

  const handleTaskEdit = async (updatedTask: Partial<TaskType>) => {
    if (editingTask) {
      await updateTask({
        taskID: editingTask.taskID,
        ...updatedTask,
      });
      setEditingTask(null);
      refetch();
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occured while fetching tasks</div>;

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          {taskStatus.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasks?.filter((task) => task.status === status) || []}
              moveTask={moveTask}
              setIsModaNewTasklOpen={setIsModaNewTasklOpen}
              onEditTask={(task) => {
                setEditingTask(task);
                handleTaskClick(task.taskID);
              }}
              onDeleteTask={async (taskId) => {
                await updateTask({ taskID: taskId, status: "Deleted" });
                refetch();
              }}
            />
          ))}
        </div>
      </DndProvider>

      {editingTask && (
        <div className="fixed inset-0 z-40 flex items-start justify-between backdrop-blur-sm">
          {/* Modal Task Detail */}
          <div className="flex-shrink-0">
            <EditTaskModal
              task={editingTask}
              users={
                users
                  ? users.map((user) => ({
                      id: user.id,
                      fullName: user.fullName || "",
                      dayOfBirth: user.dayOfBirth || "",
                      email: user.email,
                      password: user.password,
                      department: user.department,
                      pictureProfile: user.pictureProfile || "",
                      createDate: user.createDate,
                      role: user.role || { id: 0, roleName: "Unknown" },
                      status: user.status,
                      taskUsers: user.TaskUser || [],
                    }))
                  : []
              }
              onClose={() => setEditingTask(null)}
              onSave={handleTaskEdit}
            />
          </div>
          {/* Modal List Request */}
          {isRequestModalOpen && (
            <div className="mr-12 mt-16 flex-shrink-0">
              <RequestListModal
                requests={taskRequests || []}
                onClose={closeRequestModal}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
type TaskColumnProps = {
  status: string;
  tasks: TaskType[];
  moveTask: (taskId: string, toStatus: string) => void;
  setIsModaNewTasklOpen: (isOpen: boolean) => void;
  onEditTask: (task: TaskType) => void;
  onDeleteTask: (taskId: string) => void;
};
const TaskColumn = ({
  status,
  tasks,
  moveTask,
  setIsModaNewTasklOpen,
  onEditTask,
  onDeleteTask,
}: TaskColumnProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "task",
    drop: (item: { id: string }) => moveTask(item.id, status),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  const tasksCount = tasks.filter((task) => task.status === status).length;
  const statusColor: any = {
    ToDo: "#2563EB",
    WorkInProgress: "#059669",
    UnderReview: "#D97706",
    Completed: "#000000",
  };
  return (
    <div
      ref={(instance) => {
        drop(instance);
      }}
      className={`sl:py-4 rounded-lg py-2 xl:px-2 ${isOver ? "bg-blue-100 dark:bg-neutral-950" : ""}`}
    >
      <div className="mb-3 flex w-full">
        <div
          className={`w-2 !bg-[${statusColor[status]}] rounded-s-lg`}
          style={{ backgroundColor: statusColor[status] }}
        />
        <div className="flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4 dark:bg-dark-secondary">
          <h3 className="flex items-center text-lg font-semibold dark:text-white">
            {status}{" "}
            <span
              className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary"
              style={{ width: "1.5rem", height: "1.5rem" }}
            >
              {tasksCount}
            </span>
          </h3>
          <div className="flex items-center gap-1">
            <button className="flex h-6 w-5 items-center justify-center dark:text-neutral-500">
              <EllipsisVertical size={26} />
            </button>
            <button
              className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 dark:bg-dark-tertiary dark:text-white"
              onClick={() => setIsModaNewTasklOpen(true)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {tasks
        .filter((task) => task.status === status)
        .map((task) => (
          <Task
            key={task.taskID}
            task={task}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
    </div>
  );
};

type TaskProps = {
  task: TaskType;
  onEditTask: (task: TaskType) => void;
  onDeleteTask: (taskId: string) => void;
};
const Task = ({ task, onEditTask, onDeleteTask }: TaskProps) => {
  const [{ isDragging }, drop] = useDrag(() => ({
    type: "task",
    item: { id: task.taskID },
    collect: (monitor: any) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  const {
    data: taskRequests,
    isLoading,
    error,
  } = useGetRequestsByTaskQuery(task.taskID);

  const hasRequests = taskRequests && taskRequests.length > 0;

  const taskTagsSplit = task.tag ? task.tag.split(",") : [];
  const formattedStartDate = task.startDate
    ? format(new Date(task.startDate), "P")
    : "";
  [];
  const formattedDueDate = task.endDate
    ? format(new Date(task.endDate), "P")
    : "";
  const [showOptions, setShowOptions] = useState(false);
  const [archiveTask] = useArchiveTaskMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handleArchiveTask = async (taskId: string) => {
    try {
      await archiveTask({ taskId }).unwrap();
      setErrorMessage(null);
      alert("Task archived successfully!");
    } catch (error: any) {
      console.error("Error archiving task:", error);
      if (error.data?.error) {
        setErrorMessage(error.data.error);
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    }
  };
  const searchParams = useSearchParams();

  const taskRef = useRef<HTMLDivElement | null>(null); // 🔹 Xác định kiểu dữ liệu
  const highlightedTaskId = searchParams.get("taskId");

  useEffect(() => {
    if (task.taskID === highlightedTaskId && taskRef.current) {
      taskRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedTaskId]);

  // const numberOfComments = (task.comments && task.comments.length) || 0;
  const PriorityTag = ({ priority }: { priority: TaskType["priority"] }) => (
    <div
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        priority === "Urgent"
          ? "bg-red-200 text-red-700"
          : priority === "High"
            ? "bg-yellow-200 text-yellow-700"
            : priority === "Medium"
              ? "bg-green-200 text-green-700"
              : priority === "Low"
                ? "bg-blue-200 text-blue-700"
                : "bg-gray-200 text-gray-700"
      }`}
    >
      {priority}
    </div>
  );
  return (
    <div
      ref={(instance) => {
        taskRef.current = instance; // Lưu vào ref
        drop(instance);
      }}
      className={`mb-4 rounded-lg bg-white shadow-md transition hover:shadow-lg dark:bg-dark-secondary ${
        isDragging ? "opacity-50" : "opacity-100"
      } cursor-pointer`}
      style={
        hasRequests
          ? {
              border: "1px solid rgba(255, 77, 79, 0.6)", // Viền đỏ nhẹ hơn
              boxShadow: "0 2px 6px rgba(255, 77, 79, 0.2)", // Hiệu ứng bóng mờ nhẹ
              borderRadius: "10px", // Bo góc mềm mại hơn
              transition: "border-color 0.3s ease, box-shadow 0.3s ease", // Hiệu ứng mượt khi thay đổi
            }
          : {
              border: "1px solid rgba(0, 0, 0, 0.1)", // Viền mặc định nhẹ
              borderRadius: "10px", // Bo góc mềm mại hơn
              transition: "border-color 0.3s ease, box-shadow 0.3s ease", // Hiệu ứng mượt khi thay đổi
            }
      }
      onClick={() => onEditTask(task)}
    >
      {" "}
      <div
        className={`task-item rounded border p-2 ${
          task.taskID === highlightedTaskId ? "border-yellow-700" : ""
        }`}
      >
        <div className="p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {task.priority && <PriorityTag priority={task.priority} />}
              <div className="flex gap-2">
                {taskTagsSplit.map((tag) => (
                  <div
                    key={tag}
                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
            {/* Dropdown Menu */}
            <div className="relative">
              {/* Nút bấm mở menu */}
              <button
                className="text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(!showOptions);
                }}
              >
                <EllipsisVertical size={26} />
              </button>

              {/* Hiển thị menu khi showOptions = true */}
              {showOptions && (
                <div className="absolute right-0 top-full mt-2 w-40 rounded-md border bg-white shadow-lg dark:border-dark-secondary dark:bg-dark-secondary">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.taskID);
                      setShowOptions(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-dark-tertiary"
                  >
                    <Trash2 size={18} />
                    Delete Task
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveTask({ taskId: task.taskID });
                      setShowOptions(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-blue-500 hover:bg-gray-100 dark:hover:bg-dark-tertiary"
                  >
                    <Archive size={18} />
                    Archive Task
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Task Title */}
          <div className="my-3 flex justify-between">
            <h4 className="text-md font-bold dark:text-white">{task.title}</h4>
          </div>

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {task.attachments.map((attachment) => {
                const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(
                  attachment.fileUrl,
                );
                const isPDF = /\.pdf$/i.test(attachment.fileUrl);

                return (
                  <div
                    key={String(attachment.attachmentId)}
                    className="rounded-lg border p-2 shadow transition hover:bg-gray-100 dark:hover:bg-dark-tertiary"
                  >
                    {isImage ? (
                      <div className="relative h-48 w-full overflow-hidden rounded-lg">
                        <Image
                          src={attachment.fileUrl}
                          alt={attachment.fileName}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-lg transition-transform hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder-image.png";
                          }}
                        />
                      </div>
                    ) : isPDF ? (
                      <iframe
                        src={attachment.fileUrl}
                        className="h-48 w-full rounded border"
                        title={attachment.fileName}
                      />
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg bg-gray-200 p-2 dark:bg-dark-secondary">
                        📄
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline transition hover:text-blue-700"
                        >
                          {attachment.fileName}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Task Description */}
          <p className="mt-2 text-sm text-gray-600 dark:text-neutral-500">
            {task.description}
          </p>

          {/* Task Date */}
          <div className="mt-2 text-xs text-gray-500 dark:text-neutral-500">
            {formattedStartDate && <span>{formattedStartDate} - </span>}
            {formattedDueDate && <span>{formattedDueDate}</span>}
          </div>

          {/* Divider */}
          <div className="mt-4 border-t border-gray-200 dark:border-stroke-dark" />

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            {/* Assignee */}
            <div className="flex -space-x-2 overflow-hidden">
              {task?.assigneeInfo ? (
                <Image
                  key={task.assigneeInfo.id}
                  src={
                    task.assigneeInfo.pictureProfile
                      ? `/${task.assigneeInfo.pictureProfile}`
                      : "/default-avatar.png"
                  }
                  alt={task.assigneeInfo.fullName || "User"}
                  width={35}
                  height={35}
                  className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-md dark:border-dark-secondary"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium shadow-md dark:border-dark-secondary dark:bg-dark-tertiary">
                  Null
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="flex items-center text-gray-500 dark:text-neutral-500">
              <MessageSquareMore size={20} />
              <span className="ml-1 text-sm dark:text-neutral-400">
                {task.comments ? task.comments.length : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardView;
