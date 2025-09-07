import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

interface S3Image {
  key: string;
  url: string;
  lastModified: Date;
  size: number;
}

interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
}

export class S3Service {
  private s3Client: S3Client | null = null;
  private config: S3Config | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('s3Config');
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
        this.initializeS3();
      }
    } catch (error) {
      console.error('Failed to load S3 config:', error);
    }
  }

  private initializeS3(): void {
    if (!this.config) {
      throw new Error('S3 configuration not found');
    }

    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  async listImages(): Promise<S3Image[]> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 service not configured. Please provide your AWS credentials.');
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        MaxKeys: 1000,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      // Filter for image files
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      const imageObjects = response.Contents.filter(obj => {
        const key = obj.Key?.toLowerCase() || '';
        return imageExtensions.some(ext => key.endsWith(ext));
      });

      // Generate signed URLs for each image
      const images: S3Image[] = await Promise.all(
        imageObjects.map(async (obj) => {
          if (!obj.Key || !obj.LastModified || !obj.Size) {
            throw new Error('Invalid object data');
          }

          const getObjectCommand = new GetObjectCommand({
            Bucket: this.config!.bucketName,
            Key: obj.Key,
          });

          const signedUrl = await getSignedUrl(this.s3Client!, getObjectCommand, {
            expiresIn: 3600, // 1 hour
          });

          return {
            key: obj.Key,
            url: signedUrl,
            lastModified: obj.LastModified,
            size: obj.Size,
          };
        })
      );

      // Sort by last modified date (newest first)
      return images.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      console.error('Error listing S3 objects:', error);
      throw new Error(`Failed to fetch images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadImage(file: File, key?: string): Promise<string> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 service not configured');
    }

    const uploadKey = key || `uploads/${Date.now()}-${file.name}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: uploadKey,
        Body: file,
        ContentType: file.type,
        ACL: 'private',
      });

      await this.s3Client.send(command);
      
      // Return the object key since we can't get the direct URL easily
      return uploadKey;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isConfigured(): boolean {
    return this.config !== null && this.s3Client !== null;
  }

  getConfig(): S3Config | null {
    return this.config;
  }
}