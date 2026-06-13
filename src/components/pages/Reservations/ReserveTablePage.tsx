"use client";

import Image from "next/image";
import { AlertTriangle, CalendarDays, CalendarX, CircleCheck, Clock, Coffee, Info, LoaderCircle, Star, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useReservations from "@/hooks/useReservations";
import { useAuth } from "@/hooks/useAuth";
import { ReservationSuccess } from "@/components/pages/Reservations/components/ReservationSuccess";
import { AsyncSelect } from "@/components/ui/AsyncSelect";
import { getApiErrorMessage } from "@/lib/errors";
import { createReservationSchema, type ReservationFormValues } from "@/validations/reservations";
import {
  getReservationStatusLabelKey,
  normalizeReservationResponse,
  type Reservation,
  type ReservationPayload,
} from "@/services/reservations";
import type { BranchRecord } from "@/types/branch-selector";

const SLOT_INTERVAL_MINUTES = 30;

type OpeningHours = {
  dayOfWeek?: string;
  isClosed?: boolean;
  openTime?: string;
  closeTime?: string;
  breakTimes?: {
    startTime?: string;
    endTime?: string;
    note?: string;
  }[];
  note?: string;
};

type DateRangeRule = {
  fromDate?: string;
  toDate?: string;
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
  date?: string;
  isClosed?: boolean;
  openTime?: string;
  closeTime?: string;
  note?: string;
};

type ReservationBlockReason = "temporaryClosure" | "holiday" | "unavailable";

const normalizeArray = <T = unknown,>(value: unknown): T[] => {
  return Array.isArray(value) ? value as T[] : [];
};

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const getTodayDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateFromValue = (value: string) => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const getDayOfWeek = (dateValue: string) => {
  const date = getDateFromValue(dateValue);

  if (!date) return "";

  return date
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
};

const isPastDateValue = (value: string) => {
  if (!value) return false;

  return value < getTodayDateValue();
};

const timeToMinutes = (value?: string | null) => {
  if (!value) return null;

  const [hours, minutes] = String(value).split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
};

const minutesToTime = (value: number) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatTimeLabel = (value: string) => {
  const minutes = timeToMinutes(value);

  if (minutes === null) return value;

  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const roundUpToInterval = (minutes: number, interval: number) => {
  return Math.ceil(minutes / interval) * interval;
};

const getCurrentMinutes = () => {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
};

const normalizeDateValue = (value: unknown) => {
  const text = String(value || "").trim();

  if (!text) return "";

  return text.slice(0, 10);
};

const getDateRangeDates = (rule: DateRangeRule) => {
  const fromDate = normalizeDateValue(
    rule?.fromDate || rule?.startDate || rule?.dateFrom || rule?.date
  );

  const toDate = normalizeDateValue(
    rule?.toDate || rule?.endDate || rule?.dateTo || rule?.date || fromDate
  );

  return {
    fromDate,
    toDate,
  };
};

const isDateInsideRange = (dateValue: string, rule: DateRangeRule) => {
  const { fromDate, toDate } = getDateRangeDates(rule);

  if (!dateValue || !fromDate || !toDate) return false;

  return dateValue >= fromDate && dateValue <= toDate;
};

const getDateRangeRules = (branch?: BranchRecord | null): DateRangeRule[] => {
  const settings = branch?.settings || {};

  return [
    ...normalizeArray<DateRangeRule>(settings?.holidayRanges),
    ...normalizeArray<DateRangeRule>(settings?.reservationDateRanges),
    ...normalizeArray<DateRangeRule>(settings?.tableReservationDateRanges),
    ...normalizeArray<DateRangeRule>(settings?.reservationBlackoutRanges),
  ];
};

const getTemporaryClosure = (branch?: BranchRecord | null) =>
  branch?.availability?.temporaryClosure || branch?.settings?.temporaryClosure || null;

const getDateTimeFromDateAndMinutes = (dateValue: string, minutes: number) => {
  const date = getDateFromValue(dateValue);

  if (!date) return null;

  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

const getTimestamp = (value?: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  const timestamp = date.getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
};

const isTemporaryClosureActiveForDate = (branch: BranchRecord | null, dateValue: string) => {
  const closure = getTemporaryClosure(branch);

  if (!branch || !dateValue || (!closure?.isClosed && !branch.availability?.isTemporarilyClosed)) {
    return false;
  }

  const from = getTimestamp(closure?.closedAt);
  const to = getTimestamp(closure?.closedUntil);

  if (from === null && to === null) {
    return true;
  }

  const dayStart = getDateFromValue(dateValue);

  if (!dayStart) return true;

  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const closureStart = from ?? Number.NEGATIVE_INFINITY;
  const closureEnd = to ?? Number.POSITIVE_INFINITY;

  return closureStart <= dayEnd.getTime() && closureEnd >= dayStart.getTime();
};

const isSlotInsideTemporaryClosure = ({
  branch,
  dateValue,
  slotStart,
  slotEnd,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
  slotStart: number;
  slotEnd: number;
}) => {
  const closure = getTemporaryClosure(branch);

  if (!branch || !dateValue || (!closure?.isClosed && !branch.availability?.isTemporarilyClosed)) {
    return false;
  }

  const from = getTimestamp(closure?.closedAt);
  const to = getTimestamp(closure?.closedUntil);

  if (from === null && to === null) {
    return true;
  }

  const slotStartDate = getDateTimeFromDateAndMinutes(dateValue, slotStart);
  const slotEndDate = getDateTimeFromDateAndMinutes(dateValue, slotEnd);

  if (!slotStartDate || !slotEndDate) return true;

  const closureStart = from ?? Number.NEGATIVE_INFINITY;
  const closureEnd = to ?? Number.POSITIVE_INFINITY;

  return slotStartDate.getTime() < closureEnd && slotEndDate.getTime() > closureStart;
};

const getHolidayOpeningHoursForDate = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}): OpeningHours | null => {
  const holidayOpeningHour = getRecord(branch?.availability?.holidayOpeningHour);

  if (!holidayOpeningHour || !dateValue) {
    return null;
  }

  const holidayDate = typeof holidayOpeningHour.date === "string"
    ? normalizeDateValue(holidayOpeningHour.date)
    : "";

  if (holidayDate && holidayDate !== dateValue) {
    return null;
  }

  if (!holidayDate && dateValue !== getTodayDateValue()) {
    return null;
  }

  return {
    dayOfWeek: getDayOfWeek(dateValue),
    isClosed: Boolean(holidayOpeningHour.isClosed),
    openTime: typeof holidayOpeningHour.openTime === "string" ? holidayOpeningHour.openTime : undefined,
    closeTime: typeof holidayOpeningHour.closeTime === "string" ? holidayOpeningHour.closeTime : undefined,
    breakTimes: [],
    note: typeof holidayOpeningHour.note === "string" ? holidayOpeningHour.note : "",
  };
};

const getBranchAvailabilityBlock = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}) => {
  if (!branch || !dateValue) {
    return null;
  }

  if (branch.isActive === false || branch.availability?.isActive === false) {
    return {
      reason: "unavailable" as ReservationBlockReason,
      message: branch.availability?.reason || "",
    };
  }

  if (branch.availability?.isHolidayClosed && dateValue === getTodayDateValue()) {
    return {
      reason: "holiday" as ReservationBlockReason,
      message: branch.availability?.reason || "",
    };
  }

  if (isTemporaryClosureActiveForDate(branch, dateValue)) {
    const closure = getTemporaryClosure(branch);

    return {
      reason: "temporaryClosure" as ReservationBlockReason,
      message: closure?.message || closure?.reason || branch.availability?.reason || "",
    };
  }

  if (
    branch.availability?.isAvailable === false &&
    !branch.availability?.isTemporarilyClosed &&
    !branch.availability?.isHolidayClosed
  ) {
    return {
      reason: "unavailable" as ReservationBlockReason,
      message: branch.availability?.reason || "",
    };
  }

  return null;
};

