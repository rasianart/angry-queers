import React from 'react';

const About: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-6xl mx-auto px-6'>
        <div className='text-center mb-8'>
          <h2 className='text-3xl font-thin text-gray-800 mb-4'>
            A Digital Tool for Community Safety and Organizing
          </h2>
        </div>
        <div className='bg-white rounded-lg shadow-md p-8 space-y-8'>
          <div className='text-center mb-8'>
            <p className='text-lg text-gray-600 leading-relaxed'>
              Angry Queers is a community-driven platform designed to help organizers,
              volunteers, and community members coordinate mutual aid and build stronger 
              networks of care and protection.
            </p>
          </div>

          <div className='space-y-6'>
            <div className='border-l-4 border-green-500 pl-6'>
              <h3 className='text-xl font-normal text-gray-800 mb-3'>
                Our Mission
              </h3>
              <p className='text-gray-600 leading-relaxed'>
                We believe communities are safer when they're connected,
                informed, and prepared. This platform provides practical tools
                to help you protect vulnerable community members, coordinate
                grassroots responses, and build the infrastructure needed for
                effective mutual aid and community defense.
              </p>
            </div>

            <div className='bg-gray-50 p-6 rounded-lg'>
              <h3 className='text-xl font-normal text-gray-800 mb-4'>
                Platform Features
              </h3>
              <p className='text-gray-600 mb-4'>
                Angry Queers combines multiple tools into one integrated platform:
              </p>
              <div className='grid md:grid-cols-2 gap-4'>
                <div className='bg-white p-4 rounded-lg border border-gray-200'>
                  <h4 className='font-semibold text-gray-800 mb-1'>
                    Canvas Planning
                  </h4>
                  <p className='text-sm text-gray-600'>
                    Coordinate door-to-door canvassing campaigns. Schedule
                    sessions, invite partners, track materials, and manage
                    expiring canvas areas with visual map markers.
                  </p>
                </div>

                <div className='bg-white p-4 rounded-lg border border-gray-200'>
                  <h4 className='font-semibold text-gray-800 mb-1'>
                    Community Events
                  </h4>
                  <p className='text-sm text-gray-600'>
                    Discover and share community events, workshops, and
                    gatherings. Connect with local organizing efforts and build
                    solidarity.
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-6'>
              <div>
                <h3 className='text-xl font-normal text-gray-800 mb-3'>
                  How to Use the Platform
                </h3>
                <div className='space-y-4'>
                  <div className='bg-blue-50 p-4 rounded-lg'>
                    <h4 className='font-semibold text-gray-800 mb-2'>
                      For Community Members
                    </h4>
                    <ul className='list-disc list-inside text-gray-600 space-y-1 text-sm'>
                      <li>Find and attend local organizing events</li>
                      <li>View canvas planning locations and activities</li>
                    </ul>
                  </div>

                  <div className='bg-green-50 p-4 rounded-lg'>
                    <h4 className='font-semibold text-gray-800 mb-2'>
                      For Organizers & Volunteers
                    </h4>
                    <ul className='list-disc list-inside text-gray-600 space-y-1 text-sm'>
                      <li>
                        Plan and coordinate canvassing campaigns with partners
                      </li>
                      <li>Track materials and notes for organizing sessions</li>
                      <li>
                        Receive email invitations when added to canvas campaigns
                      </li>
                      <li>Manage event details and attendee information</li>
                    </ul>
                  </div>

                  <div className='bg-purple-50 p-4 rounded-lg'>
                    <h4 className='font-semibold text-gray-800 mb-2'>
                      For Admins
                    </h4>
                    <ul className='list-disc list-inside text-gray-600 space-y-1 text-sm'>
                      <li>
                        Manage user access and permissions through invite codes
                      </li>
                      <li>View all canvas markers and organizing activity</li>
                      <li>
                        Coordinate community organizing and mutual aid efforts
                      </li>
                      <li>
                        Access donation records and volunteer signup data
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-xl font-normal text-gray-800 mb-3'>
                  Getting Started
                </h3>
                <div className='bg-gray-50 p-6 rounded-lg space-y-3'>
                  <div className='flex items-start gap-3'>
                    <span className='flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold'>
                      1
                    </span>
                    <div>
                      <p className='text-gray-700 font-medium'>
                        Create an Account
                      </p>
                      <p className='text-sm text-gray-600'>
                        You'll need an invite link from a current member or
                        organizer to join. Once you have your invite code, sign
                        up using email or Google OAuth.
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <span className='flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold'>
                      2
                    </span>
                    <div>
                      <p className='text-gray-700 font-medium'>
                        Explore the Platform
                      </p>
                      <p className='text-sm text-gray-600'>
                        Browse canvas planning and events in your community
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <span className='flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold'>
                      3
                    </span>
                    <div>
                      <p className='text-gray-700 font-medium'>Get Involved</p>
                      <p className='text-sm text-gray-600'>
                        Join canvas campaigns, attend events, and contribute to
                        the community
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-xl font-normal text-gray-800 mb-3'>
                  Key Features Explained
                </h3>
                <div className='space-y-3'>
                  <details className='bg-white border border-gray-200 rounded-lg p-4'>
                    <summary className='font-semibold text-gray-800 cursor-pointer'>
                      Canvas Planning & Coordination
                    </summary>
                    <div className='mt-3 text-sm text-gray-600 space-y-2'>
                      <p>
                        The Canvas page allows organizers to plan door-to-door
                        campaigns with precision. Click on the map to set a
                        canvas area, choose date/time, duration, and invite
                        partners to join you.
                      </p>
                      <p>
                        Partners receive email notifications when added to
                        campaigns. You can track materials needed (literature,
                        snacks, clipboards, etc.), add custom materials, and
                        include notes for your team.
                      </p>
                      <p>
                        Canvas markers show different colors: green for your
                        active markers, blue for campaigns you're invited to,
                        and gray for expired sessions. Toggle expired markers
                        on/off to declutter your map.
                      </p>
                    </div>
                  </details>

                  <details className='bg-white border border-gray-200 rounded-lg p-4'>
                    <summary className='font-semibold text-gray-800 cursor-pointer'>
                      User Roles & Permissions
                    </summary>
                    <div className='mt-3 text-sm text-gray-600 space-y-2'>
                      <p>
                        <strong>Basic Users:</strong> Can attend events and 
                        participate in canvas campaigns they're invited to.
                      </p>
                      <p>
                        <strong>Admins:</strong> Full platform access including
                        user management, viewing all canvas markers (not just
                        their own), and managing invite codes.
                      </p>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            <div className='bg-gray-100 p-6 rounded-lg border-l-4 border-green-600'>
              <h3 className='text-xl font-normal text-gray-800 mb-3'>
                Built for Community, By Community
              </h3>
              <p className='text-gray-600 leading-relaxed mb-3'>
                This platform is designed with organizers' real needs in mind.
                From coordinating weekend canvassing sessions to responding to
                immigration enforcement, every feature is built to make
                community organizing more effective and accessible.
              </p>
              <p className='text-gray-600 leading-relaxed'>
                We're committed to creating technology that strengthens
                communities, protects vulnerable populations, and builds
                networks of mutual aid and solidarity. Your safety, privacy, and
                autonomy are our top priorities.
              </p>
            </div>

            <div className='text-center text-sm text-gray-500 mt-8'>
              <p>
                Questions, feedback, or need help? Contact your platform
                administrator or reach out through your organizing network.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
