// src/components/layouts/CommunityLayout.tsx
"use client"
import {usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'
import dynamic from 'next/dynamic'
import {ProfileDialogProvider} from "@/contexts/ProfileDialogContext"

// 🔥 동적 임포트로 클라이언트 전용 컴포넌트들 로드
const GlobalSidebar = dynamic(() => import('@/components/GlobalSidebar'), {
    ssr: false,
    loading: () => null
});

const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'), {
    ssr: false,
    loading: () => null
});

// 🔥 OrientationLock 컴포넌트 동적 임포트
const OrientationLock = dynamic(() => import('@/components/OrientationLock'), {
    ssr: false,
    loading: () => null
});

// 🔥 클라이언트 전용 인증 로직을 별도 컴포넌트로 분리
const CommunityAuthenticatedLayout = dynamic(() => import('./CommunityAuthenticatedLayout'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1] mx-auto mb-4"></div>
                <p className="text-gray-600">로딩 중...</p>
            </div>
        </div>
    )
});

interface CommunityLayoutProps {
    children: React.ReactNode
}

export default function CommunityLayout({children}: CommunityLayoutProps) {
    const pathname = usePathname()
    const [isMounted, setIsMounted] = useState(false)

    // 🔥 클라이언트 마운트 확인
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // 🔥 서버 사이드 렌더링 시 - 간단한 HTML만 반환
    if (!isMounted) {
        return (
            <div className="community-app-layout">
                <main className="community-main-content-full">
                    {children}
                </main>
            </div>
        )
    }

    // 🔥 클라이언트 사이드 렌더링 - 커뮤니티 페이지 전용
    return (
        <ProfileDialogProvider>
            <OrientationLock/>
            <CommunityAuthenticatedLayout pathname={pathname}>
                {children}
            </CommunityAuthenticatedLayout>
        </ProfileDialogProvider>
    );
}