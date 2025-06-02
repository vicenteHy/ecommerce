"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingCart,
  LineChart,
  Users,
  Package,
  Search,
} from "lucide-react";

const navItems = [
  {
    href: "/overview",
    label: "数据总览",
    icon: Home,
  },
  {
    href: "/sales",
    label: "销售数据",
    icon: ShoppingCart,
  },
  {
    href: "/traffic",
    label: "流量数据",
    icon: LineChart,
  },
  {
    href: "/conversion",
    label: "转化数据",
    icon: Users,
  },
  {
    href: "/products",
    label: "商品数据",
    icon: Package,
  },
  {
    href: "/search",
    label: "搜索数据",
    icon: Search,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === item.href && "bg-muted text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 