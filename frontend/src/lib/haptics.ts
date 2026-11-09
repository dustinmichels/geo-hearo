import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNative } from "./platform";

// The web falls back to navigator.vibrate, which Android browsers support and
// iOS Safari lacks (no-op there).

/** A guess was submitted. */
export function guessFeedback(): void {
  if (isNative) void Haptics.impact({ style: ImpactStyle.Medium });
  else navigator.vibrate?.(200);
}

/** The round ended. Replaces the guess vibration that fires on the same tap. */
export function roundResultFeedback(isWin: boolean): void {
  if (isNative) {
    void Haptics.notification({ type: isWin ? NotificationType.Success : NotificationType.Error });
  } else {
    // Win: two short pulses; lose: one long buzz.
    navigator.vibrate?.(isWin ? [60, 80, 60] : [400]);
  }
}
