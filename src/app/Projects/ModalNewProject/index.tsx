"use client";
import Modal from "@/components/Modal";
import { useCreateMilestoneMutation } from "@/state/api";
import { formatISO } from "date-fns";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

type Props = { isOpen: boolean; onClose: () => void; id?: string | null };

const ModalNewProject = ({ isOpen, onClose, id = null }: Props) => {
  const params = useParams();
  const [createProject, { isLoading }] = useCreateMilestoneMutation();
  const [title, settitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Lấy projectId từ URL, đảm bảo kiểu dữ liệu là string
  const projectIdFromUrl = Array.isArray(params.projectID)
    ? params.projectID[0]
    : params.projectID;

  // Nếu `id` không null, dùng `id`, ngược lại dùng `projectIdFromUrl`
  const projectID = id !== null ? id : projectIdFromUrl || "";
  console.log("Project ID:", projectID);

  const handleSubmit = async () => {
    if (!title || !startDate || !endDate || !projectID) {
      console.error("Missing required fields");
      return;
    }

    const formattedStartDate = formatISO(new Date(startDate), {
      representation: "complete",
    });
    const formattedEndDate = formatISO(new Date(endDate), {
      representation: "complete",
    });

    try {
      const response = await createProject({
        milestoneID: "",
        title,
        description,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        projectID: projectID,
      }).unwrap(); // Dùng .unwrap() để nhận lỗi từ RTK Query

      console.log("Project created:", response);
      onClose(); // Đóng modal sau khi tạo thành công
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const isFormValid = () => {
    return title && description && startDate && endDate;
  };
  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Project">
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
          placeholder="Milestone Title"
          value={title}
          onChange={(e) => settitle(e.target.value)}
        />
        <textarea
          className={inputStyles}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
        {projectID === null && (
          <input
            type="text"
            className={inputStyles}
            placeholder="project ID"
            value={projectID}
            onChange={(e) => {
              console.log("project ID nhập vào:", e.target.value);
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
          {isLoading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewProject;
