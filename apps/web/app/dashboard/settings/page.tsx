'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { User, Bell, KeyRound, Palette } from "lucide-react";

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

// --- Reusable Card Component for Settings ---
const SettingsCard = ({ icon, title, description, children, footer }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) => (
    <motion.div variants={itemVariants}>
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted rounded-lg text-muted-foreground">{icon}</div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer && <CardFooter>{footer}</CardFooter>}
        </Card>
    </motion.div>
);

// --- Individual Settings Components ---

const ProfileCard = () => {
    const [firstName, setFirstName] = useState("Alex");
    const [lastName, setLastName] = useState("Johnson");

    const handleSaveProfile = () => {
        // In a real app, you would send this data to your API
        console.log("Saving profile:", { firstName, lastName });
    };
    
    return (
        <SettingsCard
            icon={<User />}
            title="Profile"
            description="Update your personal information."
            footer={<Button className="ml-auto" onClick={handleSaveProfile}>Save Profile</Button>}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value="alex.johnson@example.com" disabled />
                    <p className="text-xs text-muted-foreground">Email cannot be changed for security reasons.</p>
                </div>
            </div>
        </SettingsCard>
    );
};

const NotificationsCard = () => {
    const [reminders, setReminders] = useState(true);
    const [updates, setUpdates] = useState(true);

    return (
        <SettingsCard
            icon={<Bell />}
            title="Notifications"
            description="Manage how you receive application updates."
            footer={<Button className="ml-auto">Save Notifications</Button>}
        >
             <div className="space-y-4">
                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                    <Label htmlFor="interview-reminders" className="flex flex-col space-y-1 cursor-pointer">
                        <span>Interview Reminders</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Receive email reminders for upcoming interviews.
                        </span>
                    </Label>
                    <Switch id="interview-reminders" checked={reminders} onCheckedChange={setReminders} />
                </div>
                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                    <Label htmlFor="candidate-updates" className="flex flex-col space-y-1 cursor-pointer">
                        <span>Application Status Updates</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Get notified when your application status changes.
                        </span>
                    </Label>
                    <Switch id="candidate-updates" checked={updates} onCheckedChange={setUpdates} />
                </div>
            </div>
        </SettingsCard>
    );
};

const SecurityCard = () => {
    return (
        <SettingsCard
            icon={<KeyRound />}
            title="Security"
            description="Manage your password and account security."
            footer={<Button className="ml-auto">Change Password</Button>}
        >
            <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </SettingsCard>
    );
};

const AppearanceCard = () => {
    const { theme, setTheme } = useTheme();

    return (
        <SettingsCard
            icon={<Palette />}
            title="Appearance"
            description="Customize the look and feel of the application."
        >
            <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme">
                        <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </SettingsCard>
    );
};


// --- Main Page Component ---
export default function SettingsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
            <div>
                <h1 className="font-semibold text-2xl md:text-3xl">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your profile, notifications, and application preferences.
                </p>
            </div>

            <motion.div 
                className="grid gap-8 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <ProfileCard />
                    <NotificationsCard />
                    <SecurityCard />
                </div>
                
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <AppearanceCard />
                </div>
            </motion.div>
        </div>
    );
}