import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Camera, Mail, Building, ShieldCheck, User } from "lucide-react";
import { PageBackButton } from "../components/PageBackButton";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";
import { getProfile, updateProfile, uploadAvatar } from "@/lib/data/repository";
import { uploadToS3 } from "@/lib/apiClient";
import { CurrentUser } from "@/lib/types/models";

export function ProfilePage() {
  const { session, updateSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CurrentUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
        setEditName(data.name);
        // Email might not be in CurrentUser but usually comes from session/profile
        setEditEmail(session?.user?.email || "");
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [session]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateProfile({ name: editName });
      setProfile(updated);
      toast.success("Profile updated successfully");
      
      // Update session if needed
      if (session) {
        updateSession({
          ...session,
          user: {
            ...session.user,
            nameEn: editName
          }
        });
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const { uploadUrl, avatarUrl } = await uploadAvatar(file.name, file.type);
      
      // If we got a presigned URL, upload directly to S3
      if (uploadUrl) {
        await uploadToS3(uploadUrl, file);
      }
      
      setProfile(prev => prev ? { ...prev, avatarUrl } : null);
      toast.success("Avatar updated successfully");
      
      if (session) {
        updateSession({
          ...session,
          user: {
            ...session.user,
            avatarUrl: avatarUrl
          }
        });
      }
    } catch (error) {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <PageBackButton to={session?.activeRole === "instructor" ? "/instructor" : "/student"} label="Dashboard" />
      
      <div className="mb-8 flex items-center gap-6">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-2 border-white shadow-lg">
            <AvatarImage src={profile?.avatarUrl} />
            <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
              {profile?.initials || "U"}
            </AvatarFallback>
          </Avatar>
          <label 
            className={cn(
              "absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-md",
              uploading && "opacity-50 cursor-not-allowed"
            )}
            htmlFor="avatar-upload"
          >
            <Camera className="h-4 w-4" />
            <input 
              id="avatar-upload" 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{profile?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="capitalize">{profile?.activeRole}</Badge>
            <span className="text-gray-500 text-sm">ID: {profile?.id}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile details and how others see you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="name" 
                    className="pl-10" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="email" 
                    className="pl-10 bg-gray-50" 
                    value={editEmail} 
                    disabled 
                  />
                </div>
                <p className="text-xs text-gray-400">Official TU email cannot be changed here.</p>
              </div>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleUpdateProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Department</p>
                <p className="text-sm font-medium">{session?.user?.department || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                <p className="text-sm font-medium">Active (Regular)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
