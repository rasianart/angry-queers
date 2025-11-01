import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Link, useSearchParams } from 'react-router-dom';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import DatePicker from 'react-datepicker';
import { DateTime } from 'luxon';
import { useAuth } from '../../contexts/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';

interface CanvasMarker {
  id: number;
  latitude: string; // Comes from database as string
  longitude: string; // Comes from database as string
  canvasDate: string;
  canvasTime: string;
  durationHours: number;
  createdAt: string;
  expiresAt: string;
  createdBy?: number;
  createdByEmail?: string;
  createdByUsername?: string;
  materials?: string[];
  notes?: string | null;
  participants?: { id: number; name: string; email: string }[];
}

interface CanvasPlanningProps {}

// Helper function to parse canvas date/time using Luxon
const parseCanvasDateTime = (dateStr: string, timeStr: string): string => {
  try {
    // Try different combinations of date and time formats
    const formats = [
      `${dateStr}T${timeStr}`, // YYYY-MM-DDTHH:MM:SS
      `${dateStr} ${timeStr}`, // YYYY-MM-DD HH:MM:SS
      `${dateStr}T${timeStr}:00`, // YYYY-MM-DDTHH:MM:00
      `${dateStr} ${timeStr}:00`, // YYYY-MM-DD HH:MM:00
    ];

    for (const format of formats) {
      const dt = DateTime.fromISO(format);
      if (dt.isValid) {
        return dt.toLocaleString(DateTime.DATETIME_MED);
      }
    }

    // If ISO parsing fails, try parsing date and time separately
    const datePart = DateTime.fromISO(dateStr);
    if (datePart.isValid) {
      // Try to parse time with different formats
      const timeFormats = [timeStr, `${timeStr}:00`, `${timeStr}:00:00`];
      for (const timeFormat of timeFormats) {
        const timePart = DateTime.fromFormat(timeFormat, 'HH:mm:ss');
        if (timePart.isValid) {
          const combined = datePart.set({
            hour: timePart.hour,
            minute: timePart.minute,
            second: timePart.second,
          });
          return combined.toLocaleString(DateTime.DATETIME_MED);
        }
      }
    }

    // Fallback to raw values
    return `${dateStr} at ${timeStr}`;
  } catch (error) {
    console.error('Luxon date parsing error:', error);
    return `${dateStr} at ${timeStr}`;
  }
};

// Component to handle map recentering
const MapController: React.FC<{
  center: { lat: number; lng: number } | null;
  zoom: number | null;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;

    // Smoothly pan and zoom to the new location
    map.panTo(center);
    if (zoom !== null) {
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  return null;
};

// Custom component to render canvas markers with radius
const CanvasMarkerWithRadius: React.FC<{
  marker: CanvasMarker;
  onMarkerClick: (marker: CanvasMarker) => void;
  currentUserId?: number;
}> = ({ marker, onMarkerClick, currentUserId }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const lat = Number(marker.latitude);
    const lng = Number(marker.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return;
    }

    // Check if marker is expired
    const isExpired = new Date(marker.expiresAt) <= new Date();

    // Determine circle color based on marker status
    let circleColor = '#10B981'; // Green-500 (default/active)
    if (isExpired) {
      circleColor = '#9CA3AF'; // Gray-400 (expired)
    } else if (
      currentUserId &&
      marker.createdBy !== currentUserId &&
      marker.participants?.some(p => p.id === currentUserId)
    ) {
      circleColor = '#3B82F6'; // Blue-500 (invited)
    }

    // Create a circle with 1 block radius (approximately 0.1 miles or 160 meters)
    const newCircle = new google.maps.Circle({
      strokeColor: circleColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: circleColor,
      fillOpacity: 0.15,
      map: map,
      center: { lat, lng },
      radius: 160, // 1 block radius in meters
    });

    return () => {
      if (newCircle) {
        newCircle.setMap(null);
      }
    };
  }, [
    map,
    marker.latitude,
    marker.longitude,
    marker.expiresAt,
    marker.createdBy,
    marker.participants,
    currentUserId,
  ]);

  const lat = Number(marker.latitude);
  const lng = Number(marker.longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  // Check if current user was invited (is a participant but not the creator)
  const wasInvited =
    currentUserId &&
    marker.createdBy !== currentUserId &&
    marker.participants?.some(p => p.id === currentUserId);

  // Check if marker is expired
  const isExpired = new Date(marker.expiresAt) <= new Date();

  // Determine marker color based on status
  let markerColor = 'bg-green-500 hover:bg-green-600'; // Default: your markers
  if (isExpired) {
    markerColor = 'bg-gray-400 hover:bg-gray-500'; // Expired
  } else if (wasInvited) {
    markerColor = 'bg-blue-500 hover:bg-blue-600'; // Invited
  }

  return (
    <AdvancedMarker
      position={{ lat, lng }}
      onClick={() => onMarkerClick(marker)}
    >
      <div
        className={`${markerColor} text-white w-8 h-8 rounded-full shadow-lg border-2 border-white cursor-pointer transition-colors flex items-center justify-center relative`}
      >
        📍
        {wasInvited && !isExpired && (
          <span className='absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white'></span>
        )}
      </div>
    </AdvancedMarker>
  );
};

