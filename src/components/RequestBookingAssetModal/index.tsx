import React, { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  DayOfWeek,
  useGetAllAssetQuery,
  useCreateAssetRequestBookingMutation,
  useGetAssetBookingsQuery,
} from "@/state/api";
import viLocale from "@fullcalendar/core/locales/vi";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { CalendarDays, X, Loader2 } from "lucide-react";

interface RequestBookingAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
}

type BookingType = "ONE_TIME" | "RECURRING";
type RecurrenceType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

const weekDaysList: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const dayOfWeekLabel: Record<DayOfWeek, string> = {
  SUNDAY: "Chủ nhật",
  MONDAY: "Thứ 2",
  TUESDAY: "Thứ 3",
  WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5",
  FRIDAY: "Thứ 6",
  SATURDAY: "Thứ 7",
};

const bookingTypeLabel: Record<BookingType, string> = {
  ONE_TIME: "Một lần",
  RECURRING: "Lặp lại",
};

const recurrenceTypeLabel: Record<RecurrenceType, string> = {
  NONE: "Không lặp",
  DAILY: "Hàng ngày",
  WEEKLY: "Hàng tuần",
  MONTHLY: "Hàng tháng",
};

const RequestBookingAssetModal: React.FC<RequestBookingAssetModalProps> = ({
  isOpen,
  onClose,
  taskId,
}) => {
  const { data: assets } = useGetAllAssetQuery();

  // Asset filter
  const assetTypes = useMemo(() => {
    if (!assets) return [];
    const typeMap: Record<string, any> = {};
    assets.forEach((a: any) => {
      if (a.assetType?.id && !typeMap[a.assetType.id]) {
        typeMap[a.assetType.id] = {
          id: a.assetType.id,
          name: a.assetType.name,
        };
      }
    });
    return Object.values(typeMap);
  }, [assets]);

  const [selectedAssetType, setSelectedAssetType] = useState<string>("");
  const [selectedAssetCategory, setSelectedAssetCategory] =
    useState<string>("");
  const [assetId, setAssetId] = useState<string>("");

  const assetCategories = useMemo(() => {
    if (!assets || !selectedAssetType) return [];
    const categoryMap: Record<string, any> = {};
    assets.forEach((a: any) => {
      if (a.assetType?.id === selectedAssetType && a.category) {
        categoryMap[a.category.categoryID] = a.category;
      }
    });
    return Object.values(categoryMap);
  }, [assets, selectedAssetType]);

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter(
      (a: any) =>
        a.assetType?.id === selectedAssetType &&
        a.category?.categoryID === selectedAssetCategory,
    );
  }, [assets, selectedAssetType, selectedAssetCategory]);

  // Booking states
  const [bookingType, setBookingType] = useState<BookingType>("ONE_TIME");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("NONE");
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [fallbackToLastDay, setFallbackToLastDay] = useState<boolean>(false);

  const now = new Date();
  const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000);
  const [startTime, setStartTime] = useState<string>(
    now.toISOString().slice(0, 16),
  );
  const [endTime, setEndTime] = useState<string>(
    defaultEnd.toISOString().slice(0, 16),
  );
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>(
    tomorrow.toISOString().split("T")[0],
  );

  const [createBooking, { isLoading: isBooking }] =
    useCreateAssetRequestBookingMutation();

  useEffect(() => {
    setSelectedAssetCategory("");
    setAssetId("");
  }, [selectedAssetType]);
  useEffect(() => {
    setAssetId("");
  }, [selectedAssetCategory]);
  useEffect(() => {
    if (bookingType === "ONE_TIME") setRecurrenceType("NONE");
    else setRecurrenceType("DAILY");
  }, [bookingType]);
  useEffect(() => {
    if (recurrenceType !== "WEEKLY") setSelectedDays([]);
    if (recurrenceType !== "MONTHLY") {
      setDayOfMonth(1);
      setFallbackToLastDay(false);
    }
  }, [recurrenceType]);
  useEffect(() => {
    if (isOpen) {
      setSelectedAssetType("");
      setSelectedAssetCategory("");
      setAssetId("");
    }
  }, [isOpen]);

  // Submit
  const handleSubmit = async () => {
    try {
      if (!assetId) {
        toast.error("Vui lòng chọn tài sản!");
        return;
      }
      const sampleStart = new Date(startTime);
      const durationMs = new Date(endTime).getTime() - sampleStart.getTime();
      if (durationMs <= 0)
        throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu.");

      // Weekly
      if (recurrenceType === "WEEKLY") {
        if (!selectedDays.length)
          throw new Error("Hãy chọn ít nhất một ngày trong tuần.");
        const dow = sampleStart.getDay();
        if (!selectedDays.includes(weekDaysList[dow])) {
          throw new Error(
            "Ngày bắt đầu mẫu phải thuộc vào ngày trong tuần đã chọn.",
          );
        }
      }
      // Monthly
      if (recurrenceType === "MONTHLY") {
        const year = sampleStart.getFullYear();
        const month = sampleStart.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        if (dayOfMonth > daysInMonth) {
          if (fallbackToLastDay) sampleStart.setDate(daysInMonth);
          else
            throw new Error(
              `Tháng này chỉ có ${daysInMonth} ngày, hãy bật fallback hoặc chọn ngày nhỏ hơn!`,
            );
        } else sampleStart.setDate(dayOfMonth);
      }
      const recEnd = new Date(recurrenceEndDate);
      if (recurrenceType !== "NONE" && recEnd <= sampleStart)
        throw new Error("Ngày kết thúc chu kỳ phải sau ngày bắt đầu!");

      const payload = {
        title: "",
        description: "",
        assetID: assetId,
        taskID: taskId,
        startTime: sampleStart.toISOString(),
        endTime: new Date(sampleStart.getTime() + durationMs).toISOString(),
        bookingType,
        recurrenceType,
        recurrenceInterval,
        selectedDays,
        dayOfMonth,
        fallbackToLastDay,
        recurrenceEndDate,
      };
      await createBooking(payload).unwrap();
      toast.success("Đặt lịch thành công!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || err.data?.message || "Đặt lịch thất bại!");
    }
  };

  // Calendar section
  const {
    data: bookings,
    isLoading: loadingCalendar,
    error: errorCalendar,
  } = useGetAssetBookingsQuery(assetId, { skip: !assetId });

  const events = useMemo(() => {
    if (!bookings || !Array.isArray(bookings)) return [];
    return bookings.map((item: any) => ({
      id: item.requestId,
      title: item.asset?.assetName || "Tài sản",
      start: item.startTime,
      end: item.endTime,
      color: item.status === "BOOKED" ? "#38bdf8" : "#facc15",
      extendedProps: { ...item },
    }));
  }, [bookings]);

  // Ref and resize fix for FullCalendar
  const calendarRef = useRef<any>(null);
  useEffect(() => {
    if (isOpen && assetId && calendarRef.current) {
      setTimeout(() => {
        if (calendarRef.current?.getApi) {
          calendarRef.current.getApi().updateSize();
        }
      }, 200);
    }
  }, [isOpen, assetId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex max-h-[95vh] min-h-[640px] w-full max-w-5xl flex-col overflow-y-auto rounded-3xl border border-blue-100 bg-white/95 shadow-2xl transition-all dark:bg-dark-secondary md:flex-row">
        {/* LEFT: Form */}
        <div className="relative flex w-full flex-col justify-between p-5 md:w-[54%] md:p-10">
          {/* Close btn */}
          <button
            className="absolute right-6 top-6 text-2xl text-gray-400 transition hover:text-blue-500"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={26} />
          </button>
          <div>
            <div className="mb-7 mt-3 flex flex-col items-center">
              <div className="mb-2 rounded-xl bg-blue-100 p-3 text-blue-600">
                <CalendarDays size={32} />
              </div>
              <h2 className="mb-1 text-2xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400">
                Đặt lịch tài sản
              </h2>
              <p className="text-center text-xs text-gray-500">
                Chọn loại tài sản, danh mục và tài sản, sau đó đặt lịch mượn.{" "}
                <br />
                <span className="text-red-500">*</span> Bắt buộc.
              </p>
            </div>
            {/* Loại tài sản */}
            <div className="mb-4">
              <label className="mb-1 block font-semibold">
                Loại tài sản <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAssetType}
                onChange={(e) => setSelectedAssetType(e.target.value)}
                className="input-custom"
              >
                <option value="">-- Chọn loại tài sản --</option>
                {assetTypes.map((type: any) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Danh mục */}
            <div className="mb-4">
              <label className="mb-1 block font-semibold">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAssetCategory}
                onChange={(e) => setSelectedAssetCategory(e.target.value)}
                className="input-custom"
                disabled={!selectedAssetType}
              >
                <option value="">-- Chọn danh mục --</option>
                {assetCategories.map((cat: any) => (
                  <option key={cat.categoryID} value={cat.categoryID}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Tài sản */}
            <div className="mb-4">
              <label className="mb-1 block font-semibold">
                Tài sản <span className="text-red-500">*</span>
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="input-custom"
                disabled={!selectedAssetCategory}
              >
                <option value="">-- Chọn tài sản --</option>
                {filteredAssets.map((asset: any) => (
                  <option key={asset.assetID} value={asset.assetID}>
                    {asset.assetName}
                    {asset.model ? ` - Model: ${asset.model}` : ""}
                    {asset.code ? ` - Mã: ${asset.code}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {/* Hình thức đặt */}
            <div className="mb-4">
              <label className="mb-1 block font-semibold">
                Hình thức đặt lịch <span className="text-red-500">*</span>
              </label>
              <select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value as BookingType)}
                className="input-custom"
              >
                {Object.entries(bookingTypeLabel).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {/* Thời gian, Recurring */}
            {bookingType === "ONE_TIME" && (
              <>
                <div className="mb-4">
                  <label className="mb-1 block font-semibold">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-custom"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1 block font-semibold">
                    Thời gian kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-custom"
                  />
                </div>
              </>
            )}
            {bookingType === "RECURRING" && (
              <>
                <div className="mb-4">
                  <label className="mb-1 block font-semibold">
                    Chu kỳ lặp <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={recurrenceType}
                    onChange={(e) =>
                      setRecurrenceType(e.target.value as RecurrenceType)
                    }
                    className="input-custom"
                  >
                    {Object.entries(recurrenceTypeLabel).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="mb-1 block font-semibold">
                    Khoảng cách chu kỳ (mỗi ... lần){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={recurrenceInterval}
                    onChange={(e) =>
                      setRecurrenceInterval(parseInt(e.target.value, 10))
                    }
                    className="input-custom"
                  />
                </div>
                {recurrenceType === "WEEKLY" && (
                  <div className="mb-4">
                    <label className="mb-1 block font-semibold">
                      Chọn các ngày trong tuần
                    </label>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      {weekDaysList.map((day) => (
                        <label
                          key={day}
                          className="flex cursor-pointer items-center text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDays.includes(day)}
                            onChange={() => {
                              if (selectedDays.includes(day)) {
                                setSelectedDays(
                                  selectedDays.filter((d) => d !== day),
                                );
                              } else {
                                setSelectedDays([...selectedDays, day]);
                              }
                            }}
                            className="mr-2 accent-blue-500"
                          />
                          {dayOfWeekLabel[day]}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {recurrenceType === "MONTHLY" && (
                  <div className="mb-4">
                    <label className="mb-1 block font-semibold">
                      Ngày trong tháng
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={dayOfMonth}
                      onChange={(e) =>
                        setDayOfMonth(parseInt(e.target.value, 10))
                      }
                      className="input-custom"
                    />
                    <label className="mt-2 flex cursor-pointer items-center text-sm">
                      <input
                        type="checkbox"
                        checked={fallbackToLastDay}
                        onChange={() =>
                          setFallbackToLastDay(!fallbackToLastDay)
                        }
                        className="mr-2 accent-blue-500"
                      />
                      Nếu tháng không đủ ngày, lấy ngày cuối tháng
                    </label>
                  </div>
                )}
                {recurrenceType !== "NONE" && (
                  <>
                    <div className="mb-4">
                      <label className="mb-1 block font-semibold">
                        Thời gian bắt đầu mẫu{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="input-custom"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="mb-1 block font-semibold">
                        Thời gian kết thúc mẫu{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="input-custom"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="mb-1 block font-semibold">
                        Ngày kết thúc chu kỳ{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        min={new Date(startTime).toISOString().split("T")[0]}
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="input-custom"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div className="mt-7 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2 font-semibold text-gray-600 shadow-sm transition hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isBooking}
              className={`flex items-center gap-2 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 px-6 py-2 font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-blue-500 ${
                isBooking ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {isBooking && <Loader2 className="animate-spin" size={18} />}
              Đặt lịch
            </button>
          </div>
        </div>
        {/* RIGHT: Calendar */}
        <div className="flex min-h-[320px] w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 p-4 pt-0 dark:bg-dark-tertiary md:min-h-[640px] md:w-[46%] md:border-l md:border-blue-100 dark:md:border-gray-700">
          <div className="mb-3 mt-5 flex items-center gap-2 text-center text-lg font-bold text-blue-700">
            <CalendarDays size={20} /> Lịch đã đặt của tài sản
          </div>
          <div className="flex min-h-[320px] w-full max-w-[480px] items-center justify-center md:min-h-[480px]">
            {!assetId && (
              <div className="w-full text-center italic text-gray-400">
                Chọn tài sản để xem lịch đặt
              </div>
            )}
            {assetId && loadingCalendar && (
              <div className="flex w-full items-center justify-center gap-2 text-gray-400">
                <Loader2 className="animate-spin" /> Đang tải lịch đặt...
              </div>
            )}
            {assetId && errorCalendar && (
              <div className="w-full text-center text-red-500">
                Lỗi tải lịch đặt!
              </div>
            )}
            {assetId &&
              !loadingCalendar &&
              !errorCalendar &&
              events.length === 0 && (
                <div className="w-full text-center text-gray-400">
                  Tài sản này chưa có lịch đặt nào.
                </div>
              )}
            {assetId &&
              !loadingCalendar &&
              !errorCalendar &&
              events.length > 0 && (
                <div className="w-full">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={false}
                    locale={viLocale}
                    events={events}
                    height={window.innerWidth >= 768 ? 440 : 320}
                    eventContent={renderEventContent}
                  />
                </div>
              )}
          </div>
        </div>
      </div>
      {/* Custom style nhẹ cho Calendar */}
      <style jsx global>{`
        .fc {
          border-radius: 1rem !important;
          background: none !important;
          box-shadow: 0 4px 32px #2563eb09;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background: #e8f2fd !important;
          border-radius: 8px !important;
          transition: background 0.18s;
        }
        .fc-event {
          border-radius: 999px !important;
          box-shadow: 0 2px 8px #2563eb14;
          font-weight: 500;
        }
      `}</style>
      <style jsx>{`
        .input-custom {
          width: 100%;
          border: 1.5px solid #e0e7ef;
          border-radius: 0.8rem;
          padding: 0.5rem 0.85rem;
          font-size: 1rem;
          outline: none;
          background: #f8fafc;
          margin-bottom: 0;
          transition:
            border 0.15s,
            box-shadow 0.18s;
        }
        .input-custom:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 1.5px #3b82f6;
          background: #fff;
        }
      `}</style>
    </div>
  );
};

function renderEventContent(eventInfo: any) {
  const { event } = eventInfo;
  return (
    <div className="px-1">
      <div className="truncate text-xs font-bold text-blue-700">
        {event.title}
      </div>
      <div className="text-xs text-gray-500">
        {event.extendedProps?.status || ""}
      </div>
    </div>
  );
}

export default RequestBookingAssetModal;
