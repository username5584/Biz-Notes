import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Circle, Ellipse, Line, Path, Polyline, Rect, Svg } from 'react-native-svg';

export type IconName =
  | 'search'
  | 'settings'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'trash-2'
  | 'plus'
  | 'calendar'
  | 'clock'
  | 'file-text'
  | 'check'
  | 'info'
  | 'database'
  | 'folder'
  | 'x'
  | 'cloud-upload'
  | 'cloud-download'
  | 'refresh-cw'
  | 'link'
  | 'key'
  | 'alert-circle'
  | 'edit-3';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

interface StrokeProps {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: string;
}

const strokePropsCache = new Map<string, StrokeProps>();

function makeStroke(color: string): StrokeProps {
  const cached = strokePropsCache.get(color);
  if (cached) return cached;
  
  const props: StrokeProps = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  };
  strokePropsCache.set(color, props);
  return props;
}

const iconCache = new Map<string, React.ReactNode>();

function renderIcon(name: IconName, p: StrokeProps): React.ReactNode {
  const cacheKey = `${name}:${p.stroke}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;

  let result: React.ReactNode;
  
  switch (name) {
    case 'search':
      result = (
        <>
          <Circle cx="11" cy="11" r="8" {...p} />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" {...p} />
        </>
      );
      break;
    case 'settings':
      result = (
        <>
          <Circle cx="12" cy="12" r="3" {...p} />
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" {...p} />
        </>
      );
      break;
    case 'chevron-left':
      result = <Polyline points="15 18 9 12 15 6" {...p} />;
      break;
    case 'chevron-right':
      result = <Polyline points="9 18 15 12 9 6" {...p} />;
      break;
    case 'chevron-up':
      result = <Polyline points="18 15 12 9 6 15" {...p} />;
      break;
    case 'chevron-down':
      result = <Polyline points="6 9 12 15 18 9" {...p} />;
      break;
    case 'trash-2':
      result = (
        <>
          <Polyline points="3 6 5 6 21 6" {...p} />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...p} />
          <Line x1="10" y1="11" x2="10" y2="17" {...p} />
          <Line x1="14" y1="11" x2="14" y2="17" {...p} />
        </>
      );
      break;
    case 'plus':
      result = (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" {...p} />
          <Line x1="5" y1="12" x2="19" y2="12" {...p} />
        </>
      );
      break;
    case 'calendar':
      result = (
        <>
          <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" {...p} />
          <Line x1="16" y1="2" x2="16" y2="6" {...p} />
          <Line x1="8" y1="2" x2="8" y2="6" {...p} />
          <Line x1="3" y1="10" x2="21" y2="10" {...p} />
        </>
      );
      break;
    case 'clock':
      result = (
        <>
          <Circle cx="12" cy="12" r="10" {...p} />
          <Polyline points="12 6 12 12 16 14" {...p} />
        </>
      );
      break;
    case 'file-text':
      result = (
        <>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...p} />
          <Polyline points="14 2 14 8 20 8" {...p} />
          <Line x1="16" y1="13" x2="8" y2="13" {...p} />
          <Line x1="16" y1="17" x2="8" y2="17" {...p} />
          <Polyline points="10 9 9 9 8 9" {...p} />
        </>
      );
      break;
    case 'check':
      result = <Polyline points="20 6 9 20 4 14" {...p} />;
      break;
    case 'info':
      result = (
        <>
          <Circle cx="12" cy="12" r="10" {...p} />
          <Line x1="12" y1="8" x2="12" y2="12" {...p} />
          <Line x1="12" y1="16" x2="12.01" y2="16" {...p} />
        </>
      );
      break;
    case 'database':
      result = (
        <>
          <Ellipse cx="12" cy="5" rx="9" ry="3" {...p} />
          <Path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" {...p} />
          <Path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" {...p} />
        </>
      );
      break;
    case 'folder':
      result = (
        <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" {...p} />
      );
      break;
    case 'x':
      result = (
        <>
          <Line x1="18" y1="6" x2="6" y2="18" {...p} />
          <Line x1="6" y1="6" x2="18" y2="18" {...p} />
        </>
      );
      break;
    case 'cloud-upload':
      result = (
        <>
          <Polyline points="16 16 12 12 8 16" {...p} />
          <Line x1="12" y1="12" x2="12" y2="21" {...p} />
          <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" {...p} />
        </>
      );
      break;
    case 'cloud-download':
      result = (
        <>
          <Polyline points="8 17 12 21 16 17" {...p} />
          <Line x1="12" y1="12" x2="12" y2="21" {...p} />
          <Path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" {...p} />
        </>
      );
      break;
    case 'refresh-cw':
      result = (
        <>
          <Polyline points="23 4 23 10 17 10" {...p} />
          <Polyline points="1 20 1 14 7 14" {...p} />
          <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" {...p} />
        </>
      );
      break;
    case 'link':
      result = (
        <>
          <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" {...p} />
          <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" {...p} />
        </>
      );
      break;
    case 'key':
      result = (
        <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" {...p} />
      );
      break;
    case 'alert-circle':
      result = (
        <>
          <Circle cx="12" cy="12" r="10" {...p} />
          <Line x1="12" y1="8" x2="12" y2="12" {...p} />
          <Line x1="12" y1="16" x2="12.01" y2="16" {...p} />
        </>
      );
      break;
    case 'edit-3':
      result = (
        <>
          <Path d="M12 20h9" {...p} />
          <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" {...p} />
        </>
      );
      break;
    default:
      result = null;
  }

  iconCache.set(cacheKey, result);
  return result;
}

export function Icon({ name, size = 24, color = '#1A1918', style }: IconProps) {
  const strokeProps = makeStroke(color);
  const iconContent = useMemo(() => renderIcon(name, strokeProps), [name, color]);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style as StyleProp<ViewStyle>}>
      {iconContent}
    </Svg>
  );
}
