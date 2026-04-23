// Simple module-level flag so AuthContext can skip SIGNED_IN / USER_UPDATED
// events that fire during the OTP password-reset flow.
let _inProgress = false;

export function setPasswordResetInProgress(v: boolean) {
  _inProgress = v;
}

export function isPasswordResetInProgress() {
  return _inProgress;
}
