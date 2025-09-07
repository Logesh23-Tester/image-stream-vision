import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageModal } from "./ImageModal";
import { LoadingSpinner } from "./LoadingSpinner";
import { S3Service } from "@/lib/s3Service";

interface S3Image {
  key: string;
  url: string;
  lastModified: Date;
  size: number;
}

export const ImageGallery = () => {
  const [images, setImages] = useState<S3Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<S3Image | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchImages = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const s3Service = new S3Service();
      const fetchedImages = await s3Service.listImages();
      setImages(fetchedImages);
      
      if (isRefresh) {
        toast({
          title: "Gallery refreshed",
          description: `Found ${fetchedImages.length} images`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load images";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchImages();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchImages(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchImages(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Unable to load images</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => fetchImages()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">S3 Image Gallery</h2>
          <p className="text-muted-foreground">
            {images.length} image{images.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={refreshing}
          className="bg-gradient-primary"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <ImageIcon className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">No images found</h3>
            <p className="text-muted-foreground">
              Upload images to your S3 bucket to see them here
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card 
              key={image.key} 
              className="overflow-hidden bg-card hover:shadow-glow transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedImage(image)}
            >
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={image.url}
                  alt={image.key}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm truncate" title={image.key}>
                  {image.key.split('/').pop() || image.key}
                </h3>
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(image.size)}</span>
                  <span>{image.lastModified.toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};