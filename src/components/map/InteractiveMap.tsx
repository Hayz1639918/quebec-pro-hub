import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from 'react-leaflet';
import { Icon, DragEndEvent } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Locate, 
  MapPin, 
  Briefcase, 
  User, 
  Star,
  DollarSign,
  Eye,
  MousePointerClick
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { calculateDistance } from '@/lib/geolocation';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom marker icons
const projectIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'project-marker'
});

const professionalIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'professional-marker'
});

// User location icon is created dynamically with useMemo in the component

// Types
export interface MapProject {
  id: string;
  title: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  region: string | null;
  status: string;
  latitude: number;
  longitude: number;
  created_at: string;
  client_name?: string;
  distance_km?: number;
}

export interface MapProfessional {
  id: string;
  full_name: string;
  company_name: string | null;
  city: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  service_radius_km: number;
  services_offered: string | null;
  years_experience: number | null;
  is_rbq_verified: boolean;
  rbq_number: string | null;
  average_rating: number;
  total_reviews: number;
  distance_km?: number;
}

interface InteractiveMapProps {
  mode: 'projects' | 'professionals';
  projects?: MapProject[];
  professionals?: MapProfessional[];
  onRadiusChange?: (radius: number) => void;
  onLocationChange?: (lat: number, lng: number) => void;
  defaultRadius?: number;
  height?: string;
}

// Component to handle map events
const MapController = ({ 
  onMoveEnd 
}: { 
  onMoveEnd?: (lat: number, lng: number) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    if (onMoveEnd) {
      const handler = () => {
        const center = map.getCenter();
        onMoveEnd(center.lat, center.lng);
      };
      map.on('moveend', handler);
      return () => { map.off('moveend', handler); };
    }
  }, [map, onMoveEnd]);

  return null;
};

// Component to auto-center map on user's location at startup
const AutoLocate = ({ 
  onLocate,
  onLoadingChange
}: { 
  onLocate: (lat: number, lng: number) => void;
  onLoadingChange?: (loading: boolean) => void;
}) => {
  const map = useMap();
  const [hasLocated, setHasLocated] = useState(false);

  useEffect(() => {
    if (hasLocated) return;

    if ('geolocation' in navigator) {
      onLoadingChange?.(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Center map on user's position with animation
          map.flyTo([latitude, longitude], 12, { duration: 1.5 });
          onLocate(latitude, longitude);
          setHasLocated(true);
          onLoadingChange?.(false);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          // Keep default Montreal center
          setHasLocated(true);
          onLoadingChange?.(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000,
          maximumAge: 60000 // Cache position for 1 minute
        }
      );
    } else {
      setHasLocated(true);
    }
  }, [map, onLocate, hasLocated, onLoadingChange]);

  return null;
};

