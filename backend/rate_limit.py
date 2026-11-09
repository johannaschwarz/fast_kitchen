import math
import threading
import time
from dataclasses import dataclass, field


@dataclass
class _AttemptState:
    failures: list[float] = field(default_factory=list)
    blocked_until: float = 0.0


class FailureRateLimiter:
    """Small in-memory limiter for repeated failed attempts.

    State is kept per key (client IP) and is intentionally not persisted. It resets
    when the backend restarts and is not shared between worker processes.
    """

    def __init__(
        self,
        max_attempts: int,
        window_seconds: int,
        lockout_seconds: int,
        max_tracked_keys: int = 50_000,
    ) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = max(1, window_seconds)
        self.lockout_seconds = max(1, lockout_seconds)
        self.max_tracked_keys = max_tracked_keys
        self._states: dict[str, _AttemptState] = {}
        self._lock = threading.Lock()

    def retry_after(self, key: str) -> int | None:
        """Return seconds until the key may try again, or None if not blocked."""
        if self.max_attempts <= 0:
            return None

        now = time.monotonic()
        with self._lock:
            state = self._states.get(key)
            if state is None:
                return None

            if state.blocked_until > now:
                return max(1, math.ceil(state.blocked_until - now))

            # The previous lockout has expired.
            if state.blocked_until:
                self._states.pop(key, None)
                return None

            self._prune_failures(state, now)
            if not state.failures:
                self._states.pop(key, None)
            return None

    def record_failure(self, key: str) -> int | None:
        """Record a failed attempt and return a lockout duration if now blocked."""
        if self.max_attempts <= 0:
            return None

        now = time.monotonic()
        with self._lock:
            state = self._states.setdefault(key, _AttemptState())
            self._prune_failures(state, now)
            state.failures.append(now)

            if len(state.failures) >= self.max_attempts:
                state.failures.clear()
                state.blocked_until = now + self.lockout_seconds
                retry_after = self.lockout_seconds
            else:
                retry_after = None

            self._evict_if_needed(now)
            return retry_after

    def reset(self, key: str) -> None:
        with self._lock:
            self._states.pop(key, None)

    def _prune_failures(self, state: _AttemptState, now: float) -> None:
        cutoff = now - self.window_seconds
        state.failures = [failure for failure in state.failures if failure > cutoff]

    def _evict_if_needed(self, now: float) -> None:
        if len(self._states) <= self.max_tracked_keys:
            return

        for key, state in list(self._states.items()):
            if state.blocked_until <= now and not state.failures:
                self._states.pop(key, None)

        # Last-resort bound so a flood of unique IPs cannot grow memory forever.
        overflow = len(self._states) - self.max_tracked_keys
        if overflow > 0:
            for key in list(self._states)[:overflow]:
                self._states.pop(key, None)
