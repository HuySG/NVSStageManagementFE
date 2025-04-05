import {
  AssigneeInfo,
  Status,
  TaskUser,
  useUploadFileMetadataMutation,
  Watcher,
} from "@/state/api";
import { Task as TaskType } from "@/state/api";
import { useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import RequestAssetModal from "../RequestAssetModal";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebaseConfig";
import AssetRequestSelector from "../AssetRequestSelector";
import { toast } from "react-toastify";

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
  const [uploadFileMetadata] = useUploadFileMetadataMutation(); // Gọi mutation từ RTK Query

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

  const handleUploadFile = async () => {
    if (!newAttachment) {
      toast.warning("Please select a file to upload.");
      return;
    }

    const storageRef = ref(storage, `attachments/${newAttachment.name}`);
    const uploadTask = uploadBytesResumable(storageRef, newAttachment);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload progress: ${progress.toFixed(2)}%`);
      },
      (error) => {
        console.error("Upload failed:", error);
        toast.error("File upload failed. Please try again!");
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log("File uploaded:", downloadURL);

        const newFile = {
          fileName: newAttachment.name,
          fileUrl: downloadURL,
          taskId: task.taskID,
          uploadedById: assigneeinfo?.id || "",
        };

        try {
          await uploadFileMetadata(newFile).unwrap();
          toast.success("File uploaded successfully!");

          setAttachments((prev) => [
            ...prev,
            { ...newFile, attachmentId: crypto.randomUUID() },
          ]);
        } catch (error) {
          console.error("Error saving attachment metadata:", error);
          toast.error("Failed to save file metadata.");
        }

        setNewAttachment(null);
      },
    );
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((file) => file.attachmentId !== id));
  };

  const handleSave = () => {
    try {
      onSave({
        title,
        description,
        priority,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        tag: tags,
        status,
        watchers: watchers,
        assigneeID: assigneeinfo?.id || "",
        assigneeInfo: assigneeinfo,
        milestoneId,
        attachments,
        updateDate: new Date().toISOString(),
      });

      toast.success("Task updated successfully!");
      onClose(); // Đóng modal sau khi lưu thành công
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task. Please try again.");
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg dark:bg-dark-secondary">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold dark:text-white">
            Task Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700"
          >
            <X size={20} />
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
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
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
              className="h-24 w-full resize-none rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Attachments
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                onChange={(e) => setNewAttachment(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              />
              <button
                onClick={handleUploadFile}
                disabled={!newAttachment}
                className={`rounded-lg px-4 py-2 text-white transition ${
                  newAttachment
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "cursor-not-allowed bg-gray-400"
                }`}
              >
                Upload
              </button>
            </div>
            {/* Danh sách file đã upload */}
            <div className="mt-3 space-y-2">
              {attachments.map((file) => {
                const isImage = file.fileUrl.match(
                  /\.(jpeg|jpg|png|gif|webp)$/i,
                );
                return (
                  <div
                    key={file.attachmentId}
                    className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 shadow-sm transition hover:bg-gray-200 dark:bg-dark-tertiary"
                  >
                    <div className="flex items-center gap-3">
                      {isImage ? (
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="h-12 w-12 rounded border object-cover"
                        />
                      ) : (
                        <span className="text-gray-700 dark:text-white">
                          📄
                        </span>
                      )}
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400"
                      >
                        {file.fileName}
                      </a>
                    </div>
                    <button
                      onClick={() => handleRemoveAttachment(file.attachmentId)}
                      className="text-red-500 transition hover:text-red-700"
                    >
                      ❌
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
            >
              <option value={Status.ToDo}>To Do</option>
              <option value={Status.WorkInProgress}>Work In Progress</option>
              <option value={Status.UnderReview}>Under Review</option>
              <option value={Status.Completed}>Completed</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Assigned To
            </label>
            <select
              onChange={handleAddUser}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              value={assigneeinfo?.id || ""}
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Watchers */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Watchers
            </label>
            <select
              onChange={handleAddWatcher}
              className="mt-2 w-full rounded-lg border p-2 shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-dark-tertiary dark:text-white"
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
                  className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-1 shadow-sm transition hover:bg-gray-200"
                >
                  <span>{user.fullName}</span>
                  <button
                    onClick={() => handleRemoveWatcher(user.userID)}
                    className="text-red-500 transition hover:text-red-700"
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
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
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
                className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
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
                className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-400 px-5 py-2 text-white transition hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsRequestAssetOpen(true)}
              className="rounded-lg bg-green-500 px-5 py-2 text-white transition hover:bg-green-600"
            >
              Request Asset
            </button>
            <button
              onClick={handleSave}
              disabled={!isChanged}
              className={`rounded-lg px-5 py-2 text-white transition ${
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
          <AssetRequestSelector
            taskId={task.taskID}
            onClose={() => setIsRequestAssetOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default EditTaskModal;
