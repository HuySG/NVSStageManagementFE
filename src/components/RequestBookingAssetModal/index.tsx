import {
  AssetCategory,
  useCreateAssetRequestBookingMutation,
  useGetAllAssetQuery,
  useGetAssetBookingsQuery,
  useGetAssetsQuery,
  useGetAssetTypesQuery,
} from "@/state/api";
import React, { useEffect, useState } from "react";
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

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

const RequestBookingAssetModal = ({
  taskId,
  onClose,
}: RequestBookingAssetModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("09:00");
  const [assetID, setAssetID] = useState("");
  const [bookingType, setBookingType] = useState("ONE_TIME");
  const [recurrenceCount, setRecurrenceCount] = useState(0);
  const [recurrenceType, setRecurrenceType] = useState<
    "NONE" | "DAILY" | "WEEKLY" | "MONTHLY"
  >("NONE");

  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(undefined);
  const [fallbackToLastDay, setFallbackToLastDay] = useState(false);

  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categories, setCategories] = useState<AssetCategory[]>([]);

  const { data: assetTypes = [] } = useGetAssetTypesQuery();
  const { data: filteredAssets = [] } = useGetAssetsQuery(
    selectedCategoryId
      ? { categoryId: selectedCategoryId }
      : { categoryId: "" },
    { skip: !selectedCategoryId },
  );

  const { data: assets } = useGetAllAssetQuery();

  const { data: bookings, isLoading: isLoadingBookings } =
    useGetAssetBookingsQuery(assetID, { skip: !assetID });
  const [createBooking, { isLoading }] = useCreateAssetRequestBookingMutation();

  useEffect(() => {
    if (selectedAssetTypeId) {
      const selectedType = assetTypes.find(
        (type) => type.id === selectedAssetTypeId,
      );
      setCategories(selectedType?.categories ?? []);
      setSelectedCategoryId("");
      setAssetID("");
    } else {
      setCategories([]);
      setSelectedCategoryId("");
      setAssetID("");
    }
  }, [selectedAssetTypeId, assetTypes]);

  useEffect(() => {
    setAssetID("");
  }, [selectedCategoryId]);

  const toISOStringWithTimezone = (dateTime: string) => {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) {
      console.error("Invalid dateTime in toISOStringWithTimezone:", dateTime);
      return "";
    }
    return date.toISOString();
  };
  const buildFullEndTime = () => {
    if (!startTime || !endTime || !endTime.includes(":")) return "";

    const [hoursStr, minutesStr] = endTime.split(":");
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    if (isNaN(hours) || isNaN(minutes)) return "";

    const baseDate = new Date(startTime);
    if (isNaN(baseDate.getTime())) return "";

    const end = new Date(baseDate);
    end.setHours(hours);
    end.setMinutes(minutes);
    end.setSeconds(0);

    return end.toISOString();
  };

  const isBookingOverlap = () => {
    if (!bookings) return false;
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
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });
  };

  const formatEvents = (bookings: Booking[] | undefined) => {
    if (!bookings || !Array.isArray(bookings)) return [];
    return bookings.map((booking) => ({
      title: "Booked",
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
      allDay: false,
    }));
  };

  const handleSubmit = async () => {
    if (!startTime || !endTime || !assetID) {
      toast.warning("Please fill in all required fields.");
      return;
    }

    if (isBookingOverlap()) {
      toast.error("This asset is already booked for the selected time.");
      return;
    }

    const requestData = {
      title,
      description,
      assetID,
      taskID: taskId,
      startTime: toISOStringWithTimezone(startTime),
      endTime: buildFullEndTime(),
      bookingType,
      recurrenceType,
      recurrenceInterval: recurrenceType === "NONE" ? 0 : recurrenceInterval,
      selectedDays,
      dayOfMonth,
      fallbackToLastDay,
      recurrenceEndDate: recurrenceEndDate || undefined,
    };

    try {
      await createBooking(requestData).unwrap();
      toast.success("Booking request successfully submitted!");
      onClose();
    } catch {
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Title:
              </label>
              <input
                type="text"
                className="w-full rounded-lg border p-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Description:
              </label>
              <textarea
                className="w-full rounded-lg border p-2"
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
                  className="w-full rounded-lg border p-2"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  End Time:
                </label>
                <input
                  type="time"
                  className="w-full rounded-lg border p-2"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Recurrence UI */}
            <select
              className="w-full rounded-lg border p-2"
              value={recurrenceType}
              onChange={(e) =>
                setRecurrenceType(
                  e.target.value as "NONE" | "DAILY" | "WEEKLY" | "MONTHLY",
                )
              }
            >
              <option value="NONE">One Time</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>

            {recurrenceType !== "NONE" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Recurrence Interval:
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border p-2"
                      value={recurrenceInterval}
                      min={1}
                      onChange={(e) =>
                        setRecurrenceInterval(Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Recurrence End Date:
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border p-2"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    />
                  </div>
                </div>
                {recurrenceType === "WEEKLY" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Repeat on:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "MONDAY",
                        "TUESDAY",
                        "WEDNESDAY",
                        "THURSDAY",
                        "FRIDAY",
                        "SATURDAY",
                        "SUNDAY",
                      ].map((day) => (
                        <label
                          key={day}
                          className="inline-flex items-center space-x-1"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDays.includes(day as DayOfWeek)}
                            onChange={(e) => {
                              const newDays = e.target.checked
                                ? [...selectedDays, day as DayOfWeek]
                                : selectedDays.filter((d) => d !== day);
                              setSelectedDays(newDays);
                            }}
                          />
                          <span>{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {recurrenceType === "MONTHLY" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Day of Month:
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border p-2"
                        value={dayOfMonth || ""}
                        onChange={(e) => setDayOfMonth(Number(e.target.value))}
                      />
                    </div>
                    <div className="mt-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={fallbackToLastDay}
                          onChange={(e) =>
                            setFallbackToLastDay(e.target.checked)
                          }
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Fallback to last day if day exceeds month
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </>
            )}

            <hr className="my-2" />
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Asset Type:
              </label>
              <select
                className="w-full rounded-lg border p-2"
                value={selectedAssetTypeId}
                onChange={(e) => setSelectedAssetTypeId(e.target.value)}
              >
                <option value="">-- Select Asset Type --</option>
                {assetTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Asset Category:
              </label>
              <select
                className="w-full rounded-lg border p-2"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                disabled={!selectedAssetTypeId || categories.length === 0}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.categoryID} value={cat.categoryID}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Filtered Asset:
              </label>
              <select
                className="w-full rounded-lg border p-2"
                value={assetID}
                onChange={(e) => setAssetID(e.target.value)}
                disabled={!selectedCategoryId || filteredAssets.length === 0}
              >
                <option value="">-- Select filtered asset --</option>
                {filteredAssets
                  .filter((a) => a.assetType.id === selectedAssetTypeId)
                  .map((asset) => (
                    <option key={asset.assetID} value={asset.assetID}>
                      {asset.assetName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

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
