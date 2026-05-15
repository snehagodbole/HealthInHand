export type FastingMilestone = {
  /** Minimum elapsed hours to enter this stage */
  hours: number;
  /** Short stage name */
  stage: string;
  /** Motivational / educational message */
  message: string;
  /** Accent color class for the badge */
  color: string;
};

/**
 * Fasting milestones ordered by hour threshold (ascending).
 * Based on well-known metabolic stages during extended fasting.
 */
export const fastingMilestones: FastingMilestone[] = [
  {
    hours: 0,
    stage: "Fed State",
    message: "Your fast has begun — stay strong, the benefits are coming!",
    color: "bg-stone-100 text-stone-600"
  },
  {
    hours: 4,
    stage: "Post-Absorptive",
    message: "Your body is finishing digestion. You're doing great — keep going!",
    color: "bg-stone-100 text-stone-600"
  },
  {
    hours: 8,
    stage: "Early Fasting",
    message:
      "Blood sugar is stabilizing and your body is switching fuel sources. Stay with it!",
    color: "bg-sky-50 text-sky-700"
  },
  {
    hours: 12,
    stage: "Fat Burning",
    message:
      "Glycogen stores are depleting — your body is ramping up fat burning. You're crushing it! 🔥",
    color: "bg-amber-50 text-amber-700"
  },
  {
    hours: 14,
    stage: "Ketosis Begins",
    message:
      "Your liver is producing ketones for energy. Mental clarity is on the way — keep pushing!",
    color: "bg-orange-50 text-orange-700"
  },
  {
    hours: 16,
    stage: "Autophagy Begins ✨",
    message:
      "Cellular cleanup is activating! Your body is recycling damaged cells. This is where the magic happens!",
    color: "bg-moss-50 text-moss-700"
  },
  {
    hours: 18,
    stage: "Deep Autophagy",
    message:
      "Autophagy is intensifying — your cells are renewing themselves. You are a fasting warrior! 💪",
    color: "bg-emerald-50 text-emerald-700"
  },
  {
    hours: 24,
    stage: "Peak Autophagy",
    message:
      "Maximum cellular renewal is underway. Growth hormone is surging. Incredible discipline! 🏆",
    color: "bg-violet-50 text-violet-700"
  },
  {
    hours: 36,
    stage: "Extended Fast",
    message:
      "Deep ketosis and powerful autophagy. You've entered elite territory — be proud! 🌟",
    color: "bg-purple-50 text-purple-700"
  },
  {
    hours: 48,
    stage: "Immune Reset",
    message:
      "Your immune system is regenerating. Truly remarkable endurance — you're transforming! 🦋",
    color: "bg-fuchsia-50 text-fuchsia-700"
  }
];

/**
 * Returns the current milestone based on elapsed hours.
 */
export function getCurrentMilestone(elapsedHours: number): FastingMilestone {
  let current = fastingMilestones[0];
  for (const milestone of fastingMilestones) {
    if (elapsedHours >= milestone.hours) {
      current = milestone;
    } else {
      break;
    }
  }
  return current;
}

/**
 * Returns the next upcoming milestone, or null if at the last one.
 */
export function getNextMilestone(
  elapsedHours: number
): FastingMilestone | null {
  for (const milestone of fastingMilestones) {
    if (elapsedHours < milestone.hours) {
      return milestone;
    }
  }
  return null;
}
