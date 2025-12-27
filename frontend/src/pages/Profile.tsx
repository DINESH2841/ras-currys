import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { apiClient } from '../services/apiClient';
import Button from '../components/Button';
import { User as UserIcon, Mail, Phone, MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=profile');
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Only allow digits, max 10
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Please enter a valid name');
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      setError('Phone number must be 10 digits');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.updateUser(user!.id, {
        name: formData.name.trim(),
        phone: formData.phone || null,
        address: formData.address.trim() || null
      });

      if (result.id || result._id) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-12">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-brand-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                <p className="text-brand-100 capitalize">{user.role} Account</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {!isEditing ? (
              // View Mode
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Full Name
                    </div>
                    <p className="text-gray-900 font-medium">{formData.name}</p>
                  </div>

                  {/* Email */}
                  <div>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Address
                    </div>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone Number
                    </div>
                    <p className="text-gray-900 font-medium">{formData.phone || 'Not provided'}</p>
                  </div>

                  {/* Address */}
                  <div>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      Address
                    </div>
                    <p className="text-gray-900 font-medium">{formData.address || 'Not provided'}</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </div>
              </div>
            ) : (
              // Edit Mode
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (10 digits)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your full delivery address (street, area, city, state, pincode)"
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4 border-t pt-6">
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={loading}
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name,
                        phone: user.phone || '',
                        address: user.address || ''
                      });
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