const isSlotInsideBreak = ({
  slotStart,
  slotEnd,
  breakTime,
}: {
  slotStart: number;
  slotEnd: number;
  breakTime: unknown;
}) => {
  const breakRecord = getRecord(breakTime);
  const breakStart = timeToMinutes(typeof breakRecord?.startTime === "string" ? breakRecord.startTime : null);
  const breakEnd = timeToMinutes(typeof breakRecord?.endTime === "string" ? breakRecord.endTime : null);

  if (breakStart === null || breakEnd === null) return false;

  return slotStart < breakEnd && slotEnd > breakStart;
};

const getOpeningHoursForDate = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}) => {
  if (!branch || !dateValue) {
    return {
      schedule: null as OpeningHours | null,
      dateRule: null as DateRangeRule | null,
      reason: "",
    };
  }

  const rangeRule =
    getDateRangeRules(branch).find((rule) => isDateInsideRange(dateValue, rule)) ||
    null;

  if (rangeRule) {
    const closed = Boolean(rangeRule?.isClosed);

    return {
      schedule: {
        dayOfWeek: getDayOfWeek(dateValue),
        isClosed: closed,
        openTime: rangeRule?.openTime || "09:00",
        closeTime: rangeRule?.closeTime || "18:00",
        breakTimes: [],
        note: rangeRule?.note || "",
      },
      dateRule: rangeRule,
      reason: rangeRule?.note || "",
    };
  }

  const holidayOpeningHours = getHolidayOpeningHoursForDate({ branch, dateValue });

  if (holidayOpeningHours) {
    return {
      schedule: holidayOpeningHours,
      dateRule: null,
      reason: holidayOpeningHours.note || "",
    };
  }

  const openingHours = normalizeArray<OpeningHours>(branch?.settings?.openingHours);
  const selectedDay = getDayOfWeek(dateValue);

  const weeklySchedule =
    openingHours.find((hour) => {
      return String(hour?.dayOfWeek || "").trim().toUpperCase() === selectedDay;
    }) || null;

  return {
    schedule: weeklySchedule,
    dateRule: null,
    reason: "",
  };
};

