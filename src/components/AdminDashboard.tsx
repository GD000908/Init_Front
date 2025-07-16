"use client"

import { useState, useEffect } from "react"
import { Users, TrendingUp, Search, UserX, CheckCircle, XCircle, LogOut } from "lucide-react"
import { useRouter } from 'next/navigation'

interface User {
    id: number;
    userId: string;
    email: string;
    name: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    role: string;
}

interface Statistics {
    totalUsers: number;
    activeUsers: number;
    deactivatedUsers: number;
    todaySignups: number;
    dailyGrowth: Array<{
        date: string;
        users: number;
    }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/api';


export default function AdminDashboard() {
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("createdAt")
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [activeTab, setActiveTab] = useState("users")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 🔥 API 호출 헬퍼 함수
    const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken')

        if (!token) {
            throw new Error('인증 토큰이 없습니다.')
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        }

        console.log('🔗 API 요청:', url)

        const response = await fetch(url, {
            ...options,
            headers,
        })

        console.log('📡 응답 상태:', response.status)
        console.log('📋 응답 헤더:', Object.fromEntries(response.headers.entries()))

        if (response.status === 401) {
            localStorage.removeItem('authToken')
            localStorage.removeItem('accessToken')
            router.push('/login?reason=token_expired')
            throw new Error('인증이 만료되었습니다.')
        }

        if (!response.ok) {
            // 🔥 에러 응답도 한 번만 읽기
            const errorText = await response.text()
            console.error('❌ API 에러 응답:', errorText)
            throw new Error(errorText || `HTTP Error: ${response.status}`)
        }

        // 🔥 응답을 한 번만 읽고 처리
        const responseText = await response.text()
        console.log('📄 Raw Response (처음 500자):', responseText.substring(0, 500))

        try {
            const jsonData = JSON.parse(responseText)
            console.log('✅ 파싱된 JSON:', jsonData)
            return jsonData
        } catch (parseError) {
            console.error('❌ JSON 파싱 실패:', parseError)
            console.log('📄 전체 응답:', responseText)
            throw new Error(`JSON 파싱 실패: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`)
        }
    }

    // 🔥 사용자 목록 조회
    const fetchUsers = async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams({
                page: '0',
                size: '50',
                sortBy: sortBy,
                ...(searchTerm && { search: searchTerm })
            })

