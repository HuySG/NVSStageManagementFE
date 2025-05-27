import {
  AssigneeInfo,
  Status,
  TaskUser,
  useGetTaskCommentsQuery,
  usePostTaskCommentMutation,
  useUploadFileMetadataMutation,
  Watcher,
} from "@/state/api";
import { Task as TaskType } from "@/state/api";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import AssetRequestSelector from "../AssetRequestSelector";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebaseConfig";
import { toast } from "react-toastify";
import { Comment } from "@/state/api";

type EditTaskModalProps = {
  task: TaskType;
  users: AssigneeInfo[];
  onClose: () => void;
  onSave: (updatedTask: Partial<TaskType>) => void;
  isOpen?: boolean;
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
  const [uploadFileMetadata] = useUploadFileMetadataMutation();
  const [postTaskComment] = usePostTaskCommentMutation();
  const { data: comments = [], refetch: refetchComments } =
    useGetTaskCommentsQuery({ taskID: task.taskID }, { skip: !task.taskID });
  const [isRequestAssetOpen, setIsRequestAssetOpen] = useState(false);
  const [showComments, setShowComments] = useState(true);

  useEffect(() => {
    const normalizedComments = comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt
        ? new Date(comment.createdAt).toISOString()
        : null,
    }));
    console.log(normalizedComments);
  }, [comments]);

  const handleAddUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = e.target.value;
    const selectedUser = users.find((user) => user.id === selectedUserId);
    if (selectedUser) {
      setAssigneeinfo(selectedUser);
    }
  };

  const handleRemoveUser = () => {
    setAssigneeinfo(undefined);
  };

  const handleAddWatcher = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = e.target.value;
    const selectedUser = users.find((user) => user.id === selectedUserId);
    if (selectedUser && !watchers.some((w) => w.userID === selectedUserId)) {
      const newWatcher: Watcher = {
        userID: selectedUser.id,
        fullName: selectedUser.fullName || "",
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
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task. Please try again.");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.warning("Comment cannot be empty.");
      return;
    }
    if (!task?.taskID) {
      toast.error("Task ID is missing. Cannot add comment.");
      return;
    }
    try {
      const userString = localStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : null;
      if (!user) {
        toast.error("User not found. Please log in again.");
        return;
      }
      await postTaskComment({
        taskID: task.taskID,
        userID: user.id,
        commentText: newComment,
      }).unwrap();
      toast.success("Comment added!");
      setNewComment("");
      await refetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment. Please try again.");
    }
  };

  const isValidDate = (date: any) => {
    return date && !isNaN(new Date(date).getTime());
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
    ) ||
    assigneeinfo?.id !== task.assigneeInfo?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-md bg-white p-4 shadow-lg dark:bg-dark-secondary">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-base font-semibold dark:text-white">
            Task Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung chính */}
        <div className="mt-3 space-y-3 text-sm">
          {/* Title */}
          <div>
            <label className="block font-medium dark:text-white">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-gray-300 p-2 focus:outline-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium dark:text-white">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-gray-300 p-2 focus:outline-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              rows={3}
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block font-medium dark:text-white">
              Attachments
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                onChange={(e) => setNewAttachment(e.target.files?.[0] || null)}
                className="w-full rounded border border-gray-300 p-1 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              />
              <button
                onClick={handleUploadFile}
                disabled={!newAttachment}
                className={`rounded px-3 py-1 text-white transition ${
                  newAttachment
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "cursor-not-allowed bg-gray-400"
                }`}
              >
                Upload
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {attachments.map((file) => {
                const isImage = file.fileUrl.match(
                  /\.(jpeg|jpg|png|gif|webp)$/i,
                );
                return (
                  <div
                    key={file.attachmentId}
                    className="flex items-center justify-between rounded bg-gray-100 px-2 py-1 dark:bg-dark-tertiary"
                  >
                    <div className="flex items-center gap-2">
                      {isImage ? (
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <span>📄</span>
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
                      className="text-red-500"
                    >
                      ❌
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium dark:text-white">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded border border-gray-300 p-2 focus:outline-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              >
                <option value={Status.ToDo}>To Do</option>
                <option value={Status.WorkInProgress}>Work In Progress</option>
                <option value={Status.UnderReview}>Under Review</option>
                <option value={Status.Completed}>Completed</option>
              </select>
            </div>
            <div>
              <label className="block font-medium dark:text-white">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as TaskType["priority"])
                }
                className="w-full rounded border border-gray-300 p-2 focus:outline-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium dark:text-white">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded border border-gray-300 p-2 focus:outline-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium dark:text-white">
                Due Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded border border-gray-300 p-2 focus:outline-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              />
            </div>
          </div>

          {/* Assignee & Watchers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium dark:text-white">
                Assigned To
              </label>
              <select
                onChange={handleAddUser}
                value={assigneeinfo?.id || ""}
                className="w-full rounded border border-gray-300 p-2 focus:outline-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
              {assigneeinfo && (
                <button
                  onClick={handleRemoveUser}
                  className="mt-1 text-xs text-red-500"
                >
                  Remove assignee
                </button>
              )}
            </div>
            <div>
              <label className="block font-medium dark:text-white">
                Watchers
              </label>
              <select
                onChange={handleAddWatcher}
                className="w-full rounded border border-gray-300 p-2 focus:outline-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
              >
                <option value="">Add Watcher</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
              <div className="mt-1 space-y-1">
                {watchers.map((user) => (
                  <div
                    key={user.userID}
                    className="flex items-center justify-between rounded bg-gray-100 px-2 py-1 dark:bg-dark-tertiary"
                  >
                    <span>{user.fullName}</span>
                    <button
                      onClick={() => handleRemoveWatcher(user.userID)}
                      className="text-xs text-red-500"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 border-t pt-2">
            <button
              onClick={onClose}
              className="rounded bg-gray-400 px-3 py-1 text-xs text-white hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsRequestAssetOpen(true)}
              className="rounded bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600"
            >
              Request Asset
            </button>
            <button
              onClick={handleSave}
              disabled={!isChanged}
              className={`rounded px-3 py-1 text-xs text-white transition ${isChanged ? "bg-blue-500 hover:bg-blue-600" : "cursor-not-allowed bg-gray-400"}`}
              title={!isChanged ? "No changes detected ❌" : ""}
            >
              Save Changes
            </button>
          </div>

          {/* Comments Section (toggle hiển thị) */}
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <label className="font-medium dark:text-white">Comments</label>
              <button
                onClick={() => setShowComments((prev) => !prev)}
                className="text-xs text-blue-500"
              >
                {showComments ? "Hide" : "Show"}
              </button>
            </div>
            {showComments && (
              <>
                <div className="mt-2 max-h-40 overflow-y-auto rounded bg-gray-100 p-2 dark:bg-dark-tertiary">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={comment.commentID}
                        className="mb-1 flex items-start gap-2 rounded bg-white p-2 shadow-sm dark:bg-dark-secondary"
                      >
                        <div className="flex-1">
                          <p className="text-xs text-gray-700 dark:text-gray-200">
                            {comment.commentText}
                          </p>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {isValidDate(comment.createdDate)
                              ? format(
                                  new Date(String(comment.createdDate)),
                                  "dd/MM/yyyy HH:mm",
                                )
                              : "Unknown Date"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No comments yet.
                    </p>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 rounded border border-gray-300 p-2 text-xs focus:outline-blue-500 dark:border-gray-600 dark:bg-dark-tertiary dark:text-white"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className={`rounded px-3 py-1 text-xs text-white transition ${
                      newComment.trim()
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "cursor-not-allowed bg-gray-400"
                    }`}
                  >
                    Add
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Asset Request Modal */}
        {isRequestAssetOpen && (
          <AssetRequestSelector
            isOpen={true}
            taskId={task.taskID}
            onClose={() => setIsRequestAssetOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default EditTaskModal;
