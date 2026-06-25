import {
  type CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ShaderDisplacementGenerator, fragmentShaders } from './shader-utils';
import { displacementMap, polarDisplacementMap, prominentDisplacementMap } from './utils';

// Generate shader-based displacement map using shaderUtils
const generateShaderDisplacementMap = (width: number, height: number): string => {
  const generator = new ShaderDisplacementGenerator({
    width,
    height,
    fragment: fragmentShaders.liquidGlass,
  });

  const dataUrl = generator.updateShader();
  generator.destroy();

  return dataUrl;
};

const getMap = (mode: 'standard' | 'polar' | 'prominent' | 'shader', shaderMapUrl?: string) => {
  switch (mode) {
    case 'standard':
      return displacementMap;
    case 'polar':
      return polarDisplacementMap;
    case 'prominent':
      return prominentDisplacementMap;
    case 'shader':
      return shaderMapUrl || displacementMap;
    default:
      throw new Error(`Invalid mode: ${mode}`);
  }
};

type GlassSizeValue = number | string;

type GlassSizeInput = {
  width?: GlassSizeValue;
  height?: GlassSizeValue;
};

const toCssSize = (value: GlassSizeValue | undefined) => {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
};

/* ---------- SVG filter (edge-only displacement) ---------- */
const GlassFilter: React.FC<{
  id: string;
  displacementScale: number;
  aberrationIntensity: number;
  width: number;
  height: number;
  mode: 'standard' | 'polar' | 'prominent' | 'shader';
  shaderMapUrl?: string;
}> = ({ id, displacementScale, aberrationIntensity, width, height, mode, shaderMapUrl }) => (
  <svg style={{ position: 'absolute', top: 0, left: 0, width, height, pointerEvents: 'none' }} aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-edge-mask`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="black" stopOpacity="0" />
        <stop offset={`${Math.max(30, 80 - aberrationIntensity * 2)}%`} stopColor="black" stopOpacity="0" />
        <stop offset="100%" stopColor="white" stopOpacity="1" />
      </radialGradient>
      <filter id={id} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
        <feImage
          id="feimage"
          x="0"
          y="0"
          width="100%"
          height="100%"
          result="DISPLACEMENT_MAP"
          href={getMap(mode, shaderMapUrl)}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Create edge mask using the displacement map itself */}
        <feColorMatrix
          in="DISPLACEMENT_MAP"
          type="matrix"
          values="0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0 0 0 1 0"
          result="EDGE_INTENSITY"
        />
        <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
          <feFuncA type="discrete" tableValues={`0 ${aberrationIntensity * 0.05} 1`} />
        </feComponentTransfer>

        {/* Original undisplaced image for center */}
        <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />

        {/* Red channel displacement with slight offset */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          scale={displacementScale * (mode === 'shader' ? 1 : -1)}
          xChannelSelector="R"
          yChannelSelector="B"
          result="RED_DISPLACED"
        />
        <feColorMatrix
          in="RED_DISPLACED"
          type="matrix"
          values="1 0 0 0 0
                 0 0 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
          result="RED_CHANNEL"
        />

        {/* Green channel displacement */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          scale={displacementScale * ((mode === 'shader' ? 1 : -1) - aberrationIntensity * 0.05)}
          xChannelSelector="R"
          yChannelSelector="B"
          result="GREEN_DISPLACED"
        />
        <feColorMatrix
          in="GREEN_DISPLACED"
          type="matrix"
          values="0 0 0 0 0
                 0 1 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
          result="GREEN_CHANNEL"
        />

        {/* Blue channel displacement with slight offset */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          scale={displacementScale * ((mode === 'shader' ? 1 : -1) - aberrationIntensity * 0.1)}
          xChannelSelector="R"
          yChannelSelector="B"
          result="BLUE_DISPLACED"
        />
        <feColorMatrix
          in="BLUE_DISPLACED"
          type="matrix"
          values="0 0 0 0 0
                 0 0 0 0 0
                 0 0 1 0 0
                 0 0 0 1 0"
          result="BLUE_CHANNEL"
        />

        {/* Combine all channels with screen blend mode for chromatic aberration */}
        <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED" />
        <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" result="RGB_COMBINED" />

        {/* Add slight blur to soften the aberration effect */}
        <feGaussianBlur
          in="RGB_COMBINED"
          stdDeviation={Math.max(0.1, 0.5 - aberrationIntensity * 0.1)}
          result="ABERRATED_BLURRED"
        />

        {/* Apply edge mask to aberration effect */}
        <feComposite in="ABERRATED_BLURRED" in2="EDGE_MASK" operator="in" result="EDGE_ABERRATION" />

        {/* Create inverted mask for center */}
        <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
          <feFuncA type="table" tableValues="1 0" />
        </feComponentTransfer>
        <feComposite in="CENTER_ORIGINAL" in2="INVERTED_MASK" operator="in" result="CENTER_CLEAN" />

        {/* Combine edge aberration with clean center */}
        <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
      </filter>
    </defs>
  </svg>
);

/* ---------- container ---------- */
const GlassContainer = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<{
    className?: string;
    style?: React.CSSProperties;
    displacementScale?: number;
    blurAmount?: number;
    saturation?: number;
    aberrationIntensity?: number;
    mouseOffset?: { x: number; y: number };
    onMouseLeave?: () => void;
    onMouseEnter?: () => void;
    onMouseDown?: () => void;
    onMouseUp?: () => void;
    active?: boolean;
    overLight?: boolean;
    cornerRadius?: number;
    padding?: string;
    glassSize?: { width: number; height: number };
    fillWidth?: boolean;
    fillHeight?: boolean;
    onClick?: () => void;
    mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  }>
>(
  (
    {
      children,
      className = '',
      style,
      displacementScale = 25,
      blurAmount = 12,
      saturation = 180,
      aberrationIntensity = 2,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      active = false,
      overLight = false,
      cornerRadius = 999,
      padding = '24px 32px',
      glassSize = { width: 270, height: 69 },
      fillWidth = false,
      fillHeight = false,
      onClick,
      mode = 'standard',
    },
    ref,
  ) => {
    const filterId = useId();
    const [shaderMapUrl, setShaderMapUrl] = useState<string>('');

    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

    // Generate shader displacement map when in shader mode
    useEffect(() => {
      if (mode === 'shader') {
        const url = generateShaderDisplacementMap(glassSize.width, glassSize.height);
        setShaderMapUrl(url);
      }
    }, [mode, glassSize.width, glassSize.height]);

    const backdropStyle = {
      filter: isFirefox ? null : `url(#${filterId})`,
      backdropFilter: `blur(${(overLight ? 12 : 4) + blurAmount * 32}px) saturate(${saturation}%)`,
    };

    return (
      <div
        ref={ref}
        className={`${className} ${active ? 'active' : ''}`}
        style={{ position: 'relative', ...style, cursor: onClick ? 'pointer' : style?.cursor }}
        onClick={onClick}
      >
        <GlassFilter
          mode={mode}
          id={filterId}
          displacementScale={displacementScale}
          aberrationIntensity={aberrationIntensity}
          width={glassSize.width}
          height={glassSize.height}
          shaderMapUrl={shaderMapUrl}
        />

        <div
          className="glass"
          style={{
            borderRadius: `${cornerRadius}px`,
            position: 'relative',
            display: 'inline-flex',
            width: fillWidth ? '100%' : undefined,
            height: fillHeight ? '100%' : undefined,
            alignItems: 'center',
            gap: '24px',
            padding,
            overflow: 'hidden',
            transition: 'all 0.2s ease-in-out',
            boxShadow: overLight ? '0px 16px 70px rgba(0, 0, 0, 0.75)' : '0px 12px 40px rgba(0, 0, 0, 0.25)',
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          {/* backdrop layer that gets wiggly */}
          <span
            className="glass__warp"
            style={
              {
                ...backdropStyle,
                position: 'absolute',
                inset: '0',
              } as CSSProperties
            }
          />

          {/* user content stays sharp */}
          <div
            data-liquid-glass-content="true"
            style={{
              position: 'relative',
              zIndex: 1,
              flex: fillWidth || fillHeight ? '1 1 auto' : undefined,
              width: fillWidth ? '100%' : undefined,
              height: fillHeight ? '100%' : undefined,
              minWidth: fillWidth ? 0 : undefined,
              minHeight: fillHeight ? 0 : undefined,
              font: '500 20px/1 system-ui',
              color: '#fff',
              textShadow: overLight ? '0px 2px 12px rgba(0, 0, 0, 0)' : '0px 2px 12px rgba(0, 0, 0, 0.4)',
              transition: 'all 150ms ease-in-out',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);

GlassContainer.displayName = 'GlassContainer';

interface LiquidGlassProps {
  children: React.ReactNode;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  globalMousePos?: { x: number; y: number };
  mouseOffset?: { x: number; y: number };
  mouseContainer?: React.RefObject<HTMLElement | null> | null;
  className?: string;
  padding?: string;
  style?: React.CSSProperties;
  overLight?: boolean;
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  inline?: boolean;
  glassSize?: GlassSizeInput;
  onClick?: () => void;
}

export default function LiquidGlass({
  children,
  displacementScale = 100,
  blurAmount = 0.5,
  saturation = 140,
  aberrationIntensity = 2,
  elasticity = 0,
  cornerRadius = 18,
  globalMousePos: externalGlobalMousePos,
  mouseOffset: externalMouseOffset,
  mouseContainer = null,
  className = '',
  padding = '24px 32px',
  overLight = false,
  style = {},
  mode = 'standard',
  inline = false,
  glassSize: glassSizeProp,
  onClick,
}: LiquidGlassProps) {
  const glassRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [glassSize, setGlassSize] = useState({ width: 270, height: 69 });
  const [internalGlobalMousePos, setInternalGlobalMousePos] = useState({ x: 0, y: 0 });
  const [internalMouseOffset, setInternalMouseOffset] = useState({ x: 0, y: 0 });

  // Use external mouse position if provided, otherwise use internal
  const globalMousePos = externalGlobalMousePos || internalGlobalMousePos;
  const mouseOffset = externalMouseOffset || internalMouseOffset;

  // Internal mouse tracking
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const container = mouseContainer?.current || glassRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      setInternalMouseOffset({
        x: ((e.clientX - centerX) / rect.width) * 100,
        y: ((e.clientY - centerY) / rect.height) * 100,
      });

      setInternalGlobalMousePos({
        x: e.clientX,
        y: e.clientY,
      });
    },
    [mouseContainer],
  );

  // Set up mouse tracking if no external mouse position is provided
  useLayoutEffect(() => {
    if (externalGlobalMousePos && externalMouseOffset) {
      // External mouse tracking is provided, don't set up internal tracking
      return;
    }

    const container = mouseContainer?.current || glassRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove, mouseContainer, externalGlobalMousePos, externalMouseOffset]);

  // Calculate directional scaling based on mouse position
  const calculateDirectionalScale = useCallback(() => {
    if (!globalMousePos.x || !globalMousePos.y || !glassRef.current) {
      return 'scale(1)';
    }

    const rect = glassRef.current.getBoundingClientRect();
    const pillCenterX = rect.left + rect.width / 2;
    const pillCenterY = rect.top + rect.height / 2;
    const pillWidth = glassSize.width;
    const pillHeight = glassSize.height;

    const deltaX = globalMousePos.x - pillCenterX;
    const deltaY = globalMousePos.y - pillCenterY;

    // Calculate distance from mouse to pill edges (not center)
    const edgeDistanceX = Math.max(0, Math.abs(deltaX) - pillWidth / 2);
    const edgeDistanceY = Math.max(0, Math.abs(deltaY) - pillHeight / 2);
    const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);

    // Activation zone: 200px from edges
    const activationZone = 200;

    // If outside activation zone, no effect
    if (edgeDistance > activationZone) {
      return 'scale(1)';
    }

    // Calculate fade-in factor (1 at edge, 0 at activation zone boundary)
    const fadeInFactor = 1 - edgeDistance / activationZone;

    // Normalize the deltas for direction
    const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (centerDistance === 0) {
      return 'scale(1)';
    }

    const normalizedX = deltaX / centerDistance;
    const normalizedY = deltaY / centerDistance;

    // Calculate stretch factors with fade-in
    const stretchIntensity = Math.min(centerDistance / 300, 1) * elasticity * fadeInFactor;

    // X-axis scaling: stretch horizontally when moving left/right, compress when moving up/down
    const scaleX = 1 + Math.abs(normalizedX) * stretchIntensity * 0.3 - Math.abs(normalizedY) * stretchIntensity * 0.15;

    // Y-axis scaling: stretch vertically when moving up/down, compress when moving left/right
    const scaleY = 1 + Math.abs(normalizedY) * stretchIntensity * 0.3 - Math.abs(normalizedX) * stretchIntensity * 0.15;

    return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`;
  }, [globalMousePos, elasticity, glassSize]);

  // Helper function to calculate fade-in factor based on distance from element edges
  const calculateFadeInFactor = useCallback(() => {
    if (!globalMousePos.x || !globalMousePos.y || !glassRef.current) {
      return 0;
    }

    const rect = glassRef.current.getBoundingClientRect();
    const pillCenterX = rect.left + rect.width / 2;
    const pillCenterY = rect.top + rect.height / 2;
    const pillWidth = glassSize.width;
    const pillHeight = glassSize.height;

    const edgeDistanceX = Math.max(0, Math.abs(globalMousePos.x - pillCenterX) - pillWidth / 2);
    const edgeDistanceY = Math.max(0, Math.abs(globalMousePos.y - pillCenterY) - pillHeight / 2);
    const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);

    const activationZone = 200;
    return edgeDistance > activationZone ? 0 : 1 - edgeDistance / activationZone;
  }, [globalMousePos, glassSize]);

  // Helper function to calculate elastic translation
  const calculateElasticTranslation = useCallback(() => {
    if (!glassRef.current) {
      return { x: 0, y: 0 };
    }

    const fadeInFactor = calculateFadeInFactor();
    const rect = glassRef.current.getBoundingClientRect();
    const pillCenterX = rect.left + rect.width / 2;
    const pillCenterY = rect.top + rect.height / 2;

    return {
      x: (globalMousePos.x - pillCenterX) * elasticity * 0.1 * fadeInFactor,
      y: (globalMousePos.y - pillCenterY) * elasticity * 0.1 * fadeInFactor,
    };
  }, [globalMousePos, elasticity, calculateFadeInFactor]);

  const hasExplicitWidth = glassSizeProp?.width !== undefined || style.width !== undefined;
  const hasExplicitHeight = glassSizeProp?.height !== undefined || style.height !== undefined;

  // Update glass size whenever component mounts, viewport changes, or responsive CSS changes.
  useLayoutEffect(() => {
    let animationFrame = 0;

    const updateGlassSize = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const container = glassRef.current;
        if (!container) return;

        const glassElement = container.querySelector<HTMLElement>('.glass');
        const contentElement = container.querySelector<HTMLElement>('[data-liquid-glass-content]');
        const widthElement = hasExplicitWidth ? glassElement || container : contentElement || glassElement || container;
        const heightElement = hasExplicitHeight
          ? glassElement || container
          : contentElement || glassElement || container;
        const widthRect = widthElement.getBoundingClientRect();
        const heightRect = heightElement.getBoundingClientRect();
        const width = Math.round(widthElement.offsetWidth || widthRect.width);
        const height = Math.round(heightElement.offsetHeight || heightRect.height);
        if (!width || !height) return;

        setGlassSize((current) => {
          if (current.width === width && current.height === height) return current;
          return { width, height };
        });
      });
    };

    updateGlassSize();
    const observer = new ResizeObserver(updateGlassSize);
    if (glassRef.current) {
      observer.observe(glassRef.current);
      const glassElement = glassRef.current.querySelector<HTMLElement>('.glass');
      const contentElement = glassRef.current.querySelector<HTMLElement>('[data-liquid-glass-content]');
      if (glassElement) observer.observe(glassElement);
      if (contentElement) observer.observe(contentElement);
    }

    window.addEventListener('resize', updateGlassSize);
    window.addEventListener('orientationchange', updateGlassSize);
    document.fonts?.ready.then(updateGlassSize).catch(() => undefined);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener('resize', updateGlassSize);
      window.removeEventListener('orientationchange', updateGlassSize);
    };
  }, [
    children,
    glassSizeProp?.height,
    glassSizeProp?.width,
    hasExplicitHeight,
    hasExplicitWidth,
    style.height,
    style.width,
  ]);

  const directionalTransform = isActive && Boolean(onClick) ? 'scale(0.96)' : calculateDirectionalScale();
  const elasticTranslation = calculateElasticTranslation();
  const transformOffset = inline ? '0%' : '-50%';
  const transformStyle = `translate(calc(${transformOffset} + ${elasticTranslation.x}px), calc(${transformOffset} + ${elasticTranslation.y}px)) ${directionalTransform}`;
  const cssWidth = toCssSize(glassSizeProp?.width) ?? style.width;
  const cssHeight = toCssSize(glassSizeProp?.height) ?? style.height;

  const baseStyle = {
    ...style,
    width: cssWidth,
    height: cssHeight,
    transform: transformStyle,
    transition: 'all ease-out 0.2s',
  };

  const positionStyles = {
    position: baseStyle.position || (inline ? 'static' : 'relative'),
    top: baseStyle.top || '50%',
    left: baseStyle.left || '50%',
  };

  const layerStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    height: glassSize.height,
    width: glassSize.width,
    borderRadius: `${cornerRadius}px`,
    transform: baseStyle.transform,
    transition: baseStyle.transition,
    pointerEvents: 'none' as const,
  };

  return (
    <div
      style={{
        ...positionStyles,
        width: glassSize.width,
        height: glassSize.height,
      }}
    >
      {/* Over light effect */}
      <div
        style={{
          ...layerStyle,
          opacity: overLight ? 0.2 : 0,
          background: '#000',
        }}
      />
      <div
        style={{
          ...layerStyle,
          opacity: overLight ? 1 : 0,
          background: '#000',
          mixBlendMode: 'overlay',
        }}
      />

      <GlassContainer
        ref={glassRef}
        className={className}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: cssWidth,
          height: cssHeight,
          transform: baseStyle.transform,
          transition: baseStyle.transition,
        }}
        cornerRadius={cornerRadius}
        displacementScale={overLight ? displacementScale * 0.5 : displacementScale}
        blurAmount={blurAmount}
        saturation={saturation}
        aberrationIntensity={aberrationIntensity}
        glassSize={glassSize}
        fillWidth={hasExplicitWidth}
        fillHeight={hasExplicitHeight}
        padding={padding}
        mouseOffset={mouseOffset}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        active={isActive}
        overLight={overLight}
        onClick={onClick}
        mode={mode}
      >
        {children}
      </GlassContainer>

      {/* Border layer 1 - extracted from glass container */}
      <span
        style={{
          ...layerStyle,
          mixBlendMode: 'screen',
          opacity: 0.2,
          padding: '1.5px',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          boxShadow:
            '0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)',
          background: `linear-gradient(
          ${135 + mouseOffset.x * 1.2}deg,
          rgba(255, 255, 255, 0.0) 0%,
          rgba(255, 255, 255, ${0.12 + Math.abs(mouseOffset.x) * 0.008}) ${Math.max(10, 33 + mouseOffset.y * 0.3)}%,
          rgba(255, 255, 255, ${0.4 + Math.abs(mouseOffset.x) * 0.012}) ${Math.min(90, 66 + mouseOffset.y * 0.4)}%,
          rgba(255, 255, 255, 0.0) 100%
        )`,
        }}
      />

      {/* Border layer 2 - duplicate with mix-blend-overlay */}
      <span
        style={{
          ...layerStyle,
          mixBlendMode: 'overlay',
          padding: '1.5px',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          boxShadow:
            '0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)',
          background: `linear-gradient(
          ${135 + mouseOffset.x * 1.2}deg,
          rgba(255, 255, 255, 0.0) 0%,
          rgba(255, 255, 255, ${0.32 + Math.abs(mouseOffset.x) * 0.008}) ${Math.max(10, 33 + mouseOffset.y * 0.3)}%,
          rgba(255, 255, 255, ${0.6 + Math.abs(mouseOffset.x) * 0.012}) ${Math.min(90, 66 + mouseOffset.y * 0.4)}%,
          rgba(255, 255, 255, 0.0) 100%
        )`,
        }}
      />

      {/* Hover effects */}
      {Boolean(onClick) && (
        <>
          <div
            style={{
              ...layerStyle,
              height: glassSize.height,
              width: glassSize.width + 1,
              opacity: isHovered || isActive ? 0.5 : 0,
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%)',
              mixBlendMode: 'overlay',
            }}
          />
          <div
            style={{
              ...layerStyle,
              height: glassSize.height,
              width: glassSize.width + 1,
              opacity: isActive ? 0.5 : 0,
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 80%)',
              mixBlendMode: 'overlay',
            }}
          />
          <div
            style={{
              ...layerStyle,
              height: glassSize.height,
              width: glassSize.width + 1,
              opacity: isHovered ? 0.4 : isActive ? 0.8 : 0,
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)',
              mixBlendMode: 'overlay',
            }}
          />
        </>
      )}
    </div>
  );
}
