/**
 * WorldMapBackground - World map with network connections background
 * Displays a professional world map with network overlay effect
 */

const WorldMapBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* CSS-based world map network effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 20%, rgba(147, 197, 253, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 30% 30%, rgba(96, 165, 250, 0.25) 0%, transparent 40%),
            radial-gradient(ellipse 60% 50% at 70% 25%, rgba(59, 130, 246, 0.2) 0%, transparent 35%),
            radial-gradient(ellipse 40% 30% at 20% 40%, rgba(147, 197, 253, 0.15) 0%, transparent 30%),
            radial-gradient(ellipse 50% 40% at 80% 35%, rgba(96, 165, 250, 0.15) 0%, transparent 35%),
            linear-gradient(180deg, rgba(239, 246, 255, 0.9) 0%, rgba(255, 255, 255, 1) 100%)
          `,
        }}
      />
      
      {/* SVG World Map Silhouette */}
      <svg
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] max-w-none h-auto opacity-[0.12]"
        viewBox="0 0 1200 600"
        style={{ maxHeight: '80vh' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="continentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        
        <g fill="url(#continentGrad)">
          {/* North America */}
          <path d="M120,70 C150,50 200,40 260,45 C320,50 370,70 400,100 C430,130 440,170 420,210 C400,250 360,280 310,300 C260,320 200,320 150,300 C100,280 70,240 60,190 C50,140 70,90 120,70 Z"/>
          <path d="M80,60 C110,40 150,35 180,50 C210,65 220,95 200,120 C180,145 140,155 105,140 C70,125 55,90 80,60 Z"/>
          <path d="M170,300 C200,285 245,290 280,310 C315,330 335,365 330,405 C325,445 295,475 255,485 C215,495 170,480 145,445 C120,410 125,355 170,300 Z"/>
          
          {/* South America */}
          <path d="M260,480 C300,455 350,465 385,500 C420,535 435,590 425,650 C415,710 380,760 330,790 C280,820 220,825 175,795 C130,765 110,710 120,650 C130,590 180,520 260,480 Z"/>
          
          {/* Greenland */}
          <path d="M380,25 C420,15 475,20 510,45 C545,70 555,105 530,135 C505,165 455,175 410,160 C365,145 340,110 345,70 C350,40 380,25 380,25 Z"/>
          
          {/* Europe */}
          <path d="M520,75 C555,55 605,50 650,65 C695,80 730,110 740,150 C750,190 735,230 700,255 C665,280 615,290 570,275 C525,260 495,225 490,180 C485,135 500,95 520,75 Z"/>
          <path d="M480,95 C505,80 545,85 565,105 C585,125 575,155 545,170 C515,185 480,175 465,150 C450,125 460,105 480,95 Z"/>
          
          {/* UK */}
          <path d="M485,70 C500,60 525,65 540,80 C555,95 550,120 530,135 C510,150 485,145 470,125 C455,105 465,80 485,70 Z"/>
          
          {/* Africa */}
          <path d="M530,270 C585,245 655,255 710,295 C765,335 800,400 805,475 C810,550 780,630 725,685 C670,740 595,765 530,745 C465,725 420,670 410,595 C400,520 450,400 530,270 Z"/>
          
          {/* Madagascar */}
          <path d="M710,540 C735,520 770,535 790,565 C810,595 805,640 780,665 C755,690 720,690 695,665 C670,640 675,585 710,540 Z"/>
          
          {/* Middle East */}
          <path d="M690,240 C735,220 795,235 830,275 C865,315 875,370 850,410 C825,450 775,470 725,455 C675,440 640,400 640,350 C640,300 660,255 690,240 Z"/>
          
          {/* Russia */}
          <path d="M710,40 C800,20 920,30 1010,65 C1100,100 1160,155 1170,220 C1180,285 1140,345 1070,380 C1000,415 910,425 830,405 C750,385 690,340 670,280 C650,220 670,140 710,80 C735,55 710,40 710,40 Z"/>
          
          {/* India */}
          <path d="M810,310 C855,290 910,305 945,345 C980,385 995,445 975,495 C955,545 910,580 860,580 C810,580 765,545 745,495 C725,445 750,375 810,310 Z"/>
          
          {/* Southeast Asia */}
          <path d="M910,400 C945,385 995,400 1025,440 C1055,480 1060,535 1035,575 C1010,615 960,635 910,620 C860,605 830,560 840,510 C850,460 875,415 910,400 Z"/>
          
          {/* China */}
          <path d="M930,200 C985,175 1060,185 1115,225 C1170,265 1200,330 1190,395 C1180,460 1135,510 1075,530 C1015,550 950,535 905,490 C860,445 845,380 870,320 C895,260 930,200 930,200 Z"/>
          
          {/* Japan */}
          <path d="M1090,190 C1115,170 1150,180 1175,205 C1200,230 1205,270 1185,300 C1165,330 1130,345 1100,330 C1070,315 1055,280 1065,245 C1075,210 1090,190 1090,190 Z"/>
          
          {/* Indonesia */}
          <path d="M960,500 C1010,480 1075,495 1120,535 C1165,575 1180,635 1155,680 C1130,725 1075,750 1020,735 C965,720 925,680 925,625 C925,570 940,520 960,500 Z"/>
          
          {/* Australia */}
          <path d="M990,580 C1050,555 1130,570 1185,615 C1240,660 1265,730 1245,795 C1225,860 1170,905 1105,915 C1040,925 975,900 935,850 C895,800 890,730 925,665 C960,600 990,580 990,580 Z"/>
          
          {/* New Zealand */}
          <path d="M1150,720 C1170,705 1200,720 1215,745 C1230,770 1220,805 1195,825 C1170,845 1140,840 1120,815 C1100,790 1115,750 1150,720 Z"/>
        </g>
      </svg>
      
      {/* Animated connection dots */}
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMin slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="dotGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Connection lines */}
        <g stroke="#3b82f6" strokeWidth="0.8" fill="none" opacity="0.15">
          <path d="M250,130 Q400,60 540,100" />
          <path d="M650,130 Q800,80 1000,180" />
          <path d="M540,130 Q600,100 700,120" />
          <path d="M280,320 Q300,420 320,550" />
          <path d="M580,250 Q600,350 620,450" />
          <path d="M850,350 Q950,420 1050,550" />
          <path d="M750,280 Q850,320 950,400" />
        </g>
        
        {/* Glowing dots */}
        <g filter="url(#dotGlow)" opacity="0.4">
          {[
            { x: 200, y: 120 }, { x: 160, y: 90 }, { x: 280, y: 150 },
            { x: 540, y: 100 }, { x: 590, y: 120 }, { x: 650, y: 110 },
            { x: 620, y: 380 }, { x: 320, y: 550 }, { x: 780, y: 280 },
            { x: 870, y: 360 }, { x: 1000, y: 220 }, { x: 1100, y: 240 },
            { x: 1080, y: 620 }, { x: 1000, y: 480 },
          ].map((dot, i) => (
            <circle key={i} cx={dot.x} cy={dot.y} r="4" fill="#3b82f6">
              <animate
                attributeName="opacity"
                values="0.3;1;0.3"
                dur={`${2 + (i % 5) * 0.5}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values="3;5;3"
                dur={`${2 + (i % 5) * 0.5}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      </svg>
      
      {/* Bottom fade to white */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-40"
        style={{
          background: 'linear-gradient(to top, white 0%, transparent 100%)',
        }}
      />
    </div>
  );
};

export default WorldMapBackground;
