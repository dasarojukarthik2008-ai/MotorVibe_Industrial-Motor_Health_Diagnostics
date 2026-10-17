import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-industrial-border p-3 rounded-lg shadow-lg font-mono text-xs">
        <p className="text-industrial-muted mb-1">{label}</p>
        {payload.map((item, index) => (
          <p key={index} style={{ color: item.color }} className="font-semibold flex items-center justify-between gap-4">
            <span>{item.name}:</span>
            <span>{Number(item.value).toFixed(2)} {item.unit || ''}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function TelemetryChart({ data = [], height = 300, showLimits = true }) {
  // Format data labels if needed
  const formattedData = data.map((d, index) => ({
    ...d,
    time: d.timestamp
      ? new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : `#${index + 1}`,
    vibration: parseFloat(d.vibration) || 0,
    temperature: parseFloat(d.temperature) || 0,
  }));

  if (formattedData.length === 0) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center bg-industrial-cardLight/30 border border-dashed border-industrial-border rounded-xl text-industrial-muted font-mono text-sm">
        <span>Awaiting telemetry data stream...</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D8E0EA" vertical={false} />
          
          <XAxis
            dataKey="time"
            stroke="#64748B"
            tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace' }}
            tickLine={{ stroke: '#D8E0EA' }}
          />

          {/* Left Axis: Vibration (mm/s) */}
          <YAxis
            yAxisId="left"
            stroke="#0891B2"
            domain={[0, 'auto']}
            tick={{ fill: '#08798F', fontSize: 11, fontFamily: 'monospace' }}
            tickLine={{ stroke: '#D8E0EA' }}
            label={{ value: 'Vib (mm/s)', angle: -90, position: 'insideLeft', fill: '#08798F', fontSize: 10 }}
          />

          {/* Right Axis: Temperature (°C) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#B45309"
            domain={[20, 'auto']}
            tick={{ fill: '#92400E', fontSize: 11, fontFamily: 'monospace' }}
            tickLine={{ stroke: '#D8E0EA' }}
            label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', fill: '#92400E', fontSize: 10 }}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12, fontFamily: 'monospace' }} />

          {showLimits && (
            <>
              {/* Vibration Warning Threshold: 4.5 mm/s */}
              <ReferenceLine
                yAxisId="left"
                y={4.5}
                stroke="#B91C1C"
                strokeDasharray="4 4"
                label={{ value: 'Vib Limit (4.5)', fill: '#B91C1C', fontSize: 10, position: 'top' }}
              />
              {/* Temperature Warning Threshold: 75°C */}
              <ReferenceLine
                yAxisId="right"
                y={75}
                stroke="#B45309"
                strokeDasharray="4 4"
                label={{ value: 'Temp Limit (75°)', fill: '#92400E', fontSize: 10, position: 'top' }}
              />
            </>
          )}

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="vibration"
            name="Vibration (mm/s)"
            stroke="#0891B2"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="temperature"
            name="Temperature (°C)"
            stroke="#B45309"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
