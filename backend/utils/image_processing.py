"""
Image processing utilities for optimization and thumbnail generation.
"""
import os
from io import BytesIO
from typing import Optional, Tuple
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.files.base import ContentFile
import sys


def optimize_image(
    image_file,
    max_size: Tuple[int, int] = (1920, 1080),
    quality: int = 85,
    format: str = 'JPEG'
) -> InMemoryUploadedFile:
    """
    Optimize an image by resizing and compressing.
    
    Args:
        image_file: Django uploaded file
        max_size: Maximum dimensions (width, height)
        quality: JPEG quality (1-100)
        format: Output format ('JPEG', 'PNG', 'WEBP')
    
    Returns:
        Optimized InMemoryUploadedFile
    """
    # Open image
    img = Image.open(image_file)
    
    # Convert RGBA to RGB for JPEG
    if format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Resize if needed (maintain aspect ratio)
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # Save to memory
    output = BytesIO()
    
    # Use WebP if format is WEBP and PIL supports it
    if format == 'WEBP':
        try:
            img.save(output, format='WEBP', quality=quality, method=6)
        except Exception:
            # Fallback to JPEG if WebP not supported
            img.save(output, format='JPEG', quality=quality)
            format = 'JPEG'
    elif format == 'PNG':
        img.save(output, format='PNG', optimize=True)
    else:
        img.save(output, format='JPEG', quality=quality, optimize=True)
    
    output.seek(0)
    
    # Create InMemoryUploadedFile
    file_name = os.path.splitext(image_file.name)[0]
    file_extension = '.webp' if format == 'WEBP' else ('.png' if format == 'PNG' else '.jpg')
    
    return InMemoryUploadedFile(
        output,
        'ImageField',
        f"{file_name}{file_extension}",
        f'image/{format.lower()}',
        sys.getsizeof(output),
        None
    )


def create_thumbnail(
    image_file,
    size: Tuple[int, int] = (300, 300),
    quality: int = 75
) -> InMemoryUploadedFile:
    """
    Create a thumbnail from an image.
    
    Args:
        image_file: Django uploaded file
        size: Thumbnail size (width, height)
        quality: JPEG quality (1-100)
    
    Returns:
        Thumbnail as InMemoryUploadedFile
    """
    # Open image
    img = Image.open(image_file)
    
    # Convert RGBA to RGB for JPEG
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Create thumbnail (maintains aspect ratio, crops to fit)
    img.thumbnail(size, Image.Resampling.LANCZOS)
    
    # Create a square thumbnail by cropping
    width, height = img.size
    if width != height:
        # Crop to square from center
        size_min = min(width, height)
        left = (width - size_min) // 2
        top = (height - size_min) // 2
        img = img.crop((left, top, left + size_min, top + size_min))
        img = img.resize(size, Image.Resampling.LANCZOS)
    
    # Save to memory
    output = BytesIO()
    img.save(output, format='JPEG', quality=quality, optimize=True)
    output.seek(0)
    
    # Create InMemoryUploadedFile
    file_name = os.path.splitext(image_file.name)[0]
    
    return InMemoryUploadedFile(
        output,
        'ImageField',
        f"{file_name}_thumb.jpg",
        'image/jpeg',
        sys.getsizeof(output),
        None
    )


def get_image_dimensions(image_file) -> Tuple[int, int]:
    """
    Get image dimensions.
    
    Args:
        image_file: Django uploaded file
    
    Returns:
        Tuple of (width, height)
    """
    img = Image.open(image_file)
    return img.size


def validate_image(
    image_file,
    max_size: Optional[Tuple[int, int]] = None,
    max_file_size: Optional[int] = None,
    allowed_formats: Optional[list] = None
) -> Tuple[bool, Optional[str]]:
    """
    Validate an image file.
    
    Args:
        image_file: Django uploaded file
        max_size: Maximum dimensions (width, height)
        max_file_size: Maximum file size in bytes
        allowed_formats: List of allowed formats (e.g., ['JPEG', 'PNG'])
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if allowed_formats is None:
        allowed_formats = ['JPEG', 'PNG', 'WEBP', 'GIF']
    
    try:
        img = Image.open(image_file)
        format = img.format
        
        # Check format
        if format not in allowed_formats:
            return False, f"Image format {format} not allowed. Allowed formats: {', '.join(allowed_formats)}"
        
        # Check dimensions
        if max_size:
            width, height = img.size
            if width > max_size[0] or height > max_size[1]:
                return False, f"Image dimensions ({width}x{height}) exceed maximum ({max_size[0]}x{max_size[1]})"
        
        # Check file size
        if max_file_size:
            image_file.seek(0, os.SEEK_END)
            file_size = image_file.tell()
            image_file.seek(0)
            if file_size > max_file_size:
                return False, f"Image size ({file_size} bytes) exceeds maximum ({max_file_size} bytes)"
        
        return True, None
    
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"

