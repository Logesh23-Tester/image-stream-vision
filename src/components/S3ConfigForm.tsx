import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
}

interface S3ConfigFormProps {
  onConfigSave: (config: S3Config) => void;
  initialConfig?: Partial<S3Config>;
}

export const S3ConfigForm = ({ onConfigSave, initialConfig }: S3ConfigFormProps) => {
  const [config, setConfig] = useState<S3Config>({
    accessKeyId: initialConfig?.accessKeyId || "",
    secretAccessKey: initialConfig?.secretAccessKey || "",
    region: initialConfig?.region || "us-east-1",
    bucketName: initialConfig?.bucketName || "",
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (!config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
        throw new Error("Please fill in all required fields");
      }

      // Save to localStorage for frontend-only approach
      localStorage.setItem("s3Config", JSON.stringify(config));
      onConfigSave(config);
      
      toast({
        title: "Configuration saved",
        description: "S3 settings have been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-card">
      <CardHeader className="text-center">
        <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
        <CardTitle>S3 Configuration</CardTitle>
        <CardDescription>
          Enter your AWS S3 credentials to connect to your bucket
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessKeyId">Access Key ID *</Label>
            <Input
              id="accessKeyId"
              type={showSecrets ? "text" : "password"}
              value={config.accessKeyId}
              onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
              placeholder="AKIA..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretAccessKey">Secret Access Key *</Label>
            <div className="relative">
              <Input
                id="secretAccessKey"
                type={showSecrets ? "text" : "password"}
                value={config.secretAccessKey}
                onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                placeholder="Enter secret access key"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowSecrets(!showSecrets)}
              >
                {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region *</Label>
            <Input
              id="region"
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value })}
              placeholder="us-east-1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bucketName">Bucket Name *</Label>
            <Input
              id="bucketName"
              value={config.bucketName}
              onChange={(e) => setConfig({ ...config, bucketName: e.target.value })}
              placeholder="my-image-bucket"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary" 
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Your credentials are stored locally in your browser. 
            For production use, consider using a backend service or AWS Cognito for secure credential management.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};