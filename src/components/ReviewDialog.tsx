"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  truckerId: string;
  shipperId: string;
  truckerName: string;
  onSuccess?: () => void;
}

const ReviewDialog = ({ 
  isOpen, 
  onClose, 
  tripId, 
  truckerId, 
  shipperId, 
  truckerName,
  onSuccess 
}: ReviewDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      showError('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          trip_id: tripId,
          trucker_id: truckerId,
          shipper_id: shipperId,
          rating,
          comment: comment.trim()
        });

      if (error) throw error;

      showSuccess('Review submitted! Thank you for your feedback.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate your experience</DialogTitle>
          <DialogDescription>
            How was your trip with {truckerName}? Your feedback helps the community.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <Label className="text-sm font-medium text-gray-500">Overall Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform active:scale-90"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      (hover || rating) >= star
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about the service, punctuality, etc."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="h-24 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-orange-600 hover:bg-orange-700"
            disabled={submitting || rating === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;