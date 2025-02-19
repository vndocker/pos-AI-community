import pytest
import boto3
from datetime import datetime
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError
from app.utils.r2_storage import R2Storage

@pytest.fixture
def r2_storage():
    """Fixture to create R2Storage instance for testing."""
    return R2Storage()

@pytest.fixture
def mock_s3_client():
    """Fixture to mock S3 client."""
    with patch('boto3.client') as mock_client:
        yield mock_client.return_value

def test_generate_presigned_url_success(r2_storage, mock_s3_client):
    """Test successful generation of presigned URLs."""
    # Mock responses
    mock_s3_client.generate_presigned_url.side_effect = [
        "https://fake-upload-url.com",
        "https://fake-download-url.com"
    ]
    
    # Test
    object_key = "test/image.jpg"
    result = r2_storage.generate_presigned_url(object_key)
    
    # Assertions
    assert isinstance(result, dict)
    assert "upload_url" in result
    assert "download_url" in result
    assert "object_key" in result
    assert result["object_key"] == object_key
    assert result["upload_url"] == "https://fake-upload-url.com"
    assert result["download_url"] == "https://fake-download-url.com"

def test_generate_presigned_url_with_custom_expiration(r2_storage, mock_s3_client):
    """Test presigned URL generation with custom expiration."""
    custom_expiration = 7200  # 2 hours
    object_key = "test/image.jpg"
    
    # Call the method
    r2_storage.generate_presigned_url(object_key, expiration=custom_expiration)
    
    # Verify the expiration was passed correctly
    mock_s3_client.generate_presigned_url.assert_called_with(
        "get_object",
        Params={
            "Bucket": r2_storage.bucket_name,
            "Key": object_key,
        },
        ExpiresIn=custom_expiration,
    )

def test_generate_presigned_url_failure(r2_storage, mock_s3_client):
    """Test handling of presigned URL generation failure."""
    # Mock error response
    mock_s3_client.generate_presigned_url.side_effect = ClientError(
        {"Error": {"Code": "InvalidAccessKeyId", "Message": "Invalid access key"}},
        "generate_presigned_url"
    )
    
    # Test
    with pytest.raises(Exception) as exc_info:
        r2_storage.generate_presigned_url("test/image.jpg")
    
    assert "Error generating presigned URL" in str(exc_info.value)

def test_delete_object_success(r2_storage, mock_s3_client):
    """Test successful object deletion."""
    # Mock successful deletion
    mock_s3_client.delete_object.return_value = {"ResponseMetadata": {"HTTPStatusCode": 204}}
    
    # Test
    result = r2_storage.delete_object("test/image.jpg")
    
    # Assertions
    assert result is True
    mock_s3_client.delete_object.assert_called_once_with(
        Bucket=r2_storage.bucket_name,
        Key="test/image.jpg"
    )

def test_delete_object_failure(r2_storage, mock_s3_client):
    """Test handling of object deletion failure."""
    # Mock error response
    mock_s3_client.delete_object.side_effect = ClientError(
        {"Error": {"Code": "NoSuchKey", "Message": "Object does not exist"}},
        "delete_object"
    )
    
    # Test
    with pytest.raises(Exception) as exc_info:
        r2_storage.delete_object("test/image.jpg")
    
    assert "Error deleting object" in str(exc_info.value)

def test_generate_avatar_key(r2_storage):
    """Test avatar key generation."""
    user_id = "test-user-123"
    result = r2_storage.generate_avatar_key(user_id)
    
    # Assertions
    assert result.startswith(f"avatars/{user_id}/")
    assert result.endswith(".jpg")
    assert datetime.utcnow().strftime("%Y%m%d") in result

def test_generate_presigned_url_invalid_key(r2_storage, mock_s3_client):
    """Test presigned URL generation with invalid object key."""
    # Test with empty key
    with pytest.raises(Exception):
        r2_storage.generate_presigned_url("")
    
    # Test with None key
    with pytest.raises(Exception):
        r2_storage.generate_presigned_url(None)

def test_delete_object_invalid_key(r2_storage, mock_s3_client):
    """Test object deletion with invalid key."""
    # Test with empty key
    with pytest.raises(Exception):
        r2_storage.delete_object("")
    
    # Test with None key
    with pytest.raises(Exception):
        r2_storage.delete_object(None)

def test_generate_avatar_key_invalid_user_id(r2_storage):
    """Test avatar key generation with invalid user ID."""
    # Test with empty user ID
    with pytest.raises(Exception):
        r2_storage.generate_avatar_key("")
    
    # Test with None user ID
    with pytest.raises(Exception):
        r2_storage.generate_avatar_key(None)
