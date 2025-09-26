import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import heic2any from "heic2any";

import { Button } from "components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";

import { apiRequest } from "lib/queryClient";
import { useToast } from "hooks/use-toast";
import { useAuth } from "hooks/useAuth";
import { useUser } from "state/UserContext";

import { Upload, User, Save, X, Camera } from "lucide-react";

import PageShell from "components/layout/PageShell";
import AeroBanner from "components/layout/AeroBanner";


const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().or(z.literal("")),
});

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [convertingImage, setConvertingImage] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const { setUser: setGlobalUser } = useUser();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user/current"],
  });

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
    },
  });

  // Reset form when user data loads - using useEffect to prevent infinite loop
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        bio: user.bio || "",
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      return await apiRequest("PATCH", "/api/user/current", data);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/current"] });
      
      // Update global user context to trigger sidebar refresh
      if (user) {
        const newUser = { ...user, ...updatedUser };
        setGlobalUser(newUser);
      }
      
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating profile",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Clean up previous preview
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    // Check if file is HEIC/HEIF
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      /\.heic$/i.test(file.name) ||
      /\.heif$/i.test(file.name);

    try {
      setConvertingImage(true);

      if (isHeic) {
        // Convert HEIC → JPEG
        const convertedBlob = (await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        }));

        // Create a File from the Blob
        const convertedFile = new File(
          [convertedBlob],
          file.name.replace(/\.(heic|heif)$/i, ".jpg"),
          { type: "image/jpeg" }
        );

        setAvatarFile(convertedFile);
        setAvatarPreview(URL.createObjectURL(convertedFile));
      } else {
        // Check file type for non-HEIC files
        const validImageTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
          'image/bmp', 'image/tiff', 'image/avif'
        ];
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const validExtensions = [
          'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 
          'bmp', 'tiff', 'tif', 'avif', 'jfif'
        ];

        const isValidType = file.type.startsWith("image/") || validImageTypes.includes(file.type);
        const isValidExtension = validExtensions.includes(fileExtension || '');

        if (!isValidType && !isValidExtension) {
          toast({
            title: "Invalid file type",
            description: "Please select an image file. Supported formats: JPEG, PNG, GIF, WebP, SVG, HEIC, HEIF, BMP, TIFF, AVIF",
            variant: "destructive",
          });
          return;
        }

        // Not HEIC—use as-is
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    } catch (err) {
      console.error("Image conversion error:", err);
      toast({
        title: "Image processing failed",
        description: "Sorry, we couldn't process that image. Please try a different photo.",
        variant: "destructive",
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      // Reset the input so user can choose again
      event.target.value = "";
    } finally {
      setConvertingImage(false);
    }
  };

  const onSubmit = async (data) => {
    let avatarUrl = user?.avatar;

    // Upload avatar if changed
    if (avatarFile) {
      try {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        
        const uploadResponse = await fetch("/api/user/avatar", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          avatarUrl = result.avatarUrl;
          
          // Immediately update global context so sidebar shows new avatar
          if (user && avatarUrl) {
            const cacheBustedUrl = `${avatarUrl}?t=${Date.now()}`;
            setGlobalUser({ ...user, avatar: cacheBustedUrl });
          }
        } else {
          const errorText = await uploadResponse.text();
          throw new Error(`Avatar upload failed: ${uploadResponse.status} - ${errorText}`);
        }
      } catch (error) {
        console.error("Avatar upload error:", error);
        toast({
          title: "Avatar upload failed",
          description: error instanceof Error ? error.message : "Could not upload avatar. Profile will be updated without the new image.",
          variant: "destructive",
        });
      }
    }

    updateProfileMutation.mutate({
      ...data,
      avatar: avatarUrl || undefined,
    });
  };

  const handleCancel = () => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        bio: user.bio || "",
      });
    }
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  if (isLoading) {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
          <p className="text-white/80">Unable to load profile. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <PageShell>
        <AeroBanner size="md" title="Your Profile" subtitle="Manage your account and avatar" />
        <div className="section max-w-4xl mx-auto space-y-6">
          {/* Header Section with Glassmorphic Design */}
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
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 font-semibold shadow-lg transition-all duration-300"
                  data-testid="button-edit-profile"
                >
                  <User className="w-5 h-5 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Main Profile Card with Enhanced Glassmorphic Effect */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader className="bg-white/5 backdrop-blur-sm rounded-t-2xl border-b border-white/10">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-white/70">
                Manage your author profile and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {!isEditing ? (
                // Display Mode with Glassmorphic Elements
                <div className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-2 border-white/30 ring-4 ring-white/10 shadow-xl">
                        <AvatarImage 
                          src={user.avatar || undefined} 
                          alt={user.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-lg font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30">
                          {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 to-purple-400/20 pointer-events-none"></div>
                    </div>
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
                // Edit Mode with Glassmorphic Form Elements
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <Avatar className="w-24 h-24 border-2 border-white/30 ring-4 ring-white/10 shadow-xl">
                            <AvatarImage 
                              src={avatarPreview || user.avatar || undefined}
                              alt={user.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-lg font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30">
                              {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
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
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-white">Profile Photo</p>
                          <p className="text-xs text-white/60">
                            Click the camera icon to upload a new photo (max 5MB)
                            <br />
                            HEIC files will be converted to JPEG automatically
                          </p>
                          {convertingImage && (
                            <div className="text-xs text-blue-300 font-medium bg-blue-500/20 backdrop-blur-sm rounded px-2 py-1 border border-blue-400/20">
                              Converting image...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/90">Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                              data-testid="input-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/90">Email Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/90">Author Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={5}
                              placeholder="Tell your readers about yourself, your writing journey, and what inspires you..."
                              className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none"
                              data-testid="textarea-bio"
                            />
                          </FormControl>
                          <div className="text-xs text-white/60 text-right bg-white/5 backdrop-blur-sm rounded px-2 py-1 border border-white/10">
                            {(field.value || "").length}/500 characters
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-end space-x-3 pt-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateProfileMutation.isPending}
                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        data-testid="button-cancel"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-blue-600/80 backdrop-blur-sm hover:bg-blue-500/80 border border-white/20 shadow-xl"
                        data-testid="button-save"
                      >
                        {updateProfileMutation.isPending ? (
                          "Saving..."
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </div>
  );
}
