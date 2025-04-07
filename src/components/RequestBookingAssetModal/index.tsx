import {
  useCreateAssetRequestBookingMutation,
  useGetAllAssetQuery,
  useGetAssetBookingsQuery,
  useGetAssetsQuery,
} from "@/state/api";
import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type RequestBookingAssetModalProps = {
  taskId: string;
  onClose: () => void;
};
type Booking = {
  id: string;
  startTime: string;
  endTime: string;
};

const RequestBookingAssetModal = ({
  taskId,
  onClose,
}: RequestBookingAssetModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(""); // State lưu startTime
  const [endTime, setEndTime] = useState(""); // State lưu endTime
  const [assetID, setAssetID] = useState("");
  const [bookingType, setBookingType] = useState("ONE_TIME");
  const [recurrenceCount, setRecurrenceCount] = useState(0);
  const [recurrenceInterval, setRecurrenceInterval] = useState(0);

  // Fetch danh sách assets từ API
  const {
    data: assets,
    isLoading: isLoadingAssets,
    error: assetsError,
  } = useGetAllAssetQuery();
  const [createBooking, { isLoading, error }] =
    useCreateAssetRequestBookingMutation();

  const { data: bookings, isLoading: isLoadingBookings } =
    useGetAssetBookingsQuery(assetID, {
      skip: !assetID, // Chỉ fetch khi assetID có giá trị
    });

  const toISOStringWithTimezone = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toISOString(); // Chuyển thành ISO 8601
  };
  const isBookingOverlap = () => {
    if (!bookings) return false;

    // Định dạng ngày startTime và endTime trước khi so sánh
    const newStart = new Date(toISOStringWithTimezone(startTime)).getTime();
    const newEnd = new Date(toISOStringWithTimezone(endTime)).getTime();

    return bookings.some((booking: Booking) => {
      const existingStart = new Date(
        toISOStringWithTimezone(booking.startTime),
      ).getTime();
      const existingEnd = new Date(
        toISOStringWithTimezone(booking.endTime),
      ).getTime();

      return (
        (newStart >= existingStart && newStart < existingEnd) || // Bắt đầu trong khoảng đã đặt
        (newEnd > existingStart && newEnd <= existingEnd) || // Kết thúc trong khoảng đã đặt
        (newStart <= existingStart && newEnd >= existingEnd) // Trùng hoàn toàn
      );
    });
  };
  const formatEvents = (bookings: Booking[] | undefined) => {
    if (!bookings || !Array.isArray(bookings)) return []; // Trả về mảng rỗng nếu bookings bị undefined/null

    return bookings.map((booking) => ({
      title: "Booked", // Hoặc booking.title nếu có
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
      allDay: false,
    }));
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Định dạng 24h
    }).format(date);
  };

  const handleSubmit = async () => {
    if (isBookingOverlap()) {
      toast.error("This asset is already booked for the selected time.");
      return;
    }

    if (!title || !description || !startTime || !endTime || !assetID) {
      toast.warning("Please fill in all required fields.");
      return;
    }

    const requestData = {
      title,
      description,
      startTime: toISOStringWithTimezone(startTime),
      endTime: toISOStringWithTimezone(endTime),
      assetID,
      taskID: taskId,
      bookingType,
      recurrenceCount,
      recurrenceInterval,
    };

    try {
      await createBooking(requestData).unwrap();
      toast.success("Booking request successfully submitted!");
      onClose();
    } catch (err) {
      toast.error("Failed to submit booking request.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-[900px] max-w-full rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          Request Asset Booking
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Cột 1: Form nhập thông tin */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Title:
              </label>
              <input
                type="text"
                className="w-full rounded-lg border p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Description:
              </label>
              <textarea
                className="w-full rounded-lg border p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Start Time:
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  End Time:
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Select Asset:
              </label>
              {isLoadingAssets ? (
                <p>Loading assets...</p>
              ) : assetsError ? (
                <p className="text-red-500">Error loading assets</p>
              ) : (
                <select
                  className="w-full rounded-lg border p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                  value={assetID}
                  onChange={(e) => setAssetID(e.target.value)}
                >
                  <option value="">-- Select an asset --</option>
                  {assets?.map((asset) => (
                    <option key={asset.assetID} value={asset.assetID}>
                      {asset.assetName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Cột 2: Lịch booking */}
          <div className="border-l pl-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-700">
              Existing Bookings:
            </h3>
            {isLoadingBookings ? (
              <p>Loading bookings...</p>
            ) : bookings?.length > 0 ? (
              <div className="rounded-lg border shadow">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin]}
                  initialView="timeGridWeek"
                  events={formatEvents(bookings)}
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  height="420px"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No bookings for this asset.
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-lg bg-blue-500 px-5 py-2 text-white shadow-md hover:bg-blue-600"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
          <button
            className="rounded-lg bg-gray-400 px-5 py-2 text-white shadow-md hover:bg-gray-500"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestBookingAssetModal;