// Component to handle map click events for setting new origin
const MapClickHandler = ({
  onLocationSet,
  enabled
}: {
  onLocationSet: (lat: number, lng: number) => void;
  enabled: boolean;
}) => {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onLocationSet(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Locate button component
const LocateButton = ({ 
  onLocate,
  t
}: { 
  onLocate: (lat: number, lng: number) => void;
  t: (key: string) => string;
}) => {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleLocate = () => {
    setLoading(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 12, { duration: 1.5 });
          onLocate(latitude, longitude);
          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoading(false);
          // Default to Montreal if geolocation fails
          map.flyTo([45.5017, -73.5673], 10, { duration: 1.5 });
          onLocate(45.5017, -73.5673);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLoading(false);
      // Default to Montreal
      map.flyTo([45.5017, -73.5673], 10, { duration: 1.5 });
      onLocate(45.5017, -73.5673);
    }
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      className="absolute top-4 right-4 z-[1000] shadow-lg"
      onClick={handleLocate}
      disabled={loading}
    >
      <Locate className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      {loading ? t('common.loading') : t('professionals.map.my_location')}
    </Button>
  );
};

export const InteractiveMap = ({
  mode,
  projects = [],
  professionals = [],
  onRadiusChange,
  onLocationChange,
  defaultRadius = 50,
  height = '400px'
}: InteractiveMapProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Default center (Montreal) - will be updated by AutoLocate
  const [center] = useState<[number, number]>([45.5017, -73.5673]);
  const [zoom] = useState(10);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(defaultRadius);
  const [isLocating, setIsLocating] = useState(true);
  const [clickToMoveEnabled] = useState(true);

  const handleLocate = useCallback((lat: number, lng: number) => {
    setUserLocation([lat, lng]);
    onLocationChange?.(lat, lng);
  }, [onLocationChange]);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLocating(loading);
  }, []);

  const handleRadiusChange = useCallback((value: number[]) => {
    setRadius(value[0]);
    onRadiusChange?.(value[0]);
  }, [onRadiusChange]);

  const handleMoveEnd = useCallback((_lat: number, _lng: number) => {
    // Map moved - could be used for future features
  }, []);

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback((e: DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setUserLocation([position.lat, position.lng]);
    onLocationChange?.(position.lat, position.lng);
  }, [onLocationChange]);

  // Memoize user location icon with draggable cursor style
  const draggableUserIcon = useMemo(() => new Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [30, 49],
    iconAnchor: [15, 49],
    popupAnchor: [1, -40],
    shadowSize: [41, 41],
    className: 'user-location-marker cursor-move'
  }), []);

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return t('projects.card.to_discuss');
    if (min && max) return `${min.toLocaleString()} $ - ${max.toLocaleString()} $`;
    if (min) return `${t('projects.card.from')} ${min.toLocaleString()} $`;
    return `${t('projects.card.up_to')} ${max!.toLocaleString()} $`;
  };

  // Calculate projects within the radius
  const projectsInRadius = useMemo(() => {
    if (!userLocation) return projects;
    
    return projects.filter((project) => {
      if (!project.latitude || !project.longitude) return false;
      const distance = calculateDistance(
        userLocation[0],
        userLocation[1],
        project.latitude,
        project.longitude
      );
      return distance <= radius;
    });
  }, [projects, userLocation, radius]);

  // Calculate professionals within the radius
  const professionalsInRadius = useMemo(() => {
    if (!userLocation) return professionals;
    
    return professionals.filter((pro) => {
      if (!pro.latitude || !pro.longitude) return false;
      const distance = calculateDistance(
        userLocation[0],
        userLocation[1],
        pro.latitude,
        pro.longitude
      );
      return distance <= radius;
    });
  }, [professionals, userLocation, radius]);

  // Count of items in radius for display
  const itemsInRadiusCount = mode === 'projects' ? projectsInRadius.length : professionalsInRadius.length;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-0">
        {/* Radius slider */}
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg max-w-[220px]">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('professionals.map.radius')}: {radius} {t('professionals.map.km')}</span>
          </div>
          <Slider
            value={[radius]}
            onValueChange={handleRadiusChange}
            min={5}
            max={200}
            step={5}
            className="w-full"
          />
          {/* Click hint */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MousePointerClick className="h-3.5 w-3.5 text-primary" />
              <span>{t('professionals.map.click_to_move')}</span>
            </div>
          </div>
        </div>

        {/* Items count badge - shows only items within radius */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <Badge variant="secondary" className="shadow-lg">
            {mode === 'projects' ? (
              <><Briefcase className="h-3 w-3 mr-1" /> {t('projects.map.projects_count', { count: itemsInRadiusCount })}</>
            ) : (
              <><User className="h-3 w-3 mr-1" /> {t('professionals.map.professionals_count', { count: itemsInRadiusCount })}</>
            )}
          </Badge>
        </div>

        {/* Loading overlay */}
        {isLocating && (
          <div className="absolute inset-0 z-[1001] bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Locate className="h-8 w-8 text-primary animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 border-2 border-primary/30 rounded-full animate-ping" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {t('common.loading')}
              </span>
            </div>
          </div>
        )}

        {/* Map container */}
        <div style={{ height }}>
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            dragging={true}
            zoomControl={true}
            doubleClickZoom={true}
            touchZoom={true}
            boxZoom={true}
            keyboard={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController 
              onMoveEnd={handleMoveEnd}
            />
            
            {/* Auto-center on user's location at startup */}
            <AutoLocate 
              onLocate={handleLocate} 
              onLoadingChange={handleLoadingChange}
            />
            
            <LocateButton onLocate={handleLocate} t={t} />
            
            {/* Click handler for setting new origin */}
            <MapClickHandler 
              onLocationSet={handleLocate}
              enabled={clickToMoveEnabled}
            />

            {/* User location marker and radius circle */}
            {userLocation && (
              <>
                <Marker 
                  position={userLocation} 
                  icon={draggableUserIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend: handleMarkerDragEnd,
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <strong>📍 {t('professionals.map.my_location')}</strong>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('professionals.map.drag_to_move')}
                      </p>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={userLocation}
                  radius={radius * 1000}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.1,
                    weight: 2
                  }}
                />
              </>
            )}

            {/* Project markers - only show those within radius */}
            {mode === 'projects' && projectsInRadius.map((project) => {
              // Calculate distance for display
              const distance = userLocation 
                ? calculateDistance(userLocation[0], userLocation[1], project.latitude, project.longitude)
                : project.distance_km;
              
              return (
                <Marker
                  key={project.id}
                  position={[project.latitude, project.longitude]}
                  icon={projectIcon}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-bold text-sm mb-1">{project.title}</h3>
                      <Badge variant="outline" className="mb-2 text-xs">
                        {project.category}
                      </Badge>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.city}, {project.region}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatBudget(project.budget_min, project.budget_max)}
                        </div>
                        {distance !== undefined && (
                          <div className="text-primary font-medium">
                            📍 {distance.toFixed(1)} km
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {t('projects.card.view_details')}
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Professional markers - only show those within radius */}
            {mode === 'professionals' && professionalsInRadius.map((pro) => {
              // Calculate distance for display
              const distance = userLocation 
                ? calculateDistance(userLocation[0], userLocation[1], pro.latitude, pro.longitude)
                : pro.distance_km;
              
              return (
                <Marker
                  key={pro.id}
                  position={[pro.latitude, pro.longitude]}
                  icon={professionalIcon}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-bold text-sm mb-1">
                        {pro.company_name || pro.full_name}
                      </h3>
                      {pro.is_rbq_verified && (
                        <Badge variant="default" className="mb-2 text-xs bg-green-600">
                          ✓ {t('professionals.card.verified')}
                        </Badge>
                      )}
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {pro.city}, {pro.region}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {pro.average_rating.toFixed(1)} ({pro.total_reviews} {t('professionals.card.reviews')})
                        </div>
                        {pro.years_experience && (
                          <div>{pro.years_experience} {t('professionals.card.years_exp')}</div>
                        )}
                        {distance !== undefined && (
                          <div className="text-primary font-medium">
                            📍 {distance.toFixed(1)} {t('professionals.map.km')}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => navigate(`/professional/${pro.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {t('professionals.card.view_profile')}
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;

