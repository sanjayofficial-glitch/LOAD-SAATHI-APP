// ✅ Fixed: Using defined variables throughout JSX
{/* ... existing JSX ... */}
{/* Offer details */}
<p className="font-bold text-gray-900">
  {offerModal?.shipment.origin_city} → {offerModal?.shipment.destination_city}
</p>
<p className="text-sm text-gray-600">
  {offerModal?.shipment.weight_tonnes}t • {offerModal?.shipment.goods_description}
</p>
<p className="text-xs text-gray-500">
  Shipper's Budget: ₹{offerModal?.shipment.budget_per_tonne}/t
</p>

{/* Price calculation */}
<p className="font-bold text-gray-900">
  Estimated Cost: ₹{(parseFloat(offerModal?.price || "0") * parseFloat(offerModal?.shipment.budget_per_tonne || "0")).toLocaleString()}
</p>

{/* Input fields */}
<Input
  type="number"
  placeholder="Enter your price per tonne"
  value={offerModal?.price || ""}
  onChange={(e) => setOfferModal({ ...offerModal, price: e.target.value })}
/>
<Input
  placeholder="Add a message to the shipper..."
  value={offerModal?.message || ""}
  onChange={(e) => setOfferModal({ ...offerModal, message: e.target.value })}
/>
/* ... rest of the component ... */