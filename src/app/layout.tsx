"use client";

import { Inter as FontSans } from "next/font/google"
import "./globals.css";
import { cn } from "@/lib/utils";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { SidebarProvider, SidebarToggle, useSidebar } from "@/components/layout/sidebar-toggle";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

// 主布局组件
function MainLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  
  return (
    <div className={cn(
      "grid min-h-screen w-full transition-all duration-300",
      collapsed 
        ? "grid-cols-[0px_1fr]" 
        : "md:grid-cols-[160px_1fr] lg:grid-cols-[200px_1fr]" // 缩短侧边栏宽度
    )}>
      <div className={cn(
        "border-r bg-muted/40 transition-all duration-300 overflow-hidden",
        collapsed ? "w-0" : "md:block"
      )}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/overview" className="flex items-center gap-2 font-semibold">
              <span className="">数据分析平台</span>
            </Link>
          </div>
          <div className="flex-1">
            <SidebarNav />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <SidebarToggle />
          <div className="w-full flex-1">
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <SidebarProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </SidebarProvider>
      </body>
    </html>
  );
}
