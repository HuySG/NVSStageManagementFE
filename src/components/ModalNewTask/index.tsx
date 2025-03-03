"use client";
import {
  Priority,
  Status,
  TaskUser,
  useCreateTaskMutation,
  useGetUsersQuery,
} from "@/state/api";
import { formatISO } from "date-fns";
import React, { useState } from "react";
import Modal from "../Modal";
import { useParams } from "next/navigation";

type Props = { isOpen: boolean; onClose: () => void; id?: string | null };

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const { data: users, isLoading: isLoadingUsers } = useGetUsersQuery();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState<Priority>(Priority.Backlog);
  const [tag, setTag] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assignedUsers, setAssignedUsers] = useState<TaskUser[]>([]);
  const params = useParams();

  // Lấy projectId từ URL, đảm bảo kiểu dữ liệu là string
  const projectIdFromUrl = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  // Nếu `id` không null, dùng `id`, ngược lại dùng `projectIdFromUrl`
  const projectId = id !== null ? id : projectIdFromUrl || "";

  const handleSubmit = async () => {
    if (!title || !(id !== null || projectId)) return;

    const formattedStartDate = formatISO(new Date(startDate), {
      representation: "date",
    });
    const formattedDueDate = formatISO(new Date(endDate), {
      representation: "date",
    });
    const assignedUsersFormatted = assignedUsers.map((user) => ({
      userID: user.userID,
      fullName: user.fullName,
      dayOfBirth: user.dayOfBirth,
      email: user.email,
      pictureProfile: user.pictureProfile,
    }));

    await createTask({
      taskID: "", // BE sẽ tự sinh ID
      title,
      description,
      status,
      priority,
      tag,
      startDate: formattedStartDate,
      endDate: formattedDueDate,
      assignedUsers: assignedUsersFormatted,
      attachments: "",
      content: "",
      projectId,
    });
  };
  const isFormValid = () => {
    return !!title && !!(id !== null || projectId);
  };

  const selectStyles =
    "mb-4 block w-full rounded border border-gray-300 px-3 py-2 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Task">
      <form
        className="mt-4 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input
          type="text"
          className={inputStyles}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={inputStyles}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
          <select
            className={selectStyles}
            value={status}
            onChange={(e) =>
              setStatus(Status[e.target.value as keyof typeof Status])
            }
          >
            <option value="">Select Status</option>
            <option value={Status.ToDo}>To Do</option>
            <option value={Status.WorkInProgress}>Work In Progress</option>
            <option value={Status.UnderReview}>Under Review</option>
            <option value={Status.Completed}>Completed</option>
          </select>
          <select
            className={selectStyles}
            value={priority}
            onChange={(e) =>
              setPriority(Priority[e.target.value as keyof typeof Priority])
            }
          >
            <option value="">Select Priority</option>
            <option value={Priority.Urgent}>Urgent</option>
            <option value={Priority.High}>High</option>
            <option value={Priority.Medium}>Medium</option>
            <option value={Priority.Low}>Low</option>
            <option value={Priority.Backlog}>Backlog</option>
          </select>
        </div>
        <input
          type="text"
          className={inputStyles}
          placeholder="Tags (comma separated)"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
          <input
            type="date"
            className={inputStyles}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className={inputStyles}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <select
          className="w-full rounded border border-gray-300 p-2 dark:bg-dark-tertiary dark:text-white"
          value={assignedUsers.map((u) => u.userID)}
          onChange={(e) => {
            const selectedUser = users?.find(
              (user) => user.id === e.target.value,
            );
            if (
              selectedUser &&
              !assignedUsers.some((u) => u.userID === selectedUser.id)
            )
              if (selectedUser) {
                const newTaskUser: TaskUser = {
                  userID: selectedUser.id ?? "", // Nếu không có userID, gán giá trị mặc định
                  fullName: selectedUser.fullName,
                  dayOfBirth: selectedUser.dayOfBirth || "",
                  email: selectedUser.email || "",
                  pictureProfile: selectedUser.pictureProfile || "",
                };

                setAssignedUsers([...assignedUsers, newTaskUser]);
              }
          }}
        >
          <option value="">Select Assignee</option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName} {/* 🟢 Hiển thị Full Name */}
            </option>
          ))}
        </select>
        <div>
          {assignedUsers.map((user) => (
            <div key={user.userID} className="flex items-center gap-2">
              <span>{user.fullName}</span>
              <button
                type="button"
                className="text-red-500"
                onClick={() =>
                  setAssignedUsers(
                    assignedUsers.filter((u) => u.userID !== user.userID),
                  )
                }
              >
                ❌
              </button>
            </div>
          ))}
        </div>
        {id === null && (
          <input
            type="text"
            className={inputStyles}
            placeholder="ProjectId"
            value={projectId}
            onChange={(e) => {
              console.log("Project ID nhập vào:", e.target.value);
            }}
          />
        )}
        <button
          type="submit"
          className={`focus-offset-2 mt-4 flex w-full justify-center rounded-md border border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            !isFormValid() || isLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTask;
