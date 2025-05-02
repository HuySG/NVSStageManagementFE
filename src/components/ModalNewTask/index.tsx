"use client";
import {
  Attachment,
  Priority,
  Status,
  TaskUser,
  useCreateTaskMutation,
  useGetUserInfoQuery,
  useGetUsersQuery,
} from "@/state/api";
import { format, formatISO } from "date-fns";
import React, { useRef, useState } from "react";
import Modal from "../Modal";
import { useParams } from "next/navigation";
import { BlobServiceClient } from "@azure/storage-blob";

type Props = { isOpen: boolean; onClose: () => void; id?: string | null };

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const { data: users = [] } = useGetUsersQuery();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState<Priority>(Priority.Backlog);
  const [tag, setTag] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assignedUsers, setAssignedUsers] = useState<TaskUser[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const { data: currentUser } = useGetUserInfoQuery();

  // Lấy projectId từ URL, đảm bảo kiểu dữ liệu là string
  const projectIdFromUrl = Array.isArray(params.milestoneId)
    ? params.milestoneId[0]
    : params.milestoneId;

  // Nếu `id` không null, dùng `id`, ngược lại dùng `projectIdFromUrl`
  const milestoneId = id !== null ? id : projectIdFromUrl || "";

  // Cấu hình Azure Storage - trong thực tế nên đưa vào file config riêng
  const NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING_URL =
    process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING_URL || "";
  const AZURE_STORAGE_CONTAINER_NAME =
    process.env.NEXT_PUBLIC_AZURE_STORAGE_CONTAINER_NAME || "attachments";
  // Tạo ID ngẫu nhiên cho attachment
  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    }
  };

  const uploadFilesToAzure = async () => {
    if (files.length === 0) return [];

    setIsUploading(true);
    setUploadProgress(0);

    const uploadedAttachments: Attachment[] = [];

    try {
      // Kiểm tra connection string
      if (!NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING_URL) {
        throw new Error("Azure Storage connection string is not configured");
      }

      // Tạo BlobServiceClient
      const blobServiceClient = new BlobServiceClient(
        NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING_URL,
      );

      // Lấy container client
      const containerClient = blobServiceClient.getContainerClient(
        AZURE_STORAGE_CONTAINER_NAME,
      );

      // Đảm bảo container tồn tại
      await containerClient.createIfNotExists();

      // Upload từng file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uniqueId = generateUniqueId();
        const fileExtension = file.name.split(".").pop() || "";
        const blobName = `${uniqueId}-${file.name}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Upload file
        await blockBlobClient.uploadData(await file.arrayBuffer(), {
          onProgress: (progress) => {
            // Cập nhật tiến trình upload
            const totalProgress = Math.round(
              ((i + progress.loadedBytes / file.size) / files.length) * 100,
            );
            setUploadProgress(totalProgress);
          },
          blobHTTPHeaders: {
            blobContentType: file.type,
          },
        });

        // Thêm thông tin file đã upload vào danh sách attachments theo cấu trúc JSON
        uploadedAttachments.push({
          attachmentId: uniqueId,
          fileName: file.name,
          fileUrl: blockBlobClient.url,
          taskId: "", // Sẽ được cập nhật sau khi task được tạo
          uploadedById: "",
        });
      }

      setAttachments((prevAttachments) => [
        ...prevAttachments,
        ...uploadedAttachments,
      ]);
      setFiles([]);
      setUploadProgress(100);

      return uploadedAttachments;
    } catch (error) {
      console.error("Error uploading files to Azure:", error);
      alert(`Lỗi khi upload file: ${(error as Error).message}`);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prevAttachments) =>
      prevAttachments.filter((_, i) => i !== index),
    );
  };

  const handleSubmit = async () => {
    if (!title || !(id !== null || milestoneId)) return;

    try {
      // Upload files trước khi tạo task nếu có file mới
      let taskAttachments: Attachment[] = [...attachments];
      if (files.length > 0) {
        const uploadedFiles = await uploadFilesToAzure();
        taskAttachments = [...taskAttachments, ...uploadedFiles];
      }
      const formattedStartDate = format(
        new Date(startDate),
        "yyyy-MM-dd'T'HH:mm:ss",
      );
      const formattedDueDate = format(
        new Date(endDate),
        "yyyy-MM-dd'T'HH:mm:ss",
      );

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
        attachments: taskAttachments,
        milestoneId: milestoneId,
        createBy: currentUser?.id, // 👈 Thêm dòng này
      });

      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Lỗi khi tạo task. Vui lòng thử lại.");
    }
  };

  const isFormValid = () => {
    return !!title && !!(id !== null || milestoneId);
  };
  if (isLoading) return <div>Loading...</div>;

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

        {/* File upload section */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Attachments</span>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              type="button"
              className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-600 dark:bg-blue-900 dark:text-blue-200"
              onClick={() => fileInputRef.current?.click()}
            >
              Add Files
            </button>
          </div>
          {/* List of files to be uploaded */}
          {files.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="text-sm font-medium">Files to upload:</div>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-dark-tertiary"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-red-500"
                    onClick={() => removeFile(index)}
                  >
                    ❌
                  </button>
                </div>
              ))}
              {!isUploading && files.length > 0 && (
                <button
                  type="button"
                  className="mt-2 rounded bg-green-100 px-3 py-1 text-sm text-green-600 dark:bg-green-900 dark:text-green-200"
                  onClick={uploadFilesToAzure}
                >
                  Upload Files
                </button>
              )}
            </div>
          )}
          {/* Upload progress */}
          {isUploading && (
            <div className="mt-2">
              <div className="text-sm">Uploading... {uploadProgress}%</div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          {/* List of uploaded attachments */}
          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium">Uploaded attachments:</div>
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-dark-tertiary"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{attachment.fileName}</span>
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500"
                    >
                      (View)
                    </a>
                  </div>
                  <button
                    type="button"
                    className="text-red-500"
                    onClick={() => removeAttachment(index)}
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {id === null && (
          <input
            type="text"
            className={inputStyles}
            placeholder="showID"
            value={milestoneId}
            onChange={(e) => {
              console.log("Show ID nhập vào:", e.target.value);
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
