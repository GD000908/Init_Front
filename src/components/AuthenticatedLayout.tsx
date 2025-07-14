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

    // 🔥 일반 사용자 전용 경로 (USER 권한 필요)
    const userOnlyPaths = [
        '/dashboard',
        '/profile',
        '/resume',
        '/introduce',
        '/spec-management',
        '/job-calendar',
        '/community',
        '/statistics',
        '/settings',
        '/home'
    ]

    // 🔥 관리자 전용 경로 (ADMIN 권한 필요)
    const adminOnlyPaths = ['/admin']

    // 🔥 공개 경로 (인증 불필요)
    const publicPaths = ['/', '/login', '/signup']

    const isUserOnlyPath = userOnlyPaths.some(path => pathname.startsWith(path))
    const isAdminOnlyPath = adminOnlyPaths.some(path => pathname.startsWith(path))
    const isPublicPath = publicPaths.includes(pathname)

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
                pathname,
                isUserOnlyPath,
                isAdminOnlyPath
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

    // 🔥 역할 기반 접근 제어 및 리다이렉트 처리
    useEffect(() => {
        const authStatus = checkAuthStatus()
        setIsAuthenticated(authStatus)
        setIsCheckingAuth(false)

        console.log('🔐 Role-based access control:', {
            pathname,
            isAuthenticated: authStatus,
            userRole,
            isUserOnlyPath,
            isAdminOnlyPath,
            isPublicPath
        })

        // 1. 공개 경로는 접근 허용
        if (isPublicPath) {
            console.log('✅ 공개 경로 접근 허용')
            return
        }

        // 2. 인증되지 않은 사용자
        if (!authStatus) {
            console.log('❌ 미인증 사용자 - 로그인 페이지로 리다이렉트')
            router.replace('/login?reason=auth_required&redirect=' + encodeURIComponent(pathname))
            return
        }

        // 3. 🔥 관리자가 일반 사용자 페이지에 접근하려는 경우
        if (userRole === 'ADMIN' && isUserOnlyPath) {
            console.log('❌ 관리자가 일반 사용자 페이지 접근 시도 - 관리자 페이지로 리다이렉트')
            alert('관리자는 해당 페이지에 접근할 수 없습니다. 관리자 페이지로 이동합니다.')
            router.replace('/admin')
            return
        }

        // 4. 🔥 일반 사용자가 관리자 페이지에 접근하려는 경우
        if (userRole === 'USER' && isAdminOnlyPath) {
            console.log('❌ 일반 사용자가 관리자 페이지 접근 시도 - 대시보드로 리다이렉트')
            alert('관리자 권한이 필요한 페이지입니다. 대시보드로 이동합니다.')
            router.replace('/dashboard')
            return
        }

        // 5. 🔥 관리자가 로그인/회원가입 페이지에 접근하는 경우
        if (authStatus && userRole === 'ADMIN' && (pathname === '/login' || pathname === '/signup')) {
            console.log('🔄 관리자가 인증 페이지 접근 - 관리자 페이지로 리다이렉트')
            router.replace('/admin')
            return
        }

        // 6. 🔥 일반 사용자가 로그인/회원가입 페이지에 접근하는 경우
        if (authStatus && userRole === 'USER' && (pathname === '/login' || pathname === '/signup')) {
            console.log('🔄 일반 사용자가 인증 페이지 접근 - 대시보드로 리다이렉트')
            router.replace('/dashboard')
            return
        }

        // 7. 🔥 역할이 설정되지 않은 경우 (비정상 상태)
        if (authStatus && !userRole) {
            console.log('❌ 역할 정보 없음 - 로그인 페이지로 리다이렉트')
            alert('계정 정보에 오류가 있습니다. 다시 로그인해주세요.')
            localStorage.clear()
            router.replace('/login')
            return
        }

    }, [pathname, router, isUserOnlyPath, isAdminOnlyPath, isPublicPath, userRole])

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

    // 🔥 공개 경로는 레이아웃 없이 렌더링
    if (isPublicPath) {
        return <>{children}</>
    }

    // 🔥 관리자가 일반 사용자 페이지에 접근 시도 시 로딩 화면
    if (userRole === 'ADMIN' && isUserOnlyPath) {
        return (
            <div className="app-layout">
                <main className="main-content-full">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                            <p className="text-red-600">접근 권한 확인 중...</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // 🔥 일반 사용자가 관리자 페이지에 접근 시도 시 로딩 화면
    if (userRole === 'USER' && isAdminOnlyPath) {
        return (
            <div className="app-layout">
                <main className="main-content-full">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                            <p className="text-red-600">권한 확인 중...</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // 🔥 인증되지 않은 사용자
    if (!isAuthenticated) {
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
    // 관리자는 사이드바 없이, 일반 사용자는 사이드바 표시
    const showSidebar = isAuthenticated && userRole === 'USER' && !isAdminOnlyPath

    return (
        <div className="app-layout">
            {showSidebar && <GlobalSidebar />}
            <main className={showSidebar ? "main-content" : "main-content-full"}>
                {children}
            </main>
            {showSidebar && <ScrollToTop />}
        </div>
    )
}