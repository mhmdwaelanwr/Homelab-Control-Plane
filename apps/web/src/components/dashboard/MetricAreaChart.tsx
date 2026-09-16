import { useId, useState } from 'react';

import { Card } from '@/components/ui/card';
import { formatTimestamp } from '@/lib/utils';
import { useI18n } from '@/providers/I18nProvider';
import type { MetricPoint } from '@/types/api';

const chartWidth = 640;
const chartHeight = 256;
const chartPadding = {
  top: 16,
  right: 12,
  bottom: 32,
  left: 42,
};

function buildLinePath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function buildAreaPath(points: Array<{ x: number; y: number }>, baseline: number) {
  if (points.length === 0) {
    return '';
  }

  const first = points[0];
  const last = points[points.length - 1];

  return [
    `M ${first.x} ${baseline}`,
    `L ${first.x} ${first.y}`,
    ...points.slice(1).map((point) => `L ${point.x} ${point.y}`),
    `L ${last.x} ${baseline}`,
    'Z',
  ].join(' ');
}

type MetricAreaChartProps = {
  title: string;
  subtitle: string;
  points: MetricPoint[];
  color: string;
};

export function MetricAreaChart({ title, subtitle, points, color }: MetricAreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { t } = useI18n();
  const gradientId = useId().replace(/:/g, '');
  const latestPoint = points.at(-1)?.value ?? null;
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const chartPoints = points.map((point, index) => ({
    ...point,
    x: chartPadding.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth),
    y: chartPadding.top + (1 - Math.max(0, Math.min(point.value, 100)) / 100) * plotHeight,
  }));
  const activeIndex = hoveredIndex ?? (chartPoints.length > 0 ? chartPoints.length - 1 : null);
  const activePoint = activeIndex === null ? null : chartPoints[activeIndex] ?? null;
  const xTickIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1].filter((value) => value >= 0))];
  const yTicks = [0, 25, 50, 75, 100];
  const linePath = buildLinePath(chartPoints);
  const areaPath = buildAreaPath(chartPoints, chartPadding.top + plotHeight);

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-panel/95 to-panelAlt/75">
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/4 to-transparent" />
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-display text-xl text-[rgb(var(--color-text-primary))]">{title}</h3>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.05] px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--color-text-muted))]">{t('common.latest')}</p>
          <p className="mt-1 font-display text-2xl text-[rgb(var(--color-text-primary))]">{latestPoint === null ? t('common.na') : `${latestPoint.toFixed(1)}%`}</p>
        </div>
      </div>
      <div className="relative h-64" onMouseLeave={() => setHoveredIndex(null)}>
        {chartPoints.length > 0 ? (
          <>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full overflow-visible" role="img" aria-label={`${title} trend chart`}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.42" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {yTicks.map((tick) => {
                const y = chartPadding.top + (1 - tick / 100) * plotHeight;

                return (
                  <g key={`y-${tick}`}>
                    <line x1={chartPadding.left} y1={y} x2={chartPadding.left + plotWidth} y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 8" />
                    <text x={chartPadding.left - 10} y={y + 4} textAnchor="end" fill="#90a0b1" fontSize="12">
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {xTickIndexes.map((index) => {
                const point = chartPoints[index];

                if (!point) {
                  return null;
                }

                return (
                  <text key={`x-${index}`} x={point.x} y={chartHeight - 8} textAnchor="middle" fill="#90a0b1" fontSize="12">
                    {formatTimestamp(point.timestamp).split(',')[0] ?? ''}
                  </text>
                );
              })}

              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {chartPoints.map((point, index) => {
                const isActive = index === activeIndex;

                return (
                  <g key={`${title}-${point.timestamp}-${index}`}>
                    <circle cx={point.x} cy={point.y} r={isActive ? 5 : 3.5} fill={color} stroke="rgba(15,23,42,0.9)" strokeWidth="2" />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={12}
                      fill="transparent"
                      tabIndex={0}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onFocus={() => setHoveredIndex(index)}
                      onBlur={() => setHoveredIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {activePoint ? (
              <div
                className="pointer-events-none absolute rounded-2xl border border-white/10 bg-slate-950/92 px-3 py-2 text-xs text-slate-200 shadow-2xl"
                style={{
                  left: `${(activePoint.x / chartWidth) * 100}%`,
                  top: `${Math.max(6, ((activePoint.y - 52) / chartHeight) * 100)}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <p className="font-medium text-white">{title}</p>
                <p className="mt-1">{activePoint.value.toFixed(1)}%</p>
                <p className="mt-1 text-slate-400">{formatTimestamp(activePoint.timestamp)}</p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[24px] border border-white/8 bg-slate-950/25 text-sm text-slate-400">
            No telemetry history yet.
          </div>
        )}
      </div>
    </Card>
  );
}
