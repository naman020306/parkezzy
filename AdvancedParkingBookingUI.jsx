import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, X, MapPin, Clock, DollarSign, Star, Heart, Zap, Grid3x3, Filter, MapPinIcon, Droplet, Lock, Wifi } from 'lucide-react';

// ============================================================================
// PARKING TYPE TAGS
// ============================================================================
const ParkingTypeTag = ({ type, color }) => {
  const colorMap = {
    available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    filling: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    full: 'bg-red-500/20 text-red-400 border-red-500/30',
    ev_charger: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    open_air: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    covered: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    access: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    charging: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };

  const iconMap = {
    ev_charger: <Zap className="w-3 h-3" />,
    open_air: <MapPinIcon className="w-3 h-3" />,
    covered: <Grid3x3 className="w-3 h-3" />,
    access: <Lock className="w-3 h-3" />,
    charging: <Zap className="w-3 h-3" />,
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide border ${colorMap[color]}`}>
      {iconMap[color]}
      {type}
    </div>
  );
};

// ============================================================================
// SLOT BOX COMPONENT - Individual parking slot
// ============================================================================
const SlotBox = ({ slotNumber, status, isSelected, onClick }) => {
  const getSlotColor = () => {
    if (isSelected) return 'bg-blue-500 border-blue-600 shadow-lg shadow-blue-500/50 scale-105';
    if (status === 'available') return 'bg-emerald-500/80 hover:bg-emerald-500 border-emerald-600 shadow-emerald-500/20';
    if (status === 'booked') return 'bg-red-500/80 hover:bg-red-600 border-red-600 cursor-not-allowed opacity-70';
    if (status === 'filling') return 'bg-amber-500/80 hover:bg-amber-500 border-amber-600';
  };

  return (
    <button
      onClick={onClick}
      disabled={status === 'booked'}
      className={`
        relative w-full aspect-square
        border-2 rounded-lg font-bold text-xs
        transition-all duration-200 transform
        hover:scale-110 active:scale-95
        ${getSlotColor()}
        ${status === 'booked' ? 'cursor-not-allowed' : 'cursor-pointer'}
        group
      `}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-white font-bold text-sm tracking-wide">
          {slotNumber}
        </span>
        {isSelected && (
          <span className="text-white text-xs mt-1 animate-pulse">✓</span>
        )}
      </div>

      {status === 'booked' && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
          bg-red-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          Booked
        </div>
      )}
    </button>
  );
};

// ============================================================================
// SLOT GRID COMPONENT
// ============================================================================
const SlotGrid = ({ slots, onSlotClick, selectedSlot }) => {
  const COLUMNS = 8;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}>
        {slots.map((slot) => (
          <SlotBox
            key={slot.id}
            slotNumber={slot.number}
            status={slot.status}
            isSelected={selectedSlot?.id === slot.id}
            onClick={() => onSlotClick(slot)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// LEGEND COMPONENT
// ============================================================================
const Legend = () => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
      <h3 className="text-slate-300 text-xs font-semibold mb-3 uppercase tracking-wide">Slot Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded border border-emerald-600"></div>
          <span className="text-xs text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded border border-amber-600"></div>
          <span className="text-xs text-slate-300">Filling Up</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded border border-red-600"></div>
          <span className="text-xs text-slate-300">Full</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div>
          <span className="text-xs text-slate-300">Selected</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DURATION PICKER COMPONENT
// ============================================================================
const DurationPicker = ({ duration, onDurationChange }) => {
  const durations = [1, 2, 3, 4, 6, 8, 12, 24];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
      <label className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-400" />
        Parking Duration
      </label>
      <div className="grid grid-cols-4 gap-2">
        {durations.map((hrs) => (
          <button
            key={hrs}
            onClick={() => onDurationChange(hrs)}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              duration === hrs
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {hrs}h
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ADVANCED BOOKING MODAL
// ============================================================================
const AdvancedBookingModal = ({ parking, isOpen, onClose, onBooking }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState(2);
  const [bookingMessage, setBookingMessage] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [vehicleType, setVehicleType] = useState('car');

  const availableCount = parking.slots.filter(s => s.status === 'available').length;
  const bookedCount = parking.slots.filter(s => s.status === 'booked').length;
  const fillingCount = parking.slots.filter(s => s.status === 'filling').length;

  // Calculate price
  const basePrice = parseInt(parking.price.replace(/[₹$]/g, ''));
  const totalPrice = basePrice * duration;
  const discount = duration > 4 ? Math.round(totalPrice * 0.1) : 0;
  const finalPrice = totalPrice - discount;

  const handleSlotClick = (slot) => {
    if (slot.status === 'booked') {
      setBookingMessage('❌ This slot is already booked');
      setTimeout(() => setBookingMessage(''), 3000);
      return;
    }
    setSelectedSlot(slot);
    setBookingMessage('');
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      setBookingMessage('⚠️ Please select a slot first');
      return;
    }

    setIsBooking(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setBookingMessage('✅ Slot booked successfully!');
    onBooking(selectedSlot);
    setSelectedSlot(null);
    setIsBooking(false);

    setTimeout(() => {
      setBookingMessage('');
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        {/* Header with Background Image */}
        <div className="relative h-48 bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden group">
          {parking.imageUrl && (
            <img
              src={parking.imageUrl}
              alt={parking.name}
              className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900"></div>

          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="absolute bottom-4 left-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">{parking.name}</h2>
                <p className="text-slate-400 text-sm">{parking.location} • {parking.distance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="text-emerald-400 text-2xl font-bold">{availableCount}</div>
              <div className="text-emerald-300 text-xs uppercase tracking-wide mt-1">Available</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="text-amber-400 text-2xl font-bold">{fillingCount}</div>
              <div className="text-amber-300 text-xs uppercase tracking-wide mt-1">Filling Up</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-400 text-2xl font-bold">{bookedCount}</div>
              <div className="text-red-300 text-xs uppercase tracking-wide mt-1">Full</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-blue-400 text-2xl font-bold">₹{finalPrice}</div>
              <div className="text-blue-300 text-xs uppercase tracking-wide mt-1">Total Price</div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-blue-400" />
              Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {parking.amenities?.map((amenity) => (
                <ParkingTypeTag key={amenity} type={amenity} color={
                  amenity.includes('EV') ? 'ev_charger' :
                  amenity.includes('Covered') ? 'covered' :
                  amenity.includes('Open') ? 'open_air' :
                  amenity.includes('Access') ? 'access' : 'charging'
                } />
              ))}
            </div>
          </div>

          {/* Slot Grid */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Select Your Parking Slot
            </h3>
            <SlotGrid
              slots={parking.slots}
              onSlotClick={handleSlotClick}
              selectedSlot={selectedSlot}
            />
          </div>

          {/* Legend */}
          <Legend />

          {/* Duration Picker */}
          <DurationPicker duration={duration} onDurationChange={setDuration} />

          {/* Vehicle Type */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <label className="text-slate-300 text-sm font-semibold mb-3 block">Vehicle Type</label>
            <div className="grid grid-cols-3 gap-3">
              {['Car', 'Bike', 'SUV'].map((type) => (
                <button
                  key={type}
                  onClick={() => setVehicleType(type.toLowerCase())}
                  className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
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

          {/* Selected Slot Info */}
          <div className="space-y-4">
            {selectedSlot && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm">Selected Slot</p>
                    <p className="text-white text-2xl font-bold">{selectedSlot.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 text-sm">Duration</p>
                    <p className="text-white text-2xl font-bold">{duration}h</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 text-sm">Price</p>
                    <div className="flex items-baseline gap-2">
                      {discount > 0 && <span className="text-red-400 line-through text-sm">₹{totalPrice}</span>}
                      <p className="text-emerald-400 text-2xl font-bold">₹{finalPrice}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {bookingMessage && (
              <div className={`text-center p-3 rounded-lg text-sm font-medium animate-in fade-in duration-300 ${
                bookingMessage.includes('✅') ? 'bg-emerald-500/20 text-emerald-300' :
                bookingMessage.includes('❌') ? 'bg-red-500/20 text-red-300' :
                'bg-blue-500/20 text-blue-300'
              }`}>
                {bookingMessage}
              </div>
            )}

            <button
              onClick={handleConfirmBooking}
              disabled={!selectedSlot || isBooking}
              className={`w-full py-4 px-4 rounded-lg font-bold text-white
                transition-all duration-300 transform text-lg
                ${selectedSlot && !isBooking
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/50 hover:scale-105'
                  : 'bg-slate-700 cursor-not-allowed opacity-50'
                }
              `}
            >
              {isBooking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Processing Booking...
                </span>
              ) : (
                `Confirm Booking - ₹${finalPrice}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ENHANCED PARKING CARD
// ============================================================================
const ParkingCard = ({ parking, onClick, isFavorite, onToggleFavorite }) => {
  const availableSlots = parking.slots.filter(s => s.status === 'available').length;
  const totalSlots = parking.slots.length;
  const occupancyPercent = Math.round(
    ((totalSlots - availableSlots) / totalSlots) * 100
  );

  const getStatusColor = () => {
    if (occupancyPercent > 80) return 'text-red-400';
    if (occupancyPercent > 50) return 'text-amber-400';
    return 'text-emerald-400';
  };

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
      {/* Parking Image */}
      <div className="relative h-40 bg-gradient-to-b from-slate-700 to-slate-800 overflow-hidden">
        {parking.imageUrl && (
          <img
            src={parking.imageUrl}
            alt={parking.name}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900"></div>

        {/* Price Tag */}
        <div className="absolute top-3 left-3 bg-cyan-600 px-3 py-1 rounded font-bold text-white text-sm">
          ₹{parking.price}/hr
        </div>

        {/* Status Badge */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${getStatusColor()}`}>
          {getStatusLabel()}
        </div>

        {/* Heart - Favorite */}
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

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name & Location */}
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
            {parking.name}
          </h3>
          <p className="text-slate-400 text-xs mt-1">{parking.location}</p>
          <p className="text-cyan-400 text-xs mt-1">📍 {parking.distance}</p>
        </div>

        {/* Availability Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs uppercase tracking-wide">Availability</span>
            <span className="text-emerald-400 font-semibold text-sm">{availableSlots}/{totalSlots}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.round((availableSlots / totalSlots) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1 pt-1">
          {parking.amenities?.slice(0, 2).map((amenity) => (
            <span key={amenity} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
              {amenity === 'EV Charger' && <Zap className="w-3 h-3 inline mr-1" />}
              {amenity}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300 text-sm">{parking.rating}</span>
          </div>
          <div className="text-slate-400 text-xs">
            ⏱️ {parking.duration}
          </div>
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// FILTER BUTTONS COMPONENT
// ============================================================================
const FilterButtons = ({ activeFilters, onFilterChange }) => {
  const filters = [
    { id: 'all', label: '◆ All', icon: '◆' },
    { id: 'available', label: '● Available', icon: '●' },
    { id: 'covered', label: '⬜ Covered', icon: '⬜' },
    { id: 'open_air', label: '◯ Open Air', icon: '◯' },
    { id: '24h', label: '⏰ 24H', icon: '⏰' },
    { id: 'access', label: '🔓 Access', icon: '🔓' },
    { id: 'ev_charging', label: '⚡ EV Charging Only', icon: '⚡' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-700 overflow-x-auto">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wide font-semibold whitespace-nowrap transition-all duration-200 ${
            activeFilters.includes(filter.id)
              ? 'bg-cyan-600 text-white border border-cyan-500 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================
const AdvancedParkingApp = () => {
  const [selectedParking, setSelectedParking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('distance');
  const [searchQuery, setSearchQuery] = useState('');
  const [systemStatus, setSystemStatus] = useState(true);

  // Generate parking data
  const generateSlots = (count) => {
    const slots = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let slotIndex = 0;

    for (let row of rows) {
      for (let col = 1; col <= 8; col++) {
        if (slotIndex < count) {
          const rand = Math.random();
          const status = rand > 0.75 ? 'booked' : rand > 0.5 ? 'filling' : 'available';
          slots.push({
            id: `${row}${col}`,
            number: `${row}${col}`,
            status: status,
          });
          slotIndex++;
        }
      }
    }
    return slots;
  };

  const parkingLocations = useMemo(
    () => [
      {
        id: 1,
        name: 'Nexus Smart Park',
        location: 'Koramangala, Bangalore',
        distance: '0.1 km',
        price: '₹25',
        rating: '4.8',
        duration: '24H',
        imageUrl: 'https://images.unsplash.com/photo-1537359331871-0c42f44eab2b?w=400&h=300&fit=crop',
        slots: generateSlots(64),
        amenities: ['EV Charger', 'Covered', '24H Access'],
      },
      {
        id: 2,
        name: 'Metro Park Hub',
        location: 'Indiranagar, Bangalore',
        distance: '0.8 km',
        price: '₹18',
        rating: '3.9',
        duration: '12H',
        imageUrl: 'https://images.unsplash.com/photo-1599592880213-e5b8c4d90e3e?w=400&h=300&fit=crop',
        slots: generateSlots(60),
        amenities: ['Open Air', 'Filling'],
      },
      {
        id: 3,
        name: 'GreenLot EV Centre',
        location: 'Whitefield, Bangalore',
        distance: '1.1 km',
        price: '₹38',
        rating: '4.6',
        duration: '24H',
        imageUrl: 'https://images.unsplash.com/photo-1491066804065-9a830b914330?w=400&h=300&fit=crop',
        slots: generateSlots(36),
        amenities: ['EV Charger', 'Covered', 'Access Control'],
      },
      {
        id: 4,
        name: 'Sky Tower Parking',
        location: 'MG Road, Bangalore',
        distance: '0.5 km',
        price: '₹45',
        rating: '4.9',
        duration: '24H',
        imageUrl: 'https://images.unsplash.com/photo-1486299219710-186a27470e58?w=400&h=300&fit=crop',
        slots: generateSlots(80),
        amenities: ['Covered', '24H Access', 'Security'],
      },
      {
        id: 5,
        name: 'Premium Park Zone',
        location: 'Jubilee Hills, Bangalore',
        distance: '1.5 km',
        price: '₹35',
        rating: '4.7',
        duration: '12H',
        imageUrl: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=400&h=300&fit=crop',
        slots: generateSlots(48),
        amenities: ['Covered', 'EV Charger'],
      },
      {
        id: 6,
        name: 'Quick Park Garage',
        location: 'Marathahalli, Bangalore',
        distance: '2.1 km',
        price: '₹22',
        rating: '4.3',
        duration: '24H',
        imageUrl: 'https://images.unsplash.com/photo-1574902045991-c2f18156a9b7?w=400&h=300&fit=crop',
        slots: generateSlots(56),
        amenities: ['Open Air', 'Access Control'],
      },
    ],
    []
  );

  const filteredAndSortedParkings = useMemo(() => {
    let filtered = parkingLocations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply amenity filters
    if (!activeFilters.includes('all')) {
      filtered = filtered.filter(parking => {
        return activeFilters.some(filter => {
          if (filter === 'available') {
            return parking.slots.some(s => s.status === 'available');
          }
          if (filter === 'covered') {
            return parking.amenities.includes('Covered');
          }
          if (filter === 'open_air') {
            return parking.amenities.includes('Open Air');
          }
          if (filter === '24h') {
            return parking.amenities.includes('24H Access');
          }
          if (filter === 'access') {
            return parking.amenities.includes('Access Control');
          }
          if (filter === 'ev_charging') {
            return parking.amenities.includes('EV Charger');
          }
          return true;
        });
      });
    }

    // Apply sorting
    if (sortBy === 'distance') {
      filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => parseInt(a.price.replace(/₹/g, '')) - parseInt(b.price.replace(/₹/g, '')));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    }

    return filtered;
  }, [parkingLocations, activeFilters, sortBy, searchQuery]);

  const handleCardClick = (parking) => {
    setSelectedParking(parking);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedParking(null), 300);
  };

  const handleBooking = (slot) => {
    if (selectedParking) {
      const updatedParking = {
        ...selectedParking,
        slots: selectedParking.slots.map(s =>
          s.id === slot.id ? { ...s, status: 'booked' } : s
        ),
      };
      setSelectedParking(updatedParking);
    }
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
      {/* Animated background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                🅿️
              </div>
              <h1 className="text-3xl font-black text-white">ParkEzy</h1>
              <span className="text-slate-500 text-xs uppercase tracking-widest">Feed • Precision • Parking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${systemStatus ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {systemStatus ? '🟢 Sys Online' : '🔴 Sys Offline'}
              </div>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-lg transition-all hover:shadow-lg hover:shadow-cyan-500/30">
                📌 Help
              </button>
              <button className="px-4 py-2 border border-slate-700 text-slate-300 hover:text-white text-sm font-bold rounded-lg transition-all hover:border-slate-600">
                👤 Login
              </button>
              <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/30">
                ➕ Register
              </button>
            </div>
          </div>

          {/* Search & Controls */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 Search Spots"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="distance">↕️ Sort: Distance</option>
              <option value="price">💰 Sort: Price</option>
              <option value="rating">⭐ Sort: Rating</option>
            </select>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3 mt-3 text-xs uppercase tracking-wide">
            <span className="flex items-center gap-1 text-emerald-400">🟢 Available</span>
            <span className="flex items-center gap-1 text-amber-400">🟡 Filling up</span>
            <span className="flex items-center gap-1 text-red-400">🔴 Full</span>
            <span className="flex items-center gap-1 text-yellow-400">⚡ EV Charger</span>
            <div className="ml-auto text-slate-500">
              🔄 Live Feed • 15s Refresh
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Buttons */}
        <FilterButtons activeFilters={activeFilters} onFilterChange={(filter) => {
          if (filter === 'all') {
            setActiveFilters(['all']);
          } else {
            setActiveFilters(prev =>
              prev.includes('all')
                ? [filter]
                : prev.includes(filter)
                ? prev.filter(f => f !== filter)
                : [...prev, filter]
            );
          }
        }} />

        {/* Section Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">📍 Nearby Parking</h2>
            <p className="text-slate-400 text-sm">{filteredAndSortedParkings.length} Spots Available</p>
          </div>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-all">
            ↕️ Sort: Distance
          </button>
        </div>

        {/* Parking Cards Grid */}
        {filteredAndSortedParkings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedParkings.map(parking => (
              <ParkingCard
                key={parking.id}
                parking={parking}
                onClick={() => handleCardClick(parking)}
                isFavorite={favorites.includes(parking.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No parking spots match your filters</p>
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedParking && (
        <AdvancedBookingModal
          parking={selectedParking}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onBooking={handleBooking}
        />
      )}

      {/* Footer */}
      <footer className="relative border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-3">Product</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">How it works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Safety</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3">Company</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3">Support</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3">Legal</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
            <p>© 2024 ParkEzy. Made with ♥ for urban parking. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdvancedParkingApp;
