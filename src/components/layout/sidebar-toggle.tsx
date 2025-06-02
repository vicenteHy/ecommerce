"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// 创建侧边栏上下文
interface SidebarContextType {
  collapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggleSidebar: () => {},
});

// 自定义钩子，方便使用侧边栏上下文
export const useSidebar = () => useContext(SidebarContext);

// 侧边栏提供者组件
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

// 切换按钮组件
export function SidebarToggle() {
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="mr-2"
      aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
    >
      {/* 折叠时显示向右的尖头，展开时显示向左的尖头 */}
      {collapsed ? (
        <ChevronRight className="h-5 w-5 transition-transform duration-200" />
      ) : (
        <ChevronLeft className="h-5 w-5 transition-transform duration-200" />
      )}
    </Button>
  );
} 