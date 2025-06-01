"use client";
import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  DayOfWeek,
  useGetAllAssetQuery,
  useCreateAssetRequestBookingMutation,
  useGetAssetBookingsQuery,
} from "@/state/api";
import { CalendarDays, X, Loader2, DoorOpen } from "lucide-react";
import AssetBookingCalendar from "@/components/AssetBookingCalendar";

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

const ALLOWED_ASSET_TYPE_ID = "de2b478c-a4a4-4b9d-9f39-e3a7ee5b29da";
const ALLOWED_ASSET_TYPE_NAME = "Không gian sử dụng (Phòng/Sân khấu)";

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 800;

const RequestBookingAssetModal: React.FC<RequestBookingAssetModalProps> = ({
  isOpen,
  onClose,
  taskId,
}) => {
  const { data: assets } = useGetAllAssetQuery();

  // ==== State ====
  const [selectedAssetCategory, setSelectedAssetCategory] =
    useState<string>("");
  const [assetId, setAssetId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // 1. Lọc các asset hợp lệ theo loại
  const allowedAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((a: any) => a.assetType?.id === ALLOWED_ASSET_TYPE_ID);
  }, [assets]);

  // 2. Lấy unique category từ asset hợp lệ
  const assetCategories = useMemo(() => {
    const map: Record<string, any> = {};
    allowedAssets.forEach((a: any) => {
      if (a.category?.categoryID) {
        map[a.category.categoryID] = a.category;
      }
    });
    return Object.values(map);
  }, [allowedAssets]);

  // 3. Lọc asset theo category được chọn
  const filteredAssets = useMemo(() => {
    if (!selectedAssetCategory) return [];
    return allowedAssets.filter(
      (a: any) => a.category?.categoryID === selectedAssetCategory,
    );
  }, [allowedAssets, selectedAssetCategory]);

  // ==== Booking states ====
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
  }, [allowedAssets.length]);
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
      setSelectedAssetCategory("");
      setAssetId("");
      setTitle("");
      setDescription("");
      setBookingType("ONE_TIME");
      setRecurrenceType("NONE");
      setRecurrenceInterval(1);
      setSelectedDays([]);
      setDayOfMonth(1);
      setFallbackToLastDay(false);
      setStartTime(now.toISOString().slice(0, 16));
      setEndTime(defaultEnd.toISOString().slice(0, 16));
      setRecurrenceEndDate(tomorrow.toISOString().split("T")[0]);
    }
    // eslint-disable-next-line
  }, [isOpen]);

  // ==== Validate & Submit ====
  const handleSubmit = async () => {
    try {
      // Validate các trường bắt buộc
      if (!assetId) {
        toast.error("Vui lòng chọn không gian!");
        return;
      }
      if (!selectedAssetCategory) {
        toast.error("Vui lòng chọn danh mục!");
        return;
      }
      if (!title.trim()) {
        toast.error("Vui lòng nhập tiêu đề!");
        return;
      }
      if (!description.trim()) {
        toast.error("Vui lòng nhập mô tả!");
        return;
      }
      if (title.length > MAX_TITLE_LENGTH) {
        toast.error(`Tiêu đề không được vượt quá ${MAX_TITLE_LENGTH} ký tự!`);
        return;
      }
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        toast.error(
          `Mô tả không được vượt quá ${MAX_DESCRIPTION_LENGTH} ký tự!`,
        );
        return;
      }

      // Validate thời gian không được ở quá khứ
      const nowTime = new Date();
      const sampleStart = new Date(startTime);
      const sampleEnd = new Date(endTime);

      // Lấy giờ hiện tại, reset giây, ms để so với input
      nowTime.setSeconds(0, 0);

      if (sampleStart < nowTime) {
        toast.error("Thời gian bắt đầu phải từ hiện tại trở đi!");
        return;
      }
      if (sampleEnd < nowTime) {
        toast.error("Thời gian kết thúc phải từ hiện tại trở đi!");
        return;
      }
      if (sampleEnd <= sampleStart) {
        toast.error("Thời gian kết thúc phải sau thời gian bắt đầu!");
        return;
      }

      // Recurring: validate các trường riêng
      if (bookingType === "RECURRING") {
        if (recurrenceInterval < 1) {
          toast.error("Khoảng cách chu kỳ phải lớn hơn 0!");
          return;
        }
        if (recurrenceType === "WEEKLY" && selectedDays.length === 0) {
          toast.error("Chọn ít nhất một ngày trong tuần!");
          return;
        }
        if (
          recurrenceType === "MONTHLY" &&
          (dayOfMonth < 1 || dayOfMonth > 31)
        ) {
          toast.error("Ngày trong tháng phải từ 1 đến 31!");
          return;
        }
        const recEnd = new Date(recurrenceEndDate);
        if (recEnd <= sampleStart) {
          toast.error("Ngày kết thúc chu kỳ phải sau ngày bắt đầu!");
          return;
        }
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        assetID: assetId,
        taskID: taskId,
        startTime: sampleStart.toISOString(),
        endTime: sampleEnd.toISOString(),
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

  // ==== Calendar section ====
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex max-h-[98vh] min-h-[750px] w-full max-w-[1200px] flex-col overflow-y-auto rounded-3xl border border-blue-100 bg-white/95 p-0 shadow-2xl transition-all dark:bg-dark-secondary md:flex-row">
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
                <DoorOpen size={32} />
              </div>
              <h2 className="mb-1 text-2xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400">
                Đặt lịch không gian (Phòng/Sân khấu)
              </h2>
              <p className="text-center text-xs text-gray-500">
                Chỉ có thể chọn tài sản thuộc loại{" "}
                <span className="font-semibold text-blue-500">
                  Không gian sử dụng (Phòng/Sân khấu)
                </span>
                .<br />
                <span className="text-red-500">*</span> Thông tin bắt buộc.
              </p>
            </div>
            {/* TIÊU ĐỀ */}
            <div className="mb-4">
              <label className="mb-1 block font-semibold">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input-custom"
                placeholder="Nhập tiêu đề yêu cầu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                required
              />
            </div>
            {/* MÔ TẢ */}
            <div className="mb-4">
              <label className="mb-1 block font-semibold">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input-custom"
                placeholder="Nhập mô tả chi tiết yêu cầu đặt không gian"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={MAX_DESCRIPTION_LENGTH}
                required
              />
            </div>
            {/* Loại tài sản - chỉ 1 lựa chọn */}
            <div className="mb-4">
              <label className="mb-1 block font-semibold">
                Loại tài sản <span className="text-red-500">*</span>
              </label>
              <select className="input-custom" disabled>
                <option value={ALLOWED_ASSET_TYPE_ID}>
                  {ALLOWED_ASSET_TYPE_NAME}
                </option>
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
                disabled={assetCategories.length === 0}
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
                Không gian sử dụng <span className="text-red-500">*</span>
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="input-custom"
                disabled={!selectedAssetCategory}
              >
                <option value="">-- Chọn không gian --</option>
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
            {/* Các trường recurring giữ nguyên như cũ */}
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
            <CalendarDays size={20} /> Lịch đã đặt không gian
          </div>
          <div className="flex min-h-[320px] w-full max-w-[480px] items-center justify-center md:min-h-[480px]">
            {!assetId && (
              <div className="w-full text-center italic text-gray-400">
                Chọn không gian để xem lịch đặt
              </div>
            )}
            {assetId && (
              <div className="w-full">
                <AssetBookingCalendar
                  events={events}
                  loading={loadingCalendar}
                  error={errorCalendar}
                  height={
                    typeof window !== "undefined" && window.innerWidth >= 768
                      ? 440
                      : 320
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
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

export default RequestBookingAssetModal;
