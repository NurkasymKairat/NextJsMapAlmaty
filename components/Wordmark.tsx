type Props = {
  size?: number;
  color?: string;
};

export default function Wordmark({ size = 24, color = 'var(--paper-ink)' }: Props) {
  const plate = size * 0.66;
  const fontSize = size * 0.62;
  const gap = size * 0.34;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        color,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          position: 'relative',
          width: plate,
          height: plate,
          background: color,
          borderRadius: 2,
          flex: '0 0 auto',
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: '22%',
            background: 'var(--paper-0)',
            borderRadius: 1,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: '47%',
            top: '47%',
            width: '6%',
            height: '6%',
            background: color,
            borderRadius: 1,
          }}
        />
      </span>
      <span>Алматы&nbsp;помнит</span>
    </span>
  );
}
