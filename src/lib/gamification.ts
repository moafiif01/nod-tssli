/**
 * Gamification Logic for #Nod_Tssali
 * Calculates points and handles streak logic.
 */

export const PRAYER_BASE_POINTS = 10;
export const MOSQUE_BONUS_POINTS = 15;

/**
 * Calculates the total points earned for a single prayer check-in.
 * 
 * @param prayedInMosque - Whether the user prayed in the mosque (فالجامع).
 * @param currentStreak - The user's current day streak.
 * @returns Number of points earned for this log.
 */
export function calculatePrayerPoints(prayedInMosque: boolean, currentStreak: number): number {
  let points = PRAYER_BASE_POINTS;
  
  if (prayedInMosque) {
    points += MOSQUE_BONUS_POINTS;
  }

  // Streak Multiplier
  // e.g., 1.0x for 0-2 days, 1.2x for 3-6 days, 1.5x for 7+ days
  let multiplier = 1.0;
  if (currentStreak >= 7) {
    multiplier = 1.5;
  } else if (currentStreak >= 3) {
    multiplier = 1.2;
  }

  return Math.floor(points * multiplier);
}

/**
 * Checks if a user's streak should be incremented, reset, or kept the same.
 * 
 * @param lastLogDate - The Date of the user's last prayer log.
 * @param currentStreak - The user's current streak number.
 * @returns The new streak number.
 */
export function calculateNewStreak(lastLogDate: Date | null, currentStreak: number): number {
  if (!lastLogDate) return 1;

  const now = new Date();
  
  // Normalize dates to midnight to compare days accurately
  const lastDate = new Date(lastLogDate.getFullYear(), lastLogDate.getMonth(), lastLogDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day log, streak remains the same
    return currentStreak;
  } else if (diffDays === 1) {
    // Next day log, increment streak
    return currentStreak + 1;
  } else {
    // Missed a day or more, reset streak
    // (We start at 1 because this function runs when they just logged a prayer)
    return 1;
  }
}
