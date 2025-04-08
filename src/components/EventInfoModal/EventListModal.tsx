"use client";

import React, { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface EventListModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  error?: any;
  events?: {
    eventID: string;
    eventName: string;
    description: string;
    startTime?: string;
    endTime?: string;
    locationID?: string;
    eventType?: string;
    status?: string;
    createdDate?: string;
  }[];
}

export default function EventListModal({ isOpen, onClose, isLoading, error, events }: EventListModalProps) {
  if (!isOpen) return null;

  const safeEvents = events ?? [];

  const calendarEvents = useMemo(() =>
    safeEvents.map((e) => ({
      title: e.eventName,
      start: e.startTime ? new Date(e.startTime) : new Date(),
      end: e.endTime ? new Date(e.endTime) : new Date(),
      resource: {
        description: e.description,
        location: e.locationID,
        type: e.eventType,
        status: e.status,
      },
    })), [safeEvents]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-6xl rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Event Calendar</h2>
          <button
            onClick={onClose}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Close
          </button>
        </div>

        {isLoading ? (
          <p>Loading events...</p>
        ) : error ? (
          <p className="text-red-500">Failed to load events.</p>
        ) : safeEvents.length === 0 ? (
          <p className="text-gray-500">No events available for this milestone.</p>
        ) : (
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              eventPropGetter={(event) => ({
                style: { backgroundColor: "#3b82f6", color: "white", borderRadius: "6px" },
              })}
              onSelectEvent={(event) => {
                alert(`📅 ${event.title}\n📍 ${event.resource.location}\n📝 ${event.resource.description}`);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}