import React from 'react';
import {Landscape} from '../scene/Landscape';
import {LightPath} from '../scene/LightPath';
import {Starfield} from '../scene/Starfield';

export const SeaWorld: React.FC<{
  seconds: number;
  pulse?: boolean;
  showLightPath?: boolean;
}> = ({seconds, pulse = true, showLightPath = true}) => (
  <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0}}>
    <Landscape seconds={seconds} pulse={pulse} />
    <Starfield seconds={seconds} />
    {showLightPath ? <LightPath seconds={seconds} /> : null}
  </svg>
);
