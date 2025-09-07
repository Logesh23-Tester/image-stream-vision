import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface S3Image {
  key: string;
  url: string;
  lastModified: Date;
  size: number;
}

interface ImageModalProps {
  image: S3Image;
  onClose: () => void;
}

export const ImageModal = ({ image, onClose }: ImageModalProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.key.split('/').pop() || image.key;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate">
              {image.key.split('/').pop() || image.key}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="bg-gradient-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="px-6 pb-2">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Size: {formatFileSize(image.size)}</span>
            <span>•</span>
            <span>Modified: {image.lastModified.toLocaleString()}</span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="relative bg-muted rounded-lg overflow-hidden">
            <img
              src={image.url}
              alt={image.key}
              className="w-full max-h-[60vh] object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};