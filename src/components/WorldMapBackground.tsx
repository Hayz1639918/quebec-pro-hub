/**
 * WorldMapBackground - Interactive world map with animated connections
 * Uses the WorldMap component with predefined connection routes
 */

import WorldMap from "@/components/ui/world-map";

const WorldMapBackground = () => {
  // Define connection routes between major cities
  const connectionDots = [
    {
      start: { lat: 45.5017, lng: -73.5673 }, // Montreal
      end: { lat: 48.8566, lng: 2.3522 }, // Paris
    },
    {
      start: { lat: 45.5017, lng: -73.5673 }, // Montreal
      end: { lat: 40.7128, lng: -74.006 }, // New York
    },
    {
      start: { lat: 48.8566, lng: 2.3522 }, // Paris
      end: { lat: 51.5074, lng: -0.1278 }, // London
    },
    {
      start: { lat: 51.5074, lng: -0.1278 }, // London
      end: { lat: 28.6139, lng: 77.209 }, // New Delhi
    },
    {
      start: { lat: 28.6139, lng: 77.209 }, // New Delhi
      end: { lat: 35.6762, lng: 139.6503 }, // Tokyo
    },
    {
      start: { lat: 35.6762, lng: 139.6503 }, // Tokyo
      end: { lat: -33.8688, lng: 151.2093 }, // Sydney
    },
    {
      start: { lat: 48.8566, lng: 2.3522 }, // Paris
      end: { lat: -1.2921, lng: 36.8219 }, // Nairobi
    },
    {
      start: { lat: 40.7128, lng: -74.006 }, // New York
      end: { lat: -23.5505, lng: -46.6333 }, // São Paulo
    },
  ];

  return (
    <div className="w-full h-full overflow-hidden pointer-events-none">
      {/* World Map with connections - clean white background */}
      <div className="absolute inset-0 bg-white">
        <WorldMap 
          dots={connectionDots}
          lineColor="#0ea5e9"
        />
      </div>
    </div>
  );
};

export default WorldMapBackground;
