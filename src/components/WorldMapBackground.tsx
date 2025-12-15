/**
 * WorldMapBackground - A realistic world map with network connections
 * Creates a professional tech-inspired background effect
 */

import worldMapSvg from "@/assets/world-map.svg";

const WorldMapBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* World Map Image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${worldMapSvg})`,
          backgroundSize: '120% auto',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.5,
        }}
      />

      {/* Network connection lines and nodes */}
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMin slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Animated connection lines */}
        <g stroke="#3b82f6" strokeWidth="1.5" fill="none">
          {/* North America to Europe */}
          <path d="M250,150 Q400,80 520,120" opacity="0.3">
            <animate attributeName="opacity" values="0.15;0.5;0.15" dur="4s" repeatCount="indefinite" />
          </path>
          
          {/* Europe to Asia */}
          <path d="M650,150 Q800,100 1000,200" opacity="0.3">
            <animate attributeName="opacity" values="0.15;0.5;0.15" dur="5s" repeatCount="indefinite" />
          </path>
          
          {/* North America to South America */}
          <path d="M280,320 Q300,400 310,500" opacity="0.3">
            <animate attributeName="opacity" values="0.15;0.4;0.15" dur="3.5s" repeatCount="indefinite" />
          </path>
          
          {/* Europe to Africa */}
          <path d="M580,200 Q600,280 620,380" opacity="0.3">
            <animate attributeName="opacity" values="0.15;0.4;0.15" dur="4.5s" repeatCount="indefinite" />
          </path>
          
          {/* Asia to Australia */}
          <path d="M1000,400 Q1050,480 1080,550" opacity="0.3">
            <animate attributeName="opacity" values="0.15;0.4;0.15" dur="3s" repeatCount="indefinite" />
          </path>
          
          {/* Middle East connections */}
          <path d="M750,280 Q850,320 920,380" opacity="0.25">
            <animate attributeName="opacity" values="0.1;0.35;0.1" dur="6s" repeatCount="indefinite" />
          </path>
        </g>

        {/* City nodes with pulsing effect */}
        <g filter="url(#nodeGlow)">
          {[
            { cx: 200, cy: 140, label: "NYC" },
            { cx: 160, cy: 110, label: "TOR" },
            { cx: 520, cy: 110, label: "LON" },
            { cx: 580, cy: 130, label: "PAR" },
            { cx: 640, cy: 120, label: "BER" },
            { cx: 1050, cy: 220, label: "TOK" },
            { cx: 1080, cy: 580, label: "SYD" },
            { cx: 620, cy: 400, label: "LAG" },
            { cx: 320, cy: 550, label: "SAO" },
            { cx: 780, cy: 290, label: "DXB" },
            { cx: 880, cy: 380, label: "MUM" },
            { cx: 1000, cy: 280, label: "BEI" },
          ].map((node, i) => (
            <g key={i}>
              {/* Outer pulse ring */}
              <circle 
                cx={node.cx} 
                cy={node.cy} 
                r="4" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="1.5"
              >
                <animate 
                  attributeName="r" 
                  values="4;12;4" 
                  dur={`${2 + (i % 4) * 0.5}s`}
                  repeatCount="indefinite" 
                />
                <animate 
                  attributeName="opacity" 
                  values="0.6;0;0.6" 
                  dur={`${2 + (i % 4) * 0.5}s`}
                  repeatCount="indefinite" 
                />
              </circle>
              {/* Inner dot */}
              <circle 
                cx={node.cx} 
                cy={node.cy} 
                r="4" 
                fill="#3b82f6"
                opacity="0.7"
              >
                <animate 
                  attributeName="opacity" 
                  values="0.5;0.9;0.5" 
                  dur={`${1.5 + (i % 3) * 0.3}s`}
                  repeatCount="indefinite" 
                />
              </circle>
            </g>
          ))}
        </g>
      </svg>

      {/* Very subtle bottom fade only - NOT affecting top content */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(255,255,255,0.8), transparent)',
        }}
      />
    </div>
  );
};

export default WorldMapBackground;
