import { useState, useEffect } from "react";
import { User, Save, X, Camera } from "lucide-react";

// Simple form validation schema (replacing Zod)
const validateProfile = (data) => {
  const errors = {};
  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Name is required";
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }
  if (data.bio && data.bio.length > 500) {
    errors.bio = "Bio must be less than 500 characters";
  }
  return { errors, isValid: Object.keys(errors).length === 0 };
};

// Simple toast notification (replacing useToast)
const showToast = (title, description, variant = "default") => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm ${
    variant === 'destructive' ? 'bg-red-600' : 'bg-green-600'
  }`;
  toast.innerHTML = `
    <div class="font-semibold">${title}</div>
    <div class="text-sm opacity-90">${description}</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => document.body.removeChild(toast), 3000);
};

// Mock user data (replacing useQuery)
const mockUser = {
  name: "Jacqueline Session",
  email: "jacqueline@dahtruth.com",
  bio: "Founder of DahTruth.com and creator of DahTruth StoryLab. Passionate about empowering writers to discover and share their authentic stories through faith-based community and modern technology.",
  avatar: null
};

// Simple UI Components (replacing external UI library)
const Button = ({ children, onClick, disabled, variant = "default", size = "default", className = "", ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20";
  const variants = {
    default: "bg-blue-600/80 backdrop-blur-sm hover:bg-blue-500/80 border border-white/20 shadow-xl text-white",
    outline: "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
  };
  const sizes = {
    default: "px-4 py-2",
    lg: "px-6 py-3"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`bg-white/5 backdrop-blur-sm rounded-t-2xl border-b border-white/10 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-xl text-white flex items-center gap-2 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = "" }) => (
  <p className={`text-white/70 mt-1 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const Avatar = ({ children, className = "" }) => (
  <div className={`relative ${className}`}>
    {children}
  </div>
);

const AvatarImage = ({ src, alt, className = "" }) => 
  src ? <img src={src} alt={alt} className={`object-cover ${className}`} /> : null;

const AvatarFallback = ({ children, className = "" }) => (
  <div className={`w-full h-full flex items-center justify-center ${className}`}>
    {children}
  </div>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 rounded-lg px-4 py-3 focus:outline-none transition-all ${className}`}
    {...props}
  />
);

const Textarea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 resize-none rounded-lg px-4 py-3 focus:outline-none transition-all ${className}`}
    {...props}
  />
);

// Form components
const FormField = ({ name, render }) => render({ field: { name } });
const FormItem = ({ children }) => <div className="space-y-2">{children}</div>;
const FormLabel = ({ children, className = "" }) => <label className={`text-white/90 text-sm font-medium block ${className}`}>{children}</label>;
const FormControl = ({ children }) => <div>{children}</div>;
const FormMessage = ({ children }) => children ? <div className="text-red-400 text-sm">{children}</div> : null;

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [convertingImage, setConvertingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Load mock user data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setUser(mockUser);
      setFormData({
        name: mockUser.name,
        email: mockUser.email,
        bio: mockUser.bio || ""
      });
    }, 500);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast(
        "File too large",
        "Please select an image smaller than 5MB.",
        "destructive"
      );
      return;
    }

    // Clean up previous preview
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    // Check if file is HEIC/HEIF (basic check without conversion)
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      /\.heic$/i.test(file.name) ||
      /\.heif$/i.test(file.name);

    try {
      setConvertingImage(true);

      if (isHeic) {
        showToast(
          "HEIC files not supported",
          "Please convert to JPEG or PNG first.",
          "destructive"
        );
        return;
      } else {
        const validImageTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
        ];
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        const isValidType = file.type.startsWith("image/") || validImageTypes.includes(file.type);
        const isValidExtension = validExtensions.includes(fileExtension || '');

        if (!isValidType && !isValidExtension) {
          showToast(
            "Invalid file type",
            "Please select an image file. Supported formats: JPEG, PNG, GIF, WebP",
            "destructive"
          );
          return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    } catch (err) {
      console.error("Image processing error:", err);
      showToast(
        "Image processing failed",
        "Sorry, we couldn't process that image. Please try a different photo.",
        "destructive"
      );
      setAvatarFile(null);
      setAvatarPreview(null);
      event.target.value = "";
    } finally {
      setConvertingImage(false);
    }
  };

  const handleSave = async () => {
    // Validate form
    const { errors, isValid } = validateProfile(formData);
    setFormErrors(errors);

    if (!isValid) {
      showToast(
        "Validation Error",
        "Please fix the errors below.",
        "destructive"
      );
      return;
    }

    setIsLoading(true);

    try {
      let avatarUrl = user?.avatar;

      // Simulate avatar upload if changed
      if (avatarFile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        avatarUrl = URL.createObjectURL(avatarFile);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user data
      const updatedUser = { ...user, ...formData, avatar: avatarUrl };
      setUser(updatedUser);

      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      showToast(
        "Profile updated",
        "Your profile has been successfully updated."
      );
    } catch (error) {
      console.error("Profile update error:", error);
      showToast(
        "Error updating profile",
        "There was an error updating your profile. Please try again.",
        "destructive"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        bio: user.bio || ""
      });
    }
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormErrors({});
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 backdrop-blur-xl rounded-lg border border-white/10 w-1/4"></div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white/20 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-white/20 rounded w-32"></div>
                  <div className="h-4 bg-white/20 rounded w-48"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Page Shell equivalent */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Aero Banner equivalent */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl p-8 mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-xl opacity-90">Manage your account and avatar</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Author Profile</h2>
                <p className="text-white/70">Manage your writing identity and personal information</p>
              </div>
              {!isEditing && (
                <Button 
                  onClick={() => setIsEditing(true)}
                  size="lg"
                  className="font-semibold shadow-lg"
                  data-testid="button-edit-profile"
                >
                  <User className="w-5 h-5 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Main Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Manage your author profile and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isEditing ? (
                // Display Mode
                <div className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-24 h-24 border-2 border-white/30 ring-4 ring-white/10 shadow-xl rounded-full bg-white/20 backdrop-blur-sm overflow-hidden">
                      <AvatarImage 
                        src={user.avatar || undefined} 
                        alt={user.name}
                        className="w-full h-full"
                      />
                      <AvatarFallback className="text-lg font-medium text-white border border-white/30">
                        {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 to-purple-400/20 pointer-events-none"></div>
                    </Avatar>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold text-white" data-testid="text-user-name">
                        {user.name}
                      </h3>
                      <p className="text-white/70 text-lg" data-testid="text-user-email">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {user.bio && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <h4 className="text-sm font-medium text-white/90 mb-2">Bio</h4>
                      <p className="text-white/80 leading-relaxed whitespace-pre-wrap" data-testid="text-user-bio">
                        {user.bio}
                      </p>
                    </div>
                  )}

                  {!user.bio && (
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
                  <div className="space-y-4">
                    <div className="flex items-center space-x-6">
                      <Avatar className="w-24 h-24 border-2 border-white/30 ring-4 ring-white/10 shadow-xl rounded-full bg-white/20 backdrop-blur-sm overflow-hidden">
                        <AvatarImage 
                          src={avatarPreview || user.avatar || undefined}
                          alt={user.name}
                          className="w-full h-full"
                        />
                        <AvatarFallback className="text-lg font-medium text-white border border-white/30">
                          {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
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
                          data-testid="input-avatar-upload"
                        />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 to-purple-400/20 pointer-events-none"></div>
                      </Avatar>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-white">Profile Photo</p>
                        <p className="text-xs text-white/60">
                          Click the camera icon to upload a new photo (max 5MB)
                          <br />
                          Supported formats: JPEG, PNG, GIF, WebP
                        </p>
                        {convertingImage && (
                          <div className="text-xs text-blue-300 font-medium bg-blue-500/20 backdrop-blur-sm rounded px-2 py-1 border border-blue-400/20">
                            Processing image...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <FormField
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage>{formErrors.name}</FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage>{formErrors.email}</FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={5}
                            placeholder="Tell your readers about yourself, your writing journey, and what inspires you..."
                            value={formData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            data-testid="textarea-bio"
                          />
                        </FormControl>
                        <div className="text-xs text-white/60 text-right bg-white/5 backdrop-blur-sm rounded px-2 py-1 border border-white/10">
                          {(formData.bio || "").length}/500 characters
                        </div>
                        <FormMessage>{formErrors.bio}</FormMessage>
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end space-x-3 pt-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <Button 
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                      data-testid="button-cancel"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={isLoading}
                      data-testid="button-save"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