const buildAvailableTimeSlots = ({
  branch,
  dateValue,
}: {
  branch?: BranchRecord | null;
  dateValue: string;
}) => {
  if (!branch || !dateValue || isPastDateValue(dateValue)) return [];

  const availabilityBlock = getBranchAvailabilityBlock({ branch, dateValue });

  if (availabilityBlock?.reason === "unavailable" || availabilityBlock?.reason === "holiday") {
    return [];
  }

  const { schedule } = getOpeningHoursForDate({
    branch,
    dateValue,
  });

  if (!schedule || schedule?.isClosed) return [];

  const open = timeToMinutes(schedule?.openTime);
  const close = timeToMinutes(schedule?.closeTime);

  if (open === null || close === null || open >= close) return [];

  const isToday = dateValue === getTodayDateValue();
  const earliestTodayMinutes = isToday
    ? roundUpToInterval(getCurrentMinutes(), SLOT_INTERVAL_MINUTES)
    : open;

  const startAt = Math.max(open, earliestTodayMinutes);
  const slots: string[] = [];

  for (
    let slotStart = startAt;
    slotStart + SLOT_INTERVAL_MINUTES <= close;
    slotStart += SLOT_INTERVAL_MINUTES
  ) {
    const slotEnd = slotStart + SLOT_INTERVAL_MINUTES;

    const isDuringBreak = normalizeArray(schedule?.breakTimes).some(
      (breakTime) =>
        isSlotInsideBreak({
          slotStart,
          slotEnd,
          breakTime,
        })
    );

    const isDuringTemporaryClosure = isSlotInsideTemporaryClosure({
      branch,
      dateValue,
      slotStart,
      slotEnd,
    });

    if (!isDuringBreak && !isDuringTemporaryClosure) {
      slots.push(minutesToTime(slotStart));
    }
  }

  return slots;
};

