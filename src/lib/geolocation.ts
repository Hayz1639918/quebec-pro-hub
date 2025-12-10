/**
 * Geolocation utilities for calculating distances and sorting by proximity
 */

// Import postal codes database
import postalCodesData from '@/data/quebec-postal-codes.json';

// Type for postal codes database
interface PostalCodesDatabase {
  metadata: {
    source: string;
    lastUpdate: string;
    coverage: string;
    accuracy: string;
  };
  postalCodes: Record<string, { lat: number; lng: number; name: string }>;
}

const POSTAL_CODES_DB = postalCodesData as PostalCodesDatabase;

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

/**
 * Canadian postal code prefix to approximate coordinates mapping
 * First letter indicates a province/region
 */
const POSTAL_CODE_PREFIXES: Record<string, Coordinates> = {
  // Quebec (G, H, J)
  'G': { latitude: 46.8139, longitude: -71.2080 }, // Quebec City area
  'H': { latitude: 45.5017, longitude: -73.5673 }, // Montreal area
  'J': { latitude: 45.5312, longitude: -73.5182 }, // Montérégie/Laurentides area
  // Ontario (K, L, M, N, P)
  'K': { latitude: 45.4215, longitude: -75.6972 }, // Ottawa area
  'L': { latitude: 43.6532, longitude: -79.3832 }, // Greater Toronto Area
  'M': { latitude: 43.6532, longitude: -79.3832 }, // Toronto
  'N': { latitude: 42.9849, longitude: -81.2453 }, // Southwestern Ontario
  'P': { latitude: 46.4917, longitude: -80.9930 }, // Northern Ontario
  // British Columbia (V)
  'V': { latitude: 49.2827, longitude: -123.1207 }, // Vancouver area
  // Alberta (T)
  'T': { latitude: 51.0447, longitude: -114.0719 }, // Calgary area
  // Saskatchewan (S)
  'S': { latitude: 52.1332, longitude: -106.6700 }, // Saskatoon area
  // Manitoba (R)
  'R': { latitude: 49.8951, longitude: -97.1384 }, // Winnipeg area
  // New Brunswick (E)
  'E': { latitude: 46.0878, longitude: -64.7782 }, // Moncton area
  // Nova Scotia (B)
  'B': { latitude: 44.6488, longitude: -63.5752 }, // Halifax area
  // Prince Edward Island (C)
  'C': { latitude: 46.2382, longitude: -63.1311 }, // Charlottetown area
  // Newfoundland and Labrador (A)
  'A': { latitude: 47.5615, longitude: -52.7126 }, // St. John's area
  // Yukon (Y), Northwest Territories (X), Nunavut (X)
  'Y': { latitude: 60.7212, longitude: -135.0568 }, // Whitehorse
  'X': { latitude: 62.4540, longitude: -114.3718 }, // Yellowknife
};

/**
 * Geocode a postal code to coordinates using multiple strategies
 * @param postalCode - Postal code (Canadian format: A1A 1A1)
 * @param city - Optional city name for better accuracy
 * @param country - Country code (default: 'CA' for Canada)
 * @returns Promise with coordinates or null if not found
 */
export async function geocodePostalCode(
  postalCode: string,
  city?: string,
  country: string = 'CA'
): Promise<Coordinates | null> {
  try {
    // Clean and format postal code
    const cleanedPostalCode = postalCode.trim().toUpperCase().replace(/\s+/g, '');
    
    // Validate Canadian postal code format (A1A1A1)
    if (country === 'CA') {
      const canadianPostalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
      if (!canadianPostalCodeRegex.test(cleanedPostalCode)) {
        console.warn('Invalid Canadian postal code format:', cleanedPostalCode);
        return null;
      }
    }

    // Extract FSA (Forward Sortation Area) - first 3 characters
    const fsa = cleanedPostalCode.slice(0, 3);

    // Strategy 1: LOCAL DATABASE (fastest, no API call)
    // Check our local postal codes database first
    const localEntry = POSTAL_CODES_DB.postalCodes[fsa];
    if (localEntry) {
      console.log('✅ Found in local database:', fsa, '-', localEntry.name);
      // Add small random offset to avoid all projects at same point (~100m variance)
      const offset = (Math.random() - 0.5) * 0.002;
      return {
        latitude: localEntry.lat + offset,
        longitude: localEntry.lng + offset,
      };
    }

    // Format with space for API calls: A1A 1A1
    const formattedPostalCode = fsa + ' ' + cleanedPostalCode.slice(3);

    // Strategy 2: Try Nominatim with postal code + city + Quebec, Canada
    if (city) {
      const result = await tryGeocode(`${formattedPostalCode}, ${city}, Quebec, Canada`);
      if (result) {
        console.log('✅ Found via Nominatim (with city):', formattedPostalCode);
        return result;
      }
    }

    // Strategy 3: Try with postal code + Quebec, Canada
    const result2 = await tryGeocode(`${formattedPostalCode}, Quebec, Canada`);
    if (result2) {
      console.log('✅ Found via Nominatim (Quebec):', formattedPostalCode);
      return result2;
    }

    // Strategy 4: Try with postal code + Canada
    const result3 = await tryGeocode(`${formattedPostalCode}, Canada`);
    if (result3) {
      console.log('✅ Found via Nominatim (Canada):', formattedPostalCode);
      return result3;
    }

    // Strategy 5: Try Nominatim postalcode parameter
    const result4 = await tryNominatimPostalCode(formattedPostalCode, country);
    if (result4) {
      console.log('✅ Found via Nominatim postalcode param:', formattedPostalCode);
      return result4;
    }

    // Strategy 6: Fallback to province prefix (1 character)
    const prefix = cleanedPostalCode.charAt(0);
    if (POSTAL_CODE_PREFIXES[prefix]) {
      console.log('⚠️ Using province prefix fallback for:', cleanedPostalCode);
      // Add larger random offset for province-level (~5km variance)
      const offset = (Math.random() - 0.5) * 0.1;
      return {
        latitude: POSTAL_CODE_PREFIXES[prefix].latitude + offset,
        longitude: POSTAL_CODE_PREFIXES[prefix].longitude + offset,
      };
    }

    console.warn('❌ Could not geocode postal code:', cleanedPostalCode);
    return null;
  } catch (error) {
    console.error('Error geocoding postal code:', error);
    return null;
  }
}

/**
 * Try to geocode using a free-form query
 */
async function tryGeocode(query: string): Promise<Coordinates | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ca`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BatirNet/1.0 (quebec-pro-hub)',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try Nominatim's postalcode parameter
 */
async function tryNominatimPostalCode(postalCode: string, country: string): Promise<Coordinates | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postalCode)}&country=${country}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BatirNet/1.0 (quebec-pro-hub)',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Geocode a full address to coordinates
 * @param address - Full address string
 * @returns Promise with coordinates or null if not found
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BatirNet/1.0',
      },
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

