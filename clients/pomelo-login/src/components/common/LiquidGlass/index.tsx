import styles from './index.module.less';
import type { CSSProperties, PropsWithChildren } from 'react';

type LiquidGlassProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
  padding?: string;
  cornerRadius?: number;
  layout?: 'block' | 'inline';
  overLight?: boolean;
  glassSize?: {
    width?: number | string;
    height?: number | string;
  };
}>;

function joinClasses(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(' ');
}

function toCssSize(value: number | string | undefined) {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

export default function LiquidGlass({
  children,
  className,
  style,
  padding = '24px 32px',
  cornerRadius = 18,
  layout = 'block',
  overLight = false,
  glassSize,
}: LiquidGlassProps) {
  const glassStyle = {
    '--glass-padding': padding,
    '--glass-radius': `${cornerRadius}px`,
    '--glass-width': toCssSize(glassSize?.width),
    '--glass-height': toCssSize(glassSize?.height),
    ...style,
  } as CSSProperties;

  return (
    <div
      className={joinClasses(
        styles.glass,
        layout === 'inline' ? styles.inline : styles.block,
        overLight && styles.overLight,
        className,
      )}
      style={glassStyle}
    >
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
