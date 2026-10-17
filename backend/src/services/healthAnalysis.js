const thresholds = require('../config/thresholds');

/**
 * Calculates vibration penalty (0 - 50)
 */
function calculateVibrationPenalty(vibration) {
  const { normalLimit, warningLimit, criticalLimit, maxPenalty } = thresholds.vibration;
  if (vibration <= normalLimit) return 0;
  
  if (vibration <= warningLimit) {
    // Normal to Warning zone (0 to 20 penalty)
    const ratio = (vibration - normalLimit) / (warningLimit - normalLimit);
    return ratio * 20;
  }
  
  if (vibration <= criticalLimit) {
    // Warning to Critical zone (20 to 40 penalty)
    const ratio = (vibration - warningLimit) / (criticalLimit - warningLimit);
    return 20 + ratio * 20;
  }
  
  // Above critical limit (40 to 50 penalty)
  const excess = Math.min((vibration - criticalLimit) / 3.0, 1.0);
  return 40 + excess * (maxPenalty - 40);
}

/**
 * Calculates temperature penalty (0 - 50)
 */
function calculateTemperaturePenalty(temperature) {
  const { normalLimit, warningLimit, criticalLimit, maxPenalty } = thresholds.temperature;
  if (temperature <= normalLimit) return 0;

  if (temperature <= warningLimit) {
    // Normal to Warning zone (0 to 20 penalty)
    const ratio = (temperature - normalLimit) / (warningLimit - normalLimit);
    return ratio * 20;
  }

  if (temperature <= criticalLimit) {
    // Warning to Critical zone (20 to 40 penalty)
    const ratio = (temperature - warningLimit) / (criticalLimit - warningLimit);
    return 20 + ratio * 20;
  }

  // Above critical limit (40 to 50 penalty)
  const excess = Math.min((temperature - criticalLimit) / 20.0, 1.0);
  return 40 + excess * (maxPenalty - 40);
}

/**
 * Evaluates motor condition and generates health score, fault hypothesis, and alerts.
 * @param {number} vibration - Current vibration in mm/s RMS
 * @param {number} temperature - Current temperature in Celsius
 * @param {object} [context={}] - Optional context (testCondition, vibrationVariance, recentSpike)
 */
function analyzeMotorHealth(vibration, temperature, context = {}) {
  const vib = Math.max(0, Number(vibration) || 0);
  const temp = Number(temperature) || 0;

  const vibPenalty = Math.min(50, Math.round(calculateVibrationPenalty(vib) * 10) / 10);
  const tempPenalty = Math.min(50, Math.round(calculateTemperaturePenalty(temp) * 10) / 10);
  const rawScore = 100 - (vibPenalty + tempPenalty);
  const healthScore = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  let healthStatus = 'Healthy';
  let priority = thresholds.priorities.LOW;

  if (healthScore < thresholds.healthScores.warningMin) {
    healthStatus = 'Critical';
    priority = thresholds.priorities.HIGH;
  } else if (healthScore < thresholds.healthScores.healthyMin) {
    healthStatus = 'Warning';
    priority = thresholds.priorities.MEDIUM;
  }

  // Generate Alerts
  const alerts = [];
  if (vib > thresholds.vibration.criticalLimit) {
    alerts.push({
      level: 'critical',
      parameter: 'vibration',
      message: `Critical vibration detected (${vib.toFixed(2)} mm/s > ${thresholds.vibration.criticalLimit} mm/s)`,
      timestamp: new Date().toISOString(),
    });
  } else if (vib > thresholds.vibration.warningLimit) {
    alerts.push({
      level: 'warning',
      parameter: 'vibration',
      message: `Elevated vibration detected (${vib.toFixed(2)} mm/s > ${thresholds.vibration.warningLimit} mm/s)`,
      timestamp: new Date().toISOString(),
    });
  }

  if (temp > thresholds.temperature.criticalLimit) {
    alerts.push({
      level: 'critical',
      parameter: 'temperature',
      message: `Critical temperature detected (${temp.toFixed(1)}°C > ${thresholds.temperature.criticalLimit}°C)`,
      timestamp: new Date().toISOString(),
    });
  } else if (temp > thresholds.temperature.warningLimit) {
    alerts.push({
      level: 'warning',
      parameter: 'temperature',
      message: `Elevated temperature detected (${temp.toFixed(1)}°C > ${thresholds.temperature.warningLimit}°C)`,
      timestamp: new Date().toISOString(),
    });
  }

  // Fault Classification (Rule-based preliminary demonstration)
  let possibleFault = thresholds.faults.NORMAL;
  let recommendation = thresholds.recommendations.NORMAL;

  const isVibWarn = vib > thresholds.vibration.warningLimit;
  const isVibCrit = vib > thresholds.vibration.criticalLimit;
  const isTempWarn = temp > thresholds.temperature.warningLimit;
  const isTempCrit = temp > thresholds.temperature.criticalLimit;

  // Compound elevation of both vibration and temperature indicates bearing degradation
  if ((isVibCrit && isTempWarn) || (isVibWarn && isTempWarn) || context.testCondition === 'Bearing Fault') {
    possibleFault = thresholds.faults.BEARING;
    recommendation = thresholds.recommendations.BEARING;
    if (isVibCrit || isTempCrit || (isVibWarn && isTempWarn)) {
      healthStatus = 'Critical';
      priority = thresholds.priorities.HIGH;
    }
  } else if (isTempCrit || (isTempWarn && !isVibWarn) || context.testCondition === 'Overheating') {
    possibleFault = thresholds.faults.OVERHEATING;
    recommendation = thresholds.recommendations.OVERHEATING;
  } else if (isVibCrit || context.recentSpike || context.testCondition === 'Loose Mounting') {
    possibleFault = thresholds.faults.LOOSE_MOUNTING;
    recommendation = thresholds.recommendations.LOOSE_MOUNTING;
  } else if (isVibWarn || context.testCondition === 'Imbalance') {
    possibleFault = thresholds.faults.IMBALANCE;
    recommendation = thresholds.recommendations.IMBALANCE;
  }

  return {
    healthScore,
    healthStatus,
    possibleFault,
    priority,
    recommendation,
    alerts,
    isPreliminary: true,
    breakdown: {
      baseScore: 100,
      vibrationPenalty: vibPenalty,
      temperaturePenalty: tempPenalty,
      vibration,
      temperature,
    },
  };
}

module.exports = {
  analyzeMotorHealth,
  calculateVibrationPenalty,
  calculateTemperaturePenalty,
};
