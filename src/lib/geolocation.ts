/**
 * Geolocation utilities for calculating distances and sorting by proximity
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's current location using browser Geolocation API
 * @returns Promise with user's coordinates or null if denied/unavailable
 */
export function getUserLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Error getting user location:', error.message);
        resolve(null);
      },
      {
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
        enableHighAccuracy: false, // Use network-based location for faster response
      }
    );
  });
}

/**
 * Format distance for display
 * @param distance - Distance in kilometers
 * @returns Formatted string (e.g., "5.2 km", "< 1 km", "125 km")
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return '< 1 km';
  } else if (distance < 10) {
    return `${distance.toFixed(1)} km`;
  } else {
    return `${Math.round(distance)} km`;
  }
}

/**
 * Get approximate city coordinates for Quebec major cities
 * Used as fallback when user location is not available
 */
export const QUEBEC_CITIES: Record<string, Coordinates> = {
  'Montréal': { latitude: 45.5017, longitude: -73.5673 },
  'Québec': { latitude: 46.8139, longitude: -71.2080 },
  'Laval': { latitude: 45.6066, longitude: -73.6927 },
  'Gatineau': { latitude: 45.4765, longitude: -75.7013 },
  'Longueuil': { latitude: 45.5312, longitude: -73.5182 },
  'Sherbrooke': { latitude: 45.4042, longitude: -71.8929 },
  'Saguenay': { latitude: 48.4284, longitude: -71.0656 },
  'Trois-Rivières': { latitude: 46.3432, longitude: -72.5466 },
  'Terrebonne': { latitude: 45.7001, longitude: -73.6470 },
  'Saint-Jean-sur-Richelieu': { latitude: 45.3075, longitude: -73.2625 },
};

/**
 * Get coordinates for a city name (approximate)
 * @param cityName - Name of the city
 * @returns Coordinates or null if city not found
 */
export function getCityCoordinates(cityName: string): Coordinates | null {
  // Normalize city name
  const normalized = cityName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents

  for (const [city, coords] of Object.entries(QUEBEC_CITIES)) {
    const normalizedCity = city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.includes(normalizedCity) || normalizedCity.includes(normalized)) {
      return coords;
    }
  }

  return null;
}

/**
 * Check if browser supports geolocation
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Calculate distance category for filtering
 * @param distance - Distance in kilometers
 * @returns Category string
 */
export function getDistanceCategory(distance: number): string {
  if (distance <= 10) return 'nearby'; // Dans le quartier
  if (distance <= 25) return 'close'; // Proche
  if (distance <= 50) return 'moderate'; // Modéré
  if (distance <= 100) return 'far'; // Loin
  return 'very-far'; // Très loin
}

/**
 * Sort professionals by distance from a reference point
 * @param professionals - Array of professionals with latitude/longitude
 * @param userLocation - User's coordinates
 * @returns Sorted array with distance property added
 */
export function sortByProximity<T extends { latitude: number | null; longitude: number | null }>(
  professionals: T[],
  userLocation: Coordinates
): (T & { distance?: number })[] {
  return professionals
    .map((pro) => {
      if (pro.latitude && pro.longitude) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          pro.latitude,
          pro.longitude
        );
        return { ...pro, distance };
      }
      return { ...pro, distance: undefined };
    })
    .sort((a, b) => {
      // Professionals without location go to the end
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
}

