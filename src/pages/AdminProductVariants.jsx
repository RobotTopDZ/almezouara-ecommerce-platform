import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus, FaSave, FaArrowLeft } from 'react-icons/fa';

const AdminProductVariants = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState(null);
  const [newVariant, setNewVariant] = useState({
    color_name: '',
    color_value: '#000000',
    size: '',
    stock: 0,
    sku: '',
    price_adjustment: 0,
    image_url: ''
  });
  const [showNewVariantForm, setShowNewVariantForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  // Fetch product and its variants
  useEffect(() => {
    const fetchProductAndVariants = async () => {
      try {
        setLoading(true);
        // Fetch product details
        const productRes = await axios.get(`/api/products/${productId}`);
        if (productRes.data && productRes.data.product) {
          setProduct(productRes.data.product);
        } else {
          toast.error('Produit non trouvé');
          navigate('/admin/products');
          return;
        }

        // Fetch variants
        const variantsRes = await axios.get(`/api/product-variants/product/${productId}/variants`);
        if (variantsRes.data && variantsRes.data.success) {
          setVariants(variantsRes.data.variants);
        } else {
          setVariants([]);
        }
      } catch (error) {
        console.error('Error fetching product and variants:', error);
        toast.error('Erreur lors du chargement du produit et des variantes');
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndVariants();
  }, [productId, navigate]);

  // Handle image file selection
  const handleImageChange = (e, isNewVariant = false) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        if (isNewVariant) {
          setNewVariant(prev => ({ ...prev, image_url: reader.result }));
        } else if (editingVariant) {
          setEditingVariant(prev => ({ ...prev, image_url: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image and return URL
  const uploadImage = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.success) {
        return response.data.imageUrl;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
      return null;
    }
  };

  // Save variant (create or update)
  const saveVariant = async (variant, isNew = false) => {
    try {
      let imageUrl = variant.image_url;
      
      // Upload image if there's a new file
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const variantData = {
        ...variant,
        product_id: productId,
        image_url: imageUrl
      };
      
      let response;
      if (isNew) {
        response = await axios.post('/api/product-variants/variants', variantData);
      } else {
        response = await axios.put(`/api/product-variants/variants/${variant.id}`, variantData);
      }
      
      if (response.data && response.data.success) {
        toast.success(isNew ? 'Variante ajoutée avec succès' : 'Variante mise à jour avec succès');
        
        // Refresh variants list
        const variantsRes = await axios.get(`/api/product-variants/product/${productId}/variants`);
        if (variantsRes.data && variantsRes.data.success) {
          setVariants(variantsRes.data.variants);
        }
        
        // Reset states
        setEditingVariant(null);
        setNewVariant({
          color_name: '',
          color_value: '#000000',
          size: '',
          stock: 0,
          sku: '',
          price_adjustment: 0,
          image_url: ''
        });
        setShowNewVariantForm(false);
        setImageFile(null);
        setPreviewImage('');
      }
    } catch (error) {
      console.error('Error saving variant:', error);
      toast.error('Erreur lors de l\'enregistrement de la variante');
    }
  };

  // Delete variant
  const deleteVariant = async (variantId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette variante ?')) {
      return;
    }
    
    try {
      const response = await axios.delete(`/api/product-variants/variants/${variantId}`);
      
      if (response.data && response.data.success) {
        toast.success('Variante supprimée avec succès');
        setVariants(variants.filter(v => v.id !== variantId));
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error('Erreur lors de la suppression de la variante');
    }
  };

  // Update variant stock
  const updateStock = async (variantId, newStock) => {
    try {
      const response = await axios.post(`/api/product-variants/variants/${variantId}/update-stock`, {
        quantity: parseInt(newStock, 10),
        action: 'set'
      });
      
      if (response.data && response.data.success) {
        toast.success('Stock mis à jour avec succès');
        
        // Update local state
        setVariants(variants.map(v => 
          v.id === variantId ? { ...v, stock: parseInt(newStock, 10) } : v
        ));
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Produit non trouvé
        </div>
        <button 
          onClick={() => navigate('/admin/products')}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Retour aux produits
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Gestion des variantes: {product.name}
        </h1>
        <button 
          onClick={() => navigate('/admin/products')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Retour aux produits
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Informations du produit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><span className="font-semibold">Nom:</span> {product.name}</p>
            <p><span className="font-semibold">Prix de base:</span> {product.price} DA</p>
            <p><span className="font-semibold">Catégorie:</span> {product.category_name}</p>
          </div>
          <div>
            <p><span className="font-semibold">Type:</span> {product.product_type === 'variable' ? 'Variable' : 'Simple'}</p>
            <p><span className="font-semibold">SKU:</span> {product.sku || 'Non défini'}</p>
            <p><span className="font-semibold">Statut:</span> {product.active ? 'Actif' : 'Inactif'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Variantes du produit</h2>
          <button 
            onClick={() => setShowNewVariantForm(!showNewVariantForm)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            {showNewVariantForm ? 'Annuler' : <><FaPlus className="mr-2" /> Ajouter une variante</>}
          </button>
        </div>

        {/* New Variant Form */}
        {showNewVariantForm && (
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3">Nouvelle variante</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Couleur
                  </label>
                  <input
                    type="text"
                    value={newVariant.color_name}
                    onChange={(e) => setNewVariant({...newVariant, color_name: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Nom de la couleur"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Valeur de couleur
                  </label>
                  <input
                    type="color"
                    value={newVariant.color_value}
                    onChange={(e) => setNewVariant({...newVariant, color_value: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Taille
                  </label>
                  <input
                    type="text"
                    value={newVariant.size}
                    onChange={(e) => setNewVariant({...newVariant, size: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Taille (S, M, L, XL, etc.)"
                  />
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newVariant.stock}
                    onChange={(e) => setNewVariant({...newVariant, stock: parseInt(e.target.value, 10) || 0})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={newVariant.sku}
                    onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="SKU de la variante"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Ajustement de prix (DA)
                  </label>
                  <input
                    type="number"
                    value={newVariant.price_adjustment}
                    onChange={(e) => setNewVariant({...newVariant, price_adjustment: parseInt(e.target.value, 10) || 0})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Ajustement de prix (+ ou -)"
                  />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Image de la variante
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, true)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  {previewImage && (
                    <div className="mt-2">
                      <img src={previewImage} alt="Aperçu" className="h-32 object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => saveVariant(newVariant, true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <FaSave className="mr-2" /> Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Variants List */}
        {variants.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Aucune variante configurée pour ce produit
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Couleur
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Taille
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Prix final
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b border-gray-200">
                      {variant.image_url ? (
                        <img src={variant.image_url} alt={`${variant.color_name} ${variant.size}`} className="h-16 w-16 object-cover rounded" />
                      ) : (
                        <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <span className="inline-block h-4 w-4 rounded-full mr-2" style={{ backgroundColor: variant.color_value }}></span>
                        {variant.color_name}
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {variant.size}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => {
                          const newStock = parseInt(e.target.value, 10) || 0;
                          setVariants(variants.map(v => 
                            v.id === variant.id ? { ...v, stock: newStock } : v
                          ));
                        }}
                        onBlur={(e) => updateStock(variant.id, e.target.value)}
                        className="shadow appearance-none border rounded w-20 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        min="0"
                      />
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {product.price + (variant.price_adjustment || 0)} DA
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {variant.sku || '-'}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingVariant(variant)}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteVariant(variant.id)}
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Variant Modal */}
      {editingVariant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Modifier la variante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Couleur
                  </label>
                  <input
                    type="text"
                    value={editingVariant.color_name}
                    onChange={(e) => setEditingVariant({...editingVariant, color_name: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Valeur de couleur
                  </label>
                  <input
                    type="color"
                    value={editingVariant.color_value}
                    onChange={(e) => setEditingVariant({...editingVariant, color_value: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Taille
                  </label>
                  <input
                    type="text"
                    value={editingVariant.size}
                    onChange={(e) => setEditingVariant({...editingVariant, size: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={editingVariant.stock}
                    onChange={(e) => setEditingVariant({...editingVariant, stock: parseInt(e.target.value, 10) || 0})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={editingVariant.sku || ''}
                    onChange={(e) => setEditingVariant({...editingVariant, sku: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Ajustement de prix (DA)
                  </label>
                  <input
                    type="number"
                    value={editingVariant.price_adjustment || 0}
                    onChange={(e) => setEditingVariant({...editingVariant, price_adjustment: parseInt(e.target.value, 10) || 0})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Image de la variante
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  {(previewImage || editingVariant.image_url) && (
                    <div className="mt-2">
                      <img 
                        src={previewImage || editingVariant.image_url} 
                        alt="Aperçu" 
                        className="h-32 object-contain" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setEditingVariant(null);
                  setPreviewImage('');
                  setImageFile(null);
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Annuler
              </button>
              <button
                onClick={() => saveVariant(editingVariant)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <FaSave className="mr-2" /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductVariants;