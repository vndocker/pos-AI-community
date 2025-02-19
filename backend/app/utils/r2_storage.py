"""Cloudflare R2 storage utilities."""
import os
import boto3
from botocore.config import Config
from datetime import datetime, timedelta

class R2Storage:
    def __init__(self):
        self.access_key = os.getenv("R2_ACCESS_KEY_ID", "862b2b07ce0b8548776a8ad7c2d2ad19")
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY", "32a945cb6b20512ee337bf732b98d40760cb7be7572873bba8def05f31fa897b")
        self.endpoint = os.getenv("R2_ENDPOINT", "https://d75d0978428e12467185290c27919b53.r2.cloudflarestorage.com")
        self.bucket_name = os.getenv("R2_BUCKET_NAME", "pos-ai")
        
        # Configure S3 client for R2
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            endpoint_url=self.endpoint,
            config=Config(signature_version="s3v4"),
            region_name="auto"  # R2 uses 'auto' region
        )

    def generate_presigned_url(self, object_key: str, expiration: int = 3600) -> dict:
        """Generate presigned URLs for upload and download.
        
        Args:
            object_key: The key (path) where the object will be stored
            expiration: URL expiration time in seconds (default 1 hour)
            
        Returns:
            dict: Contains presigned URLs for upload and download
            
        Raises:
            Exception: If object_key is invalid or empty
        """
        if not object_key:
            raise Exception("Object key cannot be empty or None")
            
        try:
            # Generate upload URL
            upload_url = self.s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": object_key,
                    "ContentType": "image/*",
                    "ContentLength": 500 * 1024,  # 500KB limit
                },
                ExpiresIn=expiration,
            )
            
            # Generate download URL
            download_url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": object_key,
                },
                ExpiresIn=expiration,
            )
            
            return {
                "upload_url": upload_url,
                "download_url": download_url,
                "object_key": object_key
            }
        except Exception as e:
            raise Exception(f"Error generating presigned URL: {str(e)}")

    def delete_object(self, object_key: str) -> bool:
        """Delete an object from R2 storage.
        
        Args:
            object_key: The key (path) of the object to delete
            
        Returns:
            bool: True if deletion was successful
            
        Raises:
            Exception: If object_key is invalid or empty
        """
        if not object_key:
            raise Exception("Object key cannot be empty or None")
            
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=object_key
            )
            return True
        except Exception as e:
            raise Exception(f"Error deleting object: {str(e)}")

    def generate_avatar_key(self, user_id: str) -> str:
        """Generate a unique key for user avatar.
        
        Args:
            user_id: The user's ID
            
        Returns:
            str: Generated object key
            
        Raises:
            Exception: If user_id is invalid or empty
        """
        if not user_id:
            raise Exception("User ID cannot be empty or None")
            
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return f"avatars/{user_id}/{timestamp}.jpg"
