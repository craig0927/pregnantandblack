import { getSessionEnd, isSessionStarted } from "./sessionWindow";

export type ContactOption = "Video" | "Chat" | "Audio Call";

function hasPreference(raw: unknown, value: "video" | "audio"): boolean {
  if (!Array.isArray(raw)) return false;

  const lowerValue = value.toLowerCase();
  return raw.some((entry) => {
    if (typeof entry !== "string") return false;
    const lowerEntry = entry.trim().toLowerCase();
    // Match both "phone" and "audio call" for backward compatibility
    if (lowerValue === "audio") {
      return lowerEntry === "phone" || lowerEntry === "audio call";
    }
    return lowerEntry === lowerValue;
  });
}

function normalizePrefs(raw: unknown): {
  chat: boolean;
  video: boolean;
  audio: boolean;
} {
  return {
    chat: true, // Chat is mandatory
    video: hasPreference(raw, "video"),
    audio: hasPreference(raw, "audio"),
  };
}

export function computeSessionPermissions(
  userPrefs: unknown,
  hcaPrefs: unknown,
  sessionDate: string,
  startTime: string,
  appointmentStatus: string | null,
) {
  const now = new Date();
  const sessionEnd = getSessionEnd(sessionDate, startTime);
  const sessionStarted = isSessionStarted(sessionDate, startTime);
  const sessionOver = now > sessionEnd;

  const user = normalizePrefs(userPrefs);
  const hca = normalizePrefs(hcaPrefs);

  const mutuallyVideo = user.video && hca.video;
  const mutuallyAudio = user.audio && hca.audio;

  return {
    // TESTING: time gates removed so chat/video/audio are always accessible
    chatEnabled: true, // sessionStarted && !sessionOver,
    videoEnabled: mutuallyVideo && appointmentStatus === "confirmed", // mutuallyVideo && sessionStarted && !sessionOver && appointmentStatus === "confirmed",
    phoneEnabled: mutuallyAudio && appointmentStatus === "confirmed", // mutuallyAudio && sessionStarted && !sessionOver && appointmentStatus === "confirmed",
    sessionOver: false, // sessionOver,
  };
}
