// components/ui/admin-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // Assuming you have this from shadcn

const navItems = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Manage Users', href: '/admin/users' },
  { name: 'Manage Questions', href: '/admin/questions' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col p-4 bg-gray-100 dark:bg-gray-800 h-full">
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={cn(
                'block px-4 py-2 rounded-md',
                pathname === item.href
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}