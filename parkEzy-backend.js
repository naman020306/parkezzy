// ============================================================================
// PARKEZ PARKING SYSTEM - NODE.JS/EXPRESS BACKEND
// ============================================================================
// This is a complete backend for parking system with OTP, session management,
// timing calculation, and payment processing

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const twilio = require('twilio'); // For SMS OTP
require('dotenv').config();

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ============================================================================
// IN-MEMORY DATABASE (Replace with MongoDB/PostgreSQL in production)
// ============================================================================
const database = {
  users: new Map(),
  parkingSessions: new Map(),
  otpCache: new Map(),
  payments: [],
  parkingSlots: new Map(),
};

// Initialize parking slots for each parking location
const initializeParkingSlots = () => {
  const locations = [
    { id: 1, name: 'Nexus Smart Park', totalSlots: 64 },
    { id: 2, name: 'Metro Park Hub', totalSlots: 60 },
    { id: 3, name: 'GreenLot EV Centre', totalSlots: 36 },
    { id: 4, name: 'Sky Tower Parking', totalSlots: 80 },
    { id: 5, name: 'Premium Park Zone', totalSlots: 48 },
    { id: 6, name: 'Quick Park Garage', totalSlots: 56 },
  ];

  locations.forEach(location => {
    const slots = {};
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let slotIndex = 0;

    for (let row of rows) {
      for (let col = 1; col <= 8; col++) {
        if (slotIndex < location.totalSlots) {
          const slotId = `${row}${col}`;
          slots[slotId] = {
            id: slotId,
            number: slotId,
            status: 'available', // available, booked, occupied
            occupiedBy: null,
            bookedAt: null,
          };
          slotIndex++;
        }
      }
    }

    database.parkingSlots.set(location.id, {
      locationId: location.id,
      locationName: location.name,
      totalSlots: location.totalSlots,
      slots: slots,
    });
  });
};

initializeParkingSlots();

// ============================================================================
// OTP UTILITY FUNCTIONS - Using Math.random()
// ============================================================================
const OTPUtils = {
  // Generate random 6-digit OTP using Math.random()
  generateOTP: (length = 6) => {
    let otp = '';
    for (let i = 0; i < length; i++) {
      const randomDigit = Math.floor(Math.random() * 10);
      otp += randomDigit;
    }
    return otp;
  },

  // Generate alphanumeric OTP
  generateAlphanumericOTP: (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      otp += chars[randomIndex];
    }
    return otp;
  },

  // Verify OTP
  verifyOTP: (enteredOTP, storedOTP) => {
    return enteredOTP === storedOTP;
  },

  // Store OTP with expiry (5 minutes)
  storeOTP: (email, otp) => {
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
    database.otpCache.set(email, { otp, expiryTime });
    return { otp, expiresIn: '5 minutes' };
  },

  // Check if OTP is expired
  isOTPExpired: (email) => {
    const otpData = database.otpCache.get(email);
    if (!otpData) return true;
    return Date.now() > otpData.expiryTime;
  },

  // Get stored OTP
  getOTP: (email) => {
    return database.otpCache.get(email)?.otp;
  },

  // Clear OTP after verification
  clearOTP: (email) => {
    database.otpCache.delete(email);
  },
};

// ============================================================================
// EMAIL CONFIGURATION (Using Nodemailer)
// ============================================================================
const emailTransporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

