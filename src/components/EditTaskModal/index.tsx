import { AssigneeInfo, Status, TaskUser, Watcher } from "@/state/api";
import { Task as TaskType } from "@/state/api";
import { useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import RequestAssetModal from "../RequestAssetModal/RequestAssetModal";

type EditTaskModalProps = {
  task: TaskType;
  users: AssigneeInfo[];
  onClose: () => void;
  onSave: (updatedTask: Partial<TaskType>) => void;
};

const EditTaskModal = ({
  task,
  users,
  onClose,
  onSave,
}: EditTaskModalProps) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskType["priority"]>(task.priority);
  const [startDate, setStartDate] = useState(
    task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "",
  );
  const [endDate, setEndDate] = useState(
    task.endDate ? format(new Date(task.endDate), "yyyy-MM-dd") : "",
  );
  const [tags, setTags] = useState(task.tag || "");
  const [status, setStatus] = useState(task.status || "");
  const [assigneeinfo, setAssigneeinfo] = useState<AssigneeInfo | undefined>(
    task.assigneeInfo ?? undefined,
  );

  const [newComment, setNewComment] = useState("");

  const [watchers, setWatcher] = useState(task.watchers || []);

  const [milestoneId, setMilestoneId] = useState(task.milestoneId || "");
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [newAttachment, setNewAttachment] = useState<File | null>(null);

  // Hàm xử lý người dùng được gán việc
  const handleAddUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = e.target.value;
    const selectedUser = users.find((user) => user.id === selectedUserId);

    if (selectedUser) {
      setAssigneeinfo(selectedUser); // Chỉ gán một người
    }
  };

  const handleRemoveUser = () => {
    setAssigneeinfo(undefined); // Xóa người nhận task
  };

  // Hàm xử lý người theo dõi
  const handleAddWatcher = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = e.target.value;
    const selectedUser = users.find((user) => user.id === selectedUserId);

    if (selectedUser && !watchers.some((w) => w.userID === selectedUserId)) {
      // Chuyển đổi từ TaskUser sang Watcher
      const newWatcher: Watcher = {
        userID: selectedUser.id,
        fullName: selectedUser.fullName || "", // Xử lý trường hợp undefined
        dayOfBirth: selectedUser.dayOfBirth || "",
        email: selectedUser.email || "",
        pictureProfile: selectedUser.pictureProfile || "",
      };

      setWatcher([...watchers, newWatcher]);
    }
  };

  const handleRemoveWatcher = (userIdToRemove: string) => {
    setWatcher(watchers.filter((user) => user.userID !== userIdToRemove));
  };

  const handleSave = () => {
    onSave({
      title,
      description,
      priority,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      tag: tags,
      status,
      watchers: watchers,
      assigneeID: assigneeinfo?.id || "", // Lưu người được giao task
      assigneeInfo: assigneeinfo, // Lưu người được giao task
      milestoneId,
      attachments,
      updateDate: new Date().toISOString(), // Tự động cập nhật ngày chỉnh sửa
    });
  };

  const isChanged =
    title !== task.title ||
    description !== task.description ||
    priority !== task.priority ||
    startDate !==
      (task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "") ||
    endDate !==
      (task.endDate ? format(new Date(task.endDate), "yyyy-MM-dd") : "") ||
    tags !== task.tag ||
    status !== task.status ||
    milestoneId !== task.milestoneId ||
    attachments.length !== (task.attachments?.length || 0) ||
    watchers.length !== (task.watchers?.length || 0) ||
    watchers.some(
      (user, index) => user.userID !== task.watchers?.[index]?.userID,
    );
  assigneeinfo?.id !== task.assigneeInfo?.id; // Không còn lỗi nul
  const [isRequestAssetOpen, setIsRequestAssetOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 dark:bg-dark-secondary">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Task Details */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24 w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
            />
          </div>
          {/* Status */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
            >
              <option value={Status.ToDo}>To Do</option>
              <option value={Status.WorkInProgress}>Work In Progress</option>
              <option value={Status.UnderReview}>Under Review</option>
              <option value={Status.Completed}>Completed</option>
            </select>
          </div>
          {/* Assigner */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Assigned To
            </label>
            <select
              onChange={handleAddUser}
              className="mt-2 w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
              value={assigneeinfo?.id || ""}
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>

            {assigneeinfo && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-200 px-3 py-1">
                <span>{assigneeinfo.fullName}</span>
                <button onClick={handleRemoveUser} className="text-red-500">
                  ❌
                </button>
              </div>
            )}
          </div>

          {/* Watchers */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Watchers
            </label>
            <select
              onChange={handleAddWatcher}
              className="mt-2 w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
            >
              <option value="">Add Watcher</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>

            <div className="mt-2 space-y-2">
              {watchers.map((user) => (
                <div
                  key={user.userID}
                  className="flex items-center justify-between rounded-lg bg-gray-200 px-3 py-1"
                >
                  <span>{user.fullName}</span>
                  <button
                    onClick={() => handleRemoveWatcher(user.userID)}
                    className="text-red-500"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as TaskType["priority"])
              }
              className="w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Date Fields */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium dark:text-white">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium dark:text-white">
                Due Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
              />
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Comments
            </label>
            <div className="rounded border p-2 dark:bg-dark-tertiary dark:text-white">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No comments yet.
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full rounded border p-2 dark:bg-dark-tertiary dark:text-white"
              />
              <button className="rounded bg-blue-500 px-3 text-white">
                Add
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded bg-gray-400 px-4 py-2 text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsRequestAssetOpen(true)}
              className="rounded bg-green-500 px-4 py-2 text-white"
            >
              Request Asset
            </button>
            <button
              onClick={handleSave}
              disabled={!isChanged} // Chỉ cho phép click khi có thay đổi
              className={`rounded px-4 py-2 text-white ${
                isChanged
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "cursor-not-allowed bg-gray-400"
              }`}
              title={!isChanged ? "No changes detected ❌" : ""}
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Hiển thị Modal Request Asset khi mở */}
        {isRequestAssetOpen && (
          <RequestAssetModal
            taskId={task.taskID}
            onClose={() => setIsRequestAssetOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default EditTaskModal;
