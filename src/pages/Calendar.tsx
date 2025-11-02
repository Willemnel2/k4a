import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import OrderForm from '../components/OrderForm';

const Calendar = () => {
  const { orders, loading } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();

  const daysInMonth = lastDayOfMonth.getDate();
  const daysFromPrevMonth = firstDayOfWeek;
  const totalCells = Math.ceil((daysInMonth + daysFromPrevMonth) / 7) * 7;

  const calendarDays = useMemo(() => {
    const days = [];
    
    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth - 1, 0);
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      days.push({
        date: new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(currentYear, currentMonth, day),
        isCurrentMonth: true,
      });
    }
    
    // Next month days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(currentYear, currentMonth + 1, day),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentYear, currentMonth, daysInMonth, daysFromPrevMonth, totalCells]);

  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.installation_date);
      return orderDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentYear, currentMonth + (direction === 'next' ? 1 : -1), 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-primary-500';
      case 'in_progress': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedDate(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-2">View installation schedule</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Order
        </button>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-4 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((day, index) => {
            const dayOrders = getOrdersForDate(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(day.date)}
                className={`min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary-50 ${
                  day.isCurrentMonth 
                    ? 'bg-white border-gray-200 hover:border-primary-300' 
                    : 'bg-gray-50 border-gray-100 text-gray-400'
                } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? 'text-primary-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayOrders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className={`text-xs p-1 rounded text-white truncate ${getStatusColor(order.status)}`}
                      title={`${order.title} - ${order.client?.name}`}
                    >
                      {order.title}
                    </div>
                  ))}
                  {dayOrders.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayOrders.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Form Modal */}
      {showForm && (
        <OrderForm
          order={null}
          initialDate={selectedDate}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Calendar;