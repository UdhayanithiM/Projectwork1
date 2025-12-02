"use client";

import { User, Bell, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gradient w-fit">
          Account Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your profile, preferences, and notifications.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white/5 border border-white/10 mb-8 h-auto p-1 rounded-xl">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 rounded-lg"
          >
            <User className="mr-2 h-4 w-4" /> Profile
          </TabsTrigger>

          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 rounded-lg"
          >
            <Shield className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>

          <TabsTrigger
            value="appearance"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 rounded-lg"
          >
            <Palette className="mr-2 h-4 w-4" /> Appearance
          </TabsTrigger>

          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 rounded-lg"
          >
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6">
          <GlassPanel className="space-y-8">
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32 border-4 border-white/10 shadow-xl">
                  <AvatarImage src={user?.avatar || ""} />
                  <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="w-full">
                  Change Avatar
                </Button>
              </div>

              {/* Profile Fields */}
              <div className="flex-1 space-y-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      defaultValue={user?.name || ""}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      defaultValue={user?.email || ""}
                      disabled
                      className="opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      defaultValue={user?.role || "Student"}
                      disabled
                      className="opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school">University / Organization</Label>
                    <Input id="school" placeholder="e.g. MIT" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    placeholder="Tell us a little about yourself..."
                    className="h-24"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <Button className="shadow-lg shadow-primary/25">
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </GlassPanel>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security">
          <GlassPanel className="space-y-6 p-6">
            <h3 className="text-lg font-medium">Change Password</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <Button className="shadow-lg shadow-primary/25">
                Update Password
              </Button>
            </div>
          </GlassPanel>
        </TabsContent>

        {/* APPEARANCE TAB */}
        <TabsContent value="appearance">
          <GlassPanel className="space-y-6 p-6">
            <h3 className="text-lg font-medium">Theme</h3>

            <div className="space-y-2">
              <Label>Color Scheme</Label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                >
                  Light
                </Button>

                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </Button>

                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                >
                  System
                </Button>
              </div>
            </div>
          </GlassPanel>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications">
          <GlassPanel className="space-y-6 p-6">
            <h3 className="text-lg font-medium">Email Notifications</h3>

            <div className="space-y-4">
              {/* Item 1 */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-base">Assessment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about upcoming scheduled interviews.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Get a weekly progress summary every Monday.
                  </p>
                </div>
                <Switch />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <Button className="shadow-lg shadow-primary/25">
                Save Preferences
              </Button>
            </div>
          </GlassPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

