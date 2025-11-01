import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { useAuth } from '../../contexts/AuthContext';

interface ICEAlert {
  id: number;
  latitude: string;
  longitude: string;
  locationDescription?: string;
  alertType: 'raiding' | 'checkpoint' | 'surveillance' | 'other';
  description?: string;
  imageUrl?: string;
  reportedAt: string;
  expiresAt: string;
  verified: boolean;
  createdAt: string;
  verifiedByType?: 'admin' | 'rapid_response' | 'basic' | string;
}

const ICEAlerts: React.FC = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyLoading, setApiKeyLoading] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<ICEAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ICEAlert | null>(null);
  const [showReportForm, setShowReportForm] = useState<boolean>(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Map height calculation
  const mapHeight = useMemo(() => {
    const navigationHeight = 68;
    return `calc(100vh - ${navigationHeight}px)`;
  }, []);

  // Fetch Google Maps API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('/api/google-maps-key');
        if (!response.ok) {
          throw new Error('Failed to fetch API key');
        }
        const data = await response.json();
        setApiKey(data.apiKey);
      } catch (err) {
        console.error('Error fetching API key:', err);
        setError('Failed to load Google Maps API key');
      } finally {
        setApiKeyLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  // Fetch ICE alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ice-alerts', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch ICE alerts');
      }
      const data = await response.json();
      setAlerts(data.alerts || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching ICE alerts:', err);
      setError('Failed to load ICE alerts. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetchAlerts();
      // Refresh alerts every 2 minutes
      const interval = setInterval(fetchAlerts, 120000);
      return () => clearInterval(interval);
    }
  }, [apiKey, fetchAlerts]);

  const handleMapClick = useCallback(
    (event: any) => {
      if (!user) {
        alert('Please log in to report ICE activity');
        return;
      }

      let latLng = event.latLng;
      if (!latLng && event.detail && event.detail.latLng) {
        latLng = event.detail.latLng;
      }

      if (latLng) {
        let lat, lng;
        if (typeof latLng.lat === 'function') {
          lat = latLng.lat();
          lng = latLng.lng();
        } else if (latLng.lat !== undefined && latLng.lng !== undefined) {
          lat = latLng.lat;
          lng = latLng.lng;
        } else {
          return;
        }

        setSelectedPosition({ lat, lng });
        setShowReportForm(true);
      }
    },
    [user]
  );

  const getAlertTypeColor = (alertType: string, verified: boolean) => {
    if (!verified) return '#F59E0B'; // Amber for unverified

    switch (alertType) {
      case 'raiding':
        return '#DC2626'; // Red
      case 'checkpoint':
        return '#EF4444'; // Red-orange
      case 'surveillance':
        return '#F97316'; // Orange
      default:
        return '#64748B'; // Gray
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case 'raiding':
        return 'Raid';
      case 'checkpoint':
        return 'Checkpoint';
      case 'surveillance':
        return 'Surveillance';
      default:
        return 'Other';
    }
  };

  const handleVerifyAlert = useCallback(
    async (alertId: number, verified: boolean) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`/api/ice-alerts/${alertId}/verify`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ verified }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to verify alert');
        }

        // Refresh alerts
        fetchAlerts();

        // Update selected alert if it's the one being verified
        if (selectedAlert && selectedAlert.id === alertId) {
          setSelectedAlert({
            ...selectedAlert,
            verified,
            // If verifying to true, attribute to current user type immediately for UI
            verifiedByType: verified
              ? (user?.user_type as any) || selectedAlert.verifiedByType
              : selectedAlert.verifiedByType,
          });
        }
      } catch (err) {
        console.error('Error verifying alert:', err);
        alert(err instanceof Error ? err.message : 'Failed to verify alert');
      }
    },
    [fetchAlerts, selectedAlert, user?.user_type]
  );

  if (apiKeyLoading) {
    return (
      <div className='p-10 text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
        <p className='mt-4 text-gray-600'>Loading map...</p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className='p-10 text-center'>
        <p className='text-red-600'>Failed to load Google Maps API key</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col lg:flex-row' style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className='w-full lg:w-80 bg-white border-r border-gray-200 overflow-y-auto'>
        <div className='p-6'>
          <h2 className='text-xl font-thin text-gray-800 mb-2'>ICE Alerts</h2>
          <p className='text-sm text-gray-600 mb-4'>
            Real-time reports of ICE activity in Chicago. Click on the map to
            report new activity.
          </p>
          <p className='text-xs text-gray-700 mb-2'>
            For broader Know Your Rights information and community resources
            from the Illinois Coalition for Immigrant and Refugee Rights
            (ICIRR), see their resources page below. The PDF link contains
            guidance for interactions with immigration officers and planning
            family safety.
          </p>
          <a
            href='https://www.icirr.org/resources'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center text-xs text-blue-700 hover:text-blue-900 underline mb-3'
          >
            ICIRR Immigrant Community Resources
          </a>
          <a
            href='https://www.icirr.org/_files/ugd/aec63a_a9b21961198a4d7db3df2d97b9054b01.pdf'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center text-sm text-blue-700 hover:text-blue-900 underline'
          >
            Know Your Rights (ICIRR PDF)
          </a>

          {!user && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-yellow-800 text-sm'>
              ⚠️ Log in to report ICE activity
            </div>
          )}

          {/* SALUTE expandable guidance */}
          <div className='mb-4'>
            <button
              onClick={() => setShowReportForm(prev => prev)}
              className='hidden'
            />
          </div>

          {/* Expandable S.A.L.U.T.E. panel */}
          <SalutePanel />

          {user && (
            <button
              onClick={() => setShowReportForm(true)}
              className='w-full mb-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium'
            >
              + Report ICE Activity
            </button>
          )}

          {/* Legend moved to floating overlay on map */}

          {loading ? (
            <div className='text-center py-4'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto'></div>
              <span className='text-sm text-gray-600 mt-2 block'>
                Loading alerts...
              </span>
            </div>
          ) : error ? (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm'>
              ⚠️ {error}
            </div>
          ) : alerts.length === 0 ? (
            <div className='text-center py-4 text-gray-500 text-sm'>
              No active ICE alerts. Stay vigilant and report any activity you
              observe.
            </div>
          ) : (
            <div className='space-y-2'>
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`bg-white p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                    alert.verified ? 'border-red-300' : 'border-yellow-300'
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        alert.verified
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {alert.verified
                        ? alert.verifiedByType === 'rapid_response'
                          ? '✓ Verified (Rapid Response)'
                          : '✓ Verified'
                        : 'Unverified'}
                    </span>
                    <span className='text-xs text-gray-500'>
                      {getAlertTypeLabel(alert.alertType)}
                    </span>
                  </div>
                  <div className='text-xs text-gray-600 space-y-1'>
                    {alert.locationDescription && (
                      <div className='font-medium'>
                        {alert.locationDescription}
                      </div>
                    )}
                    {alert.description && (
                      <div className='line-clamp-2'>{alert.description}</div>
                    )}
                    {alert.imageUrl && (
                      <div className='mt-2'>
                        <img
                          src={alert.imageUrl}
                          alt='Attachment thumbnail'
                          className='h-16 w-16 object-cover rounded border'
                        />
                      </div>
                    )}
                    <div className='text-gray-500'>
                      {new Date(alert.reportedAt).toLocaleString()}
                    </div>
                    <div className='text-gray-400 text-xs'>
                      Expires: {new Date(alert.expiresAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className='flex-1 min-h-0'>
        <div className='map-container relative' style={{ height: mapHeight }}>
          <APIProvider apiKey={apiKey}>
            <Map
              mapId='ice-alerts-map'
              defaultCenter={{ lat: 41.8781, lng: -87.6298 }}
              defaultZoom={11}
              style={{
                width: '100%',
                height: '100%',
                cursor: user ? 'pointer' : 'default',
              }}
              gestureHandling='greedy'
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={true}
              zoomControl={true}
              onClick={handleMapClick}
            >
              {alerts.map(alert => (
                <AlertMarker
                  key={alert.id}
                  alert={alert}
                  color={getAlertTypeColor(alert.alertType, alert.verified)}
                  onMarkerClick={() => setSelectedAlert(alert)}
                />
              ))}

              {selectedAlert && (
                <AlertInfoWindow
                  alert={selectedAlert}
                  onClose={() => setSelectedAlert(null)}
                  onVerify={verified => {
                    handleVerifyAlert(selectedAlert.id, verified);
                  }}
                  isPrivileged={
                    user?.user_type === 'admin' ||
                    user?.user_type === 'rapid_response'
                  }
                  currentUserType={user?.user_type || null}
                />
              )}
            </Map>

            {/* Floating Legend (top-left) */}
            <div className='absolute top-4 left-4 z-10'>
              <div className='bg-white/90 backdrop-blur border border-gray-200 rounded-lg shadow p-3 text-xs text-gray-700'>
                <div className='font-semibold mb-2'>Legend</div>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='inline-flex items-center justify-center'>
                    <span className='w-3.5 h-3.5 rounded-full bg-red-600 inline-block border-2 border-white'></span>
                  </span>
                  <span>Verified alert</span>
                </div>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='inline-flex items-center justify-center'>
                    <span
                      className='w-3.5 h-3.5 rounded-full bg-red-600 inline-block border-2'
                      style={{ boxShadow: '0 0 0 2px #D4AF37' }}
                    ></span>
                  </span>
                  <span>Verified by Rapid Response</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='inline-flex items-center justify-center'>
                    <span className='w-3.5 h-3.5 rounded-full bg-amber-500 inline-block border-2 border-white'></span>
                  </span>
                  <span>Unverified (admins/rapid response only)</span>
                </div>
              </div>
            </div>
          </APIProvider>
        </div>
      </div>

      {/* Report Form Modal */}
      {showReportForm && (
        <ReportForm
          position={selectedPosition}
          onClose={() => {
            setShowReportForm(false);
            setSelectedPosition(null);
          }}
          onSuccess={() => {
            setShowReportForm(false);
            setSelectedPosition(null);
            fetchAlerts();
          }}
        />
      )}
    </div>
  );
};

// SALUTE Panel (expandable)
const SalutePanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className='mb-4'>
      <button
        onClick={() => setOpen(!open)}
        className='w-full text-left text-sm font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2 transition-colors border-2 border-gray-200'
        aria-expanded={open}
      >
        📣 Spread Information, Not Panic: Remember S.A.L.U.T.E.
        <span className='float-right text-gray-500'>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className='mt-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2'>
          <p className='text-gray-800'>
            Use these prompts when reporting sightings. Detailed, accurate
            information helps communities respond without unnecessary fear.
          </p>
          <ul className='list-disc list-inside space-y-1'>
            <li>
              <strong>S — Size & Strength:</strong> How many agents and
              vehicles? Any other agencies or local police present? Note counts
              and agencies involved.
            </li>
            <li>
              <strong>A — Activity & Action:</strong> What is happening (e.g.,
              traffic stop, targeting individuals, vehicles circling a school)?
              Be specific.
            </li>
            <li>
              <strong>L — Location:</strong> Exact place (home, school,
              business). Include cross streets and direction of travel if
              moving.
            </li>
            <li>
              <strong>U — Uniform:</strong> What are agents wearing (plain
              clothes, uniforms, vests, masks, hats)? What do badges/vests say?
            </li>
            <li>
              <strong>T — Time & Date:</strong> Record the exact time and date
              of the sighting. This is critical context.
            </li>
            <li>
              <strong>E — Equipment & Weapons:</strong> Note visible equipment
              (e.g., firearms, pepper spray, tear gas) and any use on people.
            </li>
          </ul>
          <p>
            You have the right to film in public spaces. Record from a safe
            distance and do not interfere. Report sightings to ICIRR’s Family
            Support Network Hotline: <strong>855-435-7693</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

// Alert Marker Component
const AlertMarker: React.FC<{
  alert: ICEAlert;
  color: string;
  onMarkerClick: () => void;
}> = ({ alert, color, onMarkerClick }) => {
  return (
    <AdvancedMarker
      position={{ lat: Number(alert.latitude), lng: Number(alert.longitude) }}
      onClick={onMarkerClick}
    >
      <div
        className='cursor-pointer'
        style={{
          boxShadow:
            alert.verified && alert.verifiedByType === 'rapid_response'
              ? '0 0 0 3px #D4AF37'
              : undefined,
          borderRadius: '9999px',
          padding:
            alert.verified && alert.verifiedByType === 'rapid_response'
              ? '2px'
              : 0,
          backgroundColor: 'transparent',
        }}
      >
        <div
          className='w-6 h-6 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white text-xs font-bold'
          style={{ backgroundColor: color }}
        >
          ⚠
        </div>
      </div>
    </AdvancedMarker>
  );
};

// Alert Info Window Component
const AlertInfoWindow: React.FC<{
  alert: ICEAlert;
  onClose: () => void;
  onVerify: (verified: boolean) => void;
  isPrivileged: boolean;
  currentUserType: 'admin' | 'rapid_response' | 'basic' | string | null;
}> = ({ alert, onClose, onVerify, isPrivileged, currentUserType }) => {
  console.log(alert.imageUrl);
  return (
    <InfoWindow
      position={{
        lat: Number(alert.latitude),
        lng: Number(alert.longitude),
      }}
      onCloseClick={onClose}
    >
      <div className='p-2 max-w-xs'>
        <h3 className='font-bold text-sm mb-2'>
          {getAlertTypeLabel(alert.alertType)}
        </h3>
        {alert.locationDescription && (
          <p className='text-sm text-gray-700 mb-1'>
            {alert.locationDescription}
          </p>
        )}
        {alert.description && (
          <p className='text-sm text-gray-600 mb-2'>{alert.description}</p>
        )}
        {alert.imageUrl && (
          <div className='mb-2'>
            <img
              src={alert.imageUrl}
              alt='Alert attachment'
              className='max-h-48 rounded border'
            />
          </div>
        )}
        <p className='text-xs text-gray-500 mb-1'>
          Reported: {new Date(alert.reportedAt).toLocaleString()}
        </p>
        <p className='text-xs text-gray-400 mb-2'>
          Expires: {new Date(alert.expiresAt).toLocaleString()}
        </p>
        <div className='flex items-center justify-between'>
          <span
            className={`text-xs px-2 py-1 rounded ${
              alert.verified
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {alert.verified
              ? alert.verifiedByType === 'rapid_response'
                ? '✓ Verified (Rapid Response)'
                : '✓ Verified'
              : '⚠️ Unverified'}
          </span>
          {isPrivileged && (
            <div className='flex gap-2'>
              {currentUserType === 'rapid_response' &&
              alert.verified &&
              alert.verifiedByType !== 'rapid_response' ? (
                <button
                  onClick={() => onVerify(true)}
                  className='text-xs px-2 py-1 rounded transition-colors bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                >
                  Verify (Rapid Response)
                </button>
              ) : (
                <button
                  onClick={() => {
                    onVerify(!alert.verified);
                  }}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    alert.verified
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {alert.verified ? 'Unverify' : 'Verify'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </InfoWindow>
  );
};

function getAlertTypeLabel(alertType: string): string {
  switch (alertType) {
    case 'raiding':
      return 'Raid';
    case 'checkpoint':
      return 'Checkpoint';
    case 'surveillance':
      return 'Surveillance';
    default:
      return 'Other';
  }
}

// Report Form Component
const ReportForm: React.FC<{
  position: { lat: number; lng: number } | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ position, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    locationDescription: '',
    alertType: 'other' as 'raiding' | 'checkpoint' | 'surveillance' | 'other',
    description: '',
    reportedAt: new Date().toISOString().slice(0, 16),
    durationHours: 4,
    imageUrl: '' as string,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    try {
      setUploadError(null);
      setUploading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please log in to upload images');
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Only JPG/PNG/WEBP images are allowed');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image too large (max 5 MB)');
      }
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/alert/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}) as any);
        throw new Error(e.error || 'Upload failed');
      }
      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!position) {
      setSubmitError('Please click on the map to set the alert location.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to submit alerts');
      }

      const reportedAtDate = new Date(formData.reportedAt);
      if (isNaN(reportedAtDate.getTime())) {
        throw new Error('Invalid date/time');
      }

      const response = await fetch('/api/ice-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: position.lat,
          longitude: position.lng,
          location_description: formData.locationDescription || null,
          alert_type: formData.alertType,
          description: formData.description || null,
          image_url: formData.imageUrl || null,
          reported_at: reportedAtDate.toISOString(),
          duration_hours: formData.durationHours,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit alert');
      }

      onSuccess();
    } catch (err) {
      console.error('Error submitting alert:', err);
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit alert'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
          <h3 className='text-xl font-semibold mb-4'>
            Authentication Required
          </h3>
          <p className='text-gray-600 mb-4'>
            Please log in to report ICE activity.
          </p>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-600'
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      onClick={onClose}
    >
      <div
        className='bg-white p-6 rounded-lg max-w-md w-full mx-4'
        onClick={e => e.stopPropagation()}
      >
        <h3 className='text-xl font-semibold mb-4'>Report ICE Activity</h3>

        {!position && (
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-yellow-800 text-sm'>
            Tip: Click on the map to choose the exact location for this alert.
          </div>
        )}

        {submitError && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700'>
            <p>⚠️ {submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          {position && (
            <div className='text-xs text-gray-600'>
              Selected Location: {position.lat.toFixed(5)},{' '}
              {position.lng.toFixed(5)}
            </div>
          )}
          <div>
            <label className='block text-sm font-medium mb-1'>
              Alert Type <span className='text-red-500'>*</span>
            </label>
            <select
              name='alertType'
              value={formData.alertType}
              onChange={e =>
                setFormData({ ...formData, alertType: e.target.value as any })
              }
              required
              className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
            >
              <option value='raiding'>Raid</option>
              <option value='checkpoint'>Checkpoint</option>
              <option value='surveillance'>Surveillance</option>
              <option value='other'>Other</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>
              Location Description
            </label>
            <input
              type='text'
              name='locationDescription'
              value={formData.locationDescription}
              onChange={e =>
                setFormData({
                  ...formData,
                  locationDescription: e.target.value,
                })
              }
              placeholder='e.g., Near intersection of Main St and 1st Ave'
              className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>
              Description
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder='Provide details about what you observed...'
              rows={4}
              className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>
              Photo (optional)
            </label>
            <input
              type='file'
              accept='image/jpeg,image/png,image/webp'
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
              }}
              className='block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100'
            />
            {uploading && (
              <div className='text-xs text-gray-500 mt-1'>Uploading...</div>
            )}
            {uploadError && (
              <div className='text-xs text-red-600 mt-1'>⚠️ {uploadError}</div>
            )}
            {formData.imageUrl && (
              <div className='mt-2'>
                <img
                  src={formData.imageUrl}
                  alt='Attachment preview'
                  className='max-h-40 rounded border'
                />
              </div>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>
              When did this occur? <span className='text-red-500'>*</span>
            </label>
            <input
              type='datetime-local'
              name='reportedAt'
              value={formData.reportedAt}
              onChange={e =>
                setFormData({ ...formData, reportedAt: e.target.value })
              }
              required
              className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>
              Alert Duration (Hours)
            </label>
            <select
              name='durationHours'
              value={formData.durationHours}
              onChange={e =>
                setFormData({
                  ...formData,
                  durationHours: parseInt(e.target.value),
                })
              }
              className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
            >
              <option value={2}>2 hours</option>
              <option value={4}>4 hours</option>
              <option value={6}>6 hours</option>
              <option value={8}>8 hours</option>
              <option value={12}>12 hours</option>
            </select>
          </div>

          <div className='flex gap-2 pt-4'>
            <button
              type='submit'
              disabled={submitting || !position}
              className='px-6 py-2 bg-red-600 text-white rounded-md font-medium disabled:opacity-50 focus:outline-none focus:ring-0'
            >
              {submitting ? 'Submitting...' : 'Submit Alert'}
            </button>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-600'
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ICEAlerts;