// Send OTP via Email
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🔐 Your ParkEzy OTP Verification Code',
      html: `
        <div style="font-family: Arial; background: #0f172a; color: white; padding: 20px; border-radius: 10px;">
          <h2 style="color: #06b6d4;">🅿️ ParkEzy Parking Verification</h2>
          <p>Your OTP for parking verification:</p>
          <h1 style="background: #1e293b; padding: 20px; border-radius: 5px; text-align: center; letter-spacing: 5px; color: #06b6d4;">
            ${otp}
          </h1>
          <p style="color: #cbd5e1;">This OTP is valid for 5 minutes only.</p>
          <p style="color: #64748b; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return false;
  }
};

// ============================================================================
// SMS CONFIGURATION (Using Twilio)
// ============================================================================
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || 'your-account-sid',
  process.env.TWILIO_AUTH_TOKEN || 'your-auth-token'
);

const sendOTPSMS = async (phoneNumber, otp) => {
  try {
    await twilioClient.messages.create({
      body: `🔐 Your ParkEzy OTP is: ${otp}. Valid for 5 minutes only.`,
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      to: phoneNumber,
    });
    console.log(`✅ OTP SMS sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP SMS:', error);
    return false;
  }
};

// ============================================================================
// PAYMENT PROCESSING (Mock Payment Gateway)
// ============================================================================
const PaymentGateway = {
  // Process payment based on method
  processPayment: async (paymentData) => {
    const {
      userId,
      amount,
      paymentMethod, // 'netbanking', 'upi', 'debit', 'credit'
      sessionId,
      parkingLocationId,
      slotNumber,
      duration,
    } = paymentData;

    try {
      // Validate payment data
      if (!amount || !paymentMethod || !sessionId) {
        return {
          success: false,
          message: 'Invalid payment data',
          code: 'INVALID_PAYMENT',
        };
      }

      // Mock different payment methods
      let transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      let status = 'SUCCESS';

      // Simulate payment processing (In production, integrate with actual gateway)
      if (paymentMethod === 'netbanking') {
        // Simulate 5% failure rate
        status = Math.random() > 0.95 ? 'FAILED' : 'SUCCESS';
        transactionId = `NB_${transactionId}`;
      } else if (paymentMethod === 'upi') {
        // Simulate 2% failure rate (UPI is more reliable)
        status = Math.random() > 0.98 ? 'FAILED' : 'SUCCESS';
        transactionId = `UPI_${transactionId}`;
      } else if (paymentMethod === 'debit') {
        // Simulate 3% failure rate
        status = Math.random() > 0.97 ? 'FAILED' : 'SUCCESS';
        transactionId = `DEBIT_${transactionId}`;
      } else if (paymentMethod === 'credit') {
        // Simulate 4% failure rate
        status = Math.random() > 0.96 ? 'FAILED' : 'SUCCESS';
        transactionId = `CREDIT_${transactionId}`;
      }

      // Store payment record
      const paymentRecord = {
        id: transactionId,
        userId,
        sessionId,
        parkingLocationId,
        slotNumber,
        amount,
        paymentMethod,
        duration,
        status,
        timestamp: new Date(),
        receipt: `RECEIPT_${transactionId}`,
      };

      database.payments.push(paymentRecord);

      return {
        success: status === 'SUCCESS',
        message: status === 'SUCCESS' ? 'Payment processed successfully' : 'Payment failed',
        transactionId,
        status,
        receipt: paymentRecord.receipt,
      };
    } catch (error) {
      console.error('❌ Payment processing error:', error);
      return {
        success: false,
        message: 'Payment processing error',
        error: error.message,
      };
    }
  },

  // Generate payment receipt
  generateReceipt: (paymentData) => {
    const { transactionId, amount, paymentMethod, slotNumber, duration } = paymentData;
    return {
      receiptId: `RCPT_${Date.now()}`,
      transactionId,
      amount,
      paymentMethod,
      slotNumber,
      duration,
      durationText: `${duration} hour(s)`,
      totalAmount: `₹${amount}`,
      timestamp: new Date().toISOString(),
      status: 'PAID',
    };
  },
};

