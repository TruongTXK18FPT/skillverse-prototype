const CHANNEL_NAME = "skillverse:booking-sync:v1";

type BookingSyncMessage =
  | {
      type: "BOOKING_CHANGED";
      bookingId: number;
      newStatus: string;
    }
  | {
      type: "REFRESH_BOOKINGS";
    };

const tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

let channel: BroadcastChannel | null = null;
let initialized = false;
const listeners = new Set<(msg: BookingSyncMessage) => void>();

const isBrowser = (): boolean => typeof window !== "undefined";
const supportsBroadcastChannel = (): boolean =>
  isBrowser() && typeof BroadcastChannel !== "undefined";

const postMessage = (message: BookingSyncMessage): void => {
  if (!channel) return;
  channel.postMessage(message);
};

const handleMessage = (event: MessageEvent<BookingSyncMessage>): void => {
  const message = event.data;
  if (!message) return;
  listeners.forEach((fn) => fn(message));
};

export const initBookingSync = (): (() => void) => {
  if (!supportsBroadcastChannel()) {
    return () => {};
  }

  if (initialized && channel) {
    return () => {};
  }

  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = handleMessage;
  initialized = true;

  return () => {
    if (!channel) return;
    channel.close();
    channel = null;
    initialized = false;
    listeners.clear();
  };
};

export const onBookingSyncMessage = (fn: (msg: BookingSyncMessage) => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const broadcastBookingChanged = (bookingId: number, newStatus: string): void => {
  postMessage({ type: "BOOKING_CHANGED", bookingId, newStatus });
};

export const broadcastRefreshBookings = (): void => {
  postMessage({ type: "REFRESH_BOOKINGS" });
};
