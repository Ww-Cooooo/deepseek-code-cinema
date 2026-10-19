import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT} from './font';
import {ease, phase, progress} from './motion';

/**
 * Neutral 2.5D graphics track. It is a tool check, not a visual template:
 * flat layers, a frame-driven camera move, occlusion via z-order and shadows.
 */
export const GraphicsSample: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig();
  const p = progress(frame, durationInFrames);
  const travel = ease(phase(p, 0.03, 0.96));
  const late = ease(phase(p, 0.35, 0.9));
  const pan = 45 - 120 * travel;
  const zoom = 1.02 + 0.06 * travel;
  const lineGrow = 0.2 + 0.8 * ease(phase(p, 0.2, 0.8));

  return (
    <AbsoluteFill style={{background: '#c9ced3', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(58% 58% at 72% 16%, rgba(255,255,255,0.9), rgba(255,255,255,0) 62%), linear-gradient(145deg, #d9dcdf 0%, #c8cdd2 52%, #b5bcc3 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(80% 80% at 50% 112%, rgba(27,33,40,0.22), rgba(27,33,40,0) 62%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 1920,
          height: 1080,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${width / 1920}, ${height / 1080})`,
          transformOrigin: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${pan}px, ${-12 * travel}px) scale(${zoom}) rotate(${0.8 * travel}deg)`,
            transformOrigin: '50% 50%',
          }}
        >
          {/* Floor grid: depth without a paper texture. */}
          <div
            style={{
              position: 'absolute',
              left: 190,
              top: 620,
              width: 1540,
              height: 520,
              opacity: 0.5,
              transform: `perspective(760px) rotateX(62deg) translateX(${pan * 0.16}px)`,
              transformOrigin: '50% 0%',
              backgroundImage:
                'linear-gradient(rgba(45,52,60,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(45,52,60,0.18) 1px, transparent 1px)',
              backgroundSize: '52px 52px',
              maskImage: 'linear-gradient(to bottom, transparent, black 22%, black 72%, transparent)',
            }}
          />

          {/* Back layer. */}
          <div
            style={{
              position: 'absolute',
              left: 96,
              top: 150,
              width: 730,
              height: 620,
              borderRadius: 34,
              background: 'linear-gradient(150deg, #aab2ba, #8c97a1)',
              boxShadow: '0 42px 90px rgba(28,35,43,0.22)',
              transform: `translate(${pan * 0.2}px, ${6 * travel}px) rotate(-8deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 1060,
              top: 82,
              width: 610,
              height: 610,
              borderRadius: '50%',
              border: '54px solid #3e4955',
              boxShadow: 'inset 12px 16px 30px rgba(255,255,255,0.12), 0 36px 80px rgba(28,35,43,0.2)',
              opacity: 0.94,
              transform: `translate(${pan * 0.16}px, ${-8 * travel}px) rotate(${20 + 42 * late}deg)`,
            }}
          />

          {/* Mid layer: these overlaps carry the occlusion/depth read. */}
          <div
            style={{
              position: 'absolute',
              left: 900,
              top: 452,
              width: 600,
              height: 316,
              background: 'linear-gradient(160deg, #eef0f2, #d4d9dd)',
              border: '2px solid rgba(35,42,49,0.14)',
              boxShadow: '0 34px 70px rgba(28,35,43,0.18)',
              transform: `translate(${pan * 0.5 + 34 * travel}px, ${-16 * travel}px) rotate(6deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 724,
              top: 372,
              width: 286,
              height: 286,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 34% 28%, #6b7580, #2b3239 68%, #1c2127)',
              boxShadow: '0 46px 80px rgba(24,30,36,0.32)',
              transform: `translate(${pan * 0.68}px, ${-26 * travel}px)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 540,
              top: 286,
              width: 68,
              height: 384,
              background: 'linear-gradient(180deg, #333b43, #20262c)',
              boxShadow: '18px 28px 50px rgba(24,30,36,0.22)',
              transform: `translate(${pan * 0.58}px, ${18 * travel}px) rotate(-12deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 1180 - 88 * late,
              top: 574 - 34 * late,
              width: 128,
              height: 128,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 36% 30%, #8ea6bd, #4a6279 64%, #2f4052)',
              boxShadow: '0 24px 44px rgba(30,40,52,0.26)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 1034,
              top: 624,
              width: 390,
              height: 390,
              borderRadius: '50%',
              border: '26px solid #4d5b68',
              opacity: 0.82,
              transform: `translate(${pan * 0.82}px, ${-10 * travel}px) rotate(${12 + 56 * late}deg) scaleY(0.9)`,
            }}
          />

          {/* Front layer: a bar and an accent line cross in front of the shapes. */}
          <div
            style={{
              position: 'absolute',
              left: 286 - 46 * travel,
              top: 700,
              width: 560,
              height: 80,
              background: 'linear-gradient(180deg, #2b3239, #1e242a)',
              boxShadow: '0 26px 44px rgba(24,30,36,0.24)',
              transform: `rotate(-3deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 348,
              top: 748,
              width: 720 * lineGrow,
              height: 5,
              background: '#3f6285',
              opacity: 0.9,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 1118,
              top: 182,
              width: 278,
              height: 250,
              clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
              background: 'linear-gradient(160deg, #f0f2f4, #cfd5da)',
              opacity: 0.94,
              transform: `translate(${pan * 0.92}px, ${24 * travel}px) rotate(${-8 + 4 * travel}deg)`,
            }}
          />
        </div>

        {/* HTML overlay: deliberately outside the transformed graphics stage. */}
        <div
          style={{
            position: 'absolute',
            left: 98,
            top: 62,
            fontFamily: FONT,
            fontSize: 22,
            letterSpacing: 3,
            color: '#3c454e',
          }}
        >
          CODE TO VIDEO · 6s 工具检查
        </div>
        <div
          style={{
            position: 'absolute',
            right: 96,
            top: 62,
            fontFamily: FONT,
            fontSize: 20,
            letterSpacing: 2,
            color: '#4d5761',
          }}
        >
          2.5D / GRAPHICS
        </div>
        <div
          style={{
            position: 'absolute',
            left: 98,
            bottom: 86,
            fontFamily: FONT,
            color: '#20262c',
          }}
        >
          <div style={{fontSize: 78, fontWeight: 650, letterSpacing: 2, lineHeight: 1}}>
            图形 / GRAPHICS
          </div>
          <div style={{fontSize: 27, marginTop: 18, color: '#4a545e', letterSpacing: 1}}>
            中性灰 · 2.5D · 帧驱动
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 98,
            bottom: 92,
            width: 214,
            borderTop: '2px solid rgba(32,38,44,0.55)',
            paddingTop: 14,
            fontFamily: FONT,
            fontSize: 20,
            letterSpacing: 2,
            color: '#3c454e',
            textAlign: 'right',
          }}
        >
          06s / LOOP-FREE
        </div>
      </div>
    </AbsoluteFill>
  );
};
