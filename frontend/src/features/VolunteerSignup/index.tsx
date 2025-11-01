import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const timeSlots = [
  'Early Mornings (6:00 AM - 8:00 AM)',
  'Mornings 1 (8:00 AM - 10:00 AM)',
  'Mornings 2 (10:00 AM - 12:00 PM)',
  'Day Time 1 (12:00 PM - 2:00 PM)',
  'Day Time 2 (2:00 PM - 4:00 PM)',
  'Day Time 3 (4:00 PM - 6:00 PM)',
  'Night Time 1 (6:00 PM - 8:00 PM)',
  'Night Time 2 (8:00 PM -10:00 PM)',
];

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const roleOptions = [
  'Block Monitor / Visible Presence',
  'Artist / Entertainer',
  'Support Volunteer',
  'Medic / First Aid',
  'Logistics',
  'Translator',
];

const VolunteerSignup: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    pronouns: '',
    mobile_number: '',
    has_signal: false,
    signal_username: '',
    neighborhood: '',
    roles: [] as string[],
    availability: {} as Record<string, string[]>,
    trainings_completed: '',
    consent_signal: false,
    accessibility_needs: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : prev.roles.length < 4
          ? [...prev.roles, role]
          : prev.roles;
      return { ...prev, roles };
    });
  };

  const handleAvailabilityChange = (day: string, timeSlot: string) => {
    setFormData(prev => {
      const dayAvailability = prev.availability[day] || [];
      const newDayAvailability = dayAvailability.includes(timeSlot)
        ? dayAvailability.filter(ts => ts !== timeSlot)
        : [...dayAvailability, timeSlot];

      return {
        ...prev,
        availability: {
          ...prev.availability,
          [day]: newDayAvailability,
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Name is required');
      setSubmitting(false);
      return;
    }

    if (!formData.neighborhood.trim()) {
      setError('Neighborhood is required');
      setSubmitting(false);
      return;
    }

    if (formData.roles.length === 0) {
      setError('Please select at least one role');
      setSubmitting(false);
      return;
    }

    if (formData.roles.length > 4) {
      setError('Maximum 4 roles allowed');
      setSubmitting(false);
      return;
    }

    if (Object.keys(formData.availability).length === 0) {
      setError('Please select at least one availability time slot');
      setSubmitting(false);
      return;
    }

    if (!formData.trainings_completed.trim()) {
      setError('Please specify relevant trainings completed');
      setSubmitting(false);
      return;
    }

    if (!formData.consent_signal) {
      setError('Signal consent is required');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/volunteers/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      setSuccess(true);
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError((err as Error).message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
        <div className='max-w-4xl mx-auto px-6 py-16'>
          <div className='bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center'>
            <h2 className='text-3xl font-thin text-gray-900 mb-4'>
              Thank You!
            </h2>
            <p className='text-gray-700 mb-6'>
              Your volunteer signup has been submitted successfully. We'll be in
              touch soon!
            </p>
            <button
              onClick={() => navigate('/')}
              className='button-pink text-white px-8 py-3 rounded-md transition-colors font-thin hover:text-white'
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
      <div className='max-w-4xl mx-auto px-6 py-16'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-thin text-gray-900 mb-4'>
            Block Guardians and Faeries
          </h1>
          <div className='space-y-4 text-gray-700 leading-relaxed max-w-2xl mx-auto'>
            <p>
              Join Angry Queers in building a joyful, visible neighborhood
              presence to protect our undocumented neighbors against ICE. We
              coordinate with ICIRR's Family Support Network.
            </p>
            <p className='font-thin text-lg'>Queer led - everyone welcomed.</p>
            <p className='text-2xl font-thin text-pink-600'>ABOLISH ICE</p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className='bg-white rounded-lg shadow-lg p-8 space-y-6'
        >
          {error && (
            <div className='bg-red-50 border border-red-300 rounded-lg p-4 text-red-700'>
              {error}
            </div>
          )}

          {/* 1. Name */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              1. Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              required
              className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500'
            />
          </div>

          {/* 2. Pronouns */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              2. Pronouns
            </label>
            <input
              type='text'
              name='pronouns'
              value={formData.pronouns}
              onChange={handleInputChange}
              className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500'
            />
          </div>

          {/* 3. Mobile Number */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              3. Mobile Number
            </label>
            <input
              type='tel'
              name='mobile_number'
              value={formData.mobile_number}
              onChange={handleInputChange}
              className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500'
            />
          </div>

          {/* 4. Signal */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              4. Signal
            </label>
            <label className='flex items-center space-x-2'>
              <input
                type='checkbox'
                name='has_signal'
                checked={formData.has_signal}
                onChange={handleInputChange}
                className='h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded'
              />
              <span className='text-gray-700'>I have Signal installed</span>
            </label>
          </div>

          {/* 5. Neighborhood */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              5. Neighborhood You'll Cover{' '}
              <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='neighborhood'
              value={formData.neighborhood}
              onChange={handleInputChange}
              required
              placeholder='e.g., Uptown, Andersonville, Rogers Park'
              className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500'
            />
          </div>

          {/* 6. Roles */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              6. What role can you do? <span className='text-red-500'>*</span>
              <span className='text-sm text-gray-600 ml-2'>
                (maximum 4 answers)
              </span>
            </label>
            <div className='space-y-2'>
              {roleOptions.map(role => (
                <label key={role} className='flex items-start space-x-2'>
                  <input
                    type='checkbox'
                    checked={formData.roles.includes(role)}
                    onChange={() => handleRoleChange(role)}
                    disabled={
                      !formData.roles.includes(role) &&
                      formData.roles.length >= 4
                    }
                    className='h-4 w-4 mt-1 text-pink-600 focus:ring-pink-500 border-gray-300 rounded'
                  />
                  <span className='text-gray-700'>{role}</span>
                </label>
              ))}
            </div>
            <p className='text-sm text-gray-600 mt-2'>
              Selected: {formData.roles.length}/4
            </p>
          </div>

          {/* 7. Availability */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              7. Availability? <span className='text-red-500'>*</span>
            </label>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse border border-gray-300 text-sm'>
                <thead>
                  <tr className='bg-gray-100'>
                    <th className='border border-gray-300 p-2 text-left'>
                      Day
                    </th>
                    {timeSlots.map(slot => (
                      <th
                        key={slot}
                        className='border border-gray-300 p-2 text-center min-w-[100px]'
                      >
                        {slot.split('(')[0].trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map(day => (
                    <tr key={day}>
                      <td className='border border-gray-300 p-2 font-medium'>
                        {day}
                      </td>
                      {timeSlots.map(slot => (
                        <td
                          key={`${day}-${slot}`}
                          className='border border-gray-300 p-2 text-center'
                        >
                          <input
                            type='checkbox'
                            checked={
                              formData.availability[day]?.includes(slot) ||
                              false
                            }
                            onChange={() => handleAvailabilityChange(day, slot)}
                            className='h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded'
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 8. Trainings */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              8. Relevant Trainings Completed{' '}
              <span className='text-red-500'>*</span>
            </label>
            <textarea
              name='trainings_completed'
              value={formData.trainings_completed}
              onChange={handleInputChange}
              required
              rows={3}
              placeholder='List any relevant trainings you have completed'
              className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500'
            />
          </div>

          {/* 9. Consent */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              9. Do you consent to receive encrypted messages (Signal) from our
              coordination channel? <span className='text-red-500'>*</span>
            </label>
            <label className='flex items-center space-x-2'>
              <input
                type='checkbox'
                name='consent_signal'
                checked={formData.consent_signal}
                onChange={handleInputChange}
                required
                className='h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded'
              />
              <span className='text-gray-700'>Yes, I consent</span>
            </label>
          </div>

          {/* 10. Signal Username */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              10. Signal Username
            </label>
            <input
              type='text'
              name='signal_username'
              value={formData.signal_username}
              onChange={handleInputChange}
              placeholder='Your Signal username (if applicable)'
              className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500'
            />
          </div>

          {/* 11. Accessibility Needs */}
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>
              11. Accessibility Needs?
            </label>
            <textarea
              name='accessibility_needs'
              value={formData.accessibility_needs}
              onChange={handleInputChange}
              rows={3}
              placeholder='Please let us know of any accessibility needs or accommodations'
              className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500'
            />
          </div>

          {/* Submit Button */}
          <div className='pt-4'>
            <button
              type='submit'
              disabled={submitting}
              className='w-full button-pink text-white px-8 py-4 rounded-md transition-colors font-thin text-lg hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {submitting ? 'Submitting...' : 'Submit Volunteer Signup'}
            </button>
          </div>

          {/* Required Fields Note */}
          <p className='text-sm text-gray-600 text-center'>
            <span className='text-red-500'>*</span> Required fields
          </p>
        </form>
      </div>
    </div>
  );
};

export default VolunteerSignup;
