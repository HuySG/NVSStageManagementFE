"use client";
import {
  useArchiveTaskMutation,
  useGetRequestsByTaskQuery,
  useGetTaskMilestoneQuery,
  useGetTasksByDepartmentQuery,
  useGetTasksByUserQuery,
  useGetUserByDepartmentQuery,
  useGetUserInfoQuery,
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
  Archive,
  CalendarDays,
  AlertTriangle,
  AlarmClock,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import EditTaskModal from "@/components/EditTaskModal";
import RequestListModal from "../ListRequestModal/RequestListModal";

type BoardProps = {
  id: string;
  setIsModaNewTasklOpen: (isOpen: boolean) => void;
  milestoneStartDate: string;
  milestoneEndDate: string;
};

const statusViMap: Record<string, string> = {
  ToDo: "Cần làm",
  WorkInProgress: "Đang làm",
  UnderReview: "Chờ duyệt",
  Completed: "Hoàn thành",
};

const taskStatus = ["ToDo", "WorkInProgress", "UnderReview", "Completed"];

const BoardView = ({
  id,
  setIsModaNewTasklOpen,
  milestoneStartDate,
  milestoneEndDate,
}: BoardProps) => {
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const { data: taskRequests } = useGetRequestsByTaskQuery(
    selectedTaskId ?? "",
    { skip: !selectedTaskId },
  );

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    setSelectedTaskId(null);
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

  const { data: currentUser } = useGetUserInfoQuery(undefined);
  const userId = currentUser?.id;
  const departmentUser = currentUser?.department?.id;
  const { data: tasksByUser } = useGetTasksByUserQuery(userId ?? "", {
    skip: !userId,
    refetchOnMountOrArgChange: true,
  });

  const userRole = currentUser?.role?.roleName || "Staff";
  // Lấy task của phòng ban (cho leader)
  const { data: tasksByDepartment } = useGetTasksByDepartmentQuery(
    departmentUser ?? "",
    {
      skip: !departmentUser || userRole !== "Leader",
    },
  );
  const tasks =
    userRole === "Leader"
      ? tasksByDepartment?.filter((task) => task.milestoneId === id) || []
      : tasksByUser?.filter((task) => task.milestoneId === id) || [];
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [updateTask] = useUpdateTaskMutation();
  const { data: users } = useGetUserByDepartmentQuery(departmentUser!);

  const moveTask = async (taskId: string, toStatus: string) => {
    await updateTaskStatus({ taskId, status: toStatus });
    refetch();
  };

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

  if (isLoading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi khi tải danh sách công việc</div>;

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2 xl:grid-cols-4">
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
              milestoneStartDate={milestoneStartDate}
              milestoneEndDate={milestoneEndDate}
            />
          </div>
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

  const columnRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (columnRef.current) drop(columnRef.current);
  }, [drop]);

  const tasksCount = tasks.length;
  const statusColor: any = {
    ToDo: "#2563EB",
    WorkInProgress: "#059669",
    UnderReview: "#D97706",
    Completed: "#000000",
  };
  return (
    <div
      ref={columnRef}
      className={`min-h-[320px] rounded-lg py-2 xl:px-2 ${
        isOver ? "bg-blue-50 shadow-lg dark:bg-neutral-950" : ""
      }`}
    >
      <div className="mb-3 flex w-full">
        <div
          className={`w-2 rounded-s-lg`}
          style={{ backgroundColor: statusColor[status] }}
        />
        <div className="flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4 shadow dark:bg-dark-secondary">
          <h3 className="flex items-center text-lg font-semibold dark:text-white">
            {statusViMap[status] || status}
            <span
              className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary"
              style={{ minWidth: 24 }}
            >
              {tasksCount}
            </span>
          </h3>
          <button
            className="flex items-center justify-center rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-700"
            onClick={() => setIsModaNewTasklOpen(true)}
            title="Thêm công việc"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        {tasks.map((task) => (
          <Task
            key={task.taskID}
            task={task}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
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

  const [archiveTask] = useArchiveTaskMutation();
  const taskRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (taskRef.current) drop(taskRef.current);
  }, [drop]);

  const { data: taskRequests } = useGetRequestsByTaskQuery(task.taskID);
  const hasRequests = taskRequests && taskRequests.length > 0;
  const taskTagsSplit = task.tag ? task.tag.split(",") : [];
  const formattedStartDate = task.startDate
    ? format(new Date(task.startDate), "dd/MM/yyyy")
    : "";
  const formattedDueDate = task.endDate
    ? format(new Date(task.endDate), "dd/MM/yyyy")
    : "";

  const now = new Date();
  const due = task.endDate ? new Date(task.endDate) : null;
  const isDueSoon =
    due &&
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 2 &&
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) >= 0;
  const isOverdue = due && due < now;

  const [showOptions, setShowOptions] = useState(false);

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
      {priority === "Urgent" && "Khẩn cấp"}
      {priority === "High" && "Cao"}
      {priority === "Medium" && "Trung bình"}
      {priority === "Low" && "Thấp"}
      {!(
        priority === "Urgent" ||
        priority === "High" ||
        priority === "Medium" ||
        priority === "Low"
      ) && priority}
    </div>
  );

  return (
    <div
      ref={taskRef}
      className={`mb-4 rounded-lg bg-white shadow-md transition hover:shadow-lg dark:bg-dark-secondary ${
        isDragging ? "opacity-50" : "opacity-100"
      } cursor-pointer`}
      style={
        hasRequests
          ? {
              border: "1.5px solid #fb923c",
              boxShadow: "0 2px 6px rgba(251,146,60,0.13)",
              borderRadius: "10px",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }
          : {
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "10px",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }
      }
      onClick={() => onEditTask(task)}
    >
      <div className="relative p-5 md:p-6">
        {/* Dòng đầu: Badge request tài sản + menu ba chấm */}
        <div className="mb-2 flex items-center justify-between">
          {hasRequests ? (
            <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
              <svg
                width="15"
                height="15"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block text-orange-500"
              >
                <path
                  d="M12 4V20M12 20L18 14M12 20L6 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Đã gửi yêu cầu tài sản
              <span className="ml-1 font-bold">{taskRequests?.length}</span>
            </span>
          ) : (
            <div />
          )}
          <div className="relative">
            <button
              className="text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
            >
              <EllipsisVertical size={24} />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-7 z-50 w-40 rounded-md border bg-white shadow-lg dark:border-dark-secondary dark:bg-dark-secondary">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.taskID);
                    setShowOptions(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-dark-tertiary"
                >
                  <Trash2 size={18} />
                  Xóa công việc
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
                  Lưu trữ công việc
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Tiêu đề */}
        <div className="my-2">
          <h4 className="text-md break-words font-bold dark:text-white">
            {task.title}
          </h4>
        </div>
        {/* Mô tả */}
        {task.description && (
          <div className="mb-1">
            <span className="line-clamp-2 text-sm text-gray-600 dark:text-neutral-500">
              {task.description}
            </span>
          </div>
        )}
        {/* Ngày tháng & badge deadline */}
        <div className="mb-2 flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-blue-700">
            <CalendarDays className="h-4 w-4" />
            {formattedStartDate}
          </span>
          <span className="font-bold text-gray-400">–</span>
          <span className="flex items-center gap-1 text-xs text-red-600">
            <CalendarDays className="h-4 w-4" />
            {formattedDueDate}
          </span>
          {isOverdue && (
            <span className="ml-2 flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              <AlertTriangle className="h-3 w-3" /> Quá hạn
            </span>
          )}
          {isDueSoon && !isOverdue && (
            <span className="ml-2 flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
              <AlarmClock className="h-3 w-3" /> Sắp hết hạn
            </span>
          )}
        </div>
        {/* Tag & ưu tiên */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {task.priority && <PriorityTag priority={task.priority} />}
          {taskTagsSplit.map((tag) => (
            <div
              key={tag}
              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold"
            >
              {tag}
            </div>
          ))}
        </div>
        {/* File đính kèm */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mb-2 space-y-2">
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
                    <div className="relative h-32 w-full overflow-hidden rounded-lg">
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
                      className="h-32 w-full rounded border"
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
        {/* Divider */}
        <div className="mt-3 border-t border-gray-200 dark:border-stroke-dark" />
        {/* Footer: assignee, comment */}
        <div className="mt-2 flex items-center justify-between">
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
                Chưa phân công
              </div>
            )}
          </div>
          <div className="flex items-center text-gray-500 dark:text-neutral-500">
            <MessageSquareMore size={20} />
            <span className="ml-1 text-sm dark:text-neutral-400">
              {task.comments ? task.comments.length : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardView;
