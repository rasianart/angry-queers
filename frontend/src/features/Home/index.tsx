import React from 'react';
import { Link } from 'react-router-dom';
import angryQueersLogo from '../../assets/angryqueers.webp';

const Home: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
      {/* Hero Section */}
      <div className='max-w-6xl mx-auto px-6 py-16'>
        <div className='text-center mb-16'>
          <div className='mb-2 flex justify-center'>
            <img src={angryQueersLogo} alt='Angry Queers' className='h-24' />
          </div>
          <p className='text-lg text-gray-500 mb-6'>
            Resource Organization & Outreach Toolkit
          </p>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            Building strong, interconnected networks of care and protection for
            Chicago communities. Organize events, coordinate outreach, and
            strengthen the bonds that keep our neighborhoods safe.
          </p>
        </div>

        {/* Feature Cards */}
        <div className='grid md:grid-cols-2 gap-6 mb-16'>
          {/* Canvas */}
          <Link
            to='/canvas'
            className='bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-8 border-t-4 border-purple-200'
          >
            <h3 className='text-xl font-semibold text-gray-800 mb-3'>
              Canvas Planning
            </h3>
            <p className='text-gray-600'>
              Coordinate neighborhood outreach by mapping canvassing areas with
              time-based coverage tracking.
            </p>
          </Link>

          {/* Events */}
          <Link
            to='/events'
            className='bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-8 border-t-4 border-green-200'
          >
            <h3 className='text-xl font-semibold text-gray-800 mb-3'>
              Community Events
            </h3>
            <p className='text-gray-600'>
              Find and organize mutual aid events, workshops, and community
              gatherings.
            </p>
          </Link>
        </div>

        {/* Call to Action */}
        <div className='bg-green-50 rounded-lg p-8 text-center border-l-4 border-green-500'>
          <h2 className='text-2xl font-semibold text-gray-800 mb-4'>
            Why Community Networks Matter
          </h2>
          <p className='text-gray-700 mb-6 max-w-3xl mx-auto'>
            When external forces threaten our communities, the most vulnerable
            among us need more than solidarity statements. They need strong,
            practical networks of care and protection woven throughout every
            neighborhood.
          </p>
          <Link
            to='/about'
            className='inline-block button-green text-white px-8 py-3 rounded-md transition-colors font-medium hover:text-white'
          >
            Learn More About Our Mission
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Home;
