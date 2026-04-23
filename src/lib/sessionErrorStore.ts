import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_ERROR_KEY = "pwb:last_session_error";

export async function setLatestSessionError(message: string) {
  const text = message.trim();
  if (!text) return;
  await AsyncStorage.setItem(SESSION_ERROR_KEY, text);
}

export async function getLatestSessionError() {
  return AsyncStorage.getItem(SESSION_ERROR_KEY);
}

export async function clearLatestSessionError() {
  await AsyncStorage.removeItem(SESSION_ERROR_KEY);
}
