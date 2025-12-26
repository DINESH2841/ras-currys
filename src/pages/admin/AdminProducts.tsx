import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { Product } from '../../types';
import Button from '../../components/Button';
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const cancelBulkRef = useRef(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editData, setEditData] = useState<{ name: string; price: string; category: 'Currys' | 'Pickles'; description: string; image: string }>({ name: '', price: '', category: 'Currys', description: '', image: '' });
  const [editSaving, setEditSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Currys',
    description: '',
    image: 'https://picsum.photos/400/300' // Default placeholder
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await apiClient.getProducts(1, 100);
    setProducts(data.items);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await apiClient.deleteProduct(id);
      loadProducts();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.addProduct({
      name: formData.name,
      price: Number(formData.price),
      category: formData.category as 'Currys' | 'Pickles',
      description: formData.description,
      image: formData.image
    });
    setIsAdding(false);
    setFormData({ name: '', price: '', category: 'Currys', description: '', image: 'https://picsum.photos/400/300' });
    loadProducts();
  };

  const onStartEdit = (p: Product) => {
    setEditing(p);
    setEditData({ name: p.name, price: String(p.price), category: p.category, description: p.description, image: p.image });
  };

  const toDataURLFromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const toDataURLFromUrl = async (url: string): Promise<string> => {
    try {
      const resp = await fetch(url, { mode: 'cors' });
      if (!resp.ok) throw new Error('Fetch failed');
      const blob = await resp.blob();
      return await toDataURLFromFile(new File([blob], 'image', { type: blob.type || 'image/jpeg' }));
    } catch {
      // Fallback placeholder when CORS blocks conversion
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='#111827'>Image proxied</text></svg>`;
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
  };

  const onEditDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    if (!editing) return;
    const dt = e.dataTransfer;
    if (dt.files && dt.files.length > 0) {
      const file = dt.files[0];
      const dataUrl = await toDataURLFromFile(file);
      setEditData(prev => ({ ...prev, image: dataUrl }));
      return;
    }
    const uriList = dt.getData('text/uri-list');
    const plain = dt.getData('text/plain');
    const url = uriList || plain;
    if (url) {
      const dataUrl = await toDataURLFromUrl(url);
      setEditData(prev => ({ ...prev, image: dataUrl }));
    }
  };

  const onEditPaste: React.ClipboardEventHandler<HTMLDivElement> = async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'file') {
        const file = it.getAsFile();
        if (file) {
          const dataUrl = await toDataURLFromFile(file);
          setEditData(prev => ({ ...prev, image: dataUrl }));
          return;
        }
      }
    }
    const text = e.clipboardData.getData('text');
    if (text && /^https?:\/\//i.test(text)) {
      const dataUrl = await toDataURLFromUrl(text);
      setEditData(prev => ({ ...prev, image: dataUrl }));
    }
  };

  const handleEditSave = async () => {
    if (!editing) return;
    setEditSaving(true);
    try {
      await apiClient.updateProduct(editing.id, {
        name: editData.name.trim() || editing.name,
        price: Number(editData.price) || editing.price,
        category: editData.category,
        description: editData.description,
        image: editData.image || editing.image
      });
      setEditing(null);
      await loadProducts();
    } finally {
      setEditSaving(false);
    }
  };

  const generateDescription = async (name: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;
      if (!apiKey || apiKey === 'your_actual_google_api_key_here') {
        // Fallback template
        return `${name} — an authentic, comforting Indian curry prepared with traditional spices and home-style flavors. Delicious with rice or roti.`;
      }
      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({ model: 'gemini-2.0-flash-exp' });
      const prompt = `Write a single appetizing sentence (18-30 words) describing the Indian curry "${name}". Avoid emojis, keep it friendly and enticing.`;
      const res = await chat.sendMessage({ message: prompt });
      return res.text || `${name} — a delicious Indian curry with aromatic spices and rich, home-style flavors.`;
    } catch {
      return `${name} — a delicious Indian curry with aromatic spices and rich, home-style flavors.`;
    }
  };

  const detectCategory = (name: string): 'Currys' | 'Pickles' => {
    const n = name.toLowerCase();
    const pickleHints = ['pickle', 'achar', 'achaar', 'chutney'];
    if (pickleHints.some(h => n.includes(h))) return 'Pickles';
    return 'Currys';
  };

  const nameLock = (name: string): number => {
    // Simple deterministic hash → numeric lock for LoremFlickr
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return h % 10000; // keep it small
  };

  const generateImage = (name: string, category: 'Currys' | 'Pickles'): string => {
    // Prefer dish-specific LoremFlickr with deterministic lock for stability
    const tag = category === 'Pickles' ? 'pickle' : 'curry';
    const lock = nameLock(name);
    const lorem = `https://loremflickr.com/400/300/indian,food,${tag},${encodeURIComponent(name)}?lock=${lock}`;
    const picsum = `https://picsum.photos/seed/${encodeURIComponent(name)}/400/300`;
    return lorem || picsum;
  };

  const validateImage = (url: string, timeoutMs = 3000): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      let settled = false;
      const timer = setTimeout(() => { if (!settled) { settled = true; resolve(false); } }, timeoutMs);
      img.onload = () => { if (!settled) { settled = true; clearTimeout(timer); resolve(true); } };
      img.onerror = () => { if (!settled) { settled = true; clearTimeout(timer); resolve(false); } };
      img.src = url;
    });
  };

  const handleBulkCreate = async () => {
    const lines = bulkText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setBulkLoading(true);
    cancelBulkRef.current = false;
    try {
      for (const rawLine of lines) {
        if (cancelBulkRef.current) break;
        // Normalize separators and remove currency symbols like ₹ or INR
        const cleaned = rawLine
          .replace(/[₹]/g, '')
          .replace(/inr/gi, '')
          .replace(/[-:]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Extract price number
        const priceMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
        const price = priceMatch ? Number(priceMatch[1]) : 0;
        const name = cleaned.replace(/(\d+(?:\.\d+)?)/, '').trim();
        if (!name || !price || isNaN(price)) continue;

        const category = detectCategory(name);
        const description = await generateDescription(name);
        let image = generateImage(name, category);
        const ok = await validateImage(image).catch(() => false);
        if (!ok) {
          image = `https://picsum.photos/seed/${encodeURIComponent(name)}/400/300`;
        }

        await db.addProduct({
          name,
          price,
          category,
          description,
          image
        });
      }
      setBulkText('');
      await loadProducts();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const lines = bulkText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    // Build a set of normalized names (strip numbers/currency, trim, lowercased)
    const normalize = (raw: string) => raw
      .replace(/[₹]/g, '')
      .replace(/inr/gi, '')
      .replace(/[-:]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/(\d+(?:\.\d+)?)/g, '')
      .trim()
      .toLowerCase();
    const namesSet = new Set(lines.map(normalize).filter(n => n.length > 0));
    if (namesSet.size === 0) return;

    setBulkDeleting(true);
    try {
      const data = await db.getProducts(1, 1000);
      const items = data.items;
      const toDelete = items.filter(p => namesSet.has(p.name.trim().toLowerCase()));
      if (toDelete.length === 0) {
        alert('No matching products found to remove.');
        return;
      }
      const confirmed = window.confirm(`Remove ${toDelete.length} products listed?`);
      if (!confirmed) return;
      for (const prod of toDelete) {
        await db.deleteProduct(prod.id);
      }
      await loadProducts();
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'secondary' : 'primary'}>
          {isAdding ? 'Cancel' : 'Add Product'}
        </Button>
      </div>

      {/* Bulk Create with AI */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-lg font-bold mb-2">Bulk Create (AI-assisted)</h2>
        <p className="text-sm text-gray-600 mb-4">Paste lines like: <span className="font-mono">Pappu - 25</span>, <span className="font-mono">Chicken Curry - 60</span>, <span className="font-mono">Egg fry - 30</span>. Category set to <strong>Currys</strong>, descriptions via AI (fallback template if AI not configured), and seeded images.</p>
        <textarea
          className="w-full border border-gray-300 rounded-md p-2 mb-3"
          rows={4}
          placeholder={`Pappu - 25\nChicken Curry - 60\nEgg fry - 30\nCup rice - 30\nRasam - 15\nCurd - 15`}
          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
        />
        <div className="flex gap-3">
          <Button type="button" onClick={handleBulkCreate} disabled={bulkLoading || !bulkText.trim()}>
            {bulkLoading ? 'Creating…' : 'Auto Generate with AI'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => { cancelBulkRef.current = true; setBulkText(''); }}>Clear</Button>
          <Button type="button" variant="danger" onClick={handleBulkDelete} disabled={bulkDeleting || !bulkText.trim()}>
            {bulkDeleting ? 'Removing…' : 'Remove Listed Products'}
          </Button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 animate-fade-in">
          <h2 className="text-lg font-bold mb-4">Add New Product</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input 
                required
                className="mt-1 w-full border border-gray-300 rounded-md p-2" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (INR)</label>
              <input 
                required
                type="number"
                className="mt-1 w-full border border-gray-300 rounded-md p-2" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select 
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="Currys">Currys</option>
                <option value="Pickles">Pickles</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL</label>
              <input 
                className="mt-1 w-full border border-gray-300 rounded-md p-2" 
                value={formData.image} 
                onChange={e => setFormData({...formData, image: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                required
                className="mt-1 w-full border border-gray-300 rounded-md p-2" 
                rows={3}
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
               <Button type="submit">Save Product</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img className="h-10 w-10 rounded-full object-cover" src={product.image} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(product.name)}/400/300`; }} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.category === 'Currys' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{product.price}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                   <div className="flex items-center justify-end gap-4">
                     <button onClick={() => onStartEdit(product)} className="text-brand-600 hover:text-brand-800 font-medium">Edit</button>
                     <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 inline-flex items-center">
                       <Trash2 className="h-5 w-5" />
                     </button>
                   </div>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6" onDrop={onEditDrop} onDragOver={(e) => e.preventDefault()} onPaste={onEditPaste}>
            <h3 className="text-lg font-bold mb-4">Edit Product</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input className="mt-1 w-full border border-gray-300 rounded-md p-2" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (INR)</label>
                <input type="number" className="mt-1 w-full border border-gray-300 rounded-md p-2" value={editData.price} onChange={e => setEditData({ ...editData, price: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select className="mt-1 w-full border border-gray-300 rounded-md p-2" value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value as 'Currys' | 'Pickles' })}>
                  <option value="Currys">Currys</option>
                  <option value="Pickles">Pickles</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image</label>
                <div className="mt-1 border border-dashed border-gray-300 rounded-md p-3 text-sm text-gray-600">
                  Drag & drop an image file here, or paste a web link/image. Original URLs are not exposed; images are stored as data URLs.
                  <div className="mt-3">
                    {editData.image ? (
                      <img src={editData.image} alt="preview" className="w-32 h-24 object-cover rounded" />
                    ) : (
                      <div className="w-32 h-24 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">No image</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea rows={3} className="mt-1 w-full border border-gray-300 rounded-md p-2" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={handleEditSave} isLoading={editSaving}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;