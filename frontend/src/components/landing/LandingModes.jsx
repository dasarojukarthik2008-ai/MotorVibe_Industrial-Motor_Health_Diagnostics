import { Cpu, Radio } from 'lucide-react';

export default function LandingModes() {
  return (
    <section id="about" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto border-t border-industrial-border/60">
      {/* What is MotorVibe Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono uppercase tracking-widest text-industrial-accent">
          System Overview
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
          What Is MotorVibe?
        </h2>
        <p className="mt-4 text-sm sm:text-base text-industrial-muted leading-relaxed">
          MotorVibe monitors motor sensor readings, analyzes motor health, and helps users identify potential maintenance needs before catastrophic mechanical breakdown. By evaluating vibration velocity RMS against ISO 10816 standards alongside temperature signatures, plant engineers can intervene proactively.
        </p>
      </div>

      {/* Two Testing Modes Section */}
      <div id="modes">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-industrial-secondary">
            Flexible Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Two Testing Modes
          </h2>
          <p className="text-xs font-mono text-industrial-muted mt-2">
            Shared health analysis logic and unified dashboard across both execution workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mode 1: Simulation Mode */}
          <div className="bg-industrial-card border border-industrial-border border-t-4 border-t-industrial-accent rounded-2xl p-6 sm:p-8 shadow-xl relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center mb-5 text-industrial-accent">
                <Cpu className="w-6 h-6" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Simulation Mode</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 uppercase">
                  Zero Hardware Needed
                </span>
              </div>

              <p className="text-xs text-industrial-muted leading-relaxed mt-2">
                Test and demonstrate the system using realistic simulated sensor readings without physical hardware. The backend generates dynamic telemetry streams reflecting five operational states:
              </p>

              <ul className="mt-5 space-y-2 text-xs font-mono text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span><strong>Normal:</strong> Baseline vibration (1.2–2.2 mm/s) & thermal stability</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Bearing Fault:</strong> Progressively climbing vibration & heat</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Imbalance:</strong> Heavy oscillatory sinusoidal vibration swings</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span><strong>Overheating:</strong> Accelerating thermal gradients up to 90°C+</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span><strong>Loose Mounting:</strong> High baseline vibration with shock spikes</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-industrial-border/60 text-[11px] font-mono text-industrial-accent">
              ✓ Instant setup for expos, testing, and lab experiments
            </div>
          </div>

          {/* Mode 2: Hardware Mode */}
          <div className="bg-industrial-card border border-industrial-border border-t-4 border-t-industrial-secondary rounded-2xl p-6 sm:p-8 shadow-xl relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center mb-5 text-industrial-secondary">
                <Radio className="w-6 h-6" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Hardware Mode</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-950/60 text-teal-300 border border-teal-500/40 uppercase">
                  Real ESP32 IoT
                </span>
              </div>

              <p className="text-xs text-industrial-muted leading-relaxed mt-2">
                Monitor real physical motor readings through sensors connected to an ESP32 microcontroller. Readings transmit over 2.4 GHz Wi-Fi and MQTT directly into the MotorVibe telemetry gateway.
              </p>

              <div className="mt-5 space-y-3 font-mono text-xs">
                <div className="p-3 bg-industrial-bg rounded-xl border border-industrial-border">
                  <span className="text-industrial-muted block text-[10px] uppercase">Telemetry Pipeline:</span>
                  <span className="text-white">Sensors → ESP32 → Wi-Fi → MQTT → Postgres → Socket.IO</span>
                </div>
                <div className="p-3 bg-industrial-bg rounded-xl border border-industrial-border">
                  <span className="text-industrial-muted block text-[10px] uppercase">Default MQTT Topic:</span>
                  <span className="text-teal-300">motorvibe/+/telemetry</span>
                </div>
                <div className="p-3 bg-industrial-bg rounded-xl border border-industrial-border">
                  <span className="text-industrial-muted block text-[10px] uppercase">Sensors Supported:</span>
                  <span className="text-white">MPU-6050 / ADXL345 & DS18B20 / Thermistor</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-industrial-border/60 text-[11px] font-mono text-teal-400">
              ✓ Genuine hardware readings — zero fabricated data when disconnected
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
