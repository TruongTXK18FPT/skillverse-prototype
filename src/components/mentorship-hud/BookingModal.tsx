import React, { useState, useEffect } from 'react';
import { X, CreditCard, Wallet, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import walletService from '../../services/walletService';
import { getAvailability } from '../../services/availabilityService';
import { createBookingWithWallet } from '../../services/bookingService';
import { usePaymentToast } from '../../utils/useToast';
import Toast from '../shared/Toast';
import './uplink-styles.css';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string;
  mentorName: string;
  hourlyRate: number; // VND
}

interface BookableSlot {
  id: string;
  startTime: Date;
  endTime: Date;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  mentorId,
  mentorName,
  hourlyRate
}) => {
  const [step, setStep] = useState<'schedule' | 'payment'>('schedule');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<BookableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'payos'>('wallet');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [closeModalOnToastDismiss, setCloseModalOnToastDismiss] = useState(false);
  const { toast, showSuccess, showError, showWarning, hideToast } = usePaymentToast();

  // Calendar state
  const [calendarStartDate, setCalendarStartDate] = useState(new Date());

  const priceVND = hourlyRate;

  useEffect(() => {
    if (isOpen) {
      setStep('schedule');
      setSelectedSlot(null);
      setPaymentMethod('wallet');
      setCloseModalOnToastDismiss(false);
      fetchWalletBalance();
      fetchAvailableSlots();
      // Lock scroll
      document.body.classList.add('uplink-scroll-lock');
    } else {
      // Unlock scroll
      document.body.classList.remove('uplink-scroll-lock');
    }
    return () => {
      document.body.classList.remove('uplink-scroll-lock');
    };
  }, [isOpen, mentorId]);

  const fetchWalletBalance = async () => {
    try {
      const wallet = await walletService.getMyWallet();
      setWalletBalance(wallet.cashBalance);
    } catch (error) {
      console.error('Failed to fetch wallet balance', error);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      // Fetch slots for next 30 days
      const from = new Date().toISOString();
      const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const rawSlots = await getAvailability(Number(mentorId), from, to);
      
      // Process slots: Split into 1-hour chunks
      const processed: BookableSlot[] = [];
      rawSlots.forEach(slot => {
        // Ensure time is treated as UTC
        const startStr = slot.startTime.endsWith('Z') ? slot.startTime : slot.startTime + 'Z';
        const endStr = slot.endTime.endsWith('Z') ? slot.endTime : slot.endTime + 'Z';
        
        const start = new Date(startStr);
        const end = new Date(endStr);
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        
        for (let i = 0; i < hours; i++) {
          const slotStart = new Date(start.getTime() + i * 60 * 60 * 1000);
          const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
          
          // Only add if it's in the future
          if (slotStart > new Date()) {
            processed.push({
              id: `${slot.id}-${i}`,
              startTime: slotStart,
              endTime: slotEnd
            });
          }
        }
      });
      
      // Sort by time
      processed.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      setAvailableSlots(processed);
    } catch (error) {
      console.error('Failed to fetch slots', error);
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
    return availableSlots.filter(slot => 
      slot.startTime.getDate() === date.getDate() &&
      slot.startTime.getMonth() === date.getMonth() &&
      slot.startTime.getFullYear() === date.getFullYear()
    );
  };

  const handleScheduleConfirm = () => {
    if (!selectedSlot) {
      setCloseModalOnToastDismiss(false);
      showWarning('Chưa chọn khung giờ', 'Vui lòng chọn một khung giờ trước khi tiếp tục.');
      return;
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    if (paymentMethod === 'wallet') {
      if (walletBalance === null) {
        setCloseModalOnToastDismiss(false);
        showError('Lỗi', 'Không thể tải thông tin ví.');
        return;
      }
      if (walletBalance < priceVND) {
        setCloseModalOnToastDismiss(false);
        showError('Số dư không đủ', 'Vui lòng nạp thêm tiền vào ví.');
        return;
      }
    }

    setIsProcessing(true);

    try {
        if (!selectedSlot) return;

        const booking = await createBookingWithWallet({
            mentorId: Number(mentorId),
            startTime: selectedSlot.startTime.toISOString(),
            durationMinutes: 60,
            priceVnd: priceVND,
            paymentMethod: 'WALLET'
        });

        const link = booking.meetingLink;
    setCloseModalOnToastDismiss(true);
        showSuccess(
            'Đặt lịch thành công!',
            link ? `Bạn đã đặt lịch với ${mentorName}. Phòng họp đã sẵn sàng.` : `Bạn đã đặt lịch với ${mentorName}. Link phòng họp đang tạo...`,
            {
              text: 'Đóng',
              onClick: handleToastDismiss
            },
            true
        );
    } catch (error: any) {
        console.error(error);
        setCloseModalOnToastDismiss(false);
        showError('Đặt lịch thất bại', error.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch.');
    } finally {
        setIsProcessing(false);
    }
  };

  const formatTimeRange = (start: Date, end: Date) => {
    return `${start.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}`;
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
      <div className="uplink-chat-window booking-variant" onClick={(e) => e.stopPropagation()}>
        <div className="uplink-chat-header">
          <div>
            <p className="chat-protocol-label">MENTOR_BOOKING_PROTOCOL</p>
            <h3 className="uplink-chat-name">
              {step === 'schedule' ? 'Đặt lịch hẹn' : 'Thanh toán'}
            </h3>
          </div>
          <button className="uplink-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="uplink-chat-messages booking-flow-shell">
          {step === 'schedule' ? (
            <div className="booking-form">
              <div className="booking-panel booking-panel-day-picker">
                <div className="booking-panel-header">
                    <label className="booking-label">Chọn ngày</label>
                    <div className="booking-panel-controls">
                        <button onClick={handlePrevWeek} className="uplink-icon-btn"><ChevronLeft size={16}/></button>
                        <button onClick={handleNextWeek} className="uplink-icon-btn"><ChevronRight size={16}/></button>
                    </div>
                </div>
                
                <div className="date-picker-strip">
                    {days.map((date, index) => {
                        const isSelected = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth();
                        const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth();
                        return (
                            <div 
                                key={index}
                                onClick={() => setSelectedDate(date)}
                                className={`date-capsule ${isSelected ? 'active' : ''}`}
                            >
                                <span className="date-capsule-day">
                                    {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                                </span>
                                <span className="date-capsule-num">
                                    {date.getDate()}
                                </span>
                                {isToday && <span className="is-today-label">Hôm nay</span>}
                            </div>
                        );
                    })}
                </div>
              </div>

              <div className="booking-panel booking-panel-slots">
                <label className="booking-label">
                  Giờ rảnh ngày {selectedDate.toLocaleDateString('vi-VN')}
                </label>
                
                {loadingSlots ? (
                  <div className="booking-state-message">Đang tải lịch...</div>
                ) : currentSlots.length === 0 ? (
                  <div className="booking-state-message booking-state-empty">
                    Không có lịch rảnh trong ngày này.
                  </div>
                ) : (
                  <div className="slots-grid booking-slots-grid">
                    {currentSlots.map(slot => (
                      <div 
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`booking-slot-chip ${selectedSlot?.id === slot.id ? 'active' : ''}`}
                      >
                        {formatTimeRange(slot.startTime, slot.endTime)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="price-summary booking-price-summary">
                <div className="booking-price-row">
                  <span>Đơn giá:</span>
                  <span>{priceVND.toLocaleString('vi-VN')} VND/giờ</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="payment-options">
              <div className="order-summary booking-order-summary">
                <div className="booking-order-row">
                  <span>Dịch vụ:</span>
                  <span>Mentorship 1:1 với {mentorName}</span>
                </div>
                <div className="booking-order-row">
                  <span>Thời gian:</span>
                  <span>{selectedSlot ? `${selectedSlot.startTime.toLocaleDateString('vi-VN')} | ${formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}` : ''}</span>
                </div>
                <div className="booking-order-row booking-order-total">
                  <span>Tổng cộng:</span>
                  <span>{priceVND.toLocaleString('vi-VN')} VND</span>
                </div>
              </div>

              <h4 className="booking-method-heading">Chọn phương thức thanh toán</h4>

              <div 
                className={`payment-method-card ${paymentMethod === 'wallet' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('wallet')}
              >
                <Wallet size={24} color={paymentMethod === 'wallet' ? '#22d3ee' : '#94a3b8'} />
                <div className="payment-method-body">
                  <div className="payment-method-title">Ví SkillVerse</div>
                  <div className="payment-method-desc">
                    Số dư: {walletBalance !== null ? walletBalance.toLocaleString('vi-VN') + ' VND' : 'Loading...'}
                  </div>
                </div>
                {paymentMethod === 'wallet' && <CheckCircle size={20} color="#22d3ee" />}
              </div>

              <div 
                className={`payment-method-card ${paymentMethod === 'payos' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('payos')}
              >
                <CreditCard size={24} color={paymentMethod === 'payos' ? '#22d3ee' : '#94a3b8'} />
                <div className="payment-method-body">
                  <div className="payment-method-title">PayOS / Ngân hàng</div>
                  <div className="payment-method-desc">
                    Quét mã QR
                  </div>
                </div>
                {paymentMethod === 'payos' && <CheckCircle size={20} color="#22d3ee" />}
              </div>
            </div>
          )}
        </div>

        <div className="uplink-chat-input-area booking-footer-actions">
          {step === 'schedule' ? (
            <button 
              className="uplink-establish-btn"
              onClick={handleScheduleConfirm}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Tiếp tục
            </button>
          ) : (
            <div className="booking-payment-actions">
              <button 
                className="uplink-establish-btn"
                onClick={() => setStep('schedule')}
                style={{ flex: 1, background: 'transparent', border: '1px solid var(--uplink-border)', justifyContent: 'center' }}
              >
                Quay lại
              </button>
              <button 
                className="uplink-establish-btn"
                onClick={handlePayment}
                disabled={isProcessing}
                style={{ flex: 2, justifyContent: 'center', opacity: isProcessing ? 0.7 : 1 }}
              >
                {isProcessing ? 'Đang xử lý...' : `Thanh toán ${priceVND.toLocaleString('vi-VN')} đ`}
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
