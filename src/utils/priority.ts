import { SeverityLevel, PriorityLevel } from '../types/index.ts';

export const SEVERITY_SCORES: Record<SeverityLevel, number> = {
  Low: 20,
  Medium: 45,
  High: 75,
  Critical: 100,
};

/**
 * Calculates priority score according to specification:
 * Priority = 0.5 * Severity + 0.3 * Report Count Score + 0.2 * Waiting Time Score
 *
 * Severity values: Low = 20, Medium = 45, High = 75, Critical = 100
 * Report Count Score = min(100, 25 * (number of reports - 1))
 * Waiting Time Score = min(100, 100 * hours waiting / 72)
 */
export function calculatePriorityScore(
  severity: SeverityLevel,
  reportCount: number,
  createdAtIso: string,
  referenceDate: Date = new Date()
): {
  score: number;
  level: PriorityLevel;
  breakdown: {
    severityScore: number;
    reportCountScore: number;
    waitingTimeScore: number;
    hoursWaiting: number;
  };
} {
  const severityScore = SEVERITY_SCORES[severity] || 45;
  const count = Math.max(1, reportCount || 1);
  const reportCountScore = Math.min(100, Math.max(0, 25 * (count - 1)));

  const createdTime = new Date(createdAtIso).getTime();
  const now = referenceDate.getTime();
  const diffMs = Math.max(0, now - createdTime);
  const hoursWaiting = diffMs / (1000 * 60 * 60);

  const waitingTimeScore = Math.min(100, Math.max(0, (100 * hoursWaiting) / 72));

  // Compute combined weighted score
  const rawScore = 0.5 * severityScore + 0.3 * reportCountScore + 0.2 * waitingTimeScore;
  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  let level: PriorityLevel = 'Low';
  if (score >= 75) {
    level = 'Critical';
  } else if (score >= 50) {
    level = 'High';
  } else if (score >= 30) {
    level = 'Medium';
  } else {
    level = 'Low';
  }

  return {
    score,
    level,
    breakdown: {
      severityScore,
      reportCountScore,
      waitingTimeScore: Math.round(waitingTimeScore),
      hoursWaiting: Math.round(hoursWaiting * 10) / 10,
    },
  };
}
