import type { CSSProperties, PropsWithChildren } from 'react';
import styles from './index.module.less';

type LiquidGlassProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
  padding?: CSSProperties['padding'];
  cornerRadius?: number;
}>;

export default function LiquidGlass({
  children,
  className,
  style,
  padding = '24px 32px',
  cornerRadius = 18,
}: LiquidGlassProps) {
  return (
    <div
      className={[styles.root, 'glass', className].filter(Boolean).join(' ')}
      style={{
        ...style,
        borderRadius: cornerRadius,
      }}
    >
      <div className={styles.edge} />
      <div className={styles.surface} />
      <div className={styles.inner} style={{ padding }}>
        {children}
      </div>
    </div>
  );
}
