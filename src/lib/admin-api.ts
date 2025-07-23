// lib/admin-api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;


// 🔥 API 응답 타입 정의
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    errorCode?: string;
}

// 🔥 인증된 요청을 위한 헬퍼 함수
const makeAuthenticatedRequest = async <T>(
    url: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');

    if (!token) {
        throw new Error('인증 토큰이 없습니다.');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // 토큰 만료 처리
            localStorage.removeItem('authToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');

            window.location.href = '/login?reason=token_expired';
            throw new Error('인증이 만료되었습니다.');
        }

        if (response.status === 403) {
            throw new Error('접근 권한이 없습니다.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API 요청 실패:', error);
        throw error;
    }
};

export const adminApi = {
    /**
     * 전체 사용자 목록 조회
     */
    getUsers: async (params: {
        page?: number;
        size?: number;
        search?: string;
        sortBy?: string;
    } = {}) => {
        const queryParams = new URLSearchParams({
            page: (params.page || 0).toString(),
            size: (params.size || 20).toString(),
            sortBy: params.sortBy || 'createdAt',
            ...(params.search && { search: params.search })
        });

        return makeAuthenticatedRequest(`${API_BASE_URL}/admin/users?${queryParams}`);
    },

    /**
     * 사용자 상태 변경 (활성화/비활성화)
     */
    updateUserStatus: async (userId: number, isActive: boolean) => {
        return makeAuthenticatedRequest(
            `${API_BASE_URL}/admin/users/${userId}/status?isActive=${isActive}`,
            { method: 'PATCH' }
        );
    },

    /**
     * 특정 사용자 상세 정보 조회
     */
    getUserDetail: async (userId: number) => {
        return makeAuthenticatedRequest(`${API_BASE_URL}/admin/users/${userId}`);
    },

    /**
     * 대시보드 통계 정보 조회
     */
    getStatistics: async () => {
        return makeAuthenticatedRequest(`${API_BASE_URL}/admin/statistics`);
    },

    /**
     * 사용자 삭제 (비활성화)
     */
    deleteUser: async (userId: number) => {
        return makeAuthenticatedRequest(
            `${API_BASE_URL}/admin/users/${userId}`,
            { method: 'DELETE' }
        );
    },

    /**
     * 사용자 검색
     */
    searchUsers: async (keyword: string, page: number = 0, size: number = 20) => {
        const queryParams = new URLSearchParams({
            keyword,
            page: page.toString(),
            size: size.toString()
        });

        return makeAuthenticatedRequest(`${API_BASE_URL}/admin/users/search?${queryParams}`);
    }
};

// 🔥 관리자 권한 확인 헬퍼
export const checkAdminPermission = (): boolean => {
    try {
        const userRole = localStorage.getItem('userRole');
        const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');

        return !!(token && userRole === 'ADMIN');
    } catch (error) {
        console.error('관리자 권한 확인 실패:', error);
        return false;
    }
};

// 🔥 인증 정보 완전 삭제
export const clearAuthData = () => {
    const keysToRemove = [
        'userId', 'userName', 'userRole',
        'authToken', 'accessToken'
    ];

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    console.log('🧹 모든 인증 데이터 삭제 완료');
};