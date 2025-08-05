/*
'use client';

import { useState } from 'react';
import GlobalSidebar from '@/components/GlobalSidebar/GlobalSidebar';
import { cn } from '@/lib/utils';

interface SideLayoutProps {
  children: React.ReactNode;
}

export default function SideLayout({ children }: SideLayoutProps) {
  const [isCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/!* 사이드바 *!/}
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "w-[80px]" : "w-[260px]"
        )}
      >

      </div>

      {/!* 콘텐츠 영역 *!/}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
*/