            console.log('🔍 사용자 목록 요청 파라미터:', Object.fromEntries(params))

            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/users?${params}`)

            console.log('👥 사용자 API 응답:', response)

            // 🔥 다양한 응답 형태 처리
            let userData = []

            if (response && response.success && Array.isArray(response.data)) {
                userData = response.data
                console.log('✅ ApiResponse 형태의 응답')
            } else if (Array.isArray(response)) {
                userData = response
                console.log('✅ 직접 배열 형태의 응답')
            } else if (response && response.content && Array.isArray(response.content)) {
                // Spring Page 형태의 응답
                userData = response.content
                console.log('✅ Spring Page 형태의 응답')
            } else {
                console.warn('⚠️ 예상과 다른 응답 구조:', response)
                userData = []
            }

            console.log(`📊 총 ${userData.length}개의 사용자 데이터 로드됨`)
            setUsers(userData)

        } catch (fetchError) {
            console.error('❌ 사용자 목록 조회 실패:', fetchError)

            setError(`API 오류: ${fetchError instanceof Error ? fetchError.message : '알 수 없는 오류'}`)

        } finally {
            setLoading(false)
        }
    }

    // 🔥 통계 정보 조회
    const fetchStatistics = async () => {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/statistics`)

            if (response.success) {
                setStatistics(response.data)
            } else {
                throw new Error(response.message || '통계 조회 실패')
            }
        } catch (fetchError) {
            console.error('통계 조회 실패:', fetchError)
        }
    }

    // 🔥 사용자 상태 변경
    const updateUserStatus = async (userId: number, isActive: boolean) => {
        try {
            const response = await makeAuthenticatedRequest(
                `${API_BASE_URL}/admin/users/${userId}/status?isActive=${isActive}`,
                { method: 'PATCH' }
            )

            if (response.success) {
                setUsers(prev => prev.map((user) =>
                    user.id === userId ? { ...user, isActive } : user
                ))
                alert(response.message)
            } else {
                throw new Error(response.message || '상태 변경 실패')
            }
        } catch (statusError) {
            console.error('사용자 상태 변경 실패:', statusError)
            alert(statusError instanceof Error ? statusError.message : '상태 변경에 실패했습니다.')
        }
    }

    // 🔥 관리자 로그아웃
    const handleLogout = () => {
        // 모든 인증 정보 제거
        localStorage.removeItem('authToken')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('userId')
        localStorage.removeItem('userName')
        localStorage.removeItem('userRole')

        // 쿠키도 제거
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

        router.push('/login')
    }

    // 🔥 초기 데이터 로드 (통계만)
    useEffect(() => {
        fetchStatistics()
    }, [])

    // 🔥 사용자 목록은 탭이 활성화될 때만 로드
    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers()
        }
    }, [activeTab, sortBy])

    // 🔥 검색어 디바운싱 (사용자 탭에서만)
    useEffect(() => {
        if (activeTab === 'users') {
            const timer = setTimeout(() => {
                fetchUsers()
            }, 500)

            return () => clearTimeout(timer)
        }
    }, [searchTerm, activeTab])

    // 필터된 사용자 목록 (클라이언트 사이드 필터링)
    const filteredUsers = users.filter(
        (user) =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // 모달 배경 클릭시 닫기
    const handleModalBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setSelectedUser(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* 🔥 관리자 헤더 */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
                        <p className="text-gray-600 mt-2">시스템 관리 및 모니터링</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        로그아웃
                    </button>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-red-800 font-medium mb-2">⚠️ API 오류 발생</p>
                                <p className="text-red-700 text-sm">{error}</p>
                                <details className="mt-2">
                                    <summary className="text-red-600 text-xs cursor-pointer hover:underline">
                                        백엔드 확인 사항
                                    </summary>
                                    <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                                        <p>• AdminController.java가 제대로 실행 중인지 확인</p>
                                        <p>• /admin/users API가 JSON 형식으로 응답하는지 확인</p>
                                        <p>• CORS 설정이 올바른지 확인</p>
                                        <p>• JWT 토큰이 제대로 검증되는지 확인</p>
                                    </div>
                                </details>
                            </div>
                            <button
                                onClick={() => {
                                    setError(null)
                                    if (activeTab === 'users') {
                                        fetchUsers()
                                    }
                                }}
                                className="text-red-600 hover:text-red-800 underline text-sm"
                            >
                                다시 시도
                            </button>
                        </div>
                    </div>
                )}

                {/* 탭 네비게이션 */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                                activeTab === "users"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            회원 목록
                        </button>
                        <button
                            onClick={() => setActiveTab("stats")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                                activeTab === "stats"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <TrendingUp className="h-4 w-4" />
                            통계 대시보드
                        </button>
                    </nav>
                </div>

                {/* 회원 관리 탭 */}
                {activeTab === "users" && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">회원 관리</h2>
                                <p className="text-sm text-gray-600 mt-1">전체 회원 목록을 조회하고 관리할 수 있습니다.</p>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="이메일, 아이디, 이름으로 검색..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    >
                                        <option value="createdAt">가입일순</option>
                                        <option value="email">이메일순</option>
                                        <option value="name">이름순</option>
                                    </select>
                                </div>

                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                        <p className="text-gray-600">데이터를 불러오는 중...</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    아이디
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    이름
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    이메일
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    역할
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    가입일
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    상태
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    관리
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map((user) => (
                                                    <tr
                                                        key={user.id}
                                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                        onClick={() => setSelectedUser(user)}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {user.userId}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {user.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {user.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                    user.role === 'ADMIN'
                                                                        ? "bg-purple-100 text-purple-800"
                                                                        : "bg-blue-100 text-blue-800"
                                                                }`}
                                                            >
                                                                {user.role === 'ADMIN' ? '관리자' : '일반사용자'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                    user.isActive
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                                }`}
                                                            >
                                                                {user.isActive ? "활성" : "비활성"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                                            {user.role !== 'ADMIN' && (
                                                                user.isActive ? (
                                                                    <button
                                                                        onClick={() => updateUserStatus(user.id, false)}
                                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                                                    >
                                                                        <UserX className="h-3 w-3 mr-1" />
                                                                        비활성화
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => updateUserStatus(user.id, true)}
                                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                                                    >
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                        활성화
                                                                    </button>
                                                                )
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                                        {searchTerm ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
                                                    </td>
                                                </tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 회원 상세 정보 모달 */}
                        {selectedUser && (
                            <div
                                className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50"
                                onClick={handleModalBackdropClick}
                            >
                                <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">회원 상세 정보</h3>
                                        <button
                                            onClick={() => setSelectedUser(null)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <XCircle className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">아이디</p>
                                                <p className="mt-1 text-sm text-gray-900">{selectedUser.userId}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">이름</p>
                                                <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">이메일</p>
                                                <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">전화번호</p>
                                                <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || '미등록'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">역할</p>
                                                <span
                                                    className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        selectedUser.role === 'ADMIN'
                                                            ? "bg-purple-100 text-purple-800"
                                                            : "bg-blue-100 text-blue-800"
                                                    }`}
                                                >
                                                    {selectedUser.role === 'ADMIN' ? '관리자' : '일반사용자'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">가입일</p>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {new Date(selectedUser.createdAt).toLocaleString('ko-KR')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">계정 상태</p>
                                                <span
                                                    className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        selectedUser.isActive
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {selectedUser.isActive ? "활성" : "비활성"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 통계 대시보드 탭 */}
                {activeTab === "stats" && (
                    <div className="space-y-6">
                        {statistics ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <Users className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">전체 회원 수</dt>
                                                        <dd className="text-lg font-medium text-gray-900">
                                                            {statistics.totalUsers.toLocaleString()}
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">활성 회원</dt>
                                                        <dd className="text-lg font-medium text-green-600">
                                                            {statistics.activeUsers.toLocaleString()}
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <TrendingUp className="h-6 w-6 text-blue-400" />
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">오늘 가입자</dt>
                                                        <dd className="text-lg font-medium text-blue-600">
                                                            +{statistics.todaySignups}
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <UserX className="h-6 w-6 text-red-400" />
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">비활성 회원</dt>
                                                        <dd className="text-lg font-medium text-red-600">
                                                            {statistics.deactivatedUsers}
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
                                        <h2 className="text-lg font-medium text-blue-900">일별 사용자 증가 추이</h2>
                                        <p className="text-sm text-blue-700 mt-1">최근 7일간 회원 수 변화</p>
                                    </div>
                                    <div className="p-6">
                                        <div className="h-64 flex items-end justify-between gap-2 p-4">
                                            {statistics.dailyGrowth && statistics.dailyGrowth.map((day, index) => {
                                                const maxUsers = Math.max(...statistics.dailyGrowth.map((d) => d.users))
                                                const height = maxUsers > 0 ? (day.users / maxUsers) * 200 : 0
                                                return (
                                                    <div key={index} className="flex flex-col items-center gap-2">
                                                        <div className="text-xs font-medium text-blue-700">{day.users}</div>
                                                        <div
                                                            className="bg-blue-500 rounded-t w-12 transition-all hover:bg-blue-600 cursor-pointer"
                                                            style={{ height: `${height}px`, minHeight: '4px' }}
                                                            title={`${day.date}: ${day.users}명`}
                                                        />
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(day.date).toLocaleDateString('ko-KR', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">통계 데이터를 불러오는 중...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}