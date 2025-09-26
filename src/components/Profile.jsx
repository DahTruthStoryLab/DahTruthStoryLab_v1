import { useState } from "react";
import { User, Save, X, Camera } from "lucide-react";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    bio: "A passionate writer exploring the depths of storytelling and creativity. I've been crafting stories for over a decade, drawing inspiration from everyday life and the infinite possibilities of human imagination."
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsEditing(false);
    setIsLoading(false);
    console.log("Profile saved:", formData);
    alert("Profile updated successfully!");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    // Reset form data if needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header Banner */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
            <p className="text-white/70">Manage your account and avatar</p>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Author Profile</h2>
              <p className="text-white/70">Manage your writing identity and personal information</p>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 font-semibold shadow-lg transition-all duration-300 px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
          {/* Card Header */}
          <div className="bg-white/5 backdrop-blur-sm rounded-t-2xl border-b border-white/10 p-6">
            <h3 className="text-xl text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h3>
            <p className="text-white/70 mt-1">
              Manage your author profile and personal information
            </p>
          </div>
          
          {/* Card Content */}
          <div className="p-6 space-y-6">
            {!isEditing ? (
              // Display Mode
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 border-2 border-white/30 ring-4 ring-white/10 shadow-xl rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-medium overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        formData.name.split(" ").map(n => n[0]).join("").toUpperCase()
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 to-purple-400/20 pointer-events-none"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-white">
                      {formData.name}
                    </h3>
                    <p className="text-white/70 text-lg">
                      {formData.email}
                    </p>
                  </div>
                </div>

                {formData.bio && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <h4 className="text-sm font-medium text-white/90 mb-2">Bio</h4>
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                      {formData.bio}
                    </p>
                  </div>
                )}

                {!formData.bio && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 border-dashed">
                    <div className="text-white/60 italic text-center">
                      No bio added yet. Click "Edit Profile" to add your author biography.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 border-2 border-white/30 ring-4 ring-white/10 shadow-xl rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg font-medium overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          formData.name.split(" ").map(n => n[0]).join("").toUpperCase()
                        )}
                      </div>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute -bottom-2 -right-2 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-500/80 text-white rounded-full p-2 cursor-pointer shadow-xl transition-all duration-300 border border-white/20"
                        title="Change avatar"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 to-purple-400/20 pointer-events-none"></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">Profile Photo</p>
                      <p className="text-xs text-white/60">
                        Click the camera icon to upload a new photo (max 5MB)
                        <br />
                        Supported formats: JPEG, PNG, GIF, WebP
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  <div>
                    <label className="text-white/90 text-sm font-medium block mb-2">Full Name</label>
                    <input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 rounded-lg px-4 py-3 focus:outline-none transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/90 text-sm font-medium block mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 rounded-lg px-4 py-3 focus:outline-none transition-all"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/90 text-sm font-medium block mb-2">Author Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={6}
                      placeholder="Tell your readers about yourself, your writing journey, and what inspires you..."
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 resize-none rounded-lg px-4 py-3 focus:outline-none transition-all"
                      maxLength={500}
                    />
                    <div className="text-xs text-white/60 text-right bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10 mt-2 inline-block">
                      {formData.bio.length}/500 characters
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <button 
                    type="button"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-blue-600/80 backdrop-blur-sm hover:bg-blue-500/80 border border-white/20 shadow-xl text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
