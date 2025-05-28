import {
  AssigneeInfo,
  Status,
  TaskUser,
  useGetTaskCommentsQuery,
  usePostTaskCommentMutation,
  useUploadFileMetadataMutation,
  Watcher,
  Task as TaskType,
} from "@/state/api";
import { useEffect, useState } from "react";
import { format, isBefore, isAfter } from "date-fns";
import { X, UploadCloud } from "lucide-react";
import AssetRequestSelector from "../AssetRequestSelector";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebaseConfig";
import { toast } from "react-toastify";

interface EditTaskModalProps {
  task: TaskType;
  users: AssigneeInfo[];
  onClose: () => void;
  onSave: (updatedTask: Partial<TaskType>) => void;
  milestoneStartDate: string;
  milestoneEndDate: string;
}

const EditTaskModal = ({
  task,
  users,
  onClose,
  onSave,
  milestoneStartDate,
  milestoneEndDate,
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
  const [watchers, setWatcher] = useState(task.watchers || []);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [newAttachment, setNewAttachment] = useState<File | null>(null);
  const [uploadFileMetadata] = useUploadFileMetadataMutation();
  const [postTaskComment] = usePostTaskCommentMutation();
  const { data: comments = [], refetch: refetchComments } =
    useGetTaskCommentsQuery({ taskID: task.taskID }, { skip: !task.taskID });
  const [newComment, setNewComment] = useState("");
  const [isRequestAssetOpen, setIsRequestAssetOpen] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [dateError, setDateError] = useState<string>("");

  // Validate startDate & endDate phải nằm trong milestone
  useEffect(() => {
    if (!startDate || !endDate) {
      setDateError("");
      return;
    }
    const s = new Date(startDate);
    const e = new Date(endDate);
    const ms = milestoneStartDate ? new Date(milestoneStartDate) : null;
    const me = milestoneEndDate ? new Date(milestoneEndDate) : null;
    if (ms && me) {
      if (isBefore(s, ms) || isAfter(e, me) || isAfter(s, e)) {
        let err = "";
        if (isBefore(s, ms) || isAfter(s, me))
          err += "Ngày bắt đầu phải nằm trong phạm vi milestone.\n";
        if (isBefore(e, ms) || isAfter(e, me))
          err += "Ngày kết thúc phải nằm trong phạm vi milestone.\n";
        if (isAfter(s, e)) err += "Ngày kết thúc phải sau ngày bắt đầu.";
        setDateError(err.trim());
      } else {
        setDateError("");
      }
    }
  }, [startDate, endDate, milestoneStartDate, milestoneEndDate]);

  // Upload file
  const handleUploadFile = async () => {
    if (!newAttachment) return;
    const storageRef = ref(storage, `attachments/${newAttachment.name}`);
    const uploadTask = uploadBytesResumable(storageRef, newAttachment);
    uploadTask.on(
      "state_changed",
      null,
      () => toast.error("Upload thất bại"),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        try {
          await uploadFileMetadata({
            fileName: newAttachment.name,
            fileUrl: url,
            taskId: task.taskID,
            uploadedById: assigneeinfo?.id || "",
          }).unwrap();
          setAttachments((prev) => [
            ...prev,
            {
              fileName: newAttachment.name,
              fileUrl: url,
              attachmentId: crypto.randomUUID(),
              taskId: task.taskID,
              uploadedById: assigneeinfo?.id || "",
            },
          ]);

          toast.success("Upload thành công!");
        } catch {
          toast.error("Lưu thông tin file thất bại.");
        }
        setNewAttachment(null);
      },
    );
  };

  // Comment
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.warning("Không được để trống bình luận.");
      return;
    }
    try {
      await postTaskComment({
        taskID: task.taskID,
        userID: assigneeinfo?.id ?? "",
        commentText: newComment,
      }).unwrap();
      setNewComment("");
      await refetchComments();
    } catch {
      toast.error("Gửi bình luận thất bại.");
    }
  };

  // Save
  const handleSave = () => {
    if (dateError) {
      toast.error("Vui lòng kiểm tra lại ngày bắt đầu/kết thúc!");
      return;
    }
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
        milestoneId: task.milestoneId,
        attachments,
        updateDate: new Date().toISOString(),
      });
      toast.success("Cập nhật task thành công!");
      onClose();
    } catch {
      toast.error("Cập nhật thất bại. Thử lại!");
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
    attachments.length !== (task.attachments?.length || 0) ||
    watchers.length !== (task.watchers?.length || 0) ||
    assigneeinfo?.id !== task.assigneeInfo?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative max-h-[95vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-bold text-blue-700 dark:text-blue-300">
            Chỉnh sửa công việc
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
            title="Đóng"
          >
            <X size={22} />
          </button>
        </div>
        {/* Main content */}
        <div className="grid grid-cols-1 gap-4">
          {/* Tiêu đề & mô tả */}
          <div>
            <label className="font-medium dark:text-white">Tên công việc</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 focus:ring-2 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>
          <div>
            <label className="font-medium dark:text-white">Mô tả</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 focus:ring-2 focus:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          {/* Trạng thái & ưu tiên */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium dark:text-white">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value={Status.ToDo}>Cần làm</option>
                <option value={Status.WorkInProgress}>Đang làm</option>
                <option value={Status.UnderReview}>Chờ duyệt</option>
                <option value={Status.Completed}>Hoàn thành</option>
              </select>
            </div>
            <div>
              <label className="font-medium dark:text-white">Ưu tiên</label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as TaskType["priority"])
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="Low">Thấp</option>
                <option value="Medium">Trung bình</option>
                <option value="High">Cao</option>
                <option value="Urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

          {/* Thời gian (có validate) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium dark:text-white">Bắt đầu</label>
              <input
                type="date"
                value={startDate}
                min={milestoneStartDate}
                max={milestoneEndDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
            <div>
              <label className="font-medium dark:text-white">Kết thúc</label>
              <input
                type="date"
                value={endDate}
                min={milestoneStartDate}
                max={milestoneEndDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>
          {dateError && (
            <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-neutral-800">
              {dateError.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}

          {/* Tag, Assignee, Watcher */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium dark:text-white">Tag</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="ex: Design, Backend"
              />
            </div>
            <div>
              <label className="font-medium dark:text-white">
                Người thực hiện
              </label>
              <select
                onChange={(e) => {
                  const selectedUser = users.find(
                    (u) => u.id === e.target.value,
                  );
                  setAssigneeinfo(selectedUser);
                }}
                value={assigneeinfo?.id || ""}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="">Chọn user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
              {assigneeinfo && (
                <button
                  onClick={() => setAssigneeinfo(undefined)}
                  className="mt-1 text-xs text-red-500"
                >
                  Xóa người thực hiện
                </button>
              )}
            </div>
          </div>

          {/* Watchers */}
          <div>
            <label className="font-medium dark:text-white">Theo dõi</label>
            <select
              onChange={(e) => {
                const selectedUser = users.find((u) => u.id === e.target.value);
                if (
                  selectedUser &&
                  !watchers.some((w: Watcher) => w.userID === selectedUser.id)
                ) {
                  setWatcher([
                    ...watchers,
                    {
                      userID: selectedUser.id,
                      fullName: selectedUser.fullName || "",
                      dayOfBirth: selectedUser.dayOfBirth || "",
                      email: selectedUser.email || "",
                      pictureProfile: selectedUser.pictureProfile || "",
                    },
                  ]);
                }
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="">Chọn người theo dõi</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
            <div className="mt-2 flex flex-wrap gap-2">
              {watchers.map((user) => (
                <div
                  key={user.userID}
                  className="flex items-center gap-2 rounded bg-gray-200 px-3 py-1 text-xs dark:bg-neutral-700"
                >
                  <span>{user.fullName}</span>
                  <button
                    onClick={() =>
                      setWatcher(
                        watchers.filter((w) => w.userID !== user.userID),
                      )
                    }
                    className="text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="font-medium dark:text-white">Tệp đính kèm</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="file"
                onChange={(e) => setNewAttachment(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <button
                type="button"
                disabled={!newAttachment}
                className={`flex items-center gap-2 rounded-lg px-3 py-1 font-medium text-white transition ${newAttachment ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400"}`}
                onClick={handleUploadFile}
              >
                <UploadCloud size={18} /> Tải lên
              </button>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {attachments.map((file) => (
                <div
                  key={file.attachmentId}
                  className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 dark:bg-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    {/\.(jpeg|jpg|png|gif|webp)$/i.test(file.fileUrl) ? (
                      <img
                        src={file.fileUrl}
                        alt={file.fileName}
                        className="h-9 w-9 rounded object-cover"
                      />
                    ) : (
                      <span>📄</span>
                    )}
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline dark:text-blue-400"
                    >
                      {file.fileName}
                    </a>
                  </div>
                  <button
                    onClick={() =>
                      setAttachments((prev) =>
                        prev.filter(
                          (f) => f.attachmentId !== file.attachmentId,
                        ),
                      )
                    }
                    className="ml-2 text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bình luận */}
          <div>
            <label className="font-medium dark:text-white">Bình luận</label>
            <button
              onClick={() => setShowComments((v) => !v)}
              className="ml-2 text-xs text-blue-500"
            >
              {showComments ? "Ẩn" : "Hiện"}
            </button>
            {showComments && (
              <div className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-gray-100 p-2 dark:bg-neutral-800">
                {comments && comments.length > 0 ? (
                  comments.map((c) => (
                    <div
                      key={c.commentID}
                      className="mb-1 border-b border-gray-200 p-1 dark:border-neutral-700"
                    >
                      <div className="text-xs text-gray-800 dark:text-white">
                        {c.commentText}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {format(new Date(c.createdDate), "dd/MM/yyyy HH:mm")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400">
                    Chưa có bình luận.
                  </div>
                )}
              </div>
            )}
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded border border-gray-300 p-2 text-xs dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                placeholder="Nhập bình luận..."
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className={`rounded-lg px-3 py-1 text-xs text-white transition ${newComment.trim() ? "bg-blue-500 hover:bg-blue-600" : "cursor-not-allowed bg-gray-400"}`}
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Hành động */}
          <div className="mt-2 flex items-center justify-end gap-2 border-t pt-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-300 px-4 py-2 text-sm hover:bg-gray-400 dark:bg-neutral-800 dark:text-white"
            >
              Hủy
            </button>
            <button
              onClick={() => setIsRequestAssetOpen(true)}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
            >
              Yêu cầu tài sản
            </button>
            <button
              onClick={handleSave}
              disabled={!isChanged || !!dateError}
              className={`rounded-lg px-4 py-2 text-sm text-white transition ${!isChanged || !!dateError ? "cursor-not-allowed bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
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
