"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  PlusCircle, 
  MoreHorizontal, 
  Search, 
  UserPlus, 
  Trash2, 
  Edit2, 
  ShieldAlert,
  Mail,
  Calendar,
  User as UserIcon
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";

// --- Types ---
type Role = "STUDENT" | "HR" | "ADMIN";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

const addUserSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  role: z.enum(["STUDENT", "HR", "ADMIN"]),
});

type AddUserFormData = z.infer<typeof addUserSchema>;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);

  const addUserForm = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "STUDENT",
    },
  });

  // --- Fetch Users ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users.");
      const data = await response.json();
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Search Logic ---
  useEffect(() => {
    if (!searchQuery) {
        setFilteredUsers(users);
    } else {
        const lower = searchQuery.toLowerCase();
        setFilteredUsers(users.filter(u => 
            u.name.toLowerCase().includes(lower) || 
            u.email.toLowerCase().includes(lower) ||
            u.role.toLowerCase().includes(lower)
        ));
    }
  }, [searchQuery, users]);

  // --- Create User ---
  const onAddUserSubmit = async (data: AddUserFormData) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user.");
      }

      toast.success("User Created", { description: `${data.name} has been added to the system.` });
      setIsAddUserDialogOpen(false);
      addUserForm.reset();
      fetchUsers();
    } catch (err: any) {
      toast.error("Creation Failed", { description: err.message });
    }
  };

  // --- Delete User ---
  const handleDeleteClick = (user: User) => { setUserToDelete(user); setIsDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success("User Deleted", { description: "Account removed successfully." });
      fetchUsers();
    } catch (err: any) { 
        toast.error("Delete Failed", { description: err.message }); 
    } finally { 
        setIsDeleteDialogOpen(false); 
        setUserToDelete(null); 
    }
  };

  // --- Edit User ---
  const handleEditClick = (user: User) => { setUserToEdit(user); setIsEditUserDialogOpen(true); };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    try {
      const response = await fetch(`/api/admin/users/${userToEdit.id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userToEdit.name, email: userToEdit.email, role: userToEdit.role }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success("User Updated", { description: "Changes saved successfully." });
      setIsEditUserDialogOpen(false); 
      fetchUsers(); 
      setUserToEdit(null);
    } catch (err: any) { 
        toast.error("Update Failed", { description: err.message }); 
    }
  };

  const roleStyles = {
    ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
    HR: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    STUDENT: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  };

  return (
    <div className="space-y-6 p-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">User Management</h1>
          <p className="text-muted-foreground mt-1">Control access, manage roles, and oversee the user base.</p>
        </div>
        <Button onClick={() => setIsAddUserDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-glow-primary">
            <UserPlus className="mr-2 h-4 w-4"/> Add New User
        </Button>
      </div>

      {/* Main Content */}
      <GlassPanel className="p-0 overflow-hidden bg-black/40 border-white/10">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between gap-4 items-center">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search users..." 
                    className="pl-9 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <ShieldAlert className="w-3 h-3 text-primary" />
                ADMIN ACCESS ONLY
            </div>
        </div>

        {/* Table */}
        <div className="p-0">
            <Table>
                <TableHeader className="bg-transparent hover:bg-transparent">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-muted-foreground pl-6">Identity</TableHead>
                        <TableHead className="text-muted-foreground">Role</TableHead>
                        <TableHead className="text-muted-foreground">Joined</TableHead>
                        <TableHead className="text-right text-muted-foreground pr-6">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : filteredUsers.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No users match your filters.</TableCell></TableRow>
                    ) : (
                        filteredUsers.map((user) => (
                            <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                <TableCell className="pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                                            <UserIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white group-hover:text-primary transition-colors">{user.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("border font-bold", roleStyles[user.role])}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 text-muted-foreground">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#0a0a0b] border-white/10 text-white">
                                            <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEditClick(user)} className="cursor-pointer focus:bg-white/10">
                                                <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-400 cursor-pointer focus:bg-red-500/10 focus:text-red-400" onClick={() => handleDeleteClick(user)}>
                                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Account
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </GlassPanel>

      {/* --- ADD USER DIALOG --- */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[#0a0a0b] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription className="text-muted-foreground">Create a new account manually. Required for HR/Admin roles.</DialogDescription>
          </DialogHeader>

          <Form {...addUserForm}>
            <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
              <FormField control={addUserForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} className="bg-black/50 border-white/10 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={addUserForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john@company.com" {...field} className="bg-black/50 border-white/10 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={addUserForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} {...field} className="bg-black/50 border-white/10 text-white pr-14" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1 h-7 text-xs text-muted-foreground hover:text-white">
                        {showPassword ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={addUserForm.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Role</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-black/50 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0a0a0b] border-white/10 text-white">
                        <SelectItem value="STUDENT">Student</SelectItem>
                        <SelectItem value="HR">HR Manager</SelectItem>
                        <SelectItem value="ADMIN">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={addUserForm.formState.isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white">
                  {addUserForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* --- EDIT USER DIALOG --- */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#0a0a0b] border-white/10 text-white">
            <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription className="text-muted-foreground">Modify account details.</DialogDescription>
            </DialogHeader>
            {userToEdit && (
                <form onSubmit={handleEditUserSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Name</Label>
                        <Input value={userToEdit.name} onChange={(e) => setUserToEdit({...userToEdit, name: e.target.value})} className="bg-black/50 border-white/10 text-white"/>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Email</Label>
                        <Input value={userToEdit.email} onChange={(e) => setUserToEdit({...userToEdit, email: e.target.value})} className="bg-black/50 border-white/10 text-white"/>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Role</Label>
                        <Select value={userToEdit.role} onValueChange={(v: Role) => setUserToEdit({...userToEdit, role: v})}>
                            <SelectTrigger className="bg-black/50 border-white/10 text-white"><SelectValue/></SelectTrigger>
                            <SelectContent className="bg-[#0a0a0b] border-white/10 text-white">
                                <SelectItem value="STUDENT">Student</SelectItem>
                                <SelectItem value="HR">HR</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-white w-full">Save Changes</Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION --- */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0a0a0b] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Delete User Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete <span className="text-white font-bold">{userToDelete?.name}</span> and all their associated data (assessments, reports).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}