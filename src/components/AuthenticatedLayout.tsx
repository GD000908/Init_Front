// components/AuthenticatedLayout.tsx
"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// 동적 임포트로 클라이언트 전용 컴포넌트들 로드
const GlobalSidebar = dynamic(() => import('@/components/GlobalSidebar'), {
    ssr: false,
    loading: () => null
});

const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'), {
    ssr: false,
    loading: () => null
});

interface AuthenticatedLayoutProps {
    children: React.ReactNode;
    pathname: string;
}

export default function AuthenticatedLayout({ children, pathname }: AuthenticatedLayoutProps) {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    const protectedPaths = [
        '/dashboard',
        '/profile',
        '/resume',
        '/introduce',
        '/spec-management',
        '/job-calendar',
        '/community',
        '/statistics',
        '/settings'
    ]

    // 🔥 관리자 전용 경로
    const adminPaths = ['/admin']

    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
    const isAdminPath = adminPaths.some(path => pathname.startsWith(path))

    // 🔥 인증 상태 확인 함수
    const checkAuthStatus = () => {
        try {
            const userId = localStorage.getItem('userId') || getCookie('userId')
            const userName = localStorage.getItem('userName') || getCookie('userName')
            const role = localStorage.getItem('userRole') || getCookie('userRole')

            console.log('🔍 Auth check:', {
                userId: userId ? '***' + userId.slice(-3) : null,
                userName,
                role,
                pathname
            })

            setUserRole(role)
            return !!(userId && userId.trim() && userId !== 'undefined')
        } catch (error) {
            console.error('❌ Auth check error:', error)
            return false
        }
    }

    // 쿠키 읽기 헬퍼
    const getCookie = (name: string): string | null => {
        try {
            const value = `; ${document.cookie}`
            const parts = value.split(`; ${name}=`)
            if (parts.length === 2) {
                return parts.pop()?.split(';').shift() || null
            }
            return null
        } catch (error) {
            return null
        }
    }

    // 🔥 인증 확인 및 리다이렉트 처리
    useEffect(() => {
        const authStatus = checkAuthStatus()
        setIsAuthenticated(authStatus)
        setIsCheckingAuth(false)

        console.log('🔐 Auth layout check:', {
            pathname,
            isAuthenticated: authStatus,
            userRole,
            isProtectedPath,
            isAdminPath
        })

        // 🔥 관리자 페이지 접근 권한 체크
        if (isAdminPath && (!authStatus || userRole !== 'ADMIN')) {
            console.log('❌ Admin page access denied - redirecting to login')
            router.replace('/login?reason=admin_required')
            return
        }

        // 🔥 보호된 경로인데 인증되지 않은 경우
        if (isProtectedPath && !authStatus) {
            console.log('❌ Protected path without auth - redirecting to login')
            router.replace('/login?reason=auth_required&redirect=' + encodeURIComponent(pathname))
            return
        }

        // 🔥 인증된 사용자가 로그인/회원가입 페이지에 접근하는 경우
        if (authStatus && (pathname === '/login' || pathname === '/signup')) {
            console.log('🔄 Authenticated user on auth page - redirecting')
            // 역할에 따른 리다이렉트
            if (userRole === 'ADMIN') {
                router.replace('/admin')
            } else {
                router.replace('/dashboard')
            }
            return
        }
    }, [pathname, router, isProtectedPath, isAdminPath, userRole])

    // 🔥 인증 확인 중
    if (isCheckingAuth) {
        return (
            <div className="app-layout">
                <main className="main-content-full">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#356ae4] mx-auto mb-4"></div>
                            <p className="text-gray-600">인증 확인 중...</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // 🔥 관리자 페이지인데 권한이 없는 경우
    if (isAdminPath && (!isAuthenticated || userRole !== 'ADMIN')) {
        return (
            <div className="app-layout">
                <main className="main-content-full">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#356ae4] mx-auto mb-4"></div>
                            <p className="text-gray-600">관리자 로그인 페이지로 이동 중...</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // 🔥 보호된 경로인데 인증되지 않은 경우
    if (isProtectedPath && !isAuthenticated) {
        return (
            <div className="app-layout">
                <main className="main-content-full">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#356ae4] mx-auto mb-4"></div>
                            <p className="text-gray-600">로그인 페이지로 이동 중...</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // 🔥 정상적인 렌더링
    // 관리자 페이지는 사이드바 없이, 일반 페이지는 인증된 사용자만 사이드바 표시
    const showSidebar = isAuthenticated && !isAdminPath

    return (
        <div className="app-layout">
            {showSidebar && <GlobalSidebar />}
            <main className={showSidebar ? "main-content" : "main-content-full"}>
                {children}
            </main>
            <ScrollToTop />
        </div>
    )
}