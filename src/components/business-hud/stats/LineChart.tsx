import React, { useRef, useEffect, useState, useCallback } from "react";

export interface LineChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface LineChartPoint {
  label: string;
  [key: string]: string | number | undefined;
}

interface TooltipData {
  x: number;
  y: number;
  label: string;
  values: { key: string; label: string; color: string; value: number; formatted: string }[];
}

interface LineChartProps {
  series: LineChartSeries[];
  data: LineChartPoint[];
  height?: number;
  showDots?: boolean;
  showGrid?: boolean;
  title?: string;
  unit?: string;
  formatValue?: (v: number) => string;
}

const LineChart: React.FC<LineChartProps> = ({
  series,
  data,
  height = 200,
  showDots = true,
  showGrid = true,
  unit = "",
  formatValue = (v: number) => `${(v / 1000).toFixed(0)}K`,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padLeft = 55;
    const padRight = 20;
    const padTop = 36;
    const padBottom = 30;
    const chartW = W - padLeft - padRight;
    const chartH = H - padTop - padBottom;

    ctx.clearRect(0, 0, W, H);

    const allValues = data.flatMap((pt) =>
      series.map((s) => (pt[s.key] as number) || 0),
    );
    const rawMax = Math.max(...allValues, 1);
    // Round up to a nice axis max (1, 2, 5, 10, 20, 50, 100, 200, 500, 1M, 2M...)
    const axisMax = rawMax <= 1 ? 1 : (() => {
      const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
      const norm = rawMax / mag;
      if (norm <= 1) return mag;
      if (norm <= 2) return 2 * mag;
      if (norm <= 5) return 5 * mag;
      return 10 * mag;
    })();

    const px = (i: number) => padLeft + (i / (data.length - 1 || 1)) * chartW;
    const py = (v: number) => padTop + chartH - (v / axisMax) * chartH;

    // Grid
    if (showGrid) {
      const gridCount = 4;
      for (let g = 0; g <= gridCount; g++) {
        const y = padTop + (g / gridCount) * chartH;
        const val = axisMax - (g / gridCount) * axisMax;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(W - padRight, y);
        ctx.strokeStyle = "rgba(148,163,184,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#475569";
        ctx.font = "10px system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(formatValue(Math.round(val)), padLeft - 6, y + 4);
      }
    }

    // X-axis labels
    const step = Math.max(1, Math.floor(data.length / 6));
    data.forEach((pt, i) => {
      if (i % step === 0 || i === data.length - 1) {
        ctx.fillStyle = "#475569";
        ctx.font = "10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(pt.label as string, px(i), H - 6);
      }
    });

    // Series
    series.forEach((s) => {
      const values = data.map((pt) => (pt[s.key] as number) || 0);

      // Gradient fill
      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
      grad.addColorStop(0, `${s.color}28`);
      grad.addColorStop(1, `${s.color}00`);

      ctx.beginPath();
      values.forEach((v, i) => {
        if (i === 0) ctx.moveTo(px(i), py(v));
        else ctx.lineTo(px(i), py(v));
      });
      ctx.lineTo(px(values.length - 1), padTop + chartH);
      ctx.lineTo(px(0), padTop + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      values.forEach((v, i) => {
        if (i === 0) ctx.moveTo(px(i), py(v));
        else ctx.lineTo(px(i), py(v));
      });
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      if (showDots) {
        values.forEach((v, i) => {
          ctx.beginPath();
          ctx.arc(px(i), py(v), 3.5, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();
          ctx.strokeStyle = "rgba(15,23,42,0.9)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }
    });

    // Legend
    let legendX = padLeft;
    series.forEach((s) => {
      ctx.beginPath();
      ctx.rect(legendX, 12, 10, 10);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(s.label, legendX + 14, 22);
      legendX += ctx.measureText(s.label).width + 14 + 28;
    });
  }, [series, data, height, showGrid, showDots, formatValue]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw tooltip area (canvas is static, tooltip is HTML overlay)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const W = rect.width;
    const padLeft = 55;
    const padRight = 20;
    const chartW = W - padLeft - padRight;

    // Find nearest data point
    const idx = Math.round(
      ((mouseX - padLeft) / chartW) * (data.length - 1),
    );
    const clampedIdx = Math.max(0, Math.min(data.length - 1, idx));
    const pt = data[clampedIdx];
    const mouseY = e.clientY - rect.top;

    const values = series.map((s) => ({
      key: s.key,
      label: s.label,
      color: s.color,
      value: (pt[s.key] as number) || 0,
      formatted: formatValue((pt[s.key] as number) || 0),
    }));

    setTooltip({
      x: e.clientX - rect.left + 10,
      y: mouseY - 10,
      label: pt.label as string,
      values,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="rh-line-chart" style={{ position: "relative", height }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          className="rh-line-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="rh-line-tooltip__date">{tooltip.label}</div>
          {tooltip.values.map((v) => (
            <div key={v.key} className="rh-line-tooltip__row">
              <span className="rh-line-tooltip__dot" style={{ background: v.color }} />
              <span className="rh-line-tooltip__name">{v.label}</span>
              <span className="rh-line-tooltip__val" style={{ color: v.color }}>
                {v.formatted}
                {unit && <span className="rh-line-tooltip__unit"> {unit}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LineChart;
