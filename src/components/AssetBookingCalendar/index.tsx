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
  height = 440,
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
    <div className="w-full rounded-2xl border border-blue-100 bg-white px-3 pb-3 pt-1 shadow-md dark:bg-[#181c24]">
      {/* Custom Header */}
      <div className="flex w-full flex-col gap-3 px-2 pb-3 pt-4 md:flex-row md:items-center md:justify-between">
        {/* Tiêu đề */}
        <div className="flex min-w-[180px] items-center gap-2 text-lg font-bold text-blue-700 dark:text-blue-300">
          <CalendarDays size={21} />
          <span style={{ minWidth: 130, display: "inline-block" }}>
            {title}
          </span>
        </div>
        {/* Vùng nút View (Tháng, Tuần, Ngày) */}
        <div className="flex min-w-[145px] gap-2">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                currentView === opt.key
                  ? "bg-blue-600 text-white shadow"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-gray-700 dark:text-blue-200 dark:hover:bg-blue-800"
              }`}
              style={{ minWidth: 45 }}
              onClick={() => handleChangeView(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {/* Navigation */}
        <div className="flex min-w-[105px] items-center justify-end gap-2">
          <button
            onClick={handlePrev}
            className="rounded-lg bg-blue-50 p-1.5 transition hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-blue-800"
            title="Trước"
            style={{ minWidth: 32 }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleToday}
            className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-600 transition hover:bg-blue-200"
            style={{ minWidth: 55 }}
          >
            Hôm nay
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-blue-50 p-1.5 transition hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-blue-800"
            title="Sau"
            style={{ minWidth: 32 }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {/* Calendar */}
      <div className="pt-1">
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
          headerToolbar={false} // Quan trọng: không cho Calendar tự render header mặc định
        />
      </div>
    </div>
  );
};

function renderEventContent(eventInfo: any) {
  const { event } = eventInfo;
  return (
    <div className="px-1">
      <div
        className="truncate text-xs font-bold text-blue-700 dark:text-blue-300"
        style={{ maxWidth: 95 }}
      >
        {event.title}
      </div>
      <div
        className="text-xs text-gray-500 dark:text-gray-400"
        style={{ maxWidth: 95, whiteSpace: "normal" }}
      >
        {event.extendedProps?.status || ""}
      </div>
    </div>
  );
}

export default AssetBookingCalendar;
