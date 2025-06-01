"use client";
import React, { useRef, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from "@fullcalendar/core/locales/vi";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface AssetBookingCalendarProps {
  events: any[];
  loading?: boolean;
  error?: any;
  height?: number | string;
}

const VIEW_OPTIONS = [
  { key: "dayGridMonth", label: "Tháng" },
  { key: "timeGridWeek", label: "Tuần" },
  { key: "timeGridDay", label: "Ngày" },
];

const AssetBookingCalendar: React.FC<AssetBookingCalendarProps> = ({
  events,
  loading,
  error,
  height = 560,
}) => {
  const calendarRef = useRef<any>(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [title, setTitle] = useState("");

  // Navigation handlers
  const handleChangeView = (view: string) => {
    setCurrentView(view);
    setTimeout(() => {
      calendarRef.current?.getApi().changeView(view);
      setTitle(calendarRef.current?.getApi().view.title);
    }, 10);
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
    setTitle(calendarRef.current?.getApi().view.title);
  };

  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
    setTitle(calendarRef.current?.getApi().view.title);
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
    setTitle(calendarRef.current?.getApi().view.title);
  };

  // Update title on mount/change view
  useEffect(() => {
    if (calendarRef.current) {
      setTimeout(() => {
        setTitle(calendarRef.current?.getApi().view.title);
      }, 80);
    }
  }, [events.length, currentView]);

  if (loading)
    return (
      <div className="flex w-full items-center justify-center gap-2 py-10 text-gray-400">
        <span className="animate-spin">⏳</span> Đang tải lịch đặt...
      </div>
    );
  if (error)
    return (
      <div className="w-full py-10 text-center text-red-500">
        Lỗi tải lịch đặt!
      </div>
    );
  if (!events.length)
    return (
      <div className="w-full py-10 text-center text-gray-400">
        Tài sản này chưa có lịch đặt nào.
      </div>
    );

  return (
    <div className="asset-calendar-container mx-auto w-full max-w-[700px] rounded-3xl border border-blue-200 bg-white px-2 pb-3 pt-1 shadow-xl dark:bg-[#181c24]">
      {/* Custom Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-1 py-3 md:flex-nowrap md:gap-3 md:px-3"
        style={{ borderRadius: 18, marginBottom: 8, background: "#f8fafc" }}
      >
        {/* Tiêu đề */}
        <div className="flex items-center gap-2 text-base font-bold text-blue-700 dark:text-blue-300 md:text-lg">
          <CalendarDays size={20} />
          <span className="truncate" style={{ minWidth: 95 }}>
            {title}
          </span>
        </div>
        {/* Navigation & Today */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="rounded-lg bg-blue-50 p-1.5 text-blue-600 transition hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-blue-800"
            title="Trước"
            style={{ minWidth: 30, minHeight: 30 }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleToday}
            className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-600 transition hover:bg-blue-200"
            style={{ minWidth: 44 }}
          >
            Hôm nay
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-blue-50 p-1.5 text-blue-600 transition hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-blue-800"
            title="Sau"
            style={{ minWidth: 30, minHeight: 30 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        {/* Bộ chọn view */}
        <div className="flex flex-row items-center gap-1">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                currentView === opt.key
                  ? "bg-blue-600 text-white shadow"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-gray-700 dark:text-blue-200 dark:hover:bg-blue-800"
              } `}
              style={{ minWidth: 38 }}
              onClick={() => handleChangeView(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {/* Calendar content: bọc overflow-x */}
      <div
        className="calendar-content-wrapper"
        style={{
          width: "100%",
          minWidth: 0,
          overflowX: "auto",
          paddingRight: 8,
          boxSizing: "border-box",
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          locale={viLocale}
          events={events}
          height={height}
          eventContent={renderEventContent}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={true}
          headerToolbar={false}
        />
      </div>
      {/* Custom style chống tràn viền, tối ưu table */}
      <style jsx>{`
        .asset-calendar-container {
          min-height: 440px;
        }
        .asset-calendar-container .fc {
          width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box;
          overflow-x: auto;
        }
        .asset-calendar-container .fc-scrollgrid {
          border-radius: 14px;
          overflow: hidden;
        }
        .calendar-content-wrapper {
          width: 100%;
          overflow-x: auto;
          min-width: 0;
        }
        @media (max-width: 767px) {
          .asset-calendar-container {
            padding: 0.3rem;
            border-radius: 12px;
          }
        }
      `}</style>
    </div>
  );
};

function renderEventContent(eventInfo: any) {
  const { event } = eventInfo;
  return (
    <div className="px-1">
      <div
        className="truncate text-xs font-bold text-blue-700 dark:text-blue-300"
        style={{ maxWidth: 105, fontSize: 13 }}
      >
        {event.title}
      </div>
      <div
        className="text-xs text-gray-500 dark:text-gray-400"
        style={{ maxWidth: 105, whiteSpace: "normal" }}
      >
        {event.extendedProps?.status || ""}
      </div>
    </div>
  );
}

export default AssetBookingCalendar;
