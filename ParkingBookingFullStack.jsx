import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, X, MapPin, Clock, DollarSign, Star, Heart, Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from 'axios';

// ============================================================================
// API CONFIGURATION
// ============================================================================
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// ACTIVE PARKING SESSION MODAL - Shows when car is parked
// ============================================================================
const ActiveParkingModal = ({ session, isOpen, onClose, onExit }) => {
  const [remainingTime, setRemainingTime] = useState(null);
  const [exitOTP, setExitOTP] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;

    const updateTimer = () => {
      const now = new Date();
      const endTime = new Date(session.endTime);
      const remainingMs = endTime - now;

      if (remainingMs <= 0) {
        setRemainingTime({
          expired: true,
          hours: 0,
          minutes: 0,
          seconds: 0,
          formattedTime: 'EXPIRED',
        });
      } else {
        const totalSeconds = Math.floor(remainingMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setRemainingTime({
          expired: false,
          hours,
          minutes,
          seconds,
          formattedTime: `${hours}h ${minutes}m ${seconds}s`,
          totalSeconds,
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handleExitOTPRequest = () => {
    setShowOTPInput(true);
    setError('');
  };

  const handleVerifyExitOTP = async () => {
    if (!exitOTP || exitOTP.length !== 6) {
      setError('❌ Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiClient.post('/parking/verify-exit-otp', {
        sessionId: session.sessionId,
        exitOTP,
      });

      if (response.data.success) {
        // OTP verified, show payment options
        onExit(response.data);
      } else {
        setError('❌ Invalid exit OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error verifying OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen || !session || !remainingTime) return null;

  const isTimeExpired = remainingTime.expired;
  const warningTime = remainingTime.totalSeconds < 600; // Less than 10 minutes

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full animate-in fade-in zoom-in duration-300 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isTimeExpired 
              ? 'bg-red-500/20 border-2 border-red-500' 
              : warningTime 
              ? 'bg-amber-500/20 border-2 border-amber-500'
              : 'bg-emerald-500/20 border-2 border-emerald-500'
          }`}>
            <Clock className={`w-8 h-8 ${
              isTimeExpired ? 'text-red-400' : warningTime ? 'text-amber-400' : 'text-emerald-400'
            }`} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">🅿️ Car Parked</h2>
          <p className="text-slate-400 text-sm">Slot {session.slotNumber}</p>
        </div>

        {/* Timer Display */}
        <div className={`mb-8 p-6 rounded-xl border-2 text-center ${
          isTimeExpired 
            ? 'bg-red-500/10 border-red-500/30' 
            : warningTime 
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
            isTimeExpired ? 'text-red-300' : warningTime ? 'text-amber-300' : 'text-emerald-300'
          }`}>
            {isTimeExpired ? '⏰ Time Expired' : warningTime ? '⚠️ Time Running Out' : '⏱️ Time Remaining'}
          </p>
          <p className={`text-4xl font-black tracking-wider ${
            isTimeExpired ? 'text-red-400' : warningTime ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {remainingTime.formattedTime}
          </p>
          {!isTimeExpired && (
            <p className="text-slate-400 text-xs mt-2">
              Parked: {new Date(session.startTime).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Session Details */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Slot Number</span>
            <span className="text-white font-bold text-lg">{session.slotNumber}</span>
          </div>
          <div className="h-px bg-slate-700"></div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Duration Booked</span>
            <span className="text-white font-bold">{session.duration} hours</span>
          </div>
          <div className="h-px bg-slate-700"></div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Amount to Pay</span>
            <span className="text-emerald-400 font-bold text-lg">₹{session.totalAmount}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm animate-in fade-in">
            {error}
          </div>
        )}

        {/* OTP Input Section */}
        {!showOTPInput ? (
          <button
            onClick={handleExitOTPRequest}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/50 hover:scale-105"
          >
            🚪 Ready to Exit? Enter OTP
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={exitOTP}
              onChange={(e) => setExitOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-lg px-4 py-3 text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleVerifyExitOTP}
              disabled={exitOTP.length !== 6 || isVerifying}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
                exitOTP.length === 6 && !isVerifying
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/50'
                  : 'bg-slate-700 cursor-not-allowed opacity-50'
              }`}
            >
              {isVerifying ? 'Verifying OTP...' : 'Verify & Proceed to Payment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PAYMENT MODAL - Shows after exit OTP verification
// ============================================================================
const PaymentModal = ({ chargesData, sessionId, isOpen, onClose, onPaymentSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const paymentMethods = [
    { id: 'netbanking', label: '🏦 Net Banking', icon: '🏦', description: 'Direct bank transfer' },
    { id: 'upi', label: '📱 UPI', icon: '📱', description: 'Google Pay, PhonePe, etc.' },
    { id: 'debit', label: '💳 Debit Card', icon: '💳', description: 'Direct debit card payment' },
    { id: 'credit', label: '💰 Credit Card', icon: '💰', description: 'Credit card payment' },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('❌ Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await apiClient.post('/payment/process', {
        sessionId,
        amount: chargesData.charges.totalAmount,
        paymentMethod: selectedMethod,
        parkingLocationId: chargesData.parkingLocationId,
        slotNumber: chargesData.slotNumber,
        duration: chargesData.duration,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentSuccess(response.data);
        }, 2000);
      } else {
        setError(response.data.message || 'Payment failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full animate-in fade-in zoom-in duration-300 p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        {!success ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">💳 Complete Payment</h2>
              <p className="text-slate-400 text-sm">Choose your payment method</p>
            </div>

            {/* Amount Summary */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Base Amount</span>
                <span className="text-white font-bold">₹{chargesData.charges.baseAmount}</span>
              </div>
              {chargesData.charges.additionalCharges > 0 && (
                <>
                  <div className="h-px bg-slate-700"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-300">Additional Charges (Overdue)</span>
                    <span className="text-red-400 font-bold">₹{chargesData.charges.additionalCharges}</span>
                  </div>
                </>
              )}
              <div className="h-px bg-slate-700"></div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-300 font-semibold">Total Amount</span>
                <span className="text-emerald-400 font-bold text-lg">₹{chargesData.charges.totalAmount}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6 space-y-3">
              <label className="text-slate-300 text-sm font-semibold block">Select Payment Method</label>
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMethod === method.id
                      ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/30'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="text-white font-semibold">{method.label}</p>
                      <p className="text-slate-400 text-xs">{method.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm animate-in fade-in">
                {error}
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!selectedMethod || isProcessing}
              className={`w-full py-4 px-4 rounded-lg font-bold text-white text-lg transition-all ${
                selectedMethod && !isProcessing
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 shadow-lg shadow-emerald-500/50 hover:scale-105'
                  : 'bg-slate-700 cursor-not-allowed opacity-50'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Processing Payment...
                </span>
              ) : (
                `Pay ₹${chargesData.charges.totalAmount}`
              )}
            </button>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-slate-400 mb-4">Your slot has been released.</p>
            <div className="bg-slate-800/50 rounded-lg p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid</span>
                <span className="text-white font-bold">₹{chargesData.charges.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method</span>
                <span className="text-white font-bold capitalize">{selectedMethod}</span>
              </div>
            </div>
            <p className="text-emerald-300 text-sm mt-4">You can now exit the parking. Thank you!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// OTP MODAL - For Login/Registration
// ============================================================================
const OTPModal = ({ isOpen, onClose, onVerify, email, phoneNumber, otpMethod = 'email' }) => {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showResendButton, setShowResendButton] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setShowResendButton(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOTPInput = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 6) {
      setOtp(cleaned);
      setErrorMessage('');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setErrorMessage('❌ Please enter a 6-digit OTP');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await apiClient.post('/auth/verify-otp', {
        email: otpMethod === 'email' ? email : null,
        phone: otpMethod === 'sms' ? phoneNumber : null,
        otp,
      });

      if (response.data.success) {
        setSuccessMessage('✅ OTP Verified Successfully!');
        setTimeout(() => {
          onVerify(response.data);
          setIsVerifying(false);
        }, 1500);
      } else {
        setErrorMessage('❌ Invalid OTP. Please try again.');
        setIsVerifying(false);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error verifying OTP');
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await apiClient.post('/auth/request-otp', {
        email: otpMethod === 'email' ? email : null,
        phone: otpMethod === 'sms' ? phoneNumber : null,
        otpMethod,
      });
      setOtp('');
      setTimeLeft(300);
      setShowResendButton(false);
      setErrorMessage('');
      setSuccessMessage('✅ New OTP sent!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Error sending OTP');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full animate-in fade-in zoom-in duration-300 p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h2>
          <p className="text-slate-400 text-sm">
            {otpMethod === 'email' ? `We've sent an OTP to ${email}` : `We've sent an OTP to ${phoneNumber}`}
          </p>
        </div>

        <div className="mb-6">
          <label className="text-slate-300 text-sm font-semibold mb-2 block">Enter OTP Code</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => handleOTPInput(e.target.value)}
            placeholder="000000"
            maxLength="6"
            className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-lg px-4 py-3 text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <p className="text-slate-400 text-xs mt-2">Numeric OTP (6 digits)</p>
        </div>

        <div className={`text-center mb-6 font-semibold ${timeLeft < 60 ? 'text-red-400' : 'text-slate-300'}`}>
          ⏱️ Time remaining: {formatTime(timeLeft)}
        </div>

        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 mb-4 text-emerald-300 text-sm">
            {successMessage}
          </div>
        )}

        <button
          onClick={handleVerifyOTP}
          disabled={otp.length !== 6 || isVerifying}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white text-lg transition-all duration-300 transform mb-4 ${
            otp.length === 6 && !isVerifying
              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/50 hover:scale-105'
              : 'bg-slate-700 cursor-not-allowed opacity-50'
          }`}
        >
          {isVerifying ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Verifying...
            </span>
          ) : (
            'Verify OTP'
          )}
        </button>

        {showResendButton ? (
          <button
            onClick={handleResendOTP}
            className="w-full py-2 px-4 border-2 border-blue-500 text-blue-400 rounded-lg font-semibold transition-all hover:bg-blue-500/10"
          >
            🔄 Resend OTP
          </button>
        ) : (
          <p className="text-center text-slate-400 text-sm">
            Didn't receive the code? <span className="text-slate-500">Resend in {formatTime(timeLeft)}</span>
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// AUTH MODAL - Login/Register
// ============================================================================
const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [authStep, setAuthStep] = useState('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpMethod, setOtpMethod] = useState('email');

  const handleLogin = async () => {
    if (!email && !phone) {
      setErrorMessage('❌ Please enter email or phone number');
      return;
    }
    if (!password) {
      setErrorMessage('❌ Please enter password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/request-otp', {
        email: email || null,
        phone: phone || null,
        otpMethod: email ? 'email' : 'sms',
      });

      if (response.data.success) {
        setOtpMethod(email ? 'email' : 'sms');
        setShowOTP(true);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error requesting OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email && !phone) {
      setErrorMessage('❌ Please enter email or phone number');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('❌ Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      // First register user
      await apiClient.post('/auth/register', {
        email: email || null,
        phone: phone || null,
        password,
        name: 'User',
      });

      // Then request OTP
      const otpResponse = await apiClient.post('/auth/request-otp', {
        email: email || null,
        phone: phone || null,
        otpMethod: email ? 'email' : 'sms',
      });

      if (otpResponse.data.success) {
        setOtpMethod(email ? 'email' : 'sms');
        setShowOTP(true);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = (data) => {
    setShowOTP(false);
    setEmail('');
    setPhone('');
    setPassword('');
    onSuccess(data);
  };

  if (!isOpen) return null;

  if (showOTP) {
    return (
      <OTPModal
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        onVerify={handleOTPVerified}
        email={email}
        phoneNumber={phone}
        otpMethod={otpMethod}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full animate-in fade-in zoom-in duration-300 p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {authStep === 'login' ? 'Welcome Back' : 'Join ParkEzy'}
          </h2>
          <p className="text-slate-400 text-sm">
            {authStep === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setAuthStep('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
              authStep === 'login'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setAuthStep('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
              authStep === 'register'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Register
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-slate-300 text-sm font-semibold mb-2 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage('');
              }}
              placeholder="you@example.com"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="text-slate-300 text-sm font-semibold mb-2 block">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                setErrorMessage('');
              }}
              placeholder="+91 98765 43210"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="text-slate-300 text-sm font-semibold mb-2 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="••••••••"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {authStep === 'register' && (
              <p className="text-slate-400 text-xs mt-1">Min 6 characters</p>
            )}
          </div>
        </div>

        <button
          onClick={authStep === 'login' ? handleLogin : handleRegister}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white text-lg transition-all duration-300 transform ${
            !isLoading
              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/50 hover:scale-105'
              : 'bg-slate-700 cursor-not-allowed opacity-50'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Processing...
            </span>
          ) : authStep === 'login' ? (
            'Login & Verify'
          ) : (
            'Register & Verify'
          )}
        </button>

        <p className="text-center text-slate-400 text-xs mt-4">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// PARKING CARD
// ============================================================================
const ParkingCard = ({ parking, onClick, isFavorite, onToggleFavorite }) => {
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await apiClient.get(`/parking/location/${parking.id}/slots`);
        setSlots(response.data.location);
      } catch (err) {
        console.error('Error fetching slots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [parking.id]);

  if (loading) {
    return <div className="bg-slate-800 rounded-xl h-64 animate-pulse"></div>;
  }

  const availableSlots = slots?.slots?.filter(s => s.status === 'available').length || 0;
  const totalSlots = slots?.totalSlots || 0;
  const occupancyPercent = Math.round(((totalSlots - availableSlots) / totalSlots) * 100);

  const getStatusLabel = () => {
    if (occupancyPercent > 80) return 'FULL';
    if (occupancyPercent > 50) return 'FILLING UP';
    return 'AVAILABLE';
  };

  return (
    <button
      onClick={onClick}
      className="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50
        transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20
        transform hover:-translate-y-1 text-left h-full"
    >
      <div className="relative h-40 bg-gradient-to-b from-slate-700 to-slate-800 overflow-hidden">
        <img
          src={`https://images.unsplash.com/photo-${parking.id === 1 ? '1537359331871-0c42f44eab2b' : '1574902045991-c2f18156a9b7'}?w=400&h=300&fit=crop`}
          alt={parking.name}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900"></div>

        <div className="absolute top-3 left-3 bg-cyan-600 px-3 py-1 rounded font-bold text-white text-sm">
          ₹25/hr
        </div>

        <div className={`absolute top-3 right-3 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${
          occupancyPercent > 80 ? 'text-red-400' :
          occupancyPercent > 50 ? 'text-amber-400' :
          'text-emerald-400'
        }`}>
          {getStatusLabel()}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(parking.id);
          }}
          className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm p-2 rounded-full 
            hover:bg-slate-900 transition-all group-hover:scale-110 hover:scale-110"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
            {parking.name}
          </h3>
          <p className="text-slate-400 text-xs mt-1">{parking.location}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs uppercase tracking-wide">Availability</span>
            <span className="text-emerald-400 font-semibold text-sm">{availableSlots}/{totalSlots}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
              style={{ width: `${Math.round((availableSlots / totalSlots) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300 text-sm">4.8</span>
          </div>
          <div className="text-slate-400 text-xs">
            ⏱️ 24H
          </div>
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// SLOT SELECTION MODAL
// ============================================================================
const SlotSelectionModal = ({ parking, isOpen, onClose, onSlotSelected }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState(2);
  const [vehicleType, setVehicleType] = useState('car');
  const [isBooking, setIsBooking] = useState(false);

  const basePrice = 25;
  const totalPrice = basePrice * duration;
  const discount = duration > 4 ? Math.round(totalPrice * 0.1) : 0;
  const finalPrice = totalPrice - discount;

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      alert('Please select a slot');
      return;
    }

    setIsBooking(true);
    try {
      const response = await apiClient.post('/parking/book', {
        userId: localStorage.getItem('userId'),
        parkingLocationId: parking.id,
        slotNumber: selectedSlot,
        duration,
        vehicleType,
      });

      if (response.data.success) {
        onSlotSelected(response.data.session);
        setSelectedSlot(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error booking slot');
    } finally {
      setIsBooking(false);
    }
  };

  if (!isOpen || !parking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">{parking.name}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <div className="text-emerald-400 text-xl font-bold">64</div>
            <div className="text-emerald-300 text-xs uppercase">Available</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="text-blue-400 text-xl font-bold">₹{finalPrice}</div>
            <div className="text-blue-300 text-xs uppercase">Total Price</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="text-amber-400 text-xl font-bold">{duration}h</div>
            <div className="text-amber-300 text-xs uppercase">Duration</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="text-purple-400 text-xl font-bold">{vehicleType}</div>
            <div className="text-purple-300 text-xs uppercase">Vehicle Type</div>
          </div>
        </div>

        {/* Slots Grid */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Select a Slot</h3>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
            {parking.slots?.map((slot) => (
              <button
                key={slot.id}
                onClick={() => slot.status === 'available' && setSelectedSlot(slot.number)}
                disabled={slot.status !== 'available'}
                className={`aspect-square border-2 rounded-lg font-bold text-sm transition-all transform hover:scale-110 ${
                  selectedSlot === slot.number
                    ? 'bg-blue-500 border-blue-600 shadow-lg shadow-blue-500/50'
                    : slot.status === 'available'
                    ? 'bg-emerald-500/80 border-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-500/80 border-red-600 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="text-white">{slot.number}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration Picker */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
          <label className="text-slate-300 text-sm font-semibold mb-3 block">Parking Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 6, 8, 12, 24].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setDuration(hrs)}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  duration === hrs
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {hrs}h
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Type */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
          <label className="text-slate-300 text-sm font-semibold mb-3 block">Vehicle Type</label>
          <div className="grid grid-cols-3 gap-3">
            {['Car', 'Bike', 'SUV'].map((type) => (
              <button
                key={type}
                onClick={() => setVehicleType(type.toLowerCase())}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  vehicleType === type.toLowerCase()
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmBooking}
          disabled={!selectedSlot || isBooking}
          className={`w-full py-4 px-4 rounded-lg font-bold text-white text-lg transition-all ${
            selectedSlot && !isBooking
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/50 hover:scale-105'
              : 'bg-slate-700 cursor-not-allowed opacity-50'
          }`}
        >
          {isBooking ? 'Booking...' : `Confirm Booking - ₹${finalPrice}`}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================
const ParkingBookingSystemWithPayment = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [favorites, setFavorites] = useState([]);

  const [selectedParking, setSelectedParking] = useState(null);
  const [isSlotSelectionOpen, setIsSlotSelectionOpen] = useState(false);

  const [activeParkingSession, setActiveParkingSession] = useState(null);
  const [isActiveParkingModalOpen, setIsActiveParkingModalOpen] = useState(false);

  const [paymentData, setPaymentData] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [parkingLocations, setParkingLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch parking locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await apiClient.get('/parking/locations');
        const mockLocations = [
          { id: 1, name: 'Nexus Smart Park', location: 'Koramangala', price: '₹25/hr', rating: '4.8', slots: [] },
          { id: 2, name: 'Metro Park Hub', location: 'Indiranagar', price: '₹18/hr', rating: '3.9', slots: [] },
          { id: 3, name: 'GreenLot EV Centre', location: 'Whitefield', price: '₹38/hr', rating: '4.6', slots: [] },
          { id: 4, name: 'Sky Tower Parking', location: 'MG Road', price: '₹45/hr', rating: '4.9', slots: [] },
          { id: 5, name: 'Premium Park Zone', location: 'Jubilee Hills', price: '₹35/hr', rating: '4.7', slots: [] },
          { id: 6, name: 'Quick Park Garage', location: 'Marathahalli', price: '₹22/hr', rating: '4.3', slots: [] },
        ];
        setParkingLocations(mockLocations);
      } catch (err) {
        console.error('Error fetching locations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedToken = localStorage.getItem('authToken');
    if (storedUserId && storedToken) {
      setIsAuthenticated(true);
      setUserId(storedUserId);
    }
  }, []);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('authToken', data.authToken);
    setUserId(data.userId);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
  };

  const handleCardClick = (parking) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedParking(parking);
    setIsSlotSelectionOpen(true);
  };

  const handleSlotSelected = (session) => {
    setActiveParkingSession(session);
    setIsSlotSelectionOpen(false);
    setIsActiveParkingModalOpen(true);
  };

  const handleExitOTP = (chargesData) => {
    setPaymentData(chargesData);
    setIsActiveParkingModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentResponse) => {
    // Slot is now released, show success
    setIsPaymentModalOpen(false);
    setActiveParkingSession(null);
    alert('✅ Payment successful! Slot has been released.');
  };

  const toggleFavorite = (parkingId) => {
    setFavorites(prev =>
      prev.includes(parkingId)
        ? prev.filter(id => id !== parkingId)
        : [...prev, parkingId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                🅿️
              </div>
              <h1 className="text-3xl font-black text-white">ParkEzy</h1>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  👤
                </div>
                <span className="text-white text-sm font-semibold">Verified</span>
                <button
                  onClick={() => {
                    localStorage.removeItem('userId');
                    localStorage.removeItem('authToken');
                    setIsAuthenticated(false);
                    setUserId(null);
                  }}
                  className="ml-3 text-slate-400 hover:text-white text-xs"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all"
              >
                Login/Register
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white mb-1">📍 Nearby Parking</h2>
          <p className="text-slate-400 text-sm">Book your parking spot now</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="bg-slate-800 rounded-xl h-64 animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parkingLocations.map(parking => (
              <ParkingCard
                key={parking.id}
                parking={parking}
                onClick={() => handleCardClick(parking)}
                isFavorite={favorites.includes(parking.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <SlotSelectionModal
        parking={selectedParking}
        isOpen={isSlotSelectionOpen}
        onClose={() => setIsSlotSelectionOpen(false)}
        onSlotSelected={handleSlotSelected}
      />

      <ActiveParkingModal
        session={activeParkingSession}
        isOpen={isActiveParkingModalOpen}
        onClose={() => setIsActiveParkingModalOpen(false)}
        onExit={handleExitOTP}
      />

      <PaymentModal
        chargesData={paymentData}
        sessionId={activeParkingSession?.sessionId}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default ParkingBookingSystemWithPayment;
