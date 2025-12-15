/**
 * WorldMapBackground - A stylized world map with network connections
 * Creates a professional tech-inspired background effect
 */

const WorldMapBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-white/40 to-white z-10" />
      
      {/* SVG World Map with connections */}
      <svg
        className="absolute top-0 left-0 w-full h-full opacity-40"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMin slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for the map */}
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.1" />
          </linearGradient>
          
          {/* Glow effect for connection points */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Pulse animation */}
          <radialGradient id="pulseGradient">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Stylized continents */}
        <g fill="url(#mapGradient)" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.3">
          {/* North America */}
          <path d="M150,120 Q200,100 280,110 Q320,130 350,180 Q340,220 300,260 Q250,280 200,270 Q150,240 140,200 Q130,160 150,120 Z" />
          <path d="M180,270 Q220,290 260,320 Q240,360 200,380 Q160,360 150,320 Q160,290 180,270 Z" />
          
          {/* South America */}
          <path d="M260,400 Q300,380 320,420 Q340,480 320,540 Q280,600 240,580 Q200,540 220,480 Q240,420 260,400 Z" />
          
          {/* Europe */}
          <path d="M500,100 Q560,80 620,100 Q660,140 640,180 Q600,200 540,190 Q500,170 480,140 Q480,110 500,100 Z" />
          
          {/* Africa */}
          <path d="M520,240 Q580,220 620,260 Q660,320 640,400 Q600,480 540,480 Q480,440 480,360 Q490,280 520,240 Z" />
          
          {/* Asia */}
          <path d="M700,80 Q800,60 900,80 Q1000,120 1050,180 Q1080,260 1040,320 Q960,360 860,340 Q760,300 720,240 Q680,180 680,120 Q680,90 700,80 Z" />
          
          {/* Australia */}
          <path d="M920,440 Q980,420 1040,440 Q1080,480 1060,540 Q1000,580 940,560 Q900,520 900,480 Q900,450 920,440 Z" />
          
          {/* Additional landmasses */}
          <path d="M640,120 Q680,100 720,120 Q740,160 720,180 Q680,190 650,170 Q630,140 640,120 Z" />
          <path d="M800,380 Q840,360 880,380 Q900,420 880,450 Q840,470 800,450 Q780,420 800,380 Z" />
        </g>

        {/* Connection lines */}
        <g stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.2" fill="none">
          {/* North America to Europe */}
          <path d="M280,150 Q400,80 550,130">
            <animate attributeName="stroke-opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
          </path>
          
          {/* Europe to Asia */}
          <path d="M620,140 Q720,100 850,120">
            <animate attributeName="stroke-opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" />
          </path>
          
          {/* North America to South America */}
          <path d="M250,300 Q280,350 280,420">
            <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="2.5s" repeatCount="indefinite" />
          </path>
          
          {/* Europe to Africa */}
          <path d="M560,180 Q540,210 540,280">
            <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="3.5s" repeatCount="indefinite" />
          </path>
          
          {/* Asia to Australia */}
          <path d="M950,320 Q960,380 980,440">
            <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="2.8s" repeatCount="indefinite" />
          </path>
          
          {/* Cross-continental connections */}
          <path d="M300,180 Q600,250 860,160">
            <animate attributeName="stroke-opacity" values="0.05;0.2;0.05" dur="5s" repeatCount="indefinite" />
          </path>
          <path d="M580,380 Q750,420 920,460">
            <animate attributeName="stroke-opacity" values="0.05;0.2;0.05" dur="4.5s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Connection nodes/points with glow */}
        <g filter="url(#glow)">
          {/* Major city nodes */}
          {[
            { cx: 220, cy: 180, delay: "0s" },      // New York
            { cx: 280, cy: 140, delay: "0.5s" },    // Toronto
            { cx: 180, cy: 220, delay: "1s" },      // Chicago
            { cx: 550, cy: 130, delay: "0.3s" },    // London
            { cx: 590, cy: 150, delay: "0.8s" },    // Paris
            { cx: 640, cy: 140, delay: "1.2s" },    // Berlin
            { cx: 280, cy: 420, delay: "0.6s" },    // São Paulo
            { cx: 560, cy: 320, delay: "0.9s" },    // Lagos
            { cx: 750, cy: 200, delay: "0.4s" },    // Dubai
            { cx: 900, cy: 140, delay: "0.7s" },    // Beijing
            { cx: 980, cy: 180, delay: "1.1s" },    // Tokyo
            { cx: 980, cy: 480, delay: "1.3s" },    // Sydney
            { cx: 850, cy: 280, delay: "0.2s" },    // Mumbai
            { cx: 920, cy: 220, delay: "1.5s" },    // Shanghai
          ].map((node, i) => (
            <g key={i}>
              {/* Outer pulse */}
              <circle cx={node.cx} cy={node.cy} r="8" fill="none" stroke="#3b82f6" strokeWidth="1">
                <animate 
                  attributeName="r" 
                  values="4;12;4" 
                  dur="2s" 
                  begin={node.delay}
                  repeatCount="indefinite" 
                />
                <animate 
                  attributeName="opacity" 
                  values="0.6;0;0.6" 
                  dur="2s" 
                  begin={node.delay}
                  repeatCount="indefinite" 
                />
              </circle>
              {/* Inner dot */}
              <circle cx={node.cx} cy={node.cy} r="3" fill="#3b82f6" opacity="0.8">
                <animate 
                  attributeName="opacity" 
                  values="0.5;1;0.5" 
                  dur="1.5s" 
                  begin={node.delay}
                  repeatCount="indefinite" 
                />
              </circle>
            </g>
          ))}
        </g>

        {/* Subtle grid pattern */}
        <g stroke="#3b82f6" strokeWidth="0.3" strokeOpacity="0.1">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 70} x2="1200" y2={i * 70} />
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 70} y1="0" x2={i * 70} y2="800" />
          ))}
        </g>
      </svg>

      {/* Additional floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WorldMapBackground;

