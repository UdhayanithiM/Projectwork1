// app/(admin)/admin/users/page.tsx

"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "HR" | "ADMIN";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // keep a ref to focus the first field when the dialog opens
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const addUserForm = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "STUDENT",
    },
  });

  // fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users.");
      const data = await response.json();
      setUsers(data || []);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // focus first input when dialog opens
  useEffect(() => {
    if (isAddUserDialogOpen) {
      // small timeout to allow dialog to render
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isAddUserDialogOpen]);

  const onAddUserSubmit = async (data: AddUserFormData) => {
    try {
      // clear previous server-side errors
      addUserForm.clearErrors();

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      let result: any = {};
      try { result = await response.json(); } catch (e) { /* ignore json parse error */ }

      if (!response.ok) {
        // if server returned field-level validation errors in a common shape, apply them to the form
        if (result && typeof result === "object") {
          if (result.errors && typeof result.errors === "object") {
            Object.entries(result.errors).forEach(([k, v]) => {
              addUserForm.setError(k as any, { type: "server", message: String(v) });
            });
            return;
          }

          if (result.field && result.message) {
            addUserForm.setError(result.field as any, { type: "server", message: String(result.message) });
            return;
          }
        }

        throw new Error(result?.error || "Failed to create user.");
      }

      toast.success("User created successfully!");
      setIsAddUserDialogOpen(false);
      addUserForm.reset();
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || "Error creating user");
    }
  };

  const handleDeleteClick = (user: User) => { setUserToDelete(user); setIsDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (err: any) { toast.error("Error deleting user", { description: err.message }); }
    finally { setIsDeleteDialogOpen(false); setUserToDelete(null); }
  };

  const handleEditClick = (user: User) => { setUserToEdit(user); setIsEditUserDialogOpen(true); };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    try {
      const response = await fetch(`/api/admin/users/${userToEdit.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userToEdit.name, email: userToEdit.email, role: userToEdit.role }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.success("User updated successfully!");
      setIsEditUserDialogOpen(false); fetchUsers(); setUserToEdit(null);
    } catch (err: any) { toast.error("Error updating user", { description: err.message }); }
  };

  const getRoleBadgeVariant = (role: User["role"]) => {
    switch (role?.toUpperCase()) {
      case "ADMIN": return "destructive";
      case "HR": return "default";
      default: return "secondary";
    }
  };

  if (error) { return <div className="text-red-500 font-semibold p-4 border rounded-md">Error: {error}</div>; }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View, create, edit, and delete users.</CardDescription>
            </div>
            <Button onClick={() => setIsAddUserDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/> Add New User</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge></TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(user)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(user)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog
        open={isAddUserDialogOpen}
        onOpenChange={(open) => {
          setIsAddUserDialogOpen(open);
          // reset form when dialog is closed
          if (!open) addUserForm.reset();
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Fill in the details to create a new user.</DialogDescription>
          </DialogHeader>

          <Form {...addUserForm}>
            <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
              <FormField control={addUserForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="add-name">Name</FormLabel>
                  <FormControl>
                    <Input id="add-name" placeholder="John Doe" {...field} ref={(e) => { (field.ref as any)(e); nameInputRef.current = e; }} aria-invalid={!!addUserForm.formState.errors.name} aria-describedby={addUserForm.formState.errors.name ? 'add-name-error' : undefined} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={addUserForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="add-email">Email</FormLabel>
                  <FormControl>
                    <Input id="add-email" type="email" placeholder="john.doe@example.com" {...field} aria-invalid={!!addUserForm.formState.errors.email} aria-describedby={addUserForm.formState.errors.email ? 'add-email-error' : undefined} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={addUserForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="add-password">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input id="add-password" type={showPassword ? "text" : "password"} {...field} className="pr-12" aria-invalid={!!addUserForm.formState.errors.password} aria-describedby={addUserForm.formState.errors.password ? 'add-password-error' : undefined} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2">
                        {showPassword ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={addUserForm.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select a role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">Student</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={addUserForm.formState.isSubmitting} aria-busy={addUserForm.formState.isSubmitting}>
                  {addUserForm.formState.isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Edit User</DialogTitle><DialogDescription>Update the user's details below.</DialogDescription></DialogHeader>
          {userToEdit && (
            <form onSubmit={handleEditUserSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">Name</Label>
                  <Input id="edit-name" value={userToEdit.name} onChange={(e) => setUserToEdit({...userToEdit, name: e.target.value})} className="col-span-3" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">Email</Label>
                  <Input id="edit-email" type="email" value={userToEdit.email} onChange={(e) => setUserToEdit({...userToEdit, email: e.target.value})} className="col-span-3" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">Role</Label>
                  <Select onValueChange={(v: "STUDENT" | "HR" | "ADMIN") => setUserToEdit({...userToEdit, role: v})} value={userToEdit.role}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action will permanently delete the user account for <span className="font-semibold">{userToDelete?.name}</span>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

