import React, { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import viLocale from "@fullcalendar/core/locales/vi";
import { useGetAssetBookingsQuery } from "@/state/api";

const AssetBookingCalendar: React.FC<{ assetId: string | undefined }> = ({
  assetId,
}) => {
  const {
    data: bookings,
    isLoading,
    error,
  } = useGetAssetBookingsQuery(assetId, { skip: !assetId });

  // Nếu bookings là mảng các request asset, chuyển thành event cho FullCalendar
  const events = useMemo(() => {
    if (!bookings || !Array.isArray(bookings)) return [];
    return bookings.map((item: any) => ({
      id: item.requestId || item.bookingID || Math.random().toString(),
      title: item.asset?.assetName || "Tài sản",
      start: item.startTime,
      end: item.endTime,
      extendedProps: { ...item },
    }));
  }, [bookings]);

  if (!assetId)
    return (
      <div className="text-xs italic text-gray-500">
        Chọn tài sản để xem lịch đặt
      </div>
    );
  if (isLoading) return <div>Đang tải lịch đặt...</div>;
  if (error) return <div>Lỗi tải dữ liệu!</div>;
  if (events.length === 0)
    return (
      <div className="text-xs text-gray-500">
        Tài sản này chưa có lịch đặt nào.
      </div>
    );

  return (
    <div className="mt-2 rounded-xl border bg-gray-50 p-2">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={false}
        locale={viLocale}
        events={events}
        height={320}
        eventContent={renderEventContent}
      />
    </div>
  );
};

function renderEventContent(eventInfo: any) {
  const { event } = eventInfo;
  return (
    <div className="px-1">
      <div className="truncate text-xs font-semibold text-blue-700">
        {event.title}
      </div>
      <div className="text-xs text-gray-500">
        {event.extendedProps?.status || ""}
      </div>
    </div>
  );
}

export default AssetBookingCalendar;