export function ReserveTablePage() {
  const t = useTranslations("reserveTable");
  const validationT = useTranslations("validation");
  const errorsT = useTranslations("errors");
  const { token, user } = useAuth();
  const { createReservation, fetchReservationBranch, fetchReservationBranches, loading } = useReservations(token);

  const [success, setSuccess] = useState(false);
  const [reservationData, setReservationData] = useState<Reservation | null>(null);

  const reservationSchema = useMemo(() => createReservationSchema({
    branchRequired: validationT("reservationBranchRequired"),
    dateTimeRequired: validationT("reservationDateTimeRequired"),
    pastDate: validationT("reservationPastDate"),
    guestWholeNumber: validationT("reservationGuestWholeNumber"),
    guestMin: validationT("reservationGuestMin"),
    guestMax: validationT("reservationGuestMax"),
    noteMax: validationT("reservationNoteMax"),
  }), [validationT]);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      branchId: "",
      date: "",
      time: "",
      guestCount: 2,
      note: "",
    },
  });

  const {
    formState: { isSubmitting },
    handleSubmit: handleFormSubmit,
    setValue,
    watch,
    reset,
  } = form;
  const date = watch("date");
  const time = watch("time");
  const guestCount = watch("guestCount");
  const note = watch("note") || "";

  const [selectedBranch, setSelectedBranch] = useState<BranchRecord | null>(null);

  const customerId = user?.id;
  const todayDate = useMemo(() => getTodayDateValue(), []);

  useEffect(() => {
    const prefillSelectedBranch = async () => {
      if (!user?.branchId) return;

      try {
        const { branch } = await fetchReservationBranch({ branchId: String(user.branchId) });

        if (branch) {
          setSelectedBranch(branch);
          setValue("branchId", String(branch.id), { shouldValidate: true });
        }
      } catch (error) {
      }
    };

    prefillSelectedBranch();
  }, [fetchReservationBranch, setValue, user?.branchId]);

  /* ---------------- FETCH ---------------- */
  const fetchBranches = async ({ search = "", page = 1 }) => {
    return await fetchReservationBranches({
      restaurantId: user?.restaurantId,
      search,
      page,
    });
  };

  const handleBranchSelect = (branch: BranchRecord | null) => {
    setSelectedBranch(branch);
    setValue("branchId", branch?.id ? String(branch.id) : "", { shouldValidate: true });
    setValue("date", "", { shouldValidate: true });
    setValue("time", "", { shouldValidate: true });

    if (!branch?.id) return;

    fetchReservationBranch({ branchId: String(branch.id) })
      .then(({ branch: branchDetails }) => {
        if (branchDetails) {
          setSelectedBranch(branchDetails);
        }
      })
      .catch(() => {
        setSelectedBranch(branch);
      });
  };

  /* ---------------- DAY + OPENING HOURS ---------------- */
  const selectedDay = useMemo(() => {
    return date ? getDayOfWeek(date) : null;
  }, [date]);

  const selectedScheduleState = useMemo(() => {
    return getOpeningHoursForDate({
      branch: selectedBranch,
      dateValue: date,
    });
  }, [selectedBranch, date]);

  const todaysHours = selectedScheduleState.schedule;
  const selectedDateRule = selectedScheduleState.dateRule;
  const isClosed = Boolean(todaysHours?.isClosed);
  const reservationsEnabled = selectedBranch?.settings?.tableReservationsEnabled === true;
  const selectedAvailabilityBlock = useMemo(() => {
    return getBranchAvailabilityBlock({
      branch: selectedBranch,
      dateValue: date,
    });
  }, [selectedBranch, date]);

  const availableTimeSlots = useMemo(() => {
    return buildAvailableTimeSlots({
      branch: selectedBranch,
      dateValue: date,
    });
  }, [selectedBranch, date]);

  useEffect(() => {
    if (!time) return;

    if (!availableTimeSlots.includes(time)) {
      setValue("time", "", { shouldValidate: true });
    }
  }, [availableTimeSlots, time]);

  const hasOpeningHours = normalizeArray(selectedBranch?.settings?.openingHours).length > 0;
  const dateRangeRules = getDateRangeRules(selectedBranch);
  const openingHoursRows = normalizeArray<OpeningHours>(selectedBranch?.settings?.openingHours);
  const entriesCount = openingHoursRows.length + dateRangeRules.length;
  const openRowsCount = openingHoursRows.filter((hour) => !hour.isClosed).length;
  const closedRowsCount =
    openingHoursRows.filter((hour) => hour.isClosed).length +
    dateRangeRules.filter((rule) => rule?.isClosed).length;

  const dateError = useMemo(() => {
    if (!date) return "";
    if (isPastDateValue(date)) return t("errors.pastDate");
    if (!selectedBranch?.id) return t("errors.selectBranchFirst");
    if (!reservationsEnabled) return t("errors.branchUnavailable");
    if (selectedAvailabilityBlock?.reason === "unavailable") {
      return selectedAvailabilityBlock.message || t("errors.branchUnavailable");
    }
    if (selectedAvailabilityBlock?.reason === "holiday") {
      return selectedAvailabilityBlock.message || t("errors.holidayClosed");
    }
    if (!hasOpeningHours && !selectedDateRule) {
      return t("errors.openingHoursNotConfigured");
    }
    if (!todaysHours) return t("errors.openingHoursUnavailable");
    if (isClosed) {
      return selectedDateRule
        ? t("errors.closedDateRange")
        : t("errors.closedSelectedDay");
    }

    return "";
  }, [
    date,
    selectedBranch?.id,
    reservationsEnabled,
    hasOpeningHours,
    selectedDateRule,
    selectedAvailabilityBlock,
    todaysHours,
    isClosed,
    t,
  ]);

  const timeError = useMemo(() => {
    if (!date || !time) return "";
    if (dateError) return dateError;
    if (!availableTimeSlots.includes(time)) {
      return t("errors.invalidReservationTime");
    }

    return "";
  }, [date, time, dateError, availableTimeSlots, t]);

  const timeSelectPlaceholder = useMemo(() => {
    if (!selectedBranch?.id) return t("selectBranchFirst");
    if (!date) return t("selectDateFirst");
    if (dateError) return t("noAvailableTime");
    if (!availableTimeSlots.length) return t("noFutureSlots");

    return t("selectReservationTime");
  }, [selectedBranch?.id, date, dateError, availableTimeSlots.length, t]);

  const openingHoursLabel = useMemo(() => {
    if (!date || !todaysHours) return "";

    if (todaysHours?.isClosed) {
      return t("closed");
    }

    return `${todaysHours?.openTime || "--:--"} - ${
      todaysHours?.closeTime || "--:--"
    }`;
  }, [date, todaysHours, t]);

  const reservationNotice = useMemo(() => {
    if (!selectedBranch?.id) {
      return null;
    }

    const closure = getTemporaryClosure(selectedBranch);
    const closureUntil = closure?.closedUntil ? new Date(closure.closedUntil) : null;
    const formattedClosureUntil = closureUntil && !Number.isNaN(closureUntil.getTime())
      ? closureUntil.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "";

    if (date && selectedAvailabilityBlock?.reason === "temporaryClosure") {
      return {
        tone: "warning" as const,
        icon: AlertTriangle,
        title: t("temporaryClosureTitle"),
        message: selectedAvailabilityBlock.message || t("temporaryClosureDescription"),
        meta: formattedClosureUntil ? t("temporaryClosureUntil", { date: formattedClosureUntil }) : "",
      };
    }

    if (date && selectedAvailabilityBlock?.reason === "holiday") {
      return {
        tone: "danger" as const,
        icon: CalendarX,
        title: t("holidayClosureTitle"),
        message: selectedAvailabilityBlock.message || t("holidayClosureDescription"),
        meta: "",
      };
    }

    if (date && selectedAvailabilityBlock?.reason === "unavailable") {
      return {
        tone: "danger" as const,
        icon: CalendarX,
        title: t("branchUnavailableTitle"),
        message: selectedAvailabilityBlock.message || t("branchUnavailableDescription"),
        meta: "",
      };
    }

    if (date && isClosed) {
      return {
        tone: "danger" as const,
        icon: CalendarX,
        title: t("closedDayTitle"),
        message: dateError || t("errors.closedSelectedDay"),
        meta: "",
      };
    }

    if (date && availableTimeSlots.length === 0 && !dateError) {
      return {
        tone: "warning" as const,
        icon: Clock,
        title: t("noSlotsTitle"),
        message: t("noSlotsDescription"),
        meta: "",
      };
    }

    if (date && openingHoursLabel) {
      return {
        tone: "success" as const,
        icon: Clock,
        title: t("availableTodayTitle"),
        message: t("availableHours", { hours: openingHoursLabel }),
        meta: selectedDateRule ? t("dateRangeRuleSuffix") : "",
      };
    }

    return null;
  }, [
    availableTimeSlots.length,
    date,
    dateError,
    isClosed,
    openingHoursLabel,
    selectedAvailabilityBlock,
    selectedBranch,
    selectedDateRule,
    t,
  ]);

  /* ---------------- SUBMIT ---------------- */
  async function handleSubmit(values: ReservationFormValues) {
    try {
      if (!customerId) return toast.error(t("userNotFound"));

      if (!selectedBranch?.id) {
        return toast.error(t("selectBranchToast"));
      }

      if (!date || !time) {
        return toast.error(t("selectDateTime"));
      }

      if (dateError) {
        return toast.error(dateError);
      }

      if (timeError) {
        return toast.error(timeError);
      }

      if (!availableTimeSlots.includes(time)) {
        return toast.error(t("selectedTimeUnavailable"));
      }

      const reservationDate = new Date(`${values.date}T${values.time}:00`).toISOString();

      const payload: ReservationPayload = {
        branchId: selectedBranch.id,
        reservationDate,
        guestCount: values.guestCount,
        note: values.note || "",
      };

      const res = await createReservation({ customerId, payload });

      if (!res || res.error) {
        return toast.error(getApiErrorMessage(res, t("failedFallback")));
      }

      const reservation = normalizeReservationResponse(res);
      const statusKey = getReservationStatusLabelKey(reservation?.status);
      const toastMessage =
        statusKey === "confirmed"
          ? t("reservationConfirmedToast")
          : statusKey === "requested"
            ? t("reservationRequestedToast")
            : t("reservationCreatedToast");

      toast.success(toastMessage);

      setSuccess(true);
      setReservationData(reservation);

      reset({ branchId: "", date: "", time: "", guestCount: 2, note: "" });
      setSelectedBranch(null);
    } catch {
      toast.error(errorsT("somethingWentWrong"));
    }
  }

  if (success) return <ReservationSuccess data={reservationData} />;

  const canSubmit =
    Boolean(selectedBranch?.id) &&
    Boolean(date) &&
    Boolean(time) &&
    !dateError &&
    !timeError &&
    availableTimeSlots.includes(time);
  const ReservationNoticeIcon = reservationNotice?.icon;

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/reserve-table-bg.jpg"
          alt="bg"
          fill
          className="object-cover opacity-10"
        />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] gap-12 px-6 py-12 lg:grid-cols-2">
        {/* LEFT */}
        <div className="mt-10 space-y-3">
          <h1 className="text-[60px] font-bold">
            {t("heroTitlePrefix")} <span className="block text-primary">{t("heroTitleHighlight")}</span>
          </h1>

          <p className="text-gray-600">
            {t("heroDescription")}
          </p>

          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span>4.9</span>
            <span className="text-gray-500">{t("reviews")}</span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rounded-2xl bg-white p-10 shadow-xl">
          <div className="mb-[27px] space-y-[2px]">
            <h2 className="text-[23px] font-semibold text-gray-900">
              {t("title")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("subtitle")}
            </p>
          </div>

          <form
            noValidate
            className="space-y-6"
            onSubmit={handleFormSubmit(handleSubmit)}
          >
            {/* BRANCH */}
            <div>
              <label className="text-sm font-medium">{t("selectBranch")}</label>

              <div className="mt-2 flex items-center gap-2">
                <AsyncSelect
                  value={selectedBranch}
                  onChange={handleBranchSelect}
                  placeholder={t("chooseBranch")}
                  fetchOptions={fetchBranches}
                />

                {/* INFO POPUP */}
                {selectedBranch?.settings ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("openingHours")}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </DialogTrigger>

                    <DialogContent className="flex max-h-[92vh] w-[calc(100vw-24px)] max-w-[960px] gap-0 overflow-hidden rounded-[24px] border-0 bg-white p-0 shadow-2xl sm:w-[calc(100vw-48px)]">
                      <div className="border-b border-gray-100 bg-gradient-to-br from-primary/10 via-white to-orange-50 px-5 py-5 sm:px-6">
                        <DialogHeader className="pr-10 text-left">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 gap-3">
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-primary text-white shadow-lg shadow-primary/25">
                                <CalendarDays size={18} />
                              </span>
                              <div className="min-w-0">
                                <div className="mb-2 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/10">
                                  {t("openingHours")}
                                </div>
                                <DialogTitle className="text-[22px] font-semibold leading-tight tracking-tight text-gray-950 sm:text-[26px]">
                                  {t("openingHours")}
                                </DialogTitle>
                                <DialogDescription className="mt-2 max-w-[560px] text-sm leading-6 text-gray-600">
                                  {t("openingHoursPopupNote")}
                                </DialogDescription>
                              </div>
                            </div>

                            {selectedBranch?.name ? (
                              <span className="w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-100">
                                {selectedBranch.name}
                              </span>
                            ) : null}
                          </div>
                        </DialogHeader>

                        <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-[440px] sm:gap-3">
                          {[
                            { label: t("entries"), value: entriesCount },
                            { label: t("open"), value: openRowsCount },
                            { label: t("closed"), value: closedRowsCount },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="rounded-[16px] bg-white/90 px-3 py-3 text-center shadow-sm ring-1 ring-gray-100 backdrop-blur"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:text-[11px]">
                                {item.label}
                              </p>
                              <p className="mt-1 text-lg font-semibold text-gray-900">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] px-5 py-5 sm:px-6">
                        <div className="mb-5 rounded-[18px] border border-blue-100 bg-blue-50/80 p-4">
                          <div className="flex gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-blue-600 shadow-sm">
                              <Info size={16} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{t("openingHours")}</p>
                              <p className="mt-1 text-xs leading-5 text-gray-600">
                                {t("openingHoursDescription")}
                              </p>
                            </div>
                          </div>
                        </div>

                        {hasOpeningHours ? (
                          <div className="space-y-3">
                            {openingHoursRows.map((h, index) => (
                              <div
                                key={h.dayOfWeek || `opening-hour-${index}`}
                                className="overflow-visible rounded-[22px] border border-gray-100 bg-white shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-sm font-semibold text-primary">
                                      {index + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-gray-950">
                                        {String(h.dayOfWeek || "").slice(0, 3)}
                                      </p>
                                      <p className="text-xs text-gray-500">{t("openingHours")}</p>
                                    </div>
                                  </div>

                                  <span className="rounded-full bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100">
                                    {h.isClosed ? t("closed") : t("open")}
                                  </span>
                                </div>

                                <div className="p-4">
                                  {h.isClosed ? (
                                    <div className="flex min-h-[76px] flex-col justify-center rounded-[16px] border border-red-100 bg-red-50 px-4">
                                      <p className="text-sm font-semibold text-red-700">{t("closed")}</p>
                                      <p className="mt-1 text-xs leading-5 text-red-500">
                                        {t("openingHoursNotConfigured")}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="flex h-[44px] items-center gap-3 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-800">
                                        <Clock size={16} className="shrink-0 text-gray-400" />
                                        <span className="font-medium">
                                          {h.openTime || "--:--"} - {h.closeTime || "--:--"}
                                        </span>
                                      </div>

                                      {normalizeArray<NonNullable<OpeningHours["breakTimes"]>[number]>(h.breakTimes).length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {normalizeArray<NonNullable<OpeningHours["breakTimes"]>[number]>(h.breakTimes).map((breakTime, breakIndex) => (
                                            <div
                                              key={`${h.dayOfWeek || index}-break-${breakIndex}`}
                                              className="inline-flex items-center gap-2 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 py-2 text-xs font-medium text-gray-700"
                                            >
                                              <Coffee size={13} className="shrink-0 text-gray-400" />
                                              <span>
                                                {breakTime.startTime || "--:--"} - {breakTime.endTime || "--:--"}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="min-h-[260px] rounded-[22px] border border-dashed border-gray-200 bg-white p-6 text-center sm:p-8">
                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                              <CalendarDays size={18} />
                            </span>
                            <p className="mt-4 text-sm font-semibold text-gray-900">
                              {t("openingHoursNotConfigured")}
                            </p>
                          </div>
                        )}

                        {dateRangeRules.length > 0 ? (
                          <div className="mt-5">
                            <div className="mb-3 flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-primary shadow-sm">
                                <CalendarX size={16} />
                              </span>
                              <div>
                                <p className="text-base font-semibold text-gray-950">{t("dateRangeRules")}</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {dateRangeRules.slice(0, 5).map((rule, index) => {
                                const { fromDate, toDate } = getDateRangeDates(rule);

                                return (
                                  <div
                                    key={`date-rule-${index}`}
                                    className="overflow-visible rounded-[22px] border border-gray-100 bg-white shadow-sm"
                                  >
                                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
                                      <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-sm font-semibold text-primary">
                                          {index + 1}
                                        </span>
                                        <p className="truncate text-sm font-semibold text-gray-950">
                                          {fromDate}
                                          {toDate && toDate !== fromDate ? ` - ${toDate}` : ""}
                                        </p>
                                      </div>

                                      <span className="rounded-full bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100">
                                        {rule?.isClosed ? t("closed") : t("open")}
                                      </span>
                                    </div>

                                    <div className="p-4">
                                      {rule?.isClosed ? (
                                        <div className="flex min-h-[76px] flex-col justify-center rounded-[16px] border border-red-100 bg-red-50 px-4">
                                          <p className="text-sm font-semibold text-red-700">{t("closed")}</p>
                                          <p className="mt-1 text-xs leading-5 text-red-500">
                                            {rule?.note || t("errors.closedDateRange")}
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="flex h-[44px] items-center gap-3 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-800">
                                          <Clock size={16} className="shrink-0 text-gray-400" />
                                          <span className="font-medium">
                                            {rule?.openTime || "--:--"} - {rule?.closeTime || "--:--"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <DialogFooter className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
                        <DialogClose className="inline-flex h-[44px] items-center justify-center rounded-[14px] border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20">
                          {t("closeModal")}
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : null}
              </div>
            </div>

            {reservationNotice ? (
              <div
                className={`rounded-2xl border p-4 shadow-sm ${
                  reservationNotice.tone === "success"
                    ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                    : reservationNotice.tone === "warning"
                      ? "border-amber-200 bg-amber-50/90 text-amber-950"
                      : "border-red-200 bg-red-50/90 text-red-950"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      reservationNotice.tone === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : reservationNotice.tone === "warning"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {ReservationNoticeIcon ? <ReservationNoticeIcon className="h-5 w-5" /> : null}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {reservationNotice.title}
                    </p>
                    <p className="mt-1 text-sm leading-5 opacity-80">
                      {reservationNotice.message}
                      {reservationNotice.meta ? ` ${reservationNotice.meta}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* DATE + TIME */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">{t("date")}</label>
                <Input
                  type="date"
                  value={date}
                  min={todayDate}
                  disabled={!selectedBranch?.id}
                  onChange={(e) => {
                    const nextDate = e.target.value;

                    if (nextDate && isPastDateValue(nextDate)) {
                      toast.error(t("errors.pastDate"));
                      setValue("date", todayDate, { shouldValidate: true });
                      setValue("time", "", { shouldValidate: true });
                      return;
                    }

                    setValue("date", nextDate, { shouldValidate: true });
                    setValue("time", "", { shouldValidate: true });
                  }}
                  className="mt-2 rounded-full bg-[#FAFAF9] pr-11"
                />

                {dateError ? (
                  <p className="mt-1 text-xs text-red-500">{dateError}</p>
                ) : date && openingHoursLabel ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {t("availableHours", { hours: openingHoursLabel })}
                    {selectedDateRule ? t("dateRangeRuleSuffix") : ""}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-medium">{t("time")}</label>

                <select
                  value={time}
                  disabled={!selectedBranch?.id || !date || Boolean(dateError)}
                  onChange={(e) => setValue("time", e.target.value, { shouldValidate: true })}
                  className="mt-2 h-10 w-full rounded-full border border-input bg-[#FAFAF9] px-4 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{timeSelectPlaceholder}</option>

                  {availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {formatTimeLabel(slot)}
                    </option>
                  ))}
                </select>

                {timeError ? (
                  <p className="mt-1 text-xs text-red-500">{timeError}</p>
                ) : date && availableTimeSlots.length > 0 ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {t("futureSlotsOnly")}
                  </p>
                ) : null}
              </div>
            </div>

            {/* GUEST */}
            <div>
              <label className="text-sm font-medium">{t("guests")}</label>

              <div className="mt-2 grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setValue("guestCount", g, { shouldValidate: true })}
                    className={`rounded-full py-2 ${
                      guestCount === g ? "bg-primary text-white" : "bg-gray-100"
                    }`}
                  >
                    {g === 5 ? "5+" : g}
                  </button>
                ))}
              </div>
            </div>

            {/* NOTE */}
            <div>
              <label className="text-sm font-medium">{t("specialRequest")}</label>

              <Textarea
  value={note}
  onChange={(e) => setValue("note", e.target.value, { shouldValidate: true })}
  placeholder={t("specialRequestPlaceholder")}
  className="mt-2 rounded-xl border border-gray-200 bg-[#FAFAF9] placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
/>
              <p className="mt-1 text-xs text-gray-500">
                {t("specialRequestTip")}
              </p>
            </div>

            {/* SUBMIT */}
            <Button
              className="w-full py-4 text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || isSubmitting || !canSubmit}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {t("reserving")}
                </>
              ) : (
                t("confirmReservation")
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
