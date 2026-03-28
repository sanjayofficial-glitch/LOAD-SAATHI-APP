import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  fallback = '/placeholder.svg',
  ...props 
}: OptimizedImageProps) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <div className={cn("relative overflow-hidden bg-gray-100", className)}>
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => setImgSrc(fallback)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;