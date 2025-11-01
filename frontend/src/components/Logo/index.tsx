import React from 'react';

interface LogoProps {
  size?: number; // height in pixels
  colorClassName?: string; // text color classes
}

const Logo: React.FC<LogoProps> = ({
  size = 28,
  colorClassName = 'text-gray-900',
}) => {
  // Render the custom second "O" slightly smaller for visual nuance
  const oSize = Math.round(size * 0.9);
  const strokeWidth = Math.max(2, Math.round(oSize * 0.12));

  return (
    <div
      className={`inline-flex items-center font-bold ${colorClassName}`}
      aria-label='Angry Queers'
    >
      <span style={{ fontSize: size, lineHeight: 1 }}>R</span>
      <span style={{ fontSize: size, lineHeight: 1, marginLeft: 2 }}>O</span>
      {/* Custom second O with NW quadrant removed - drawn as partial arcs (no overlay) */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          margin: '0 2px',
          lineHeight: 1,
        }}
      >
        <svg
          width={oSize}
          height={oSize}
          viewBox={`0 0 ${oSize} ${oSize}`}
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden='true'
        >
          {(() => {
            const cx = oSize / 2;
            const cy = oSize / 2;
            const r = (oSize - strokeWidth) / 2;
            // Key points
            const top = `${cx} ${cy - r}`; // 270°
            const right = `${cx + r} ${cy}`; // 0°
            const left = `${cx - r} ${cy}`; // 180°
            // Two arcs: 270°->360° (top to right), then 0°->180° (right to left)
            const d = [
              `M ${top}`,
              `A ${r} ${r} 0 0 1 ${right}`,
              `A ${r} ${r} 0 0 1 ${left}`,
            ].join(' ');
            return (
              <path
                d={d}
                fill='none'
                stroke='currentColor'
                strokeWidth={strokeWidth}
                strokeLinecap='round'
              />
            );
          })()}
        </svg>
      </span>
      <span style={{ fontSize: size, lineHeight: 1, marginLeft: 2 }}>T</span>
    </div>
  );
};

export default Logo;
