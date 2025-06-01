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
import { format } from "date-fns";
import React, { useRef, useState } from "react";
import Modal from "../Modal";
import { useParams } from "next/navigation";
import { Clock } from "lucide-react";
import { toast } from "react-toastify";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null;
  milestoneStartDate: string;
  milestoneEndDate: string;
};

const STATUS_VI_MAP: Record<string, string> = {
  ToDo: "Cần làm",
  WorkInProgress: "Đang làm",
  UnderReview: "Chờ duyệt",
  Completed: "Hoàn thành",
};

const PRIORITY_VI_MAP: Record<string, string> = {
  Backlog: "Thấp nhất",
  Low: "Thấp",
  Medium: "Trung bình",
  High: "Cao",
  Urgent: "Khẩn cấp",
};

const ModalNewTask = ({
  isOpen,
  onClose,
  id = null,
  milestoneStartDate,
  milestoneEndDate,
}: Props) => {
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const { data: users = [] } = useGetUsersQuery();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState<Priority>();
  const [tag, setTag] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [assignedUsers, setAssignedUsers] = useState<TaskUser[]>([]);
  const params = useParams();
  const { data: currentUser } = useGetUserInfoQuery();

  const projectIdFromUrl = Array.isArray(params.milestoneId)
    ? params.milestoneId[0]
    : params.milestoneId;
  const milestoneId = id !== null ? id : projectIdFromUrl || "";

  // Chỉ cho phép submit khi đã có ngày milestone
  const isReady =
    !!milestoneStartDate &&
    !!milestoneEndDate &&
    milestoneStartDate !== "" &&
    milestoneEndDate !== "";

  const checkDateValid = () => {
    if (!startDate || !endDate || !isReady) return false;
    const msStart = new Date(milestoneStartDate);
    const msEnd = new Date(milestoneEndDate);
    const tStart = new Date(startDate);
    const tEnd = new Date(endDate);

    // Ngày hiện tại (giờ 00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Không cho phép ngày nhỏ hơn hôm nay
    if (tStart < today || tEnd < today) return false;

    return tStart >= msStart && tEnd <= msEnd && tStart <= tEnd;
  };

  const handleSubmit = async () => {
    if (!title || !(id !== null || milestoneId)) return;

    // Validate ngày phải nằm trong khoảng milestone
    const msStart = new Date(milestoneStartDate);
    const msEnd = new Date(milestoneEndDate);
    const tStart = new Date(startDate);
    const tEnd = new Date(endDate);

    if (tStart < msStart || tEnd > msEnd || tStart > tEnd) {
      setErrorMsg(
        "Thời gian bắt đầu và kết thúc công việc phải nằm trong khoảng thời gian của milestone, và ngày bắt đầu không được lớn hơn ngày kết thúc.",
      );
      return;
    }

    // Validate ngày trong tương lai
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (tStart < today || tEnd < today) {
      setErrorMsg("Không thể tạo công việc ở ngày quá khứ.");
      return;
    }

    try {
      const formattedStartDate = format(new Date(startDate), "yyyy-MM-dd");
      const formattedDueDate = format(new Date(endDate), "yyyy-MM-dd");
      await createTask({
        taskID: "",
        title,
        description,
        status,
        priority,
        tag,
        startDate: formattedStartDate,
        endDate: formattedDueDate,
        attachments: [],
        milestoneId: milestoneId,
        createBy: currentUser?.id,
      });
      toast.success("Tạo công việc thành công!");
      onClose();
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setErrorMsg(null);
      setPriority(Priority.Backlog);
      setStatus(Status.ToDo);
    } catch (error) {
      console.error("Lỗi khi tạo task:", error);
      setErrorMsg("Đã xảy ra lỗi khi tạo công việc. Vui lòng thử lại!");
    }
  };

  const isFormValid = () => {
    if (!title || !(id !== null || milestoneId)) return false;
    if (!startDate || !endDate) return false;
    if (!isReady) return false;
    return checkDateValid();
  };

  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Tạo công việc mới">
      <form
        className="mt-2 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Thời gian milestone nổi bật */}
        <div className="mb-2 flex items-center gap-3 rounded-xl border-l-4 border-blue-500 bg-blue-50 px-4 py-3 dark:border-blue-400 dark:bg-blue-950">
          <Clock className="text-blue-500 dark:text-blue-300" />
          <div>
            <div className="text-sm font-semibold text-blue-700 dark:text-blue-200">
              Thời gian milestone:
              <span className="ml-2">
                <span className="font-bold">
                  {milestoneStartDate
                    ? format(new Date(milestoneStartDate), "dd/MM/yyyy")
                    : "--/--/----"}
                </span>{" "}
                đến{" "}
                <span className="font-bold">
                  {milestoneEndDate
                    ? format(new Date(milestoneEndDate), "dd/MM/yyyy")
                    : "--/--/----"}
                </span>
              </span>
            </div>
            <div className="mt-1 text-xs text-blue-500">
              Công việc chỉ được tạo trong khoảng thời gian này
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputStyles}
            placeholder="Nhập tiêu đề công việc"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={!isReady}
          />
        </div>
        <div>
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
            Mô tả
          </label>
          <textarea
            className={inputStyles}
            placeholder="Nhập mô tả chi tiết"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={!isReady}
          />
        </div>
        {/* Mức độ ưu tiên */}
        <div>
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
            Mức độ ưu tiên <span className="text-red-500">*</span>
          </label>
          <select
            className={inputStyles}
            value={priority}
            onChange={(e) =>
              setPriority(Priority[e.target.value as keyof typeof Priority])
            }
            required
            disabled={!isReady}
          >
            {Object.keys(Priority).map((key) => (
              <option key={key} value={key}>
                {PRIORITY_VI_MAP[key]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
            Trạng thái <span className="text-red-500">*</span>
          </label>
          <select
            className={inputStyles}
            value={status}
            onChange={(e) =>
              setStatus(Status[e.target.value as keyof typeof Status])
            }
            required
            disabled={!isReady}
          >
            <option value={Status.ToDo}>{STATUS_VI_MAP["ToDo"]}</option>
            <option value={Status.WorkInProgress}>
              {STATUS_VI_MAP["WorkInProgress"]}
            </option>
          </select>
        </div>
        {/* Chọn ngày nằm trong milestone */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
              Ngày bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={inputStyles + " font-semibold"}
              value={startDate}
              min={
                milestoneStartDate && new Date(milestoneStartDate) > new Date()
                  ? milestoneStartDate
                  : format(new Date(), "yyyy-MM-dd")
              }
              max={milestoneEndDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={!isReady}
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
              Ngày kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={inputStyles + " font-semibold"}
              value={endDate}
              min={
                milestoneStartDate && new Date(milestoneStartDate) > new Date()
                  ? milestoneStartDate
                  : format(new Date(), "yyyy-MM-dd")
              }
              max={milestoneEndDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              required
              disabled={!isReady}
            />
          </div>
        </div>
        {id === null && (
          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-200">
              Milestone ID
            </label>
            <input
              type="text"
              className={inputStyles}
              placeholder="ID của Milestone"
              value={milestoneId}
              readOnly
              disabled
            />
          </div>
        )}
        {errorMsg && (
          <div className="mt-2 px-2 text-sm font-semibold text-red-600">
            {errorMsg}
          </div>
        )}
        <button
          type="submit"
          className={`focus-offset-2 mt-4 flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            !isFormValid() || isLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={!isFormValid() || isLoading || !isReady}
        >
          {isLoading ? "Đang tạo..." : "Tạo công việc"}
        </button>
        {!isReady && (
          <div className="mt-2 text-xs text-gray-500">
            Đang tải thông tin mốc thời gian...
          </div>
        )}
      </form>
    </Modal>
  );
};

export default ModalNewTask;
