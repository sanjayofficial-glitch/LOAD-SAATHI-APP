"use client";

import { createClerkSupabaseClient } from '@/utils/supabaseClient';

export const sendNotification = async (payload: {
  userId: string;
  message: string;
  relatedTripId?: string;
  relatedShipmentRequestId?: string;
  getToken: () => Promise<string | null>;
}) => {
  const { userId, message, relatedTripId, relatedShipmentRequestId, getToken } = payload;

  try {
    const supabaseToken = await getToken();
    if (!supabaseToken) return;

    const supabase = createClerkSupabaseClient(supabaseToken);
    
    await supabase.from('notifications').insert({
      user_id: userId,
      message,
      related_trip_id: relatedTripId,
      related_shipment_request_id: relatedShipmentRequestId,
      is_read: false
    });
  } catch (err) {
    console.error('[sendNotification] Error:', err);
  }
};