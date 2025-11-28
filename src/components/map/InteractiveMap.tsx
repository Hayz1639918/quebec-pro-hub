import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Locate, 
  ZoomIn, 
  ZoomOut, 
  MapPin, 
  Briefcase, 
  User, 
  Star,
  DollarSign,
  Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

const userLocationIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [41, 41],
  className: 'user-location-marker'
});

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

// Locate button component
const LocateButton = ({ 
  onLocate 
}: { 
  onLocate: (lat: number, lng: number) => void 
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
      {loading ? 'Localisation...' : 'Ma position'}
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
  
  // Default center (Montreal)
  const [center, setCenter] = useState<[number, number]>([45.5017, -73.5673]);
  const [zoom, setZoom] = useState(10);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(defaultRadius);

  // Get user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setCenter([latitude, longitude]);
          onLocationChange?.(latitude, longitude);
        },
        () => {
          // Default to Montreal if geolocation fails
          setCenter([45.5017, -73.5673]);
          onLocationChange?.(45.5017, -73.5673);
        }
      );
    }
  }, []);

  const handleLocate = useCallback((lat: number, lng: number) => {
    setUserLocation([lat, lng]);
    setCenter([lat, lng]);
    onLocationChange?.(lat, lng);
  }, [onLocationChange]);

  const handleRadiusChange = useCallback((value: number[]) => {
    setRadius(value[0]);
    onRadiusChange?.(value[0]);
  }, [onRadiusChange]);

  const handleMoveEnd = useCallback((lat: number, lng: number) => {
    setCenter([lat, lng]);
  }, []);

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'À discuter';
    if (min && max) return `${min.toLocaleString()} $ - ${max.toLocaleString()} $`;
    if (min) return `À partir de ${min.toLocaleString()} $`;
    return `Jusqu'à ${max!.toLocaleString()} $`;
  };

  const items = mode === 'projects' ? projects : professionals;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-0">
        {/* Radius slider */}
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg max-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Rayon: {radius} km</span>
          </div>
          <Slider
            value={[radius]}
            onValueChange={handleRadiusChange}
            min={5}
            max={200}
            step={5}
            className="w-full"
          />
        </div>

        {/* Items count badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <Badge variant="secondary" className="shadow-lg">
            {mode === 'projects' ? (
              <><Briefcase className="h-3 w-3 mr-1" /> {items.length} projet{items.length > 1 ? 's' : ''}</>
            ) : (
              <><User className="h-3 w-3 mr-1" /> {items.length} professionnel{items.length > 1 ? 's' : ''}</>
            )}
          </Badge>
        </div>

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
            
            <LocateButton onLocate={handleLocate} />

            {/* User location marker and radius circle */}
            {userLocation && (
              <>
                <Marker position={userLocation} icon={userLocationIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>📍 Votre position</strong>
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

            {/* Project markers */}
            {mode === 'projects' && projects.map((project) => (
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
                      {project.distance_km && (
                        <div className="text-primary font-medium">
                          📍 {project.distance_km.toFixed(1)} km
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir le projet
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Professional markers */}
            {mode === 'professionals' && professionals.map((pro) => (
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
                        ✓ RBQ Vérifié
                      </Badge>
                    )}
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {pro.city}, {pro.region}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {pro.average_rating.toFixed(1)} ({pro.total_reviews} avis)
                      </div>
                      {pro.years_experience && (
                        <div>{pro.years_experience} ans d'expérience</div>
                      )}
                      {pro.distance_km && (
                        <div className="text-primary font-medium">
                          📍 {pro.distance_km.toFixed(1)} km
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => navigate(`/professional/${pro.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir le profil
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;

