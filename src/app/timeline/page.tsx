"use client";

import { useAppSelector } from "@/app/redux";
import Header from "@/components/Header";
import {
  useGetProjectsQuery,
  useGetProjectTasksQuery,
  useGetTasksQuery,
} from "@/state/api";
import { skipToken } from "@reduxjs/toolkit/query";
import { DisplayOption, Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import React, { useMemo, useState } from "react";

type TaskTypeItems = "task" | "milestone" | "project";

const Timeline = () => {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { data: projects, isLoading, isError } = useGetProjectsQuery();
  // const {data: tasks} = useGetTasksQuery();
  const { data: allTasks } = useGetProjectTasksQuery();
  const [displayOptions, setDisplayOptions] = useState<DisplayOption>({
    viewMode: ViewMode.Month,
    locale: "en-US",
  });

  const ganttTasks = useMemo(() => {
    if (!projects) return [];

    return projects.map((project) => {
      // Lọc tasks thuộc về project này
      const projectTasks =
        allTasks?.filter((task) => task.projectId === project.projectID) || [];

      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(
        (task) => task.status === "Completed",
      ).length;

      // Tính phần trăm tiến độ
      const progressPercent =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      console.group(`Project: ${project.title}`);
      console.log("Total Tasks:", totalTasks);
      console.log("Completed Tasks:", completedTasks);
      console.log("Progress:", progressPercent.toFixed(2), "%");
      console.groupEnd();

      return {
        start: new Date(project.startTime),
        end: new Date(project.endTime),
        name: project.title,
        id: `Project-${project.projectID}`,
        type: "project" as TaskTypeItems,
        progress: progressPercent,
        isDisabled: false,
      };
    });
  }, [projects, allTasks]);

  const handleViewModeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setDisplayOptions((prev) => ({
      ...prev,
      viewMode: event.target.value as ViewMode,
    }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError || !projects)
    return <div>An error occurred while fetching projects</div>;

  return (
    <div className="max-w-full p-8">
      <header className="mb-4 flex items-center justify-between">
        <Header name="Projects Timeline" />
        <div className="relative inline-block w-64">
          <select
            className="focus:shadow-outline block w-full appearance-none rounded border border-gray-400 bg-white px-4 py-2 pr-8 leading-tight shadow hover:border-gray-500 focus:outline-none dark:border-dark-secondary dark:bg-dark-secondary dark:text-white"
            value={displayOptions.viewMode}
            onChange={handleViewModeChange}
          >
            <option value={ViewMode.Day}>Day</option>
            <option value={ViewMode.Week}>Week</option>
            <option value={ViewMode.Month}>Month</option>
          </select>
        </div>
      </header>

      <div className="overflow-hidden rounded-md bg-white shadow dark:bg-dark-secondary dark:text-white">
        <div className="timeline">
          <Gantt
            tasks={ganttTasks}
            {...displayOptions}
            columnWidth={displayOptions.viewMode === ViewMode.Month ? 150 : 100}
            listCellWidth="100px"
            projectBackgroundColor={isDarkMode ? "#101214" : "#1f2937"}
            projectProgressColor={isDarkMode ? "#1f2937" : "#aeb8c2"}
            projectProgressSelectedColor={isDarkMode ? "#000" : "#9ba1a6"}
          />
        </div>
      </div>
    </div>
  );
};

export default Timeline;
