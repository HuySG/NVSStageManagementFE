"use client";
import React, { useState } from "react";
import ModalNewTask from "@/components/ModalNewTask";
import ProjectHeader from "@/app/Projects/ProjectHeader";
import BoardView from "@/app/Projects/BoardView";
import ListView from "@/app/Projects/ListView";
import Timeline from "@/app/Projects/TimelineView";
import TableView from "@/app/Projects/TableView";
import { useGetMilestoneByIdQuery } from "@/state/api";

type Props = {
  milestoneId: string;
};

const MilestoneTasksClient = ({ milestoneId }: Props) => {
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
  console.log("Milestone ID:", milestoneId);

  // Lấy thông tin milestone để lấy startDate và endDate
  const { data: milestone, isLoading } = useGetMilestoneByIdQuery(milestoneId);
  console.log("Milestone Data:", milestone);

  const milestoneStartDate = milestone?.startDate || "";
  const milestoneEndDate = milestone?.endDate || "";
  console.log("Milestone Start Date:", milestoneStartDate);
  console.log("Milestone End Date:", milestoneEndDate);

  return (
    <div>
      {/* Luôn render modal, truyền "" nếu chưa có dữ liệu */}
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
        id={milestoneId}
        milestoneStartDate={milestoneStartDate}
        milestoneEndDate={milestoneEndDate}
      />

      <ProjectHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "Board" && (
        <BoardView
          id={milestoneId}
          setIsModaNewTasklOpen={setIsModalNewTaskOpen}
          milestoneStartDate={milestoneStartDate}
          milestoneEndDate={milestoneEndDate}
        />
      )}
      {activeTab === "List" && (
        <ListView
          id={milestoneId}
          setIsModaNewTasklOpen={setIsModalNewTaskOpen}
        />
      )}
      {activeTab === "Timeline" && (
        <Timeline
          id={milestoneId}
          setIsModalNewTaskOpen={setIsModalNewTaskOpen}
        />
      )}
      {activeTab === "Table" && (
        <TableView
          id={milestoneId}
          setIsModalNewTaskOpen={setIsModalNewTaskOpen}
        />
      )}
    </div>
  );
};

export default MilestoneTasksClient;