// ============================================================================
// PARKING SESSION MANAGEMENT
// ============================================================================
const ParkingSessionManager = {
  // Create parking session when car parks
  createSession: (userId, parkingLocationId, slotNumber, duration) => {
    const sessionId = `SESSION_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    const session = {
      sessionId,
      userId,
      parkingLocationId,
      slotNumber,
      status: 'active', // active, completed, cancelled
      startTime,
      endTime,
      duration: duration, // in hours
      otp: OTPUtils.generateOTP(6), // Generate exit OTP
      otpVerified: false,
      payment: null,
      totalAmount: 0,
    };

    database.parkingSessions.set(sessionId, session);
    return session;
  },

  // Get session by ID
  getSession: (sessionId) => {
    return database.parkingSessions.get(sessionId);
  },

  // Calculate parking charges
  calculateCharges: (parkingLocationId, duration) => {
    // Price per hour for each location
    const priceMap = {
      1: 25, // Nexus Smart Park
      2: 18, // Metro Park Hub
      3: 38, // GreenLot EV Centre
      4: 45, // Sky Tower Parking
      5: 35, // Premium Park Zone
      6: 22, // Quick Park Garage
    };

    const basePrice = priceMap[parkingLocationId] || 25;
    let totalPrice = basePrice * duration;

    // Apply discount for longer durations
    if (duration > 4) {
      totalPrice = Math.round(totalPrice * 0.9); // 10% discount
    } else if (duration > 8) {
      totalPrice = Math.round(totalPrice * 0.85); // 15% discount
    }

    return {
      basePrice: basePrice * duration,
      discount: basePrice * duration - totalPrice,
      totalPrice,
      durationHours: duration,
    };
  },

  // Calculate remaining time for parking
  getRemainingTime: (sessionId) => {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const now = new Date();
    const endTime = new Date(session.endTime);
    const remainingMs = endTime - now;

    if (remainingMs <= 0) {
      return {
        expired: true,
        message: 'Parking time has expired',
        remainingMinutes: 0,
        remainingHours: 0,
      };
    }

    const remainingMinutes = Math.floor(remainingMs / 60000);
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;

    return {
      expired: false,
      remainingMs,
      remainingMinutes,
      remainingHours,
      remainingMins,
      formattedTime: `${remainingHours}h ${remainingMins}m`,
    };
  },

  // Mark slot as occupied
  markSlotOccupied: (parkingLocationId, slotNumber, sessionId) => {
    const parkingLocation = database.parkingSlots.get(parkingLocationId);
    if (!parkingLocation) return false;

    const slot = parkingLocation.slots[slotNumber];
    if (!slot || slot.status !== 'available') return false;

    slot.status = 'occupied';
    slot.occupiedBy = sessionId;
    slot.bookedAt = new Date();
    return true;
  },

  // Release slot (make available again)
  releaseSlot: (parkingLocationId, slotNumber) => {
    const parkingLocation = database.parkingSlots.get(parkingLocationId);
    if (!parkingLocation) return false;

    const slot = parkingLocation.slots[slotNumber];
    if (!slot) return false;

    slot.status = 'available';
    slot.occupiedBy = null;
    slot.bookedAt = null;
    return true;
  },

  // End parking session (when payment is done)
  endSession: (sessionId) => {
    const session = this.getSession(sessionId);
    if (!session) return false;

    session.status = 'completed';
    session.endedAt = new Date();

    // Release the slot
    this.releaseSlot(session.parkingLocationId, session.slotNumber);

    return true;
  },
};

// ============================================================================
// API ROUTES
// ============================================================================

// 1. USER REGISTRATION
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, phone, password, name } = req.body;

    // Validate input
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const userKey = email || phone;
    if (database.users.has(userKey)) {
      return res.status(400).json({
        success: false,
        message: 'User already registered',
      });
    }

    // Create user
    const userId = `USER_${Date.now()}`;
    const user = {
      userId,
      email,
      phone,
      name,
      password, // In production, use bcrypt
      createdAt: new Date(),
    };

    database.users.set(userKey, user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. REQUEST OTP (For Login)
app.post('/api/auth/request-otp', (req, res) => {
  try {
    const { email, phone, otpMethod = 'email' } = req.body;

    const recipient = email || phone;
    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required',
      });
    }

    // Generate OTP using Math.random()
    const otp = OTPUtils.generateOTP(6);
    console.log(`🔐 Generated OTP for ${recipient}: ${otp}`);

    // Store OTP
    OTPUtils.storeOTP(recipient, otp);

    // Send OTP
    if (otpMethod === 'email' && email) {
      sendOTPEmail(email, otp);
    } else if (otpMethod === 'sms' && phone) {
      sendOTPSMS(phone, otp);
    }

    res.status(200).json({
      success: true,
      message: `OTP sent to ${otpMethod === 'email' ? 'your email' : 'your phone'}`,
      recipient: recipient.substring(0, 3) + '***' + recipient.substring(recipient.length - 3),
      testOTP: process.env.NODE_ENV === 'development' ? otp : null, // Only in dev
      expiresIn: '5 minutes',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. VERIFY OTP (For Login)
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    const recipient = email || phone;
    if (!recipient || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email/phone and OTP are required',
      });
    }

    // Check if OTP is expired
    if (OTPUtils.isOTPExpired(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    // Verify OTP
    const storedOTP = OTPUtils.getOTP(recipient);
    if (!OTPUtils.verifyOTP(otp, storedOTP)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Check if user exists
    if (!database.users.has(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    // Clear OTP
    OTPUtils.clearOTP(recipient);

    // Generate auth token
    const user = database.users.get(recipient);
    const authToken = `TOKEN_${Date.now()}`;

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      authToken,
      userId: user.userId,
      user: {
        email: user.email,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. BOOK PARKING SLOT
app.post('/api/parking/book', (req, res) => {
  try {
    const { userId, parkingLocationId, slotNumber, duration, vehicleType } = req.body;

    // Validate input
    if (!userId || !parkingLocationId || !slotNumber || !duration) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Check if slot is available
    const parkingLocation = database.parkingSlots.get(parkingLocationId);
    if (!parkingLocation) {
      return res.status(404).json({
        success: false,
        message: 'Parking location not found',
      });
    }

    const slot = parkingLocation.slots[slotNumber];
    if (!slot || slot.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Slot is not available',
      });
    }

    // Create parking session
    const session = ParkingSessionManager.createSession(
      userId,
      parkingLocationId,
      slotNumber,
      duration
    );

    // Mark slot as occupied
    ParkingSessionManager.markSlotOccupied(parkingLocationId, slotNumber, session.sessionId);

    // Calculate charges
    const charges = ParkingSessionManager.calculateCharges(parkingLocationId, duration);

    session.totalAmount = charges.totalPrice;

    res.status(200).json({
      success: true,
      message: 'Parking slot booked successfully',
      session: {
        sessionId: session.sessionId,
        slotNumber: session.slotNumber,
        parkingLocationId: session.parkingLocationId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: `${duration} hours`,
        otp: session.otp, // Exit OTP
        charges,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. GET PARKING SESSION DETAILS
app.get('/api/parking/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = ParkingSessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Calculate remaining time
    const remainingTime = ParkingSessionManager.getRemainingTime(sessionId);

    // Calculate additional charges if time exceeded
    let additionalCharges = 0;
    if (remainingTime.expired) {
      const additionalHours = Math.ceil(
        (new Date() - new Date(session.endTime)) / (60 * 60 * 1000)
      );
      additionalCharges = additionalHours * 50; // ₹50 per additional hour
    }

    res.status(200).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        slotNumber: session.slotNumber,
        status: session.status,
        remainingTime,
        additionalCharges,
        exitOTP: session.otp,
        otpVerified: session.otpVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. VERIFY EXIT OTP (When user wants to exit parking)
app.post('/api/parking/verify-exit-otp', (req, res) => {
  try {
    const { sessionId, exitOTP } = req.body;

    if (!sessionId || !exitOTP) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and exit OTP are required',
      });
    }

    const session = ParkingSessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Verify exit OTP
    if (session.otp !== exitOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exit OTP',
      });
    }

    // Calculate final charges
    const remainingTime = ParkingSessionManager.getRemainingTime(sessionId);
    let totalAmount = session.totalAmount;

    if (remainingTime.expired) {
      const additionalHours = Math.ceil(
        (new Date() - new Date(session.endTime)) / (60 * 60 * 1000)
      );
      const additionalCharges = additionalHours * 50;
      totalAmount += additionalCharges;
    }

    res.status(200).json({
      success: true,
      message: 'Exit OTP verified successfully',
      charges: {
        baseAmount: session.totalAmount,
        additionalCharges: totalAmount - session.totalAmount,
        totalAmount,
      },
      payment: {
        required: true,
        methods: ['netbanking', 'upi', 'debit', 'credit'],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. PROCESS PAYMENT
app.post('/api/payment/process', (req, res) => {
  try {
    const {
      userId,
      sessionId,
      amount,
      paymentMethod,
      parkingLocationId,
      slotNumber,
      duration,
    } = req.body;

    if (!sessionId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, amount, and payment method are required',
      });
    }

    // Process payment
    const paymentResult = PaymentGateway.processPayment({
      userId,
      sessionId,
      amount,
      paymentMethod,
      parkingLocationId,
      slotNumber,
      duration,
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: paymentResult.message,
        code: paymentResult.code,
      });
    }

    // Update session with payment
    const session = ParkingSessionManager.getSession(sessionId);
    session.payment = {
      transactionId: paymentResult.transactionId,
      method: paymentMethod,
      amount,
      status: paymentResult.status,
    };

    // End parking session and release slot
    ParkingSessionManager.endSession(sessionId);

    // Generate receipt
    const receipt = PaymentGateway.generateReceipt({
      transactionId: paymentResult.transactionId,
      amount,
      paymentMethod,
      slotNumber,
      duration,
    });

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      payment: {
        transactionId: paymentResult.transactionId,
        status: paymentResult.status,
        receipt: receipt.receiptId,
      },
      sessionId,
      slotReleased: true,
      nextSteps: 'You can now exit the parking. Thank you!',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. GET ALL PARKING LOCATIONS WITH SLOTS
app.get('/api/parking/locations', (req, res) => {
  try {
    const locations = [];

    database.parkingSlots.forEach((location, locationId) => {
      const availableSlots = Object.values(location.slots).filter(
        slot => slot.status === 'available'
      ).length;

      locations.push({
        id: locationId,
        name: location.locationName,
        totalSlots: location.totalSlots,
        availableSlots,
        occupancyPercent: Math.round(
          ((location.totalSlots - availableSlots) / location.totalSlots) * 100
        ),
      });
    });

    res.status(200).json({
      success: true,
      locations,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. GET PARKING LOCATION SLOTS
app.get('/api/parking/location/:locationId/slots', (req, res) => {
  try {
    const { locationId } = req.params;
    const parkingLocation = database.parkingSlots.get(parseInt(locationId));

    if (!parkingLocation) {
      return res.status(404).json({
        success: false,
        message: 'Parking location not found',
      });
    }

    const slots = Object.values(parkingLocation.slots);

    res.status(200).json({
      success: true,
      location: {
        id: locationId,
        name: parkingLocation.locationName,
        totalSlots: parkingLocation.totalSlots,
        slots,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. GET PAYMENT HISTORY
app.get('/api/payment/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const userPayments = database.payments.filter(p => p.userId === userId);

    res.status(200).json({
      success: true,
      payments: userPayments,
      totalPayments: userPayments.length,
      totalAmount: userPayments.reduce((sum, p) => sum + p.amount, 0),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================================
// START SERVER
// ============================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🅿️  ParkEzy Backend Server             ║
║  ✅ Running on port ${PORT}               ║
║  🔐 OTP System Active                  ║
║  💳 Payment Gateway Ready              ║
║  🚗 Parking Management System          ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
