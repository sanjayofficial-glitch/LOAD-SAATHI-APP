// Replace the broken dialog fragment with the correct structure
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
        <Trash2 className="h-4 w-4 mr-2" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete your trip listing.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="mr-2">Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => handleDeleteTrip(trip.id)}
          className="bg-red-600 hover:bg-red-700"
        >
          Delete        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>