import React from 'react';
import angryQueersLogo from '../../assets/angryqueers.webp';

const Home: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
      <div className='max-w-6xl mx-auto px-6 py-16'>
        {/* Logo */}
        <div className='text-center mb-12'>
          <div className='mb-8 flex justify-center'>
            <img src={angryQueersLogo} alt='Angry Queers' className='h-48' />
          </div>
          <div className='flex justify-center mb-8'>
            <hr className='w-32 border-t-2 border-gray-300' />
          </div>
        </div>

        {/* About Section */}
        <div className='mb-12'>
          <h2 className='text-3xl font-semibold text-gray-900 mb-6 text-center'>
            About Angry Queers
          </h2>

          <div className='space-y-6 text-gray-700 leading-relaxed'>
            <div>
              <h3 className='text-2xl font-thin text-gray-900 mb-4'>
                Our Mission
              </h3>
              <p className='mb-4'>
                We are Angry Queers, a grassroots collective of queer
                Chicagoans. We operate on the fundamental belief that
                undocumented and queer liberations are intertwined and that
                solidarity requires both material and embodied courage. In
                response to the ICE occupation, we build power through a simple,
                direct model: mutual aid and community defense.
              </p>
            </div>

            <p>
              Our ambitious goal is to provide transformative direct cash grants
              to undocumented families across Chicago. The goal is to provide a
              tangible shield; intended to cover rent, food, medicine, and other
              essential needs for an extended period. Providing real breathing
              room and security.
            </p>

            <p>
              Our process is built on trust and safety. All requests are
              identified and vetted through the undocumented community via
              direct word-of-mouth, ensuring aid reaches those most in need
              while centering community knowledge. We then fulfill these
              requests with absolute discretion: no applicant data is ever
              stored digitally, protecting our neighbors in a landscape of
              surveillance.
            </p>

            <p className='text-xl font-thin text-gray-900 text-center my-8'>
              This is solidarity, not charity.
            </p>

            <p>
              In parallel, we mobilize physical presence that guards our
              neighborhoods and stands ready to activate against ICE. We are
              building a city where care is direct, defense is communal and our
              queer joy is a source of safety for all of our neighbors.
            </p>
          </div>
        </div>

        {/* Get Involved Section */}
        <div className='bg-pink-50 rounded-lg p-8 mb-12 border-l-4 border-pink-500'>
          <h2 className='text-3xl font-thin text-gray-900 mb-6'>
            Get involved! Faeries Hold Down The Block
          </h2>

          <p className='text-gray-700 leading-relaxed mb-6'>
            We're reclaiming our streets: visible, joyous, and ready to protect
            our undocumented neighbors. Sing, perform, stand, or hold a phone
            and whistle— we need everyone. Sign up to watch a block or perform:
          </p>

          <p className='text-gray-700 leading-relaxed mb-6'>
            Our neighborhoods belong to all of us. Join the Angry Queer Block
            Guardians — a community of neighbors who will hold visible, joyful
            space across Uptown, North Halsted (Boystown), Andersonville,
            Edgewater and Rogers Park to protect and accompany our undocumented
            neighbors. We coordinate with ICIRR's Family Support Network for
            reporting and legal support. Volunteers of all abilities are
            welcome: performers, medics, de-escalators, logistics — every role
            matters.
          </p>

          <div className='space-y-4 mb-8'>
            <div className='bg-white p-4 rounded-lg'>
              <h4 className='font-thin text-gray-900 mb-2'>
                Block Monitor / Visible Presence
              </h4>
              <p className='text-sm text-gray-700'>
                Walk or stand visibly, greet neighbors, be a calm face. Share
                hotline info cards and other Know Your Rights information. If
                you observe activity you believe is ICE, call the ICIRR Family
                Support Hotline immediately and relay info to organizers
                following established protocols.
              </p>
            </div>

            <div className='bg-white p-4 rounded-lg'>
              <h4 className='font-thin text-gray-900 mb-2'>
                Artist / Entertainer
              </h4>
              <p className='text-sm text-gray-700'>
                Bring music, art, performance — make presence joyful and
                welcoming. Coordinate safe performance spots (sidewalks, stoops
                — its our space!).
              </p>
            </div>

            <div className='bg-white p-4 rounded-lg'>
              <h4 className='font-thin text-gray-900 mb-2'>
                Support Volunteer
              </h4>
              <p className='text-sm text-gray-700'>
                Trained volunteers who can help calm situations and support
                neighbors emotionally.
              </p>
            </div>

            <div className='bg-white p-4 rounded-lg'>
              <h4 className='font-thin text-gray-900 mb-2'>
                Medic / First Aid
              </h4>
              <p className='text-sm text-gray-700'>
                Provide basic care for minor injuries; carry a small kit and
                volunteer card.
              </p>
            </div>

            <div className='bg-white p-4 rounded-lg'>
              <h4 className='font-thin text-gray-900 mb-2'>Logistics</h4>
              <p className='text-sm text-gray-700'>
                Bring water, whistles, snacks, and help set up shifts.
              </p>
            </div>

            <div className='bg-white p-4 rounded-lg'>
              <h4 className='font-thin text-gray-900 mb-2'>Translator</h4>
              <p className='text-sm text-gray-700'>
                Help communicate with neighbors in native languages.
              </p>
            </div>
          </div>

          <div className='text-center'>
            <a
              href='https://forms.gle/your-signup-form-link'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block button-pink text-white px-8 py-3 rounded-md transition-colors font-thin hover:text-white'
            >
              Sign Up to Volunteer
            </a>
          </div>
        </div>

        {/* Donate Section */}
        <div className='bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-8 text-center border-2 border-pink-300'>
          <h2 className='text-3xl font-thin text-gray-900 mb-4'>Donate</h2>
          <p className='text-gray-700 mb-6 max-w-2xl mx-auto leading-relaxed'>
            Donate now to assist us in providing direct aid to our neighbors.
          </p>
          <a
            href='https://your-donation-link.com'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-block button-pink text-white px-8 py-3 rounded-md transition-colors font-thin text-lg hover:text-white'
          >
            Donate Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
