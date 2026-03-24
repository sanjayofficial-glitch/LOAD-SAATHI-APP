// ... inside handleSendMessage, before the self-check:
console.log('[Chat Debug]', {
  userProfileId: userProfile?.id,
  userType: userProfile?.user_type,
  requestId: requestId,
  shipperId: request?.shipper_id,
  truckerId: request?.trip?.trucker_id,
  isTrucker: userProfile?.user_type === 'trucker',
  calculatedRecipient: isTrucker ? request?.shipper_id : request?.trip?.trucker_id
});