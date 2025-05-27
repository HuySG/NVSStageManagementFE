"use client";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { useRouter } from "next/navigation";
import {
  useGetMilestonesByProjectQuery,
  useGetProjectsQuery,
  useLazyGetEventsByMilestoneQuery,
} from "@/state/api";
import { FaFlagCheckered } from "react-icons/fa";
import { useState } from "react";
import Header from "../Header";
import ModalNewProject from "@/app/Projects/ModalNewProject";
import { PlusSquare, CalendarClock, Loader2, CheckCircle2 } from "lucide-react";
import "./index.css";
import { format, isBefore, isAfter, isWithinInterval } from "date-fns";
import clsx from "clsx"; // Cần cài: npm install clsx

type Props = { projectID: string };

export default function MilestoneTimeline({ projectID }: Props) {
  const router = useRouter();
  const {
    data: milestones,
    error: milestonesError,
    isLoading: milestonesLoading,
  } = useGetMilestonesByProjectQuery({ projectID });
  const { data: projects } = useGetProjectsQuery();
  const project = projects?.find((p) => p.projectID === projectID);

  const [isModalNewProjectOpen, setIsModalNewProjectOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventList, setEventList] = useState<any[]>([]);
  const [triggerGetEvents, { isFetching: eventsLoading, error: eventsError }] =
    useLazyGetEventsByMilestoneQuery();

  // Xác định trạng thái milestone dựa vào ngày
  const getMilestoneStatus = (start: string, end: string) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isBefore(now, startDate))
      return { label: "Chưa bắt đầu", color: "bg-gray-300 text-gray-700" };
    if (isWithinInterval(now, { start: startDate, end: endDate }))
      return { label: "Đang diễn ra", color: "bg-blue-100 text-blue-700" };
    if (isAfter(now, endDate))
      return { label: "Đã kết thúc", color: "bg-green-100 text-green-700" };
    return { label: "Không xác định", color: "bg-gray-100 text-gray-400" };
  };

  if (milestonesLoading)
    return (
      <div className="p-5 text-center text-gray-500">
        Đang tải milestones...
      </div>
    );
  if (milestonesError || !milestones)
    return (
      <div className="p-5 text-center text-red-500">
        Không thể tải milestones
      </div>
    );

  // Sắp xếp milestones theo ngày bắt đầu
  const milestonesSorted = milestones
    .slice()
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  return (
    <div className="container mx-auto max-w-4xl px-4">
      {/* Modal New Project */}
      <ModalNewProject
        isOpen={isModalNewProjectOpen}
        onClose={() => setIsModalNewProjectOpen(false)}
        id={projectID}
      />

      {/* TIMELINE */}
      <VerticalTimeline animate={true} lineColor="#e5e7eb">
        {milestonesSorted.map((milestone) => {
          const status = getMilestoneStatus(
            milestone.startDate,
            milestone.endDate,
          );
          return (
            <VerticalTimelineElement
              key={milestone.milestoneID}
              date={`${format(new Date(milestone.startDate), "dd/MM/yyyy")} — ${format(new Date(milestone.endDate), "dd/MM/yyyy")}`}
              iconStyle={{
                background:
                  status.label === "Đã kết thúc"
                    ? "#22c55e"
                    : status.label === "Đang diễn ra"
                      ? "#3b82f6"
                      : "#a3a3a3",
                color: "#fff",
                boxShadow: "0px 0px 14px rgba(59, 130, 246, 0.4)",
                cursor: "pointer",
              }}
              icon={
                status.label === "Đã kết thúc" ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : status.label === "Đang diễn ra" ? (
                  <Loader2 className="animate-spin-slow h-6 w-6" />
                ) : (
                  <FaFlagCheckered className="h-6 w-6" />
                )
              }
              contentStyle={{
                background: "#f9fafb",
                color: "#1e293b",
                boxShadow: "0px 4px 16px rgba(0,0,0,0.04)",
                borderRadius: "16px",
                padding: "28px 24px",
                border: "1px solid #e0e7ef",
                transition: "transform 0.3s",
                cursor: "pointer",
              }}
              contentArrowStyle={{ borderRight: "7px solid #f9fafb" }}
              onTimelineElementClick={() =>
                router.push(
                  `/Projects/${projectID}/milestones/${milestone.milestoneID}`,
                )
              }
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="mb-1 flex items-center gap-1 text-lg font-bold text-indigo-700">
                    <CalendarClock className="mr-1 inline-block text-blue-500" />
                    {milestone.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {milestone.description}
                  </p>
                </div>
                <span
                  className={clsx(
                    "ml-0 mt-2 rounded-full px-3 py-1 text-xs font-semibold md:ml-6 md:mt-0",
                    status.color,
                  )}
                >
                  {status.label}
                </span>
              </div>
            </VerticalTimelineElement>
          );
        })}
      </VerticalTimeline>
    </div>
  );
}
