"use client";
import React, { useState } from "react";

import ModalNewTask from "@/components/ModalNewTask";
import ProjectHeader from "@/app/Projects/ProjectHeader";
import BoardView from "@/app/Projects/BoardView";
import ListView from "@/app/Projects/ListView";
import Timeline from "@/app/Projects/TimelineView";
import TableView from "@/app/Projects/TableView";

type Props = {
  params: {
    id: string;
    milestoneId: string;
  };
};

const MilestoneTasksPage = ({ params }: Props) => {
  const { milestoneId } = params;
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

  return (
    <div>
      {/* MODAL NEW TASK */}
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
        id={milestoneId}
      />
      <ProjectHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "Board" && (
        <BoardView
          id={milestoneId}
          setIsModaNewTasklOpen={setIsModalNewTaskOpen}
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

export default MilestoneTasksPage;