// Custom component to render temporary marker with radius for clicked position
const TemporaryMarkerWithRadius: React.FC<{
  position: { lat: number; lng: number };
}> = ({ position }) => {
  const map = useMap();
  const [, setCircle] = useState<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create a temporary circle with 1 block radius
    const newCircle = new google.maps.Circle({
      strokeColor: '#059669', // Green-600
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#059669', // Green-600
      fillOpacity: 0.15,
      map: map,
      center: position,
      radius: 160, // 1 block radius in meters
    });

    setCircle(newCircle);

    return () => {
      if (newCircle) {
        newCircle.setMap(null);
      }
    };
  }, [map, position.lat, position.lng]);

  return (
    <AdvancedMarker position={position}>
      <div className='bg-green-600 text-white w-8 h-8 rounded-full shadow-lg border-2 border-white animate-pulse flex items-center justify-center'>
        📍
      </div>
    </AdvancedMarker>
  );
};

const CanvasPlanning: React.FC<CanvasPlanningProps> = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyLoading, setApiKeyLoading] = useState<boolean>(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<CanvasMarker[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showMarkerForm, setShowMarkerForm] = useState<boolean>(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<CanvasMarker | null>(
    null
  );
  const [showMarkerDetails, setShowMarkerDetails] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapZoom, setMapZoom] = useState<number | null>(null);
  const [includeExpired, setIncludeExpired] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<
    { id: number; name: string; email: string }[]
  >([]);
  const [editState, setEditState] = useState<{
    materials: string[];
    notes: string;
    participant_user_ids: number[];
    saving: boolean;
    error: string | null;
  }>({
    materials: [],
    notes: '',
    participant_user_ids: [],
    saving: false,
    error: null,
  });

  // Sync edit state when opening a marker
  useEffect(() => {
    if (!selectedMarker) return;
    setEditState({
      materials: selectedMarker.materials || [],
      notes: selectedMarker.notes || '',
      participant_user_ids: (selectedMarker.participants || []).map(p => p.id),
      saving: false,
      error: null,
    });
  }, [selectedMarker]);

  // Form state
  const [formData, setFormData] = useState({
    canvas_date: new Date(),
    canvas_time: new Date(),
    duration_hours: 2,
    materials: [] as string[],
    notes: '' as string,
    participant_user_ids: [] as number[],
  });

  // Calculate map height dynamically, accounting for navigation header
  const mapHeight = useMemo(() => {
    // Navigation header is typically around 64px (4rem)
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
        setApiKeyError(null);
      } catch (err) {
        console.error('Error fetching API key:', err);
        setApiKeyError('Failed to load Google Maps API key');
      } finally {
        setApiKeyLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  // Options for materials multi-select
  const materialsOptions = useMemo(
    () =>
      ['Literature', 'Scripts', 'Snacks', 'Flyers', 'Door Signs'].map(m => ({
        value: m,
        label: m,
      })),
    []
  );

  // Options for partners multi-select (exclude current user)
  const participantOptions = useMemo(
    () =>
      allUsers
        .filter(u => u.id !== user?.id)
        .map(u => ({
          value: u.id,
          label: `${u.name || u.email} (${u.email})`,
        })),
    [allUsers, user?.id]
  );

  const fetchMarkers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view canvas markers');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/canvas-markers?includeExpired=${includeExpired}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch canvas markers');
      }
      const data = await response.json();

      const markersList = Array.isArray(data.markers) ? data.markers : [];

      setMarkers(markersList);
      setIsAdmin(data.isAdmin || false);
      setError(null);
      return markersList as CanvasMarker[];
    } catch (err) {
      setError('Failed to load canvas markers. Please try again later.');
      return [] as CanvasMarker[];
    } finally {
      setLoading(false);
    }
  }, [includeExpired]);

  // Fetch canvas markers
  useEffect(() => {
    if (apiKey) {
      fetchMarkers();
    }
  }, [apiKey, fetchMarkers]);

  // Auto-open marker from URL parameter
  useEffect(() => {
    const markerId = searchParams.get('marker');
    if (markerId && markers.length > 0) {
      const marker = markers.find(m => m.id === parseInt(markerId, 10));
      if (marker) {
        setSelectedMarker(marker);
        setShowMarkerDetails(true);
        // Center map on the marker
        setMapCenter({
          lat: parseFloat(marker.latitude),
          lng: parseFloat(marker.longitude),
        });
        setMapZoom(15);
        // Clear the URL parameter
        setSearchParams({});
      }
    }
  }, [markers, searchParams, setSearchParams]);

  // Load users for participant selection
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/canvas-users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data.users || []);
        }
      } catch {}
    };
    load();
  }, []);

  const handleMapClick = useCallback((event: any) => {
    // Try different ways to access latLng
    let latLng = event.latLng;
    if (!latLng && event.detail && event.detail.latLng) {
      latLng = event.detail.latLng;
    }

    if (latLng) {
      // Try different ways to access coordinates
      let lat, lng;

      if (typeof latLng.lat === 'function') {
        // Standard Google Maps LatLng object
        lat = latLng.lat();
        lng = latLng.lng();
      } else if (latLng.lat !== undefined && latLng.lng !== undefined) {
        // Plain object with lat/lng properties
        lat = latLng.lat;
        lng = latLng.lng;
      } else if (
        latLng.latitude !== undefined &&
        latLng.longitude !== undefined
      ) {
        // Object with latitude/longitude properties
        lat = latLng.latitude;
        lng = latLng.longitude;
      } else {
        return;
      }

      setSelectedPosition({ lat, lng });
      setShowMarkerForm(true);
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_hours' ? parseInt(value) : value,
    }));
  };

  const handleDateChange = useCallback(
    (date: Date | null, field: 'canvas_date' | 'canvas_time') => {
      if (date) {
        setFormData(prev => ({
          ...prev,
          [field]: date,
        }));
      }
    },
    []
  );

  const handleMarkerClick = useCallback((marker: CanvasMarker) => {
    setSelectedMarker(marker);
    setShowMarkerDetails(true);
    // Center map on the clicked marker and zoom in close
    setMapCenter({
      lat: Number(marker.latitude),
      lng: Number(marker.longitude),
    });
    setMapZoom(17); // Zoom in close (street level)
  }, []);

  const handleCloseMarkerDetails = useCallback(() => {
    setSelectedMarker(null);
    setShowMarkerDetails(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPosition) return;

      setSubmitting(true);
      setSubmitError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Please log in to create canvas markers');
        }

        const response = await fetch('/api/canvas-markers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude: selectedPosition.lat,
            longitude: selectedPosition.lng,
            canvas_date: formData.canvas_date.toISOString().split('T')[0], // YYYY-MM-DD format
            canvas_time: formData.canvas_time.toTimeString().split(' ')[0], // HH:MM:SS format
            duration_hours: formData.duration_hours,
            materials: formData.materials,
            notes: formData.notes,
            participant_user_ids: formData.participant_user_ids,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create canvas marker');
        }

        await response.json();

        // Close modal first
        setShowMarkerForm(false);
        setSelectedPosition(null);

        // Reset form
        setFormData({
          canvas_date: new Date(),
          canvas_time: new Date(),
          duration_hours: 2,
          materials: [],
          notes: '',
          participant_user_ids: [],
        });

        // Wait a brief moment for database transaction to complete, then refresh markers list
        // Using setTimeout to ensure state updates complete first
        setTimeout(async () => {
          await fetchMarkers();
        }, 200);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Failed to create canvas marker'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [selectedPosition, formData, fetchMarkers]
  );

  const handleDeleteMarker = async (markerId: number) => {
    if (
      !window.confirm('Are you sure you want to delete this canvas marker?')
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/canvas-markers/${markerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete canvas marker');
      }

      // Refresh markers list
      fetchMarkers();
      setShowMarkerDetails(false);
      setSelectedMarker(null);
    } catch (err) {
      console.error('Error deleting canvas marker:', err);
      alert(
        err instanceof Error ? err.message : 'Failed to delete canvas marker'
      );
    }
  };

  // Authentication gate for entire Canvas page
  if (authLoading || apiKeyLoading) {
    return (
      <div className='p-10 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50'>
        <h3>🔄 Loading...</h3>
        <p>Please wait...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-2xl mx-auto'>
          <div className='bg-white rounded-lg shadow-md p-8 text-center'>
            <h2 className='text-2xl font-semibold text-gray-800 mb-4'>
              Authentication Required
            </h2>
            <p className='text-gray-600 mb-6'>
              Canvas Planning requires you to be logged in. This helps us track
              canvassing efforts and coordinate community organizing.
            </p>
            <Link
              to='/'
              className='inline-block button-pink text-white px-6 py-3 rounded-md transition-colors font-medium'
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (apiKeyError) {
    return (
      <div className='p-5 mx-5 border-2 border-dashed border-red-400 rounded-lg text-center bg-red-50 text-red-700'>
        <h2>⚠️ API Key Error</h2>
        <p>{apiKeyError}</p>
        <p>
          <strong>Please check:</strong>
        </p>
        <ul className='text-left inline-block'>
          <li>Backend server is running</li>
          <li>Google Maps API key is configured in backend/.env</li>
          <li>API key is valid and has Maps JavaScript API enabled</li>
        </ul>
      </div>
    );
  }

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className='p-5 mx-5 border-2 border-dashed border-red-400 rounded-lg text-center bg-red-50 text-red-700'>
        <h2>⚠️ Google Maps API Key Not Configured</h2>
        <p>
          Please configure your Google Maps API key in the backend environment
          variables.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col lg:flex-row' style={{ height: mapHeight }}>
      {/* Sidebar - Top on mobile, Left on desktop */}
      <div className='w-full lg:w-80 bg-gray-50 p-4 overflow-y-auto border-r-0 lg:border-r border-b lg:border-b-0 border-gray-200 custom-scrollbar'>
        {/* Header */}
        <div className='mb-4 p-4 bg-[rgb(242 245 244)] rounded-lg'>
          <h3 className='text-xl font-thin text-black mb-2'>
            Community Canvas Planning
          </h3>
          <p className='text-black mb-5 mt-5 text-sm leading-relaxed'>
            Plan and coordinate community canvassing efforts. Click anywhere on
            the map to place a canvas marker for a specific time period.
          </p>
          <p className='text-black mb-5 mt-5 text-sm leading-relaxed'>
            Each marker represents a 1-block radius area that will be canvassed.
            Markers automatically expire after the specified duration.
          </p>
          {!isAdmin && (
            <div className='text-sm text-blue-700 bg-blue-50 p-2 rounded-lg mb-4'>
              ℹ️ You can only see your own canvas markers. Admins can view and
              manage all markers.
            </div>
          )}

          {/* Instructions */}
          <div className='bg-blue-50 rounded-lg p-2'>
            <h4 className='font-medium text-blue-800 mb-2'>How to Use:</h4>
            <ol className='text-sm text-blue-700 space-y-1'>
              <li>1. Click anywhere on the map</li>
              <li>2. Select the canvas date and time</li>
              <li>3. Choose duration (hours)</li>
              <li>4. Submit to place the marker</li>
            </ol>
          </div>
        </div>

        {/* Active Markers */}
        <div className='mb-4'>
          <h4 className='font-medium text-gray-800 mb-3'>Canvas Areas</h4>
          <div className='flex items-center justify-between mb-3'>
            <label className='text-sm text-gray-700 inline-flex items-center gap-2'>
              <input
                type='checkbox'
                checked={includeExpired}
                onChange={e => setIncludeExpired(e.target.checked)}
              />
              Show expired
            </label>
          </div>
          {loading ? (
            <div className='text-center py-4'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto'></div>
              <span className='text-sm text-gray-600 mt-2 block'>
                Loading markers...
              </span>
            </div>
          ) : error ? (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm'>
              ⚠️ {error}
            </div>
          ) : markers.length === 0 ? (
            <div className='text-center py-4 text-gray-500 text-sm'>
              No active canvas areas. Click on the map to add one!
            </div>
          ) : (
            <div className='space-y-2'>
              {markers.map(marker => (
                <div
                  key={marker.id}
                  className='bg-white p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors'
                  onClick={() => handleMarkerClick(marker)}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-800'>
                      📍 Canvas Area
                    </span>
                    <span className='text-xs text-gray-500'>
                      {marker.durationHours}h duration
                    </span>
                  </div>
                  <div className='text-xs text-gray-600 space-y-1'>
                    <div>
                      📅{' '}
                      {parseCanvasDateTime(
                        marker.canvasDate,
                        marker.canvasTime
                      )}
                    </div>
                    <div>
                      ⏰ Expires: {new Date(marker.expiresAt).toLocaleString()}
                    </div>
                    {marker.materials && marker.materials.length > 0 && (
                      <div>🧰 Materials: {marker.materials.join(', ')}</div>
                    )}
                    {marker.participants && marker.participants.length > 0 && (
                      <div>
                        👥 With:{' '}
                        {marker.participants
                          .map(p => p.name || p.email)
                          .join(', ')}
                      </div>
                    )}
                    {isAdmin && marker.createdByUsername && (
                      <div className='text-blue-600'>
                        👤 {marker.createdByUsername}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className='flex-1 min-h-0 relative'>
        <div className='map-container' style={{ height: mapHeight }}>
          <APIProvider apiKey={apiKey}>
            <Map
              mapId='canvas-map'
              defaultCenter={{ lat: 41.8781, lng: -87.6298 }}
              defaultZoom={11}
              style={{ width: '100%', height: '100%', cursor: 'pointer' }}
              gestureHandling='greedy'
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={true}
              zoomControl={true}
              onClick={handleMapClick}
            >
              {/* Map controller for programmatic pan/zoom */}
              <MapController center={mapCenter} zoom={mapZoom} />

              {/* Render canvas markers */}
              {markers.map(marker => (
                <CanvasMarkerWithRadius
                  key={marker.id}
                  marker={marker}
                  onMarkerClick={handleMarkerClick}
                  currentUserId={user?.id}
                />
              ))}

              {/* Temporary marker for clicked position */}
              {selectedPosition && (
                <TemporaryMarkerWithRadius position={selectedPosition} />
              )}
            </Map>
          </APIProvider>
        </div>

        {/* Map Legend */}
        <div className='absolute top-4 left-4 bg-white/90 backdrop-blur border border-gray-200 rounded-lg shadow p-3 text-xs text-gray-700 z-10'>
          <div className='font-semibold mb-2'>Canvas Markers</div>
          <div className='flex items-center gap-2 mb-1'>
            <div className='bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow'></div>
            <span>Your active markers</span>
          </div>
          <div className='flex items-center gap-2 mb-1'>
            <div className='bg-blue-500 w-4 h-4 rounded-full border-2 border-white shadow relative'>
              <span className='absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full border border-white'></span>
            </div>
            <span>You were invited</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='bg-gray-400 w-4 h-4 rounded-full border-2 border-white shadow'></div>
            <span>Expired markers</span>
          </div>
        </div>
      </div>

      {/* Marker Form Modal */}
      {showMarkerForm && selectedPosition && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={() => {
            setShowMarkerForm(false);
            setSelectedPosition(null);
          }}
        >
          <div
            className='bg-white p-6 rounded-lg max-w-md w-full mx-4'
            onClick={e => e.stopPropagation()}
          >
            <h3 className='text-xl font-semibold mb-4'>Plan Canvas Area</h3>

            <p className='text-sm text-gray-600 mb-4'>
              You've selected a location for community canvassing. This will
              create a 1-block radius area.
            </p>

            {submitError && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700'>
                <p>⚠️ {submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Canvas Date <span className='text-red-500'>*</span>
                </label>
                <DatePicker
                  selected={formData.canvas_date}
                  onChange={date => handleDateChange(date, 'canvas_date')}
                  dateFormat='yyyy-MM-dd'
                  minDate={new Date()}
                  className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholderText='Select canvas date'
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>
                  Canvas Time <span className='text-red-500'>*</span>
                </label>
                <DatePicker
                  selected={formData.canvas_time}
                  onChange={date => handleDateChange(date, 'canvas_time')}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption='Time'
                  dateFormat='h:mm aa'
                  className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholderText='Select canvas time'
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>
                  Duration (Hours) <span className='text-red-500'>*</span>
                </label>
                <select
                  name='duration_hours'
                  value={formData.duration_hours}
                  onChange={handleInputChange}
                  required
                  className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={6}>6 hours</option>
                  <option value={8}>8 hours</option>
                </select>
              </div>

              {/* Materials multi-select (react-select with custom entry) */}
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Materials
                </label>
                <CreatableSelect
                  isMulti
                  options={materialsOptions}
                  value={formData.materials.map(m => ({
                    label: m,
                    value: m,
                  }))}
                  onChange={(vals: any) =>
                    setFormData(prev => ({
                      ...prev,
                      materials: (vals || []).map((v: any) => v.value),
                    }))
                  }
                  placeholder='Select or type to add custom materials...'
                  classNamePrefix='rs'
                  styles={{
                    placeholder: (base: any) => ({
                      ...base,
                      paddingLeft: '4px',
                    }),
                    valueContainer: (base: any) => ({
                      ...base,
                      paddingLeft: '8px',
                    }),
                  }}
                />
              </div>

              {/* Partners multi-select with typeahead (react-select) */}
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Add Partners
                </label>
                <Select
                  isMulti
                  options={participantOptions}
                  value={participantOptions.filter(o =>
                    formData.participant_user_ids.includes(o.value)
                  )}
                  onChange={(vals: any) =>
                    setFormData(prev => ({
                      ...prev,
                      participant_user_ids: (vals || []).map(
                        (v: any) => v.value
                      ),
                    }))
                  }
                  classNamePrefix='rs'
                  styles={{
                    placeholder: base => ({ ...base, paddingLeft: '4px' }),
                    valueContainer: base => ({ ...base, paddingLeft: '8px' }),
                  }}
                />
              </div>

              {/* Notes */}
              <div>
                <label className='block text-sm font-medium mb-1'>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Anything important for this canvas?'
                />
              </div>

              <div className='flex gap-2 pt-4'>
                <button
                  type='submit'
                  disabled={submitting}
                  className='px-6 py-2 button-pink text-white rounded-md font-medium disabled:opacity-50 focus:outline-none focus:ring-0'
                >
                  {submitting ? 'Creating Marker...' : 'Create Canvas Area'}
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowMarkerForm(false);
                    setSelectedPosition(null);
                  }}
                  className='px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-600'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marker Details Modal */}
      {showMarkerDetails && selectedMarker && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
            <h3 className='text-xl font-semibold mb-4'>Canvas Details</h3>

            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Canvas Date & Time
                </label>
                <p className='text-sm font-semibold text-gray-900'>
                  {parseCanvasDateTime(
                    selectedMarker.canvasDate,
                    selectedMarker.canvasTime
                  )}
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Duration
                </label>
                <p className='text-sm font-semibold text-gray-900'>
                  {selectedMarker.durationHours} hour
                  {selectedMarker.durationHours !== 1 ? 's' : ''}
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Expires At
                </label>
                <p className='text-sm font-semibold text-gray-900'>
                  {new Date(selectedMarker.expiresAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Created
                </label>
                <p className='text-sm text-gray-600'>
                  {new Date(selectedMarker.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Organized By
                </label>
                <p className='text-sm text-gray-900'>
                  {selectedMarker.createdByUsername || 'A team member'}
                  {selectedMarker.createdBy !== user?.id && (
                    <span className='ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full'>
                      You were invited!
                    </span>
                  )}
                </p>
              </div>

              {selectedMarker.participants &&
                selectedMarker.participants.length > 0 && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Partners ({selectedMarker.participants.length})
                    </label>
                    <div className='flex flex-wrap gap-1'>
                      {selectedMarker.participants.map(p => (
                        <span
                          key={p.id}
                          className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full'
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Editable fields */}
              <div className='border-t pt-3 mt-2'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Materials
                </label>
                <CreatableSelect
                  isMulti
                  isDisabled={new Date(selectedMarker.expiresAt) <= new Date()}
                  options={materialsOptions}
                  value={(editState.materials.length
                    ? editState.materials
                    : selectedMarker.materials || []
                  ).map(m => ({
                    label: m,
                    value: m,
                  }))}
                  onChange={(vals: any) =>
                    setEditState(prev => ({
                      ...prev,
                      materials: (vals || []).map((v: any) => v.value),
                    }))
                  }
                  placeholder='Select or type to add custom materials...'
                  classNamePrefix='rs'
                  styles={{
                    placeholder: (base: any) => ({
                      ...base,
                      paddingLeft: '4px',
                    }),
                    valueContainer: (base: any) => ({
                      ...base,
                      paddingLeft: '8px',
                    }),
                  }}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Partners
                </label>
                <Select
                  isMulti
                  isDisabled={new Date(selectedMarker.expiresAt) <= new Date()}
                  options={participantOptions}
                  value={participantOptions.filter(o =>
                    (editState.participant_user_ids.length
                      ? editState.participant_user_ids
                      : selectedMarker.participants?.map(p => p.id) || []
                    ).includes(o.value)
                  )}
                  onChange={(vals: any) =>
                    setEditState(prev => ({
                      ...prev,
                      participant_user_ids: (vals || []).map(
                        (v: any) => v.value
                      ),
                    }))
                  }
                  classNamePrefix='rs'
                  styles={{
                    placeholder: base => ({ ...base, paddingLeft: '4px' }),
                    valueContainer: base => ({ ...base, paddingLeft: '8px' }),
                  }}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Notes
                </label>
                <textarea
                  value={
                    editState.notes.length
                      ? editState.notes
                      : selectedMarker.notes || ''
                  }
                  onChange={e =>
                    setEditState(prev => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Add notes'
                />
              </div>
            </div>

            <div className='flex gap-2 pt-4'>
              <button
                onClick={async () => {
                  if (!selectedMarker) return;
                  setEditState(prev => ({
                    ...prev,
                    saving: true,
                    error: null,
                  }));
                  try {
                    const token = localStorage.getItem('token');
                    if (!token) throw new Error('Authentication required');
                    const expired =
                      new Date(selectedMarker.expiresAt) <= new Date();
                    const body: any = {
                      notes: editState.notes.length
                        ? editState.notes
                        : selectedMarker.notes || '',
                    };
                    if (!expired) {
                      body.materials = editState.materials.length
                        ? editState.materials
                        : selectedMarker.materials || [];
                      body.participant_user_ids = editState.participant_user_ids
                        .length
                        ? editState.participant_user_ids
                        : selectedMarker.participants?.map(p => p.id) || [];
                    }
                    const res = await fetch(
                      `/api/canvas-markers/${selectedMarker.id}`,
                      {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(body),
                      }
                    );
                    if (!res.ok) {
                      let errorMsg = 'Failed to update marker';
                      try {
                        const e = await res.json();
                        errorMsg = e.error || errorMsg;
                      } catch {}
                      throw new Error(errorMsg);
                    }
                    // Parse success response
                    await res.json();
                    // Refresh marker data
                    const freshList = await fetchMarkers();
                    const fresh = freshList?.find(
                      m => m.id === selectedMarker.id
                    );
                    if (fresh) setSelectedMarker(fresh);
                    setEditState(prev => ({ ...prev, saving: false }));
                  } catch (e) {
                    const msg = (e as any)?.message || 'Failed to update';
                    setEditState(prev => ({
                      ...prev,
                      saving: false,
                      error: msg,
                    }));
                    alert(msg);
                  }
                }}
                className='px-6 py-2 button-pink text-white rounded-md disabled:opacity-50'
                disabled={editState.saving}
              >
                {editState.saving ? 'Saving...' : 'Save'}
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleDeleteMarker(selectedMarker.id)}
                  className='px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors'
                >
                  Delete Marker
                </button>
              )}
              <button
                onClick={handleCloseMarkerDetails}
                className='px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-600'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasPlanning;
