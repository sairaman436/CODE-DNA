"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function NavbarWrapper() {
  const pathname = usePathname();
  
  if (!pathname) return null;

  const shouldHide = pathname.startsWith('/admin') ||
                     pathname === '/login' ||
                     pathname === '/onboarding' ||
                     pathname.startsWith('/analyzing');

  if (shouldHide) return null;
  return <Navbar />;
}
