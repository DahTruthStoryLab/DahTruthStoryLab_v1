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

/* -----------------------------
   Schema
------------------------------*/
const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

/* -----------------------------
   TEMP: Font + Glass sanity card
------------------------------*/
function StyleTestCard() {
  return (
    <div className="p-6 glass-panel max-w-xl mx-auto my-6">
      <h1 className="font-serif text-3xl mb-2">Your pen is ready</h1>
      <p className="font-sans text-base leading-7 text-muted">
        This line should be Inter. The heading above should be Playfair Display.
      </p>
      <button className="mt-4 btn-primary">Looks good</button>
    </div>
  );
}

/* -----------------------------
   Component
------------------------------*/
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
    onError: () => {
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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      /\.heic$/i.test(file.name) ||
      /\.heif$/i.test(file.name);

    try {
      setConvertingImage(true);

      if (isHeic) {
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        });

        const convertedFile = new File(
          [convertedBlob],
          file.name.replace(/\.(heic|heif)$/i, ".jpg"),
          { type: "image/jpeg" }
        );

        setAvatarFile(convertedFile);
        setAvatarPreview(URL.createObjectURL(convertedFile));
      } else {
        const validImageTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml",
          "image/bmp",
          "image/tiff",
          "image/avif",
        ];
        const fileExtension = file.name.toLowerCase().split(".").pop();
        const validExtensions = [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "svg",
          "bmp",
          "tiff",
          "tif",
          "avif",
          "jfif",
        ];

        const isValidType = file.type.startsWith("image/") || validImageTypes.includes(file.type);
        const isValidExtension = validExtensions.includes(fileExtension || "");

        if (!isValidType && !isValidExtension) {
          toast({
            title: "Invalid file type",
            description:
              "Please select an image file. Supported formats: JPEG, PNG, GIF, WebP, SVG, HEIC, HEIF, BMP, TIFF, AVIF",
            variant: "destructive",
          });
          return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    } catch (err) {
      console.error("Image conversion error:", err);
      toast({
        title: "Image processing failed",
        description:
          "Sorry, we couldn't process that image. Please try a different photo.",
        variant: "destructive",
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      event.target.value = "";
    } finally {
      setConvertingImage(false);
    }
  };

  const onSubmit = async (data) => {
    let avatarUrl = user?.avatar;

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
          description:
            error instanceof Error
              ? error.message
              : "Could not upload avatar. Profile will be updated without the new image.",
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

  /* -----------------------------
     Loading / Error UI (light)
  ------------------------------*/
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[color:var(--color-base)]">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-black/5 rounded-lg w-1/4"></div>
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-black/5 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-black/5 rounded w-32"></div>
                  <div className="h-4 bg-black/5 rounded w-48"></div>
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
      <div className="min-h-screen bg-[color:var(--color-base)] flex items-center justify-center">
        <div className="glass-panel p-8 text-center">
          <p className="text-muted">Unable to load profile. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  /* -----------------------------
     Main (light + glass)
  ------------------------------*/
  return (
    <div className="min-h-screen bg-[color:var(--color-base)] bg-radial-fade">
      <PageShell>
        <AeroBanner size="md" title="Your Profile" subtitle="Manage your account and avatar" />

        {/* TEMP: font + glass sanity check */}
        <StyleTestCard />

        <div className="section max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl text-[color:var(--color-ink)]">Author Profile</h2>
                <p className="text-muted">Manage your writing identity and personal information</p>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="lg"
                  className="btn-primary font-semibold shadow-lg"
                  data-testid="button-edit-profile"
                >
                  <User className="w-5 h-5 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Card */}
          <Card className="glass-panel">
            <CardHeader className="glass-soft rounded-t-2xl border border-white/0">
              <CardTitle className="text-xl text-[color:var(--color-ink)] flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-muted">
                Manage your author profile and personal information
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {!isEditing ? (
                /* -------- Display Mode -------- */
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-2 border-white/40 ring-4 ring-white/20 shadow-xl">
                        <AvatarImage
                          src={user.avatar || undefined}
                          alt={user.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-lg font-medium bg-white/60 text-[color:var(--color-ink)] border border-white/40">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[rgba(202,177,214,0.25)] to-[rgba(234,242,255,0.25)] pointer-events-none"></div>
                    </div>
                    <div className="space-y-1">
                      <h3
                        className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
                        data-testid="text-user-name"
                      >
                        {user.name}
                      </h3>
                      <p className="text-muted text-lg" data-testid="text-user-email">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {user.bio ? (
                    <div className="glass-soft p-4">
                      <h4 className="text-sm font-medium text-[color:var(--color-ink)]/80 mb-2">Bio</h4>
                      <p
                        className="text-[color:var(--color-ink)]/80 leading-relaxed whitespace-pre-wrap"
                        data-testid="text-user-bio"
                      >
                        {user.bio}
                      </p>
                    </div>
                  ) : (
                    <div className="glass-soft p-4 border-dashed">
                      <div className="text-muted italic text-center">
                        No bio added yet. Click "Edit Profile" to add your author biography.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* -------- Edit Mode -------- */
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="w-24 h-24 border-2 border-white/40 ring-4 ring-white/20 shadow-xl">
                            <AvatarImage
                              src={avatarPreview || user.avatar || undefined}
                              alt={user.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-lg font-medium bg-white/60 text-[color:var(--color-ink)] border border-white/40">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <label
                            htmlFor="avatar-upload"
                            className="absolute -bottom-2 -right-2 bg-[color:var(--color-primary)] hover:opacity-90 text-[color:var(--color-ink)] rounded-full p-2 cursor-pointer shadow-xl border border-white/40"
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

                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[rgba(202,177,214,0.25)] to-[rgba(234,242,255,0.25)] pointer-events-none"></div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-[color:var(--color-ink)]">Profile Photo</p>
                          <p className="text-xs text-muted">
                            Click the camera icon to upload a new photo (max 5MB)
                            <br />
                            HEIC files will be converted to JPEG automatically
                          </p>
                          {convertingImage && (
                            <div className="text-xs font-medium bg-[color:var(--color-primary)] rounded px-2 py-1 border border-white/40">
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
                          <FormLabel className="text-[color:var(--color-ink)]/90">Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="glass-soft border-white/40 text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink)]/50 focus-visible:ring-0 focus:border-white/60"
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
                          <FormLabel className="text-[color:var(--color-ink)]/90">Email Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              className="glass-soft border-white/40 text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink)]/50 focus-visible:ring-0 focus:border-white/60"
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
                          <FormLabel className="text-[color:var(--color-ink)]/90">Author Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={5}
                              placeholder="Tell your readers about yourself, your writing journey, and what inspires you..."
                              className="glass-soft border-white/40 text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink)]/50 resize-none focus-visible:ring-0 focus:border-white/60"
                              data-testid="textarea-bio"
                            />
                          </FormControl>
                          <div className="text-xs text-muted text-right glass-soft px-2 py-1">
                            {(field.value || "").length}/500 characters
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-end gap-3 pt-4 glass-soft p-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateProfileMutation.isPending}
                        className="glass-soft hover:bg-white/60"
                        data-testid="button-cancel"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="btn-primary shadow-xl"
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
