import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Check, Loader2 } from "lucide-react";
import HUDCard from "./HUDCard";
import { streakService } from "../../services/streakService";
import "./SystemStatus.css";

interface SystemStatusProps {
  currentStreak: number;
  longestStreak: number;
  weeklyGoal: number;
  thisWeek: boolean[];
  streakLabel?: string;
  daysLabel?: string;
  currentStreakLabel?: string;
  longestStreakLabel?: string;
  weeklyGoalLabel?: string;
  onCheckIn?: () => void;
}

const SystemStatus: React.FC<SystemStatusProps> = ({
  currentStreak: initialStreak,
  longestStreak: initialLongestStreak,
  weeklyGoal,
  thisWeek,
  streakLabel = "System Uptime",
  daysLabel = "Days",
  currentStreakLabel = "Current Sync",
  longestStreakLabel = "Max Uptime",
  weeklyGoalLabel = "Weekly Target",
  onCheckIn,
}) => {
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [weekCheckIns, setWeekCheckIns] = useState<boolean[]>(thisWeek);
  const [currentStreak, setCurrentStreak] = useState(initialStreak);
  const [longestStreak, setLongestStreak] = useState(initialLongestStreak);
  const [isLoading, setIsLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");
  const [coinsAwarded, setCoinsAwarded] = useState(0);

  // Get today's day index (0 = Monday, 6 = Sunday)
  const getTodayIndex = () => {
    const today = new Date().getDay();
    // Convert Sunday (0) to 6, and shift others (Mon=0, Tue=1, etc.)
    return today === 0 ? 6 : today - 1;
  };

  // Get dates for current week (Monday to Sunday)
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get Monday of current week

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const todayIndex = getTodayIndex();
  const weekDates = getWeekDates();
  const currentYear = new Date().getFullYear();

  // Load streak info from backend on mount
  const loadStreakInfo = useCallback(async () => {
    try {
      const streakInfo = await streakService.getStreakInfo();
      if (streakInfo) {
        setCurrentStreak(streakInfo.currentStreak || 0);
        setLongestStreak(streakInfo.longestStreak || 0);
        setWeekCheckIns(streakInfo.weeklyActivity || thisWeek);
        setTodayCheckedIn(streakInfo.checkedInToday || false);
      }
    } catch (error) {
      console.error("Failed to load streak info:", error);
      // Fallback to props
      setWeekCheckIns(thisWeek);
    }
  }, [thisWeek]);

  useEffect(() => {
    loadStreakInfo();
  }, [loadStreakInfo]);

  // Sync with props as fallback
  useEffect(() => {
    if (!todayCheckedIn) {
      setCurrentStreak(initialStreak);
      setLongestStreak(initialLongestStreak);
    }
  }, [initialStreak, initialLongestStreak, todayCheckedIn]);

  const handleCheckIn = async () => {
    if (todayCheckedIn || isLoading) return;

    setIsLoading(true);
    try {
      const response = await streakService.checkIn();

      if (response.success) {
        setTodayCheckedIn(true);
        setShowCheckInSuccess(true);
        setCheckInMessage(response.message || "Điểm danh thành công!");
        setCoinsAwarded(response.coinsAwarded || 0);

        // Update local state with response data
        if (response.currentStreak !== undefined) {
          setCurrentStreak(response.currentStreak);
        }
        if (response.longestStreak !== undefined) {
          setLongestStreak(response.longestStreak);
        }
        if (response.weeklyActivity) {
          setWeekCheckIns(response.weeklyActivity);
        }

        // Save to localStorage as backup
        localStorage.setItem("lastCheckIn", new Date().toDateString());

        if (onCheckIn) {
          onCheckIn();
        }

        setTimeout(() => setShowCheckInSuccess(false), 3000);
      } else if (response.alreadyCheckedIn) {
        setTodayCheckedIn(true);
        setCheckInMessage(response.message || "Bạn đã điểm danh hôm nay rồi!");
      }
    } catch (error) {
      console.error("Check-in failed:", error);
      // Fallback to local-only check-in
      const today = new Date().toDateString();
      localStorage.setItem("lastCheckIn", today);
      setTodayCheckedIn(true);
      setShowCheckInSuccess(true);
      setCheckInMessage("Điểm danh thành công! (offline)");

      const newWeekCheckIns = [...weekCheckIns];
      newWeekCheckIns[todayIndex] = true;
      setWeekCheckIns(newWeekCheckIns);

      setTimeout(() => setShowCheckInSuccess(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate power level based on check-ins this week (1/7 per day)
  const checkedInDays = weekCheckIns.filter((day) => day).length;
  const powerPercentage = Math.round((checkedInDays / 7) * 100);

  return (
    <HUDCard variant="chamfer" scanline delay={0.2}>
      <div className="system-status">
        {/* Header */}
        <div className="system-status__header">
          <div className="system-status__title-wrapper">
            <div className="system-status__flame-wrapper">
              <div className="system-status__flame-glow"></div>
              <Flame className="system-status__flame-icon" size={28} />
            </div>
            <div>
              <h3 className="system-status__title">{streakLabel}</h3>
              <p className="system-status__subtitle">
                {currentStreak} {daysLabel} {currentStreakLabel}
              </p>
            </div>
          </div>

          <div className="system-status__stats">
            <div className="system-status__stat">
              <span className="system-status__stat-label">
                {longestStreakLabel}
              </span>
              <span className="system-status__stat-value">
                {longestStreak} {daysLabel}
              </span>
            </div>
            <div className="system-status__stat-divider"></div>
            <div className="system-status__stat">
              <span className="system-status__stat-label">
                {weeklyGoalLabel}
              </span>
              <span className="system-status__stat-value">
                {weeklyGoal} {daysLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Calendar */}
        <div className="system-status__calendar-wrapper">
          <div className="system-status__calendar-year">{currentYear}</div>
          <div className="system-status__calendar">
            {weekDates.map((date, index) => {
              const isToday = index === todayIndex;
              const isCheckedIn = isToday
                ? todayCheckedIn
                : weekCheckIns[index];
              const day = date.getDate();
              const month = date.getMonth() + 1;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.3 + index * 0.05,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className={`
                    system-status__day 
                    ${isCheckedIn ? "system-status__day--synced" : ""}
                    ${isToday ? "system-status__day--today" : ""}
                    ${isToday && !todayCheckedIn ? "system-status__day--clickable" : ""}
                  `}
                  onClick={
                    isToday && !todayCheckedIn && !isLoading
                      ? handleCheckIn
                      : undefined
                  }
                  whileHover={
                    isToday && !todayCheckedIn && !isLoading
                      ? { scale: 1.1 }
                      : {}
                  }
                  whileTap={
                    isToday && !todayCheckedIn && !isLoading
                      ? { scale: 0.95 }
                      : {}
                  }
                >
                  <div className="system-status__day-indicator">
                    {isCheckedIn && (
                      <div className="system-status__day-pulse"></div>
                    )}
                    {isToday && isLoading && (
                      <Loader2
                        className="system-status__day-loader"
                        size={16}
                      />
                    )}
                  </div>
                  <span className="system-status__day-label">
                    {day}/{month}
                  </span>
                  {isToday && !todayCheckedIn && !isLoading && (
                    <span className="system-status__check-in-hint">
                      Điểm danh
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Check-in Success Message */}
        <AnimatePresence>
          {showCheckInSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="system-status__check-in-success"
            >
              <Check size={16} />
              <span>{checkInMessage || "Điểm danh thành công!"} 🔥</span>
              {coinsAwarded > 0 && (
                <span className="system-status__coins-awarded">
                  +{coinsAwarded} coins
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Power Level Bar */}
        <div className="system-status__power">
          <div className="system-status__power-label">
            <span>POWER LEVEL</span>
            <span className="system-status__power-percentage">
              {powerPercentage}%
            </span>
          </div>
          <div className="system-status__power-bar">
            <motion.div
              className="system-status__power-fill"
              initial={{ width: 0 }}
              animate={{ width: `${powerPercentage}%` }}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="system-status__power-glow"></div>
            </motion.div>
          </div>
        </div>
      </div>
    </HUDCard>
  );
};

export default SystemStatus;
