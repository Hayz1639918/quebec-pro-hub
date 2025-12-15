/**
 * WorldMapBackground - Interactive world map with animated connections
 * Based on Aceternity UI WorldMap component
 */

import WorldMap from "@/components/ui/world-map";

const WorldMapBackground = () => {
  // Connection routes from the Aceternity UI demo
  const connectionDots = [
    {
      start: { lat: 64.2008, lng: -149.4937 }, // Alaska (Fairbanks)
      end: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
    },
    {
      start: { lat: 64.2008, lng: -149.4937 }, // Alaska (Fairbanks)
      end: { lat: -15.7975, lng: -47.8919 }, // Brazil (Brasília)
    },
    {
      start: { lat: -15.7975, lng: -47.8919 }, // Brazil (Brasília)
      end: { lat: 38.7223, lng: -9.1393 }, // Lisbon
    },
    {
      start: { lat: 51.5074, lng: -0.1278 }, // London
      end: { lat: 28.6139, lng: 77.209 }, // New Delhi
    },
    {
      start: { lat: 28.6139, lng: 77.209 }, // New Delhi
      end: { lat: 43.1332, lng: 131.9113 }, // Vladivostok
    },
    {
      start: { lat: 28.6139, lng: 77.209 }, // New Delhi
      end: { lat: -1.2921, lng: 36.8219 }, // Nairobi
    },
  ];

  return (
    <div className="w-full h-full overflow-hidden pointer-events-none bg-white">
      <WorldMap 
        dots={connectionDots}
        lineColor="#0ea5e9"
      />
    </div>
  );
};

export default WorldMapBackground;
