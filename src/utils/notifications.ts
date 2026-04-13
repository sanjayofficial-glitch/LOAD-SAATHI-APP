import { createClerkSupabaseClient } from './supabaseClient';

export const sendNotification = async (payload: { 
  userId: string; 
  message: string; 
  getToken: () => Promise<string | null>;
  relatedTripId?: string;
  relatedShipmentRequestId?: string;
}) => {
  try {
    const supabaseToken = await payload.getToken();
    if (!supabaseToken) throw new Error('No Supabase token');
    
    const supabase = createClerkSupabaseClient(supabaseToken);
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.userId,
        message: payload.message,
        related_trip_id: payload.relatedTripId,
        related_shipment_request_id: payload.relatedShipmentRequestId,
        is_read: false
      });

    if (error) throw error;
    
    console.log(`Notification sent to ${payload.userId}: ${payload.message}`);
  } catch (err) {
    console.error('Error sending notification:', err);
    // We don't throw here to avoid breaking the main flow
  }
};
