import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../../contexts/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  organizer: string;
  contact: string; // legacy field (backend may return contact)
  contact_email?: string; // preferred field name in form and backend
  maxAttendees?: number;
  currentAttendees?: number;
  isVirtual: boolean;
  virtualLink?: string;
  createdAt: string;
}

interface EventsCalendarProps {}

const EventsCalendar: React.FC<EventsCalendarProps> = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    category: '',
    organizer: '',
    contact_email: '',
    max_attendees: '',
    is_virtual: false,
    virtual_link: '',
  });

  // Local pickers state
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [eventTime, setEventTime] = useState<Date | null>(null);
  // Google Places Autocomplete state for location
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [locationSuggestions, setLocationSuggestions] = useState<
    Array<{ description: string; place_id: string }>
  >([]);
  const [placesLoading, setPlacesLoading] = useState<boolean>(false);
  const [showLocationDropdown, setShowLocationDropdown] =
    useState<boolean>(false);

  // Debounced autocomplete lookup
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      const q = locationQuery.trim();
      if (q.length < 3) {
        setLocationSuggestions([]);
        return;
      }
      try {
        setPlacesLoading(true);
        const res = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        // Expecting data.predictions like Google API; normalize
        const predictions = (data.predictions || data.results || []).map(
          (p: any) => ({
            description: p.description || p.formatted_address || p.name,
            place_id: p.place_id || p.id || '',
          })
        );
        setLocationSuggestions(predictions);
      } catch (_) {
        // no-op
      } finally {
        setPlacesLoading(false);
      }
    };
    const t = setTimeout(run, 250);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [locationQuery]);

  const categories = [
    { value: 'all', label: 'All Events' },
    { value: 'mutual-aid', label: 'Mutual Aid' },
    { value: 'community-defense', label: 'Community Defense' },
    { value: 'education', label: 'Education & Training' },
    { value: 'crisis-support', label: 'Crisis Support' },
    { value: 'gathering', label: 'Community Gathering' },
    { value: 'legal', label: 'Legal Aid' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Build payload with formatted date/time from pickers (fallback to strings if needed)
      const payload = {
        ...formData,
        event_date: eventDate
          ? new Date(eventDate).toISOString().split('T')[0]
          : formData.event_date,
        event_time: eventTime
          ? new Date(eventTime).toTimeString().split(' ')[0]
          : formData.event_time,
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const result = await response.json();
      console.log('Event created:', result);

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        category: '',
        organizer: '',
        contact_email: '',
        max_attendees: '',
        is_virtual: false,
        virtual_link: '',
      });
      setEventDate(null);
      setEventTime(null);
      setShowAddEvent(false);

      // Refresh events list
      fetchEvents();
    } catch (err) {
      console.error('Error creating event:', err);
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create event'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filterCategory === 'all') return true;
    return event.category === filterCategory;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'mutual-aid': 'bg-green-100 text-green-800',
      'community-defense': 'bg-red-100 text-red-800',
      education: 'bg-blue-100 text-blue-800',
      'crisis-support': 'bg-orange-100 text-orange-800',
      gathering: 'bg-purple-100 text-purple-800',
      legal: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    const categoryObj = categories.find(cat => cat.value === category);
    return categoryObj?.label || 'Other';
  };

  const getContactEmail = (e: Event) => e.contact_email || e.contact || '';

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-3 text-gray-600'>Loading events...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-red-700'>
            <p>⚠️ {error}</p>
            <button
              onClick={fetchEvents}
              className='mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-6xl mx-auto px-6'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-thin text-gray-800 mb-2'>
            Community Events Calendar
          </h1>
          <p className='text-gray-600'>
            Stay connected with mutual aid events, community gatherings, and
            support activities in Chicago
          </p>
        </div>

        {/* Controls */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <div className='flex flex-col md:flex-row gap-4 items-center'>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            {user && user.user_type === 'admin' ? (
              <button
                onClick={() => setShowAddEvent(true)}
                className='button-pink text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors'
              >
                Add Event
              </button>
            ) : (
              <div className='bg-yellow-50 border border-yellow-200 rounded px-4 py-2 text-sm text-gray-700'>
                <p className='font-medium'>
                  {!user
                    ? 'Log in to add events'
                    : 'Only administrators can add events'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Events List */}
        <div className='space-y-4'>
          {filteredEvents.length === 0 ? (
            <div className='bg-white rounded-lg shadow-md p-8 text-center'>
              <div className='text-gray-400 mb-4'>
                <svg
                  className='w-16 h-16 mx-auto'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No events found
              </h3>
              <p className='text-gray-500 mb-4'>
                {filterCategory === 'all'
                  ? 'No events are scheduled at this time.'
                  : `No ${getCategoryLabel(filterCategory).toLowerCase()} events found.`}
              </p>
              {user && user.user_type === 'admin' ? (
                <button
                  onClick={() => setShowAddEvent(true)}
                  className='button-pink text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors'
                >
                  Be the first to add an event
                </button>
              ) : (
                <p className='text-sm text-gray-500'>
                  {!user
                    ? 'Log in to add the first event'
                    : 'Only administrators can add events'}
                </p>
              )}
            </div>
          ) : (
            filteredEvents.map(event => (
              <div
                key={event.id}
                className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
              >
                <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h3 className='text-xl font-semibold text-gray-800'>
                        {event.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          event.category
                        )}`}
                      >
                        {getCategoryLabel(event.category)}
                      </span>
                    </div>

                    <p className='text-gray-600 mb-4'>{event.description}</p>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                      <div className='flex items-center gap-2'>
                        <svg
                          className='w-4 h-4 text-gray-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                          />
                        </svg>
                        <span className='text-gray-600'>
                          {formatDate(event.date)} at {formatTime(event.time)}
                        </span>
                      </div>

                      <div className='flex items-center gap-2'>
                        <svg
                          className='w-4 h-4 text-gray-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                          />
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                          />
                        </svg>
                        <span className='text-gray-600'>
                          {event.isVirtual ? 'Virtual Event' : event.location}
                        </span>
                      </div>

                      <div className='flex items-center gap-2'>
                        <svg
                          className='w-4 h-4 text-gray-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                          />
                        </svg>
                        <span className='text-gray-600'>
                          Organized by {event.organizer}
                        </span>
                      </div>

                      {event.maxAttendees && (
                        <div className='flex items-center gap-2'>
                          <svg
                            className='w-4 h-4 text-gray-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                            />
                          </svg>
                          <span className='text-gray-600'>
                            {event.currentAttendees || 0} / {event.maxAttendees}{' '}
                            attendees
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='flex flex-col gap-2'>
                    {event.isVirtual && event.virtualLink && (
                      <a
                        href={event.virtualLink}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 transition-colors text-center'
                      >
                        Join Virtual Event
                      </a>
                    )}
                    {getContactEmail(event) ? (
                      <a
                        href={`mailto:${getContactEmail(event)}?subject=${encodeURIComponent(
                          `Inquiry about ${event.title}`
                        )}`}
                        className='px-4 py-2 button-pink text-white rounded-md  transition-colors text-center'
                      >
                        Contact Organizer
                      </a>
                    ) : (
                      <button
                        className='px-4 py-2 button-pink text-white rounded-md cursor-not-allowed'
                        disabled
                        title='No contact email provided'
                      >
                        Contact Organizer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Event Modal */}
        {showAddEvent && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
              <h3 className='text-xl font-semibold mb-4'>
                Add Community Event
              </h3>

              {submitError && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700'>
                  <p>⚠️ {submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Event Title <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      name='title'
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Enter event title'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Category <span className='text-red-500'>*</span>
                    </label>
                    <select
                      name='category'
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value=''>Select a category</option>
                      <option value='mutual-aid'>Mutual Aid</option>
                      <option value='community-defense'>
                        Community Defense
                      </option>
                      <option value='education'>Education</option>
                      <option value='crisis-support'>Crisis Support</option>
                      <option value='gathering'>Gathering</option>
                      <option value='legal'>Legal</option>
                      <option value='other'>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Description <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    name='description'
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Describe your event...'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Event Date <span className='text-red-500'>*</span>
                    </label>
                    <DatePicker
                      selected={eventDate}
                      onChange={(date: Date | null) => setEventDate(date)}
                      dateFormat='yyyy-MM-dd'
                      minDate={new Date()}
                      placeholderText='Select event date'
                      className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Event Time <span className='text-red-500'>*</span>
                    </label>
                    <DatePicker
                      selected={eventTime}
                      onChange={(date: Date | null) => setEventTime(date)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption='Time'
                      dateFormat='HH:mm'
                      placeholderText='Select event time'
                      className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div className='relative'>
                  <label className='block text-sm font-medium mb-1'>
                    Location <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='location'
                    value={locationQuery || formData.location}
                    onChange={e => {
                      setLocationQuery(e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        location: e.target.value,
                      }));
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    required
                    autoComplete='off'
                    className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Search address or place'
                  />
                  {showLocationDropdown &&
                    (locationSuggestions.length > 0 || placesLoading) && (
                      <div className='absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto divide-y divide-gray-200'>
                        {placesLoading && (
                          <div className='px-3 py-2 text-sm text-black bg-white'>
                            Searching…
                          </div>
                        )}
                        {!placesLoading &&
                          locationSuggestions.map(s => (
                            <button
                              key={s.place_id + s.description}
                              type='button'
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  location: s.description,
                                }));
                                setLocationQuery(s.description);
                                setShowLocationDropdown(false);
                              }}
                              className='block w-full text-left px-3 py-2 text-sm bg-white text-black rounded-none hover:bg-gray-100 focus:bg-gray-100 focus:outline-none'
                            >
                              {s.description}
                            </button>
                          ))}
                      </div>
                    )}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Organizer <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      name='organizer'
                      value={formData.organizer}
                      onChange={handleInputChange}
                      required
                      className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Organization or individual name'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Contact Email <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='email'
                      name='contact_email'
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      required
                      className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='contact@example.org'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Maximum Attendees
                  </label>
                  <input
                    type='number'
                    name='max_attendees'
                    value={formData.max_attendees}
                    onChange={handleInputChange}
                    min='1'
                    className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Leave empty for unlimited'
                  />
                </div>

                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    name='is_virtual'
                    checked={formData.is_virtual}
                    onChange={handleInputChange}
                    className='rounded'
                  />
                  <label className='text-sm font-medium'>
                    This is a virtual event
                  </label>
                </div>

                {formData.is_virtual && (
                  <div>
                    <label className='block text-sm font-medium mb-1'>
                      Virtual Event Link
                    </label>
                    <input
                      type='url'
                      name='virtual_link'
                      value={formData.virtual_link}
                      onChange={handleInputChange}
                      className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='https://zoom.us/j/... or https://meet.google.com/...'
                    />
                  </div>
                )}

                <div className='flex gap-2 pt-4'>
                  <button
                    type='submit'
                    disabled={submitting}
                    className='px-6 py-2 button-pink text-white rounded-md font-medium disabled:opacity-50 focus:outline-none focus:ring-0'
                  >
                    {submitting ? 'Creating Event...' : 'Create Event'}
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowAddEvent(false)}
                    className='px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-600'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsCalendar;
