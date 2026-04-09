{/* Ensure the map returns proper JSX without extra parentheses */}
{myLoads.map(trip => (
  <Card key={trip.id} className="overflow-hidden border-orange-100 hover:shadow-lg transition-all duration-200">
    {/* ... */}
  </Card>
))}