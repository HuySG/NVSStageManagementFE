// components/EventListModal.jsx
"use client";
import React from "react";

interface EventListModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  error?: any;    
  events: { eventID: string; eventName: string; description: string }[];
}

export default function EventListModal({ isOpen, onClose, events }: EventListModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-11/12 max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Event List</h2>
        {events && events.length > 0 ? (
          <ul className="mb-4">
            {events.map((event) => (
              <li key={event.eventID} className="border-b py-2">
                <h3 className="font-semibold">{event.eventName}</h3>
                <p className="text-sm text-gray-600">{event.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No events available.</p>
        )}
        <button
          className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
