import AWS from 'aws-sdk';

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
  private s3: AWS.S3 | null = null;
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

    AWS.config.update({
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      region: this.config.region,
    });

    this.s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: { Bucket: this.config.bucketName },
    });
  }

  async listImages(): Promise<S3Image[]> {
    if (!this.s3 || !this.config) {
      throw new Error('S3 service not configured. Please provide your AWS credentials.');
    }

    try {
      const params = {
        Bucket: this.config.bucketName,
        MaxKeys: 1000,
      };

      const data = await this.s3.listObjectsV2(params).promise();
      
      if (!data.Contents) {
        return [];
      }

      // Filter for image files
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      const imageObjects = data.Contents.filter(obj => {
        const key = obj.Key?.toLowerCase() || '';
        return imageExtensions.some(ext => key.endsWith(ext));
      });

      // Generate signed URLs for each image
      const images: S3Image[] = await Promise.all(
        imageObjects.map(async (obj) => {
          if (!obj.Key || !obj.LastModified || !obj.Size) {
            throw new Error('Invalid object data');
          }

          const signedUrl = await this.s3!.getSignedUrlPromise('getObject', {
            Bucket: this.config!.bucketName,
            Key: obj.Key,
            Expires: 3600, // 1 hour
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
    if (!this.s3 || !this.config) {
      throw new Error('S3 service not configured');
    }

    const uploadKey = key || `uploads/${Date.now()}-${file.name}`;

    try {
      const params = {
        Bucket: this.config.bucketName,
        Key: uploadKey,
        Body: file,
        ContentType: file.type,
        ACL: 'private',
      };

      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isConfigured(): boolean {
    return this.config !== null && this.s3 !== null;
  }

  getConfig(): S3Config | null {
    return this.config;
  }
}