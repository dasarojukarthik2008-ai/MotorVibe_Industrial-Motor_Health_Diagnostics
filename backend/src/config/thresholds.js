/**
 * MotorVibe Health Analysis & Thresholds Configuration
 * Aligned with ISO 10816 standards for industrial machinery
 */
module.exports = {
  vibration: {
    normalLimit: 2.8,   // mm/s RMS
    warningLimit: 4.5,  // mm/s RMS
    criticalLimit: 7.1, // mm/s RMS
    maxPenalty: 50,     // maximum penalty contribution towards health score
  },
  temperature: {
    normalLimit: 55.0,  // degrees Celsius
    warningLimit: 75.0, // degrees Celsius
    criticalLimit: 90.0,// degrees Celsius
    maxPenalty: 50,     // maximum penalty contribution towards health score
  },
  healthScores: {
    healthyMin: 80,
    warningMin: 50,
  },
  faults: {
    NORMAL: 'No Major Issue Detected',
    BEARING: 'Possible Bearing Problem',
    IMBALANCE: 'Possible Imbalance',
    OVERHEATING: 'Possible Overheating',
    LOOSE_MOUNTING: 'Possible Loose Mounting',
  },
  recommendations: {
    NORMAL: 'Continue routine monitoring.',
    BEARING: 'Inspect bearing condition and lubrication.',
    IMBALANCE: 'Inspect shaft alignment and rotor balance.',
    OVERHEATING: 'Inspect cooling and ventilation.',
    LOOSE_MOUNTING: 'Inspect mounting bolts and foundation.',
  },
  priorities: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
  },
};
