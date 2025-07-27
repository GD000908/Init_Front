// app/layout.tsx
"use client"
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import './globals.css';

// 🔥 동적 임포트로 클라이언트 전용 컴포넌트들 로드
const GlobalSidebar = dynamic(() => import('@/components/GlobalSidebar'), {
    ssr: false,
    loading: () => null
});

// const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'), {
//     ssr: false,
//     loading: () => null
// });

// 🔥 OrientationLock 컴포넌트 동적 임포트
const OrientationLock = dynamic(() => import('@/components/OrientationLock'), {
    ssr: false,
    loading: () => null
});

// 🔥 클라이언트 전용 인증 로직을 별도 컴포넌트로 분리
const AuthenticatedLayout = dynamic(() => import('@/components/AuthenticatedLayout'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#356ae4] mx-auto mb-4"></div>
                <p className="text-gray-600">로딩 중...</p>
            </div>
        </div>
    )
});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    const pathname = usePathname()
    const [isMounted, setIsMounted] = useState(false)

    const noSidebarPages = [
        '/',
        '/login',
        '/signup',
        '/admin'
    ]

    const shouldHideSidebar = noSidebarPages.includes(pathname) || pathname.startsWith('/admin')

    // 🔥 클라이언트 마운트 확인
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // 🔥 서버 사이드 렌더링 시 - 간단한 HTML만 반환
    if (!isMounted) {
        return (
            <html lang="ko">
            <head>
                <title>Init</title>
                <meta name="description" content="이력서 관리 서비스" />
                <meta name="generator" content="v0.dev" />
            </head>
            <body>
            <div className="app-layout">
                <main className="main-content-full">
                    {children}
                </main>
            </div>
            </body>
            </html>
        )
    }

    // 🔥 클라이언트 사이드 렌더링 - 공개 페이지
    if (shouldHideSidebar) {
        return (
            <html lang="ko">
            <head>
                <title>Init</title>
                <meta name="description" content="이력서 관리 서비스" />
                <meta name="generator" content="v0.dev" />
            </head>
            <body>
            <OrientationLock />  {/* 🔥 모든 페이지에 OrientationLock 추가 */}
            <div className="app-layout">
                <main className="main-content-full">
                    {children}
                </main>
                <ScrollToTop />
            </div>
            </body>
            </html>
        )
    }

    // 🔥 클라이언트 사이드 렌더링 - 보호된 페이지 (인증 로직 포함)
    return (
        <html lang="ko">
        <head>
            <title>Init</title>
            <meta name="description" content="이력서 관리 서비스" />
            <meta name="generator" content="v0.dev" />
        </head>
        <body>
        <OrientationLock />  {/* 🔥 보호된 페이지에도 OrientationLock 추가 */}
        <AuthenticatedLayout pathname={pathname}>
            {children}
        </AuthenticatedLayout>
        </body>
        </html>
    );
}
