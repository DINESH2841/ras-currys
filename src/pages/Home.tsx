import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { apiClient } from '../services/apiClient';
import { Product } from '../types';
import { CATEGORIES, ITEMS_PER_PAGE } from '../constants';
import { Search, Loader2 } from 'lucide-react';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  // URL State Sync
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getProducts(page, ITEMS_PER_PAGE, category, search);
      setProducts(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset page on filter change
    if (key !== 'page') newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-brand-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Authentic Flavors, <span className="text-brand-400">Delivered.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-brand-100">
            Handcrafted curries and pickles made with traditional recipes. Taste the heritage of India in every bite.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          
          {/* Categories */}
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => updateParam('category', cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === cat.id 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {total > ITEMS_PER_PAGE && (
              <div className="mt-12 flex justify-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => updateParam('page', (page - 1).toString())}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {page} of {Math.ceil(total / ITEMS_PER_PAGE)}
                </span>
                <button
                  disabled={page * ITEMS_PER_PAGE >= total}
                  onClick={() => updateParam('page', (page + 1).toString())}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-gray-900">No delicious items found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;