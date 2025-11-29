import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { PaymentTransactionResponse } from '../../data/paymentDTOs';
import '../../styles/Transactional.css';

const Transactional = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentTransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledMarkedRef = useRef(false);

  const internalRef = searchParams.get('ref');
  const cancelParam = (searchParams.get('cancel') || '').toLowerCase();
  const isCancel = ['1', 'true', 'yes'].includes(cancelParam);
  const cancelStatus = searchParams.get('status') || 'CANCELLED';
  const cancelCode = searchParams.get('code') || undefined;
  const cancelOrderCode = searchParams.get('orderCode') || undefined;

  useEffect(() => {
    if (isCancel) {
      // Mark payment as CANCELLED on backend once
      if (internalRef && !cancelledMarkedRef.current) {
        cancelledMarkedRef.current = true;
        paymentService
          .cancelPayment(internalRef, 'User cancelled at gateway')
          .catch(() => {/* ignore errors for UX */});
      }
      setLoading(false);
      setPolling(false);
      return;
    }

    if (internalRef) {
      pollPaymentStatus();
    } else {
      setError('No payment reference found');
      setLoading(false);
    }
  }, [internalRef, isCancel]);

  const pollPaymentStatus = async () => {
    if (!internalRef) return;

    try {
      const paymentData = await paymentService.getPaymentByReference(internalRef);
      
      if (paymentData) {
        setPayment(paymentData);
        
        // Stop polling if payment is completed, failed, or cancelled
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(paymentData.status)) {
          setPolling(false);
        }
      } else {
        setError('Payment not found');
        setPolling(false);
      }
    } catch (err) {
      console.error('Error polling payment status:', err);
      setError('Failed to check payment status');
      setPolling(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (polling && internalRef && !isCancel) {
      const interval = setInterval(pollPaymentStatus, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [polling, internalRef, isCancel]);

  const getStatusIcon = () => {
    if (isCancel) return <XCircle className="w-16 h-16 text-red-500" />;
    if (!payment) return <Clock className="w-16 h-16 text-blue-500 animate-spin" />;
    
    switch (payment.status) {
      case 'COMPLETED':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'FAILED':
      case 'CANCELLED':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Clock className="w-16 h-16 text-blue-500 animate-spin" />;
    }
  };

  const getStatusMessage = () => {
    if (isCancel) {
      const extra = [
        cancelOrderCode ? `Mã đơn hàng: ${cancelOrderCode}` : undefined,
        cancelCode ? `Mã hệ thống: ${cancelCode}` : undefined,
      ]
        .filter(Boolean)
        .join(' • ');
      return {
        title: 'Thanh toán đã bị hủy',
        description:
          extra || 'Bạn đã hủy quá trình thanh toán. Vui lòng thử lại nếu muốn tiếp tục.'
      };
    }

    if (!payment) {
      return {
        title: 'Đang xử lý thanh toán...',
        description: 'Vui lòng chờ trong giây lát. Chúng tôi đang xử lý giao dịch của bạn.'
      };
    }

    switch (payment.status) {
      case 'COMPLETED':
        // Show appropriate message based on payment type
        let successDesc = 'Giao dịch của bạn đã được xử lý thành công.';
        if (payment.type === 'PREMIUM_SUBSCRIPTION') {
          successDesc = 'Giao dịch của bạn đã được xử lý thành công. Tài khoản premium đã được kích hoạt.';
        } else if (payment.type === 'COIN_PURCHASE') {
          successDesc = 'Giao dịch của bạn đã được xử lý thành công. SkillCoin đã được cộng vào ví.';
        } else if (payment.type === 'WALLET_TOPUP') {
          successDesc = 'Giao dịch của bạn đã được xử lý thành công. Số dư đã được cộng vào ví.';
        }
        return {
          title: 'Thanh toán thành công!',
          description: successDesc
        };
      case 'FAILED':
        return {
          title: 'Thanh toán thất bại',
          description: payment.failureReason || 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'
        };
      case 'CANCELLED':
        return {
          title: 'Thanh toán đã bị hủy',
          description: 'Giao dịch đã bị hủy. Vui lòng thử lại nếu muốn tiếp tục.'
        };
      default:
        return {
          title: 'Đang xử lý thanh toán...',
          description: 'Vui lòng chờ trong giây lát. Chúng tôi đang xử lý giao dịch của bạn.'
        };
    }
  };

  const handleBackToPremium = () => {
    navigate('/premium');
  };

  const handleRetryPayment = () => {
    navigate('/premium');
  };

  if (loading) {
    return (
      <div className="transactional-page">
        <div className="transactional-card">
          <Clock className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Đang tải...</h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  const statusMessage = getStatusMessage();
  const isSuccess = payment?.status === 'COMPLETED';
  const isError = isCancel || payment?.status === 'FAILED' || payment?.status === 'CANCELLED' || error;

  return (
    <div className="transactional-page">
      <div className="transactional-card">
        {getStatusIcon()}
        
        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4">
          {statusMessage.title}
        </h1>
        
        <p className="desc">
          {statusMessage.description}
        </p>

        {(!isCancel && payment) && (
          <div className="transactional-meta">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã giao dịch:</span>
                <span className="font-mono">{payment.internalReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(parseInt(payment.amount))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <span className={`font-semibold ${
                  payment.status === 'COMPLETED' ? 'text-green-600' :
                  payment.status === 'FAILED' || payment.status === 'CANCELLED' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {payment.status === 'COMPLETED' ? 'Thành công' :
                   payment.status === 'FAILED' ? 'Thất bại' :
                   payment.status === 'CANCELLED' ? 'Đã hủy' :
                   'Đang xử lý'}
                </span>
              </div>
            </div>
          </div>
        )}

        {isCancel && (
          <div className="transactional-meta" style={{borderColor:'#fdba74', background:'#fff7ed'}}>
            <div className="space-y-2 text-sm">
              {cancelOrderCode && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-mono">{cancelOrderCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <span className="font-semibold text-red-600">{cancelStatus}</span>
              </div>
              {cancelCode && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã hệ thống:</span>
                  <span className="font-mono">{cancelCode}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="transactional-actions">
          {isSuccess && (
            <button
              onClick={handleBackToPremium}
              className="primary"
            >
              Quay lại trang Premium
            </button>
          )}
          
          {isError && (
            <button
              onClick={handleRetryPayment}
              className="secondary"
            >
              Thử lại thanh toán
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="ghost flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Về trang chủ
          </button>
        </div>

        {polling && !isCancel && (
          <p className="text-xs text-gray-500 mt-4">
            Đang kiểm tra trạng thái thanh toán...
          </p>
        )}
      </div>
    </div>
  );
};

export default Transactional;
