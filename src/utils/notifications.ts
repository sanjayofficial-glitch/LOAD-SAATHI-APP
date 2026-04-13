import { createClerkSupabaseClient } from '@/utils/supabaseClient';

interface NotificationPayload {
  userId: string;
  message: string;
  getToken: () => Promise<string | null>;
  relatedTripId?: string;
  relatedShipmentRequestId?: string;
}

/**
 * Sends a targeted notification to a specific user via Supabase.
 * The notification is stored in the `notifications` table and
 * delivered in real-time via Supabase Realtime subscriptions.
 */
export const sendNotification = async (payload: NotificationPayload): Promise<void> => {
  try {
    const token = await payload.getToken();
    if (!token) {
      console.warn('[sendNotification] No auth token available');
      return;
    }

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('notifications').insert({
      user_id: payload.userId,
      message: payload.message,
      related_trip_id: payload.relatedTripId ?? null,
      related_shipment_request_id: payload.relatedShipmentRequestId ?? null,
      is_read: false,
    });

    if (error) {
      console.error('[sendNotification] Failed to insert notification:', error);
    }
  } catch (err) {
    console.error('[sendNotification] Unexpected error:', err);
  }
};

// ─── Notification Template Helpers ────────────────────────────────────────────

/** Shipper sent a booking request to a Trucker's trip */
export const notifyTruckerOfBookingRequest = (params: {
  truckerId: string;
  shipperName: string;
  weightTonnes: number;
  goodsDescription: string;
  originCity: string;
  destinationCity: string;
  tripId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.truckerId,
    message: `📦 New booking! ${params.shipperName} wants to ship ${params.weightTonnes}t of "${params.goodsDescription}" on your trip from ${params.originCity} → ${params.destinationCity}.`,
    relatedTripId: params.tripId,
    getToken: params.getToken,
  });

/** Trucker accepted a Shipper's booking request */
export const notifyShipperOfRequestAccepted = (params: {
  shipperId: string;
  truckerName: string;
  originCity: string;
  destinationCity: string;
  requestId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.shipperId,
    message: `✅ Great news! ${params.truckerName} accepted your booking request for the trip from ${params.originCity} → ${params.destinationCity}. You can now chat and call them directly.`,
    getToken: params.getToken,
  });

/** Trucker declined a Shipper's booking request */
export const notifyShipperOfRequestDeclined = (params: {
  shipperId: string;
  truckerName: string;
  originCity: string;
  destinationCity: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.shipperId,
    message: `❌ ${params.truckerName} declined your booking request for the trip from ${params.originCity} → ${params.destinationCity}. Try browsing other available trucks.`,
    getToken: params.getToken,
  });

/** Trucker sent an offer to a Shipper's load */
export const notifyShipperOfTruckerOffer = (params: {
  shipperId: string;
  truckerName: string;
  proposedPrice: number;
  weightTonnes: number;
  originCity: string;
  destinationCity: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.shipperId,
    message: `🚛 ${params.truckerName} offered ₹${params.proposedPrice.toLocaleString()}/t to carry your ${params.weightTonnes}t load from ${params.originCity} → ${params.destinationCity}.`,
    getToken: params.getToken,
  });

/** Shipper accepted a Trucker's offer */
export const notifyTruckerOfOfferAccepted = (params: {
  truckerId: string;
  shipperName: string;
  originCity: string;
  destinationCity: string;
  requestId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.truckerId,
    message: `✅ ${params.shipperName} accepted your offer for the load from ${params.originCity} → ${params.destinationCity}! You can now chat and coordinate directly.`,
    relatedShipmentRequestId: params.requestId,
    getToken: params.getToken,
  });

/** Shipper declined a Trucker's offer */
export const notifyTruckerOfOfferDeclined = (params: {
  truckerId: string;
  shipperName: string;
  originCity: string;
  destinationCity: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.truckerId,
    message: `❌ ${params.shipperName} declined your offer for the load from ${params.originCity} → ${params.destinationCity}.`,
    getToken: params.getToken,
  });