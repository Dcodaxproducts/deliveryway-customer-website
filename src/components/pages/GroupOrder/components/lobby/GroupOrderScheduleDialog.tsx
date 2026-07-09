"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Loader2, PauseCircle, X } from "lucide-react";
import { toast } from "sonner";

import { ScheduleRail } from "@/components/pages/Checkout/components/ScheduleRail";
import {
  buildDeliveryTimeSlots,
  buildPickupTimeSlots,
  buildScheduleBreakLabels,
  formatPickupTimeLabel,
  getBranchScheduleForDate,
  getBranchScheduleTimeZone,
  getDateFromValue,
  getDateValue,
  getScheduleOrderTimeIso,
  isImmediateScheduleAvailable,
  isPastDateValue,
  isScheduleTimeAvailable,
} from "@/components/pages/Checkout/utils/pickup-schedule";
import { Button } from "@/components/ui/button";
import { Time24Picker } from "@/components/ui/time-24-picker";
import { useAuth } from "@/hooks/useAuth";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import type { BranchRecord } from "@/types/branch-selector";
import type { GroupOrder } from "@/types/group-order";

type ScheduleMode = "now" | "schedule";

type GroupOrderScheduleDialogProps = {
  order: GroupOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (orderTime: string | null) => void;
};

const padDatePart = (value: number) => String(value).padStart(2, "0");

const buildUpcomingDates = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
};

const getCurrentSchedule = () => {
  const now = new Date();

  return {
    date: [now.getFullYear(), padDatePart(now.getMonth() + 1), padDatePart(now.getDate())].join("-"),
    time: [padDatePart(now.getHours()), padDatePart(now.getMinutes())].join(":"),
  };
};

const getScheduleType = (orderType?: string) =>
  String(orderType || "").toUpperCase() === "DELIVERY" ? "delivery" : "pickup";

const parseOrderTime = (orderTime?: string | null) => {
  if (!orderTime) return null;

  const date = new Date(orderTime);
  if (Number.isNaN(date.getTime())) return null;

  return {
    date: [date.getFullYear(), padDatePart(date.getMonth() + 1), padDatePart(date.getDate())].join("-"),
    time: [padDatePart(date.getHours()), padDatePart(date.getMinutes())].join(":"),
  };
};

const activeTileClass =
  "border-primary bg-white text-gray-950 shadow-[0_12px_34px_rgba(17,24,39,0.10)] ring-2 ring-primary/10";
const interactiveTileClass =
  "border-gray-100 bg-white text-gray-900 shadow-[0_12px_34px_rgba(17,24,39,0.08)] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_42px_rgba(17,24,39,0.12)] hover:text-primary";
const disabledTileClass = "cursor-not-allowed border-gray-100 bg-[#F7F3EF]/70 text-gray-400 shadow-none";

