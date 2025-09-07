import { useState, useEffect } from "react";
import { ImageGallery } from "@/components/ImageGallery";
import { S3ConfigForm } from "@/components/S3ConfigForm";
import { S3Service } from "@/lib/s3Service";
import { Smartphone, Cloud } from "lucide-react";

const Index = () => {
  const [s3Service] = useState(() => new S3Service());
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsConfigured(s3Service.isConfigured());
  }, [s3Service]);

  const handleConfigSave = () => {
    setIsConfigured(true);
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Cloud className="h-12 w-12 text-primary mr-3" />
              <Smartphone className="h-8 w-8 text-primary absolute -bottom-1 -right-1" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            S3 Mobile Gallery
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-time image viewing from your S3 bucket
          </p>
        </header>

        <main>
          {!isConfigured ? (
            <div className="flex justify-center">
              <S3ConfigForm 
                onConfigSave={handleConfigSave}
                initialConfig={s3Service.getConfig() || undefined}
              />
            </div>
          ) : (
            <ImageGallery />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
