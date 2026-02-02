'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ProductFormData {
  _id?: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  features: string[];
}

interface CloudinaryUploadResult {
  secure_url: string;
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [formData, setFormData] = useState<ProductFormData | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [currentFeature, setCurrentFeature] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Fetch product by ID
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Failed to load product');
        const product = await res.json();

        setFormData(product);
        setFeatures(product.features || []);
      } catch (err) {
        setErrors({ general: 'Error loading product.' });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ✅ Input change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!formData) return;
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
          }
        : null
    );
  };

  // ✅ Upload multiple images to Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadPromises = Array.from(files).map((file) => uploadSingleImage(file));

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      const successfulUploads = uploadedUrls.filter((url) => url !== null) as string[];

      setFormData((prev) =>
        prev
          ? {
              ...prev,
              images: [...prev.images, ...successfulUploads],
              image: prev.image || successfulUploads[0] || '',
            }
          : null
      );
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploadingImages(false);
    }
  };

  const uploadSingleImage = async (file: File): Promise<string | null> => {
    const data = new FormData();
    data.append('file', file);
    data.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'eshopsite'
    );

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwluovyrg'
        }/image/upload`,
        { method: 'POST', body: data }
      );

      if (res.ok) {
        const result: CloudinaryUploadResult = await res.json();
        return result.secure_url;
      }
      return null;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    }
  };

  const removeImage = (index: number) => {
    if (!formData) return;
    setFormData((prev) => {
      if (!prev) return prev;
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        image: index === 0 && newImages.length > 0 ? newImages[0] : prev.image,
      };
    });
  };

  const setPrimaryImage = (index: number) => {
    if (!formData) return;
    setFormData((prev) => {
      if (!prev || !prev.images[index]) return prev;
      const selected = prev.images[index];
      const newImages = [selected, ...prev.images.filter((_, i) => i !== index)];
      return { ...prev, image: selected, images: newImages };
    });
  };

  // ✅ Features
  const addFeature = () => {
    if (currentFeature.trim() !== '') {
      setFeatures((prev) => [...prev, currentFeature.trim()]);
      setCurrentFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Submit update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    setErrors({});

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, features }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      setSuccess('Product updated successfully!');
      setTimeout(() => {
        router.push('/products');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Loading/Error states
  if (loading) return <p className="p-6">Loading product...</p>;
  if (errors.general) return <p className="p-6 text-red-600">{errors.general}</p>;
  if (!formData) return <p className="p-6">No product found</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

      {success && <div className="mb-4 p-3 bg-green-100 text-green-700">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product ID & Name */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium">Product ID *</label>
            <input
              type="text"
              name="productId"
              value={formData.productId}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium">Price *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Original Price</label>
            <input
              type="number"
              name="originalPrice"
              value={formData.originalPrice || ''}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium">Category *</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium">Images *</label>
          <input type="file" multiple onChange={handleImageUpload} />
          {formData.images.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {formData.images.map((img, i) => (
                <div key={i} className="relative border p-2 rounded">
                  <img src={img} alt="" className="h-24 w-full object-cover rounded" />
                  <div className="flex justify-between mt-2">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(i)}
                      className={`text-xs px-2 py-1 rounded ${
                        formData.image === img ? 'bg-green-600 text-white' : 'bg-gray-200'
                      }`}
                    >
                      {formData.image === img ? 'Primary' : 'Set Primary'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium">Features</label>
          <div className="flex">
            <input
              type="text"
              value={currentFeature}
              onChange={(e) => setCurrentFeature(e.target.value)}
              className="flex-1 border p-2 rounded-l"
            />
            <button
              type="button"
              onClick={addFeature}
              className="px-4 bg-indigo-600 text-white rounded-r"
            >
              Add
            </button>
          </div>
          {features.length > 0 && (
            <ul className="mt-2 space-y-1">
              {features.map((f, i) => (
                <li key={i} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                  <span>{f}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* In Stock */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="inStock"
            checked={formData.inStock}
            onChange={handleInputChange}
            className="mr-2"
          />
          <label>In Stock</label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving || uploadingImages}
          className="w-full py-3 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
