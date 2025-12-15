import { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

interface Dot {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
}

interface WorldMapProps {
  dots?: Dot[];
  lineColor?: string;
}

// Convert lat/lng to x/y coordinates on the map
function latLngToXY(lat: number, lng: number, width: number, height: number) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

// Generate curved path between two points
function generateCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - Math.abs(end.x - start.x) * 0.2;
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
}

export default function WorldMap({ dots = [], lineColor = "#3b82f6" }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const { width, height } = dimensions;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
    >
      {/* World Map SVG */}
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.5" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* World Map Continents */}
        <g fill="url(#mapGradient)" stroke="#60a5fa" strokeWidth="0.5" strokeOpacity="0.3">
          {/* North America */}
          <path d="M120,80 C150,55 210,45 270,50 C330,55 380,80 410,115 C440,150 445,195 420,240 C395,285 345,320 285,340 C225,360 160,355 105,325 C50,295 20,245 15,185 C10,125 45,85 120,80 Z" />
          <path d="M85,65 C115,45 160,40 190,55 C220,70 230,105 210,135 C190,165 145,175 105,160 C65,145 45,105 85,65 Z" />
          
          {/* Central America */}
          <path d="M180,320 C210,305 255,310 290,330 C325,350 345,390 335,430 C325,470 285,495 240,490 C195,485 160,455 155,410 C150,365 165,330 180,320 Z" />
          
          {/* South America */}
          <path d="M240,480 C290,450 355,460 400,505 C445,550 465,620 455,695 C445,770 400,835 340,875 C280,915 205,920 150,880 C95,840 70,770 80,695 C90,620 145,530 240,480 Z" />
          
          {/* Europe */}
          <path d="M480,85 C520,65 575,60 625,75 C675,90 715,125 725,170 C735,215 715,260 675,290 C635,320 580,335 530,320 C480,305 445,265 440,210 C435,155 455,105 480,85 Z" />
          
          {/* UK */}
          <path d="M445,75 C465,60 495,65 515,85 C535,105 530,135 505,155 C480,175 450,170 430,145 C410,120 420,90 445,75 Z" />
          
          {/* Africa */}
          <path d="M500,290 C560,260 640,270 705,320 C770,370 810,450 815,545 C820,640 785,745 720,815 C655,885 565,920 490,895 C415,870 365,800 355,710 C345,620 400,480 500,290 Z" />
          
          {/* Middle East */}
          <path d="M660,250 C710,225 780,240 825,290 C870,340 885,410 855,465 C825,520 765,555 700,540 C635,525 590,475 590,410 C590,345 620,280 660,250 Z" />
          
          {/* Russia/Asia */}
          <path d="M680,50 C780,25 920,35 1020,80 C1120,125 1190,200 1200,290 C1210,380 1160,465 1075,515 C990,565 880,580 780,555 C680,530 605,470 580,390 C555,310 595,200 680,100 Z" />
          
          {/* India */}
          <path d="M780,340 C835,310 910,330 960,385 C1010,440 1030,520 1005,590 C980,660 920,710 855,710 C790,710 735,660 715,590 C695,520 720,420 780,340 Z" />
          
          {/* Southeast Asia */}
          <path d="M880,450 C925,430 985,450 1025,500 C1065,550 1075,620 1045,675 C1015,730 955,760 895,745 C835,730 795,680 800,615 C805,550 840,480 880,450 Z" />
          
          {/* China */}
          <path d="M900,220 C965,190 1055,200 1125,255 C1195,310 1235,395 1220,480 C1205,565 1145,635 1070,665 C995,695 910,680 855,620 C800,560 785,475 815,395 C845,315 900,220 900,220 Z" />
          
          {/* Japan */}
          <path d="M1060,200 C1090,175 1135,185 1165,220 C1195,255 1200,305 1175,345 C1150,385 1105,405 1065,390 C1025,375 1005,325 1020,275 C1035,225 1060,200 1060,200 Z" />
          
          {/* Indonesia */}
          <path d="M930,560 C995,535 1080,555 1140,610 C1200,665 1225,750 1190,815 C1155,880 1085,920 1010,905 C935,890 880,835 880,760 C880,685 900,600 930,560 Z" />
          
          {/* Australia */}
          <path d="M960,660 C1035,625 1140,645 1215,710 C1290,775 1325,875 1295,965 C1265,1055 1190,1120 1100,1135 C1010,1150 925,1115 875,1045 C825,975 820,880 870,795 C920,710 960,660 960,660 Z" />
        </g>
      </svg>

      {/* Animated Connection Lines */}
      <svg
        viewBox={`0 0 ${1000} ${500}`}
        className="w-full h-full absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
            <stop offset="50%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, index) => {
          const start = latLngToXY(dot.start.lat, dot.start.lng, 1000, 500);
          const end = latLngToXY(dot.end.lat, dot.end.lng, 1000, 500);
          const path = generateCurvedPath(start, end);

          return (
            <g key={index}>
              {/* Static path */}
              <path
                d={path}
                fill="none"
                stroke={lineColor}
                strokeWidth="1"
                strokeOpacity="0.2"
              />
              
              {/* Animated path */}
              <motion.path
                d={path}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 2,
                  delay: index * 0.3,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "loop",
                  repeatDelay: 1,
                }}
              />

              {/* Start dot */}
              <motion.circle
                cx={start.x}
                cy={start.y}
                r="4"
                fill={lineColor}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.3,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                }}
              />

              {/* End dot */}
              <motion.circle
                cx={end.x}
                cy={end.y}
                r="4"
                fill={lineColor}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.3 + 1.5,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                }}
              />

              {/* Pulsing rings */}
              <motion.circle
                cx={start.x}
                cy={start.y}
                r="4"
                fill="none"
                stroke={lineColor}
                strokeWidth="1"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  delay: index * 0.3,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                }}
              />
              <motion.circle
                cx={end.x}
                cy={end.y}
                r="4"
                fill="none"
                stroke={lineColor}
                strokeWidth="1"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  delay: index * 0.3 + 1.5,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