export function GroupOrderScheduleDialog({
  order,
  open,
  onOpenChange,
  onSaved,
}: GroupOrderScheduleDialogProps) {
  const { token } = useAuth();
  const { updateGroupOrderSchedule } = useGroupOrderApi(token);
  const initialSchedule = useMemo(() => getCurrentSchedule(), []);
  const scheduleDates = useMemo(() => buildUpcomingDates(), []);
  const parsedOrderTime = useMemo(() => parseOrderTime(order.orderTime), [order.orderTime]);
  const activeBranch = order.branch as BranchRecord | null | undefined;
  const scheduleType = getScheduleType(order.orderType);
  const [date, setDate] = useState(parsedOrderTime?.date || initialSchedule.date);
  const [time, setTime] = useState(parsedOrderTime?.time || "");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(parsedOrderTime ? "schedule" : "now");
  const [saving, setSaving] = useState(false);

  const immediateAvailable = useMemo(
    () => isImmediateScheduleAvailable({ branch: activeBranch, scheduleType }),
    [activeBranch, scheduleType]
  );
  const scheduleState = useMemo(
    () => getBranchScheduleForDate({ branch: activeBranch, dateValue: date, scheduleType }),
    [activeBranch, date, scheduleType]
  );
  const timeSlots = useMemo(
    () => scheduleType === "delivery"
      ? buildDeliveryTimeSlots({ branch: activeBranch, dateValue: date })
      : buildPickupTimeSlots({ branch: activeBranch, dateValue: date }),
    [activeBranch, date, scheduleType]
  );
  const breakLabels = useMemo(
    () => buildScheduleBreakLabels(scheduleState.schedule),
    [scheduleState.schedule]
  );
  const scheduleHoursLabel = useMemo(() => {
    const schedule = scheduleState.schedule;

    if (!date || !schedule) return "";
    if (schedule.isClosed) return "Closed";

    return `${formatPickupTimeLabel(schedule.openTime || "")} - ${formatPickupTimeLabel(schedule.closeTime || "")}`;
  }, [date, scheduleState.schedule]);

  useEffect(() => {
    if (!open) return;

    const parsed = parseOrderTime(order.orderTime);
    setDate(parsed?.date || initialSchedule.date);
    setTime(parsed?.time || "");
    setScheduleMode(parsed ? "schedule" : immediateAvailable ? "now" : "schedule");
  }, [immediateAvailable, initialSchedule.date, open, order.orderTime]);

  useEffect(() => {
    if (!immediateAvailable && scheduleMode === "now") {
      setScheduleMode("schedule");
    }
  }, [immediateAvailable, scheduleMode]);

  useEffect(() => {
    if (time && scheduleState.hasOpeningHours && !timeSlots.some((slot) => slot.value === time)) {
      setTime("");
    }
  }, [scheduleState.hasOpeningHours, time, timeSlots]);

  if (!open) return null;

  const saveSchedule = async () => {
    if (!order.id || saving) return;

    let orderTime: string | null = null;

    if (scheduleMode === "now") {
      if (!isImmediateScheduleAvailable({ branch: activeBranch, scheduleType })) {
        toast.error("Instant ordering is not available right now.");
        return;
      }
    } else {
      if (!date || !time) {
        toast.error("Select a date and time.");
        return;
      }

      if (isPastDateValue(date)) {
        toast.error("Please select a future date.");
        return;
      }

      const dateValue = getDateValue(getDateFromValue(date) || new Date(`${date}T00:00:00`));

      if (
        !isScheduleTimeAvailable({
          branch: activeBranch,
          dateValue,
          timeValue: time,
          scheduleType,
        })
      ) {
        toast.error("Selected time is unavailable.");
        return;
      }

      orderTime = getScheduleOrderTimeIso({
        dateValue,
        timeValue: time,
        timeZone: getBranchScheduleTimeZone(activeBranch),
      });
    }

    try {
      setSaving(true);
      const response = await updateGroupOrderSchedule({ orderId: order.id, orderTime });

      if (!response || response.error) {
        toast.error(response?.message || response?.error || "Unable to update schedule.");
        return;
      }

      onSaved(orderTime);
      toast.success("Group order schedule updated.");
      onOpenChange(false);
    } catch {
      toast.error("Unable to update schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4 backdrop-blur-sm">
      <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600"
          aria-label="Close schedule editor"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="shrink-0 px-6 pb-4 pt-6 md:px-8 md:pt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Edit schedule</h2>
          <p className="mt-1 text-sm text-gray-500">Switch between instant ordering and scheduled date/time.</p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-4 md:px-8">
          <div>
            <label className="text-sm font-medium text-gray-700">Schedule</label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => immediateAvailable && setScheduleMode("now")}
                disabled={!immediateAvailable}
                className={`rounded-2xl border p-4 text-left transition ${
                  !immediateAvailable
                    ? disabledTileClass
                    : scheduleMode === "now"
                      ? activeTileClass
                      : interactiveTileClass
                }`}
              >
                <Clock className="mb-3 h-5 w-5 text-primary" />
                <span className="block text-sm font-semibold">Order now</span>
                <span className="mt-1 block text-xs text-gray-500">
                  {immediateAvailable ? "Prepare as soon as possible" : "Not available right now"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleMode("schedule")}
                className={`rounded-2xl border p-4 text-left transition ${
                  scheduleMode === "schedule" ? activeTileClass : interactiveTileClass
                }`}
              >
                <Clock className="mb-3 h-5 w-5 text-primary" />
                <span className="block text-sm font-semibold">Schedule</span>
                <span className="mt-1 block text-xs text-gray-500">Choose date and time</span>
              </button>
            </div>
          </div>

          {scheduleMode === "schedule" ? (
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  {scheduleHoursLabel ? <span className="text-xs font-medium text-gray-500">{scheduleHoursLabel}</span> : null}
                </div>
                <ScheduleRail ariaLabel="Choose schedule date">
                  {scheduleDates.map((scheduleDate) => {
                    const nextDateValue = getDateValue(scheduleDate);
                    const dateScheduleState = getBranchScheduleForDate({
                      branch: activeBranch,
                      dateValue: nextDateValue,
                      scheduleType,
                    });
                    const availableSlots = scheduleType === "delivery"
                      ? buildDeliveryTimeSlots({ branch: activeBranch, dateValue: nextDateValue })
                      : buildPickupTimeSlots({ branch: activeBranch, dateValue: nextDateValue });
                    const disabled =
                      isPastDateValue(nextDateValue) ||
                      (dateScheduleState.hasOpeningHours &&
                        (Boolean(dateScheduleState.schedule?.isClosed) || availableSlots.length === 0));
                    const isSelected = date === nextDateValue;

                    return (
                      <button
                        key={nextDateValue}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setDate(nextDateValue);
                          setTime("");
                        }}
                        className={`min-w-[92px] snap-start rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                          isSelected
                            ? activeTileClass
                            : disabled
                              ? disabledTileClass
                              : interactiveTileClass
                        }`}
                      >
                        <span className="block text-xs font-semibold uppercase">
                          {scheduleDate.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="mt-1 block text-lg font-semibold">
                          {scheduleDate.getDate()}
                        </span>
                        <span className="block text-xs">
                          {scheduleDate.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </ScheduleRail>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-gray-700">Time</label>
                  {breakLabels.length ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                      <PauseCircle className="h-3.5 w-3.5" />
                      Break: {breakLabels.join(", ")}
                    </span>
                  ) : null}
                </div>
                {timeSlots.length ? (
                  <ScheduleRail ariaLabel="Choose schedule time">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setTime(slot.value)}
                        className={`h-[48px] min-w-[96px] snap-start rounded-[14px] border text-sm font-semibold transition-all duration-200 ${
                          time === slot.value ? activeTileClass : interactiveTileClass
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </ScheduleRail>
                ) : (
                  <Time24Picker value={time} onChange={setTime} />
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 px-6 py-4 md:px-8">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={saveSchedule} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save schedule
          </Button>
        </div>
      </div>
    </div>
  );
}
