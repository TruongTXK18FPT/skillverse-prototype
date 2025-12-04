import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CreditCard, Wallet, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import walletService from '../../services/walletService';
import { Availability, getAvailability } from '../../services/availabilityService';
import { createBookingWithWallet } from '../../services/bookingService';
import { usePaymentToast } from '../../utils/useToast';
import Toast from '../Toast';
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
  const { toast, showSuccess, showError, hideToast } = usePaymentToast();

  // Calendar state
  const [calendarStartDate, setCalendarStartDate] = useState(new Date());

  const priceVND = hourlyRate;

  useEffect(() => {
    if (isOpen) {
      setStep('schedule');
      setSelectedSlot(null);
      setPaymentMethod('wallet');
      fetchWalletBalance();
      fetchAvailableSlots();
    }
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
      alert('Vui lòng chọn một khung giờ.');
      return;
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    if (paymentMethod === 'wallet') {
      if (walletBalance === null) {
        showError('Lỗi', 'Không thể tải thông tin ví.');
        return;
      }
      if (walletBalance < priceVND) {
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
        showSuccess(
            'Đặt lịch thành công!',
            link ? `Bạn đã đặt lịch với ${mentorName}. Phòng họp đã sẵn sàng.` : `Bạn đã đặt lịch với ${mentorName}. Link phòng họp đang tạo...`,
            link
              ? {
                  text: 'Mở phòng họp',
                  onClick: () => {
                    window.open(link!, '_blank');
                    onClose();
                  }
                }
              : {
                  text: 'Đóng',
                  onClick: onClose
                }
        );
    } catch (error: any) {
        console.error(error);
        showError('Đặt lịch thất bại', error.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch.');
    } finally {
        setIsProcessing(false);
    }
  };

  const formatTimeRange = (start: Date, end: Date) => {
    return `${start.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}`;
  };

  if (!isOpen) return null;

  const days = getDaysArray();
  const currentSlots = getSlotsForDate(selectedDate);

  return (
    <div className="uplink-modal-overlay">
      <div className="uplink-chat-window" style={{ height: 'auto', maxHeight: '90vh', width: '600px' }}>
        <div className="uplink-chat-header">
          <h3 className="uplink-chat-name">
            {step === 'schedule' ? 'Đặt lịch hẹn' : 'Thanh toán'}
          </h3>
          <button className="uplink-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="uplink-chat-messages" style={{ overflowY: 'auto', padding: '1.5rem' }}>
          {step === 'schedule' ? (
            <div className="booking-form">
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ color: 'var(--uplink-text-grey)' }}>Chọn ngày</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handlePrevWeek} className="uplink-icon-btn"><ChevronLeft size={16}/></button>
                        <button onClick={handleNextWeek} className="uplink-icon-btn"><ChevronRight size={16}/></button>
                    </div>
                </div>
                
                <div className="date-picker-strip" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {days.map((date, index) => {
                        const isSelected = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth();
                        const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth();
                        return (
                            <div 
                                key={index}
                                onClick={() => setSelectedDate(date)}
                                style={{
                                    minWidth: '70px',
                                    padding: '0.75rem 0.5rem',
                                    borderRadius: '0.5rem',
                                    background: isSelected ? 'rgba(34, 211, 238, 0.2)' : 'var(--uplink-bg-secondary)',
                                    border: `1px solid ${isSelected ? 'var(--uplink-primary)' : 'var(--uplink-border)'}`,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <span style={{ fontSize: '0.8rem', color: 'var(--uplink-text-grey)' }}>
                                    {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                                </span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: isSelected ? '#22d3ee' : 'white' }}>
                                    {date.getDate()}
                                </span>
                                {isToday && <span style={{ fontSize: '0.6rem', color: '#10b981' }}>Hôm nay</span>}
                            </div>
                        );
                    })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'var(--uplink-text-grey)', display: 'block', marginBottom: '0.5rem' }}>
                  Giờ rảnh ngày {selectedDate.toLocaleDateString('vi-VN')}
                </label>
                
                {loadingSlots ? (
                  <div style={{ color: 'var(--uplink-text-grey)', padding: '2rem', textAlign: 'center' }}>Đang tải lịch...</div>
                ) : currentSlots.length === 0 ? (
                  <div style={{ color: 'var(--uplink-text-grey)', padding: '2rem', textAlign: 'center', border: '1px dashed var(--uplink-border)', borderRadius: '0.5rem' }}>
                    Không có lịch rảnh trong ngày này.
                  </div>
                ) : (
                  <div className="slots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {currentSlots.map(slot => (
                      <div 
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '0.75rem',
                          background: selectedSlot?.id === slot.id ? 'rgba(34, 211, 238, 0.2)' : 'var(--uplink-bg-secondary)',
                          border: `1px solid ${selectedSlot?.id === slot.id ? 'var(--uplink-primary)' : 'var(--uplink-border)'}`,
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: 'white',
                          fontSize: '0.9rem',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        {formatTimeRange(slot.startTime, slot.endTime)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="price-summary" style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '0.5rem', border: '1px solid var(--uplink-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--uplink-text-grey)' }}>
                  <span>Đơn giá:</span>
                  <span>{priceVND.toLocaleString('vi-VN')} VND/giờ</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="payment-options">
              <div className="order-summary" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--uplink-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--uplink-text-white)' }}>
                  <span>Dịch vụ:</span>
                  <span>Mentorship 1:1 với {mentorName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--uplink-text-white)' }}>
                  <span>Thời gian:</span>
                  <span>{selectedSlot ? `${selectedSlot.startTime.toLocaleDateString('vi-VN')} | ${formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}` : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--uplink-primary)', fontSize: '1.1rem' }}>
                  <span>Tổng cộng:</span>
                  <span>{priceVND.toLocaleString('vi-VN')} VND</span>
                </div>
              </div>

              <h4 style={{ color: 'var(--uplink-text-white)', marginBottom: '1rem' }}>Chọn phương thức thanh toán</h4>

              <div 
                className={`payment-method-card ${paymentMethod === 'wallet' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('wallet')}
                style={{
                  padding: '1rem',
                  background: paymentMethod === 'wallet' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${paymentMethod === 'wallet' ? 'var(--uplink-primary)' : 'var(--uplink-border)'}`,
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <Wallet size={24} color={paymentMethod === 'wallet' ? '#22d3ee' : '#94a3b8'} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: '600' }}>Ví SkillVerse</div>
                  <div style={{ color: 'var(--uplink-text-grey)', fontSize: '0.85rem' }}>
                    Số dư: {walletBalance !== null ? walletBalance.toLocaleString('vi-VN') + ' VND' : 'Loading...'}
                  </div>
                </div>
                {paymentMethod === 'wallet' && <CheckCircle size={20} color="#22d3ee" />}
              </div>

              <div 
                className={`payment-method-card ${paymentMethod === 'payos' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('payos')}
                style={{
                  padding: '1rem',
                  background: paymentMethod === 'payos' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${paymentMethod === 'payos' ? 'var(--uplink-primary)' : 'var(--uplink-border)'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <CreditCard size={24} color={paymentMethod === 'payos' ? '#22d3ee' : '#94a3b8'} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: '600' }}>PayOS / Ngân hàng</div>
                  <div style={{ color: 'var(--uplink-text-grey)', fontSize: '0.85rem' }}>
                    Quét mã QR
                  </div>
                </div>
                {paymentMethod === 'payos' && <CheckCircle size={20} color="#22d3ee" />}
              </div>
            </div>
          )}
        </div>

        <div className="uplink-chat-input-area" style={{ justifyContent: 'flex-end' }}>
          {step === 'schedule' ? (
            <button 
              className="uplink-establish-btn"
              onClick={handleScheduleConfirm}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Tiếp tục
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
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
        onClose={hideToast}
        actionButton={toast.actionButton}
      />
    </div>
  );
};

export default BookingModal;
