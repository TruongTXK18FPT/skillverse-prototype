import React, { useState, useEffect } from "react";
import {
  X,
  Wallet,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Target,
  Layers,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import walletService from "../../services/walletService";
import { getAvailability } from "../../services/availabilityService";
import {
  createBookingWithWallet,
  getMentorActiveBookings,
} from "../../services/bookingService";
import { usePaymentToast } from "../../utils/useToast";
import Toast from "../shared/Toast";
import journeyService from "../../services/journeyService";
import { JourneySummaryResponse } from "../../types/Journey";
import "./uplink-styles.css";

interface JourneyContext {
  journeyId?: number;
  nodeId?: string;
  nodeSkillId?: number;
  bookingType:
    | "GENERAL"
    | "NODE_MENTORING"
    | "JOURNEY_MENTORING"
    | "ROADMAP_MENTORING";
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string;
  mentorName: string;
  hourlyRate: number; // VND
  roadmapMentoringPrice?: number; // VND
  journeyContext?: JourneyContext;
}

interface BookableSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  /** Original VN timezone string from backend (e.g. "2026-03-27T02:00:00.000+07:00") — used for reliable timezone-safe serialization */
  startTimeRaw: string;
  endTimeRaw: string;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  mentorId,
  mentorName,
  hourlyRate,
  roadmapMentoringPrice,
  journeyContext,
}) => {
  const { user } = useAuth();
  const isRoadmapMentoring =
    journeyContext?.bookingType === "ROADMAP_MENTORING";

  // Determine initial step
  const getInitialStep = () => {
    if (isRoadmapMentoring) {
      return journeyContext?.journeyId ? "payment" : "journey";
    }
    return "schedule";
  };

  const [step, setStep] = useState<"journey" | "schedule" | "payment">(
    getInitialStep(),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<BookableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [closeModalOnToastDismiss, setCloseModalOnToastDismiss] =
    useState(false);
  const { toast, showSuccess, showError, showWarning, hideToast } =
    usePaymentToast();
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set()); // Set of slot IDs that are booked

  // Journey selection state
  const [userJourneys, setUserJourneys] = useState<JourneySummaryResponse[]>(
    [],
  );
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(
    null,
  );
  const [loadingJourneys, setLoadingJourneys] = useState(false);

  // Calendar state
  const [calendarStartDate, setCalendarStartDate] = useState(new Date());

  const selectedJourney = userJourneys.find((j) => j.id === selectedJourneyId);

  const priceVND =
    isRoadmapMentoring && roadmapMentoringPrice
      ? roadmapMentoringPrice
      : hourlyRate;

  const getJourneySkills = (journey: JourneySummaryResponse): string[] => {
    const skills = [
      journey.skillName,
      ...(Array.isArray(journey.skills) ? journey.skills : []),
    ].filter((skill): skill is string => Boolean(skill?.trim()));

    return Array.from(new Set(skills.map((skill) => skill.trim()))).slice(0, 6);
  };

  const getJourneyProgressClass = (progress?: number): string => {
    const normalized = Math.min(Math.max(progress || 0, 0), 100);
    if (normalized >= 100) return "booking-journey-card__progressfill--100";
    if (normalized >= 75) return "booking-journey-card__progressfill--75";
    if (normalized >= 50) return "booking-journey-card__progressfill--50";
    if (normalized >= 25) return "booking-journey-card__progressfill--25";
    return "booking-journey-card__progressfill--10";
  };

  useEffect(() => {
    if (isOpen) {
      setStep(getInitialStep());
      setSelectedSlot(null);
      setSelectedJourneyId(null);
      // Payment always WALLET - no PayOS option
      setCloseModalOnToastDismiss(false);
      fetchWalletBalance();
      if (!isRoadmapMentoring) {
        fetchAvailableSlots();
      } else if (!journeyContext?.journeyId) {
        fetchActiveJourneys();
      }
      // Lock scroll
      document.body.classList.add("uplink-scroll-lock");
    } else {
      // Unlock scroll
      document.body.classList.remove("uplink-scroll-lock");
    }
    return () => {
      document.body.classList.remove("uplink-scroll-lock");
    };
  }, [isOpen, mentorId]);

  const fetchWalletBalance = async () => {
    try {
      const wallet = await walletService.getMyWallet();
      setWalletBalance(wallet.cashBalance);
    } catch (error) {
      console.error("Failed to fetch wallet balance", error);
    }
  };

  const fetchActiveJourneys = async () => {
    setLoadingJourneys(true);
    try {
      const journeys = await journeyService.getActiveJourneys();
      // Lọc các hành trình đã hoàn thành hoặc có sẵn roadmap?
      // Tuỳ logic, ở đây lấy tất cả active.
      setUserJourneys(journeys);
    } catch (error) {
      console.error("Failed to fetch active journeys", error);
    } finally {
      setLoadingJourneys(false);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      // Fetch slots for next 30 days
      const from = new Date().toISOString();
      const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const [rawSlots, activeBookings] = await Promise.all([
        getAvailability(Number(mentorId), from, to),
        getMentorActiveBookings(Number(mentorId), from, to),
      ]);

      // Build a set of booked slot IDs from active bookings
      // A slot is booked if it overlaps with a booking's time range
      const booked = new Set<string>();
      activeBookings.forEach((booking) => {
        // Treat as VN wall-clock time — append +07:00 so JS displays correctly in VN
        const bStartStr =
          booking.startTime.endsWith("Z") ||
          booking.startTime.includes("+07:00")
            ? booking.startTime
            : booking.startTime + "+07:00";
        const bEndStr =
          booking.endTime.endsWith("Z") || booking.endTime.includes("+07:00")
            ? booking.endTime
            : booking.endTime + "+07:00";
        const bStart = new Date(bStartStr);
        const bEnd = new Date(bEndStr);

        // Mark all hourly chunks within the booking range as booked
        const totalHours = Math.floor(
          (bEnd.getTime() - bStart.getTime()) / (60 * 60 * 1000),
        );
        for (let i = 0; i < totalHours; i++) {
          const chunkStart = new Date(bStart.getTime() + i * 60 * 60 * 1000);
          booked.add(`booked-${chunkStart.getTime()}`);
        }
      });
      setBookedSlots(booked);

      // Process slots: Split into 1-hour chunks
      // Backend stores times in VN timezone (+07:00). Handle both old (UTC/Z) and new (VN offset) formats.
      const processed: BookableSlot[] = [];
      rawSlots.forEach((slot) => {
        // If already has Z (old UTC data), keep as-is. If has +07:00 (new VN data), keep as-is.
        // No longer append 'Z' blindly — it breaks VN-offset strings.
        // Backend returns LocalDateTime without timezone (e.g. "2026-03-26T09:00:00").
        // We treat these as VN wall-clock time. Append +07:00 so JavaScript parses
        // them as UTC+7, which displays correctly in the VN browser.
        const startStr =
          slot.startTime.endsWith("Z") || slot.startTime.includes("+07:00")
            ? slot.startTime
            : slot.startTime + "+07:00";
        const endStr =
          slot.endTime.endsWith("Z") || slot.endTime.includes("+07:00")
            ? slot.endTime
            : slot.endTime + "+07:00";

        const start = new Date(startStr);
        const end = new Date(endStr);
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));

        for (let i = 0; i < hours; i++) {
          // Calculate slot boundaries by adding i hours to the raw start/end strings
          const slotStartMs = start.getTime() + i * 60 * 60 * 1000;
          const slotEndMs = slotStartMs + 60 * 60 * 1000;
          const slotStart = new Date(slotStartMs);
          const slotEnd = new Date(slotEndMs);

          // Only add if it's in the future
          if (slotStart > new Date()) {
            processed.push({
              id: `${slot.id}_${i}`,
              startTime: slotStart,
              endTime: slotEnd,
              // Preserve raw VN string for safe serialization (timezone-independent)
              startTimeRaw: slot.startTime,
              endTimeRaw: slot.endTime,
            });
          }
        }
      });

      // Sort by time
      processed.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      setAvailableSlots(processed);
    } catch (error) {
      console.error("Failed to fetch slots", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const getDaysArray = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(calendarStartDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const handlePrevWeek = () => {
    const newDate = new Date(calendarStartDate);
    newDate.setDate(newDate.getDate() - 7);
    if (newDate >= new Date()) {
      setCalendarStartDate(newDate);
    } else {
      setCalendarStartDate(new Date());
    }
  };

  const handleNextWeek = () => {
    const newDate = new Date(calendarStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setCalendarStartDate(newDate);
  };

  const getSlotsForDate = (date: Date) => {
    return availableSlots.filter(
      (slot) =>
        slot.startTime.getDate() === date.getDate() &&
        slot.startTime.getMonth() === date.getMonth() &&
        slot.startTime.getFullYear() === date.getFullYear(),
    );
  };

  const handleScheduleConfirm = () => {
    if (!selectedSlot) {
      setCloseModalOnToastDismiss(false);
      showWarning(
        "Chưa chọn khung giờ",
        "Vui lòng chọn một khung giờ trước khi tiếp tục.",
      );
      return;
    }
    setStep("payment");
  };

  const handlePayment = async () => {
    if (String(user?.id) === mentorId) {
      setCloseModalOnToastDismiss(false);
      showError(
        "Không thể tự đặt lịch",
        "Bạn không thể đặt lịch mentorship với chính tài khoản của mình.",
      );
      return;
    }

    if (walletBalance === null) {
      setCloseModalOnToastDismiss(false);
      showError("Lỗi", "Không thể tải thông tin ví.");
      return;
    }
    if (walletBalance < priceVND) {
      setCloseModalOnToastDismiss(false);
      showError("Số dư không đủ", "Vui lòng nạp thêm tiền vào ví.");
      return;
    }

    setIsProcessing(true);

    try {
      if (!isRoadmapMentoring && !selectedSlot) return;

      // Build the booking start time string.
      // We parse the raw slot start time and add 'idx' hours to it.
      // Handle day/month rollover when hour crosses midnight.
      // The block index is extracted from the slot id: `${slot.id}_${i}` → parse i from id suffix.
      const buildSlotTimeStr = (rawSlotStr: string, slotId: string): string => {
        // Accept both formats:
        //   "2026-03-27T02:00:00"         (LocalDateTime, no TZ — assume VN)
        //   "2026-03-27T02:00:00.000+07:00" (with ms and TZ)
        const m = rawSlotStr.match(
          /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?(?:([+-]\d{2}:\d{2}))?$/,
        );
        if (!m) throw new Error("Invalid raw slot time: " + rawSlotStr);
        const [, year, month, day, hour, minute, second] = m;

        // Extract chunk index from slot id: "slot-id_0", "slot-id_7", etc.
        const idx = parseInt(slotId.split("_").pop() ?? "0", 10);

        let h = parseInt(hour, 10) + idx;
        let d = parseInt(day, 10);
        let mo = parseInt(month, 10);
        let y = parseInt(year, 10);

        if (h >= 24) {
          h -= 24;
          d += 1;
          // Handle month overflow (simplified)
          const daysInMonth = new Date(y, mo, 0).getDate();
          if (d > daysInMonth) {
            d = 1;
            mo += 1;
          }
          if (mo > 12) {
            mo = 1;
            y += 1;
          }
        }

        const pad = (n: number) => String(n).padStart(2, "0");
        // Always output LocalDateTime format with .000+07:00 for the backend
        return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${minute}:${second}.000+07:00`;
      };

      const startTimeStr = isRoadmapMentoring
        ? (() => {
            // Use current VN time + 5 minutes to safely pass the future-time guard.
            // Backend skips this check for ROADMAP_MENTORING, but a future value avoids
            // any race-condition edge case when the check is present.
            const future = new Date(Date.now() + 5 * 60 * 1000);
            const vnOffset = "+07:00";
            const vnTime = new Date(future.getTime() + 7 * 60 * 60 * 1000);
            const pad = (n: number) => String(n).padStart(2, "0");
            return (
              `${vnTime.getUTCFullYear()}-${pad(vnTime.getUTCMonth() + 1)}-${pad(vnTime.getUTCDate())}` +
              `T${pad(vnTime.getUTCHours())}:${pad(vnTime.getUTCMinutes())}:00.000${vnOffset}`
            );
          })()
        : buildSlotTimeStr(selectedSlot!.startTimeRaw, selectedSlot!.id);

      const effectiveJourneyId = isRoadmapMentoring
        ? (selectedJourneyId ?? journeyContext?.journeyId ?? undefined)
        : undefined;

      const bookingPayload = {
        mentorId: Number(mentorId),
        startTime: startTimeStr,
        durationMinutes: isRoadmapMentoring ? 0 : 60,
        priceVnd: priceVND,
        paymentMethod: "WALLET" as const,
        bookingType: journeyContext?.bookingType ?? "GENERAL",
        ...(journeyContext?.journeyId != null
          ? { journeyId: journeyContext.journeyId }
          : {}),
        ...(journeyContext?.nodeId != null
          ? { nodeId: journeyContext.nodeId }
          : {}),
        ...(journeyContext?.nodeSkillId != null
          ? { nodeSkillId: journeyContext.nodeSkillId }
          : {}),
        ...(effectiveJourneyId != null
          ? { journeyId: effectiveJourneyId }
          : {}),
      };

      const booking = await createBookingWithWallet(bookingPayload);

      const link = booking.meetingLink;
      setCloseModalOnToastDismiss(true);
      // Refresh slots so the newly booked slot shows as booked
      fetchAvailableSlots();
      showSuccess(
        "Đặt lịch thành công!",
        link
          ? `Bạn đã đặt lịch với ${mentorName}. Phòng họp đã sẵn sàng.`
          : `Bạn đã đặt lịch với ${mentorName}. Link phòng họp đang tạo...`,
        {
          text: "Đóng",
          onClick: handleToastDismiss,
        },
        true,
      );
    } catch (error: any) {
      console.error(error);
      setCloseModalOnToastDismiss(false);
      showError(
        "Đặt lịch thất bại",
        error.response?.data?.message || "Có lỗi xảy ra khi đặt lịch.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimeRange = (start: Date, end: Date) => {
    return `${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const handleToastDismiss = () => {
    hideToast();
    if (closeModalOnToastDismiss) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const days = getDaysArray();
  const currentSlots = getSlotsForDate(selectedDate);

  return (
    <div className="uplink-modal-overlay" onClick={onClose}>
      <div
        className="uplink-chat-window booking-variant"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="uplink-chat-header">
          <div>
            <p className="chat-protocol-label">MENTOR_BOOKING_PROTOCOL</p>
            <h3 className="uplink-chat-name">
              {step === "schedule"
                ? journeyContext?.bookingType === "JOURNEY_MENTORING"
                  ? "Đặt lịch buổi kick-off"
                  : "Đặt lịch hẹn"
                : isRoadmapMentoring
                  ? "Thanh toán Gói Roadmap"
                  : "Thanh toán bằng ví"}
            </h3>
          </div>
          <button className="uplink-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="uplink-chat-messages booking-flow-shell">
          {step === "journey" ? (
            <div className="booking-form">
              <div className="booking-panel">
                <label className="booking-label">
                  Chọn Hành Trình Đồng Hành
                </label>
                <p className="booking-sub-label">
                  Journey Mentoring yêu cầu bạn gắn với một hành trình hiện tại.
                  Mentor sẽ theo sát và cập nhật Roadmap cho hành trình này.
                </p>

                {loadingJourneys ? (
                  <div className="booking-state-message">
                    Đang tải danh sách hành trình...
                  </div>
                ) : userJourneys.length === 0 ? (
                  <div className="booking-state-message booking-state-empty">
                    Bạn chưa có hành trình nào đang hoạt động. Vui lòng tạo hành
                    trình trước khi đặt lịch Roadmap.
                  </div>
                ) : (
                  <div className="booking-journey-list">
                    {userJourneys.map((journey) => {
                      const journeySkills = getJourneySkills(journey);
                      return (
                        <button
                          type="button"
                          key={journey.id}
                          onClick={() => setSelectedJourneyId(journey.id)}
                          className={`booking-journey-card ${selectedJourneyId === journey.id ? "active" : ""}`}
                        >
                          <div className="booking-journey-card__header">
                            <div>
                              <strong className="booking-journey-card__title">
                                {journey.domain || journey.type || "Hành trình"}
                              </strong>
                              <span className="booking-journey-card__goal">
                                {journey.goal}
                              </span>
                            </div>
                            <span className="booking-journey-card__progress">
                              {journey.progressPercentage}%
                            </span>
                          </div>

                          <div className="booking-journey-card__meta">
                            {journey.industry && (
                              <span>
                                <Layers size={12} />
                                {journey.industry}
                              </span>
                            )}
                            {journey.jobRole && (
                              <span>
                                <Briefcase size={12} />
                                {journey.jobRole}
                              </span>
                            )}
                            {journey.currentLevel && (
                              <span>
                                <Target size={12} />
                                Level: {journey.currentLevel}
                              </span>
                            )}
                          </div>

                          {journeySkills.length > 0 && (
                            <div className="booking-journey-card__skills">
                              {journeySkills.map((skill) => (
                                <span
                                  key={`${journey.id}-${skill}`}
                                  className="booking-journey-skill-chip"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="booking-journey-card__progressbar">
                            <span
                              className={`booking-journey-card__progressfill ${getJourneyProgressClass(journey.progressPercentage)}`}
                            />
                          </div>

                          {journey.hasActiveMentorBooking && (
                            <span className="booking-journey-card__notice">
                              Hành trình này đang có mentor booking
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : step === "schedule" ? (
            <div className="booking-form">
              <div className="booking-panel booking-panel-day-picker">
                <div className="booking-panel-header">
                  <label className="booking-label">Chọn ngày</label>
                  <div className="booking-panel-controls">
                    <button
                      onClick={handlePrevWeek}
                      className="uplink-icon-btn"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={handleNextWeek}
                      className="uplink-icon-btn"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="date-picker-strip">
                  {days.map((date, index) => {
                    const isSelected =
                      date.getDate() === selectedDate.getDate() &&
                      date.getMonth() === selectedDate.getMonth();
                    const isToday =
                      date.getDate() === new Date().getDate() &&
                      date.getMonth() === new Date().getMonth();
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`date-capsule ${isSelected ? "active" : ""}`}
                      >
                        <span className="date-capsule-day">
                          {date.toLocaleDateString("vi-VN", {
                            weekday: "short",
                          })}
                        </span>
                        <span className="date-capsule-num">
                          {date.getDate()}
                        </span>
                        {isToday && (
                          <span className="is-today-label">Hôm nay</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="booking-panel booking-panel-slots">
                <label className="booking-label">
                  {journeyContext?.bookingType === "JOURNEY_MENTORING"
                    ? `Giờ rảnh cho buổi kick-off — ${selectedDate.toLocaleDateString("vi-VN")}`
                    : `Giờ rảnh ngày ${selectedDate.toLocaleDateString("vi-VN")}`}
                </label>

                {loadingSlots ? (
                  <div className="booking-state-message">Đang tải lịch...</div>
                ) : currentSlots.length === 0 ? (
                  <div className="booking-state-message booking-state-empty">
                    Không có lịch rảnh trong ngày này.
                  </div>
                ) : (
                  <div className="slots-grid booking-slots-grid">
                    {currentSlots.map((slot) => {
                      const isBooked = bookedSlots.has(
                        `booked-${slot.startTime.getTime()}`,
                      );
                      return (
                        <div
                          key={slot.id}
                          onClick={() => !isBooked && setSelectedSlot(slot)}
                          className={`booking-slot-chip ${selectedSlot?.id === slot.id ? "active" : ""} ${isBooked ? "booked" : ""}`}
                        >
                          {isBooked && <Lock size={12} />}
                          {formatTimeRange(slot.startTime, slot.endTime)}
                          {isBooked && (
                            <span className="booked-label">Đã đặt</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="price-summary booking-price-summary">
                <div className="booking-price-row">
                  <span>Đơn giá:</span>
                  <span>{priceVND.toLocaleString("vi-VN")} VND/giờ</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="payment-options">
              <div className="order-summary booking-order-summary">
                <div className="booking-order-row">
                  <span>Dịch vụ:</span>
                  <span>
                    {isRoadmapMentoring
                      ? `Gói đồng hành Journey với ${mentorName}`
                      : journeyContext?.bookingType === "JOURNEY_MENTORING"
                        ? `Mentor đồng hành Journey với ${mentorName}`
                        : `Mentorship 1:1 với ${mentorName}`}
                  </span>
                </div>
                {isRoadmapMentoring &&
                  (selectedJourneyId || journeyContext?.journeyId) && (
                    <div className="booking-order-row">
                      <span>Hành trình:</span>
                      <span>
                        {selectedJourneyId
                          ? selectedJourney?.domain || "Đã chọn"
                          : "Hành trình hiện tại"}
                      </span>
                    </div>
                  )}
                {isRoadmapMentoring && selectedJourney && (
                  <div className="booking-order-detail">
                    <span>Skill:</span>
                    <span>
                      {getJourneySkills(selectedJourney).join(", ") ||
                        selectedJourney.skillName ||
                        "Chưa có skill cụ thể"}
                    </span>
                  </div>
                )}
                {!isRoadmapMentoring && (
                  <div className="booking-order-row">
                    <span>
                      {journeyContext?.bookingType === "JOURNEY_MENTORING"
                        ? "Buổi kick-off:"
                        : "Thời gian:"}
                    </span>
                    <span>
                      {selectedSlot
                        ? `${selectedSlot.startTime.toLocaleDateString("vi-VN")} | ${formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}`
                        : ""}
                    </span>
                  </div>
                )}
                <div className="booking-order-row booking-order-total">
                  <span>Tổng cộng:</span>
                  <span>{priceVND.toLocaleString("vi-VN")} VND</span>
                </div>
              </div>

              <h4 className="booking-method-heading">Thanh toán qua ví</h4>

              <div className="payment-method-card selected">
                <Wallet size={24} color="#22d3ee" />
                <div className="payment-method-body">
                  <div className="payment-method-title">Ví SkillVerse</div>
                  <div className="payment-method-desc">
                    Số dư:{" "}
                    {walletBalance !== null
                      ? walletBalance.toLocaleString("vi-VN") + " VND"
                      : "Loading..."}
                  </div>
                </div>
                <CheckCircle size={20} color="#22d3ee" />
              </div>

              <p className="booking-wallet-hint">
                Nếu số dư chưa đủ, hãy nạp thêm tiền vào ví trước khi xác nhận.
              </p>
            </div>
          )}
        </div>

        <div className="uplink-chat-input-area booking-footer-actions">
          {step === "journey" ? (
            <button
              className="uplink-establish-btn booking-action-full"
              onClick={() => {
                if (!selectedJourneyId) {
                  showWarning(
                    "Chưa chọn hành trình",
                    "Vui lòng chọn một hành trình để tiếp tục.",
                  );
                  return;
                }
                setStep("payment");
              }}
              disabled={!selectedJourneyId}
            >
              Tiếp tục
            </button>
          ) : step === "schedule" ? (
            <button
              className="uplink-establish-btn booking-action-full"
              onClick={handleScheduleConfirm}
            >
              Tiếp tục
            </button>
          ) : (
            <div className="booking-payment-actions">
              {((isRoadmapMentoring && !journeyContext?.journeyId) ||
                !isRoadmapMentoring) && (
                <button
                  className="uplink-establish-btn booking-action-back"
                  onClick={() =>
                    setStep(isRoadmapMentoring ? "journey" : "schedule")
                  }
                >
                  Quay lại
                </button>
              )}
              <button
                className={`uplink-establish-btn booking-action-pay ${isProcessing ? "booking-action-pay--processing" : ""}`}
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing
                  ? "Đang xử lý..."
                  : `Thanh toán ví ${priceVND.toLocaleString("vi-VN")} đ`}
              </button>
            </div>
          )}
        </div>
      </div>

      <Toast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={handleToastDismiss}
        useOverlay={true}
        actionButton={toast.actionButton}
      />
    </div>
  );
};

export default BookingModal;
