// lib/dash-api.ts
// 홈 대시보드 페이지 API 클라이언트

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// =============================================================================
// 타입 정의
// =============================================================================

export interface ProfileData {
    name: string;
    email: string;
    career: string;
    job: string;
}

export interface ConditionsData {
    jobs: string[];
    locations: string[];
    salary: string;
    others: string[];
}

export interface ApplicationData {
    id: number;
    company: string;
    category: string;
    status: '지원 완료' | '서류 합격' | '최종 합격' | '불합격';
}

export interface HomeStats {
    totalApplications: number;
    documentPassed: number;
    finalPassed: number;
    rejected: number;
    totalResumes: number;
    totalCoverLetters: number;
    bookmarkedCompanies: number;
    deadlineSoon: number;
}

export interface ProfileCompletion {
    basicInfo: boolean;
    desiredConditions: boolean;
    workExperience: boolean;
    education: boolean;
    certificates: boolean;
    languages: boolean;
    skills: boolean;
    links: boolean;
    military: boolean;
    portfolio: boolean;
    completionPercentage?: number;
}

export interface TodoItem {
    id: number;
    text: string;
    completed: boolean;
}

export interface DashboardData {
    profile: ProfileData;
    conditions: ConditionsData;
    applications: ApplicationData[];
    stats: HomeStats;
    completion: ProfileCompletion;
    todos: TodoItem[];
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// 🔥 공고 추천 관련 타입 추가
export interface JobRecommendation {
    id: string;
    title: string;
    company: string;
    location: string;
    experience: string;
    education: string;
    employmentType: string;
    salary: string;
    deadline: string;
    url: string;
    keywords: string[];
    postedDate: string;
    matchScore: number;
    description?: string;
    requirements?: string;
    benefits?: string;
    recruitCount?: string;
}

// 백엔드 응답 타입 (enum 형태)
export type ApplicationStatusEnum = 'APPLIED' | 'DOCUMENT_PASSED' | 'FINAL_PASSED' | 'REJECTED';

export interface BackendApplicationData {
    id: number;
    company: string;
    category: string;
    status: ApplicationStatusEnum;
}

export interface BackendTodoItem {
    id: number;
    text: string;
    completed: boolean;
}

// =============================================================================
// HTTP 클라이언트 설정
// =============================================================================

interface ApiClientConfig {
    headers: Record<string, string>;
    credentials: RequestCredentials;
}

const createApiClient = (): ApiClientConfig => {
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // JWT 토큰이 있다면 헤더에 추가
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
        defaultHeaders.Authorization = `Bearer ${token}`;
    }

    return {
        headers: defaultHeaders,
        credentials: 'include',
    };
};

// HTTP 요청 헬퍼 함수
const apiRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    const config = createApiClient();

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...config,
            ...options,
            headers: {
                ...config.headers,
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 🔥 공고 추천 API는 ApiResponse 래퍼 없이 직접 배열을 반환하므로 분기 처리
        if (url.includes('/job-recommendations/')) {
            return await response.json();
        }

        const data: ApiResponse<T> = await response.json();

        if (!data.success) {
            throw new Error(data.message || '요청이 실패했습니다.');
        }

        return data.data;
    } catch (error) {
        console.error('API 요청 실패:', error);
        throw error;
    }
};

// =============================================================================
// 대시보드 API 함수들
// =============================================================================

/**
 * 전체 대시보드 데이터 조회 (페이지 로드시 사용)
 */
export const getDashboardData = async (): Promise<DashboardData> => {
    const backendData = await apiRequest<any>('/api/home/dashboard');
    return transformDashboardData(backendData);
};

// =============================================================================
// 프로필 관련 API
// =============================================================================

/**
 * 사용자 ID 가져오기 헬퍼 함수
 */
const getUserId = (): string => {
    if (typeof window === 'undefined') return '1'; // SSR 환경
    return localStorage.getItem('userId') || '1';
};

/**
 * 프로필 데이터 조회
 */
export const getProfileData = async (): Promise<ProfileData> => {
    const userId = getUserId();
    console.log('🔍 프로필 조회 API 호출:', userId);

    try {
        const response = await fetch(`${API_BASE_URL}/api/home/profile/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('accessToken')}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ 프로필 조회 성공:', data);

        // 백엔드 응답을 프론트엔드 형식으로 변환
        return {
            name: data.name || '',
            email: data.email || '',
            career: data.careerType || '신입',
            job: data.jobTitle || ''
        };
    } catch (error) {
        console.error('❌ 프로필 조회 실패:', error);
        throw error;
    }
};

/**
 * 프로필 데이터 저장
 */
export const updateProfileData = async (profileData: ProfileData): Promise<void> => {
    const userId = getUserId();
    console.log('💾 프로필 저장 API 호출:', { userId, profileData });

    try {
        // 프론트엔드 데이터를 백엔드 형식으로 변환
        const backendData = {
            name: profileData.name,
            email: profileData.email,
            careerType: profileData.career,
            jobTitle: profileData.job,
            matching: true // 기본값
        };

        const response = await fetch(`${API_BASE_URL}/api/home/profile/${userId}`, {
            method: 'POST', // 백엔드는 POST 메서드 사용
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('accessToken')}`
            },
            credentials: 'include',
            body: JSON.stringify(backendData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 프로필 저장 실패 응답:', errorText);
            throw new Error(`프로필 저장 실패: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ 프로필 저장 성공:', result);
    } catch (error) {
        console.error('❌ 프로필 저장 실패:', error);
        throw error;
    }
};

// =============================================================================
// 희망 조건 관련 API
// =============================================================================

/**
 * 희망 조건 데이터 조회
 */
export const getDesiredConditions = async (): Promise<ConditionsData> => {
    const userId = getUserId();
    console.log('🔍 희망조건 조회 API 호출:', userId);

    try {
        const response = await fetch(`${API_BASE_URL}/api/home/conditions/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('accessToken')}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ 희망조건 조회 성공:', data);

        return {
            jobs: data.jobs || [],
            locations: data.locations || [],
            salary: data.salary || '0',
            others: data.others || []
        };
    } catch (error) {
        console.error('❌ 희망조건 조회 실패:', error);
        throw error;
    }
};

/**
 * 희망 조건 데이터 저장
 */
export const updateDesiredConditions = async (conditionsData: ConditionsData): Promise<void> => {
    const userId = getUserId();
    console.log('💾 희망조건 저장 API 호출:', { userId, conditionsData });

    try {
        const response = await fetch(`${API_BASE_URL}/api/home/conditions/${userId}`, {
            method: 'POST', // 백엔드는 POST 메서드 사용
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('accessToken')}`
            },
            credentials: 'include',
            body: JSON.stringify(conditionsData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 희망조건 저장 실패 응답:', errorText);
            throw new Error(`희망조건 저장 실패: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ 희망조건 저장 성공:', result);
    } catch (error) {
        console.error('❌ 희망조건 저장 실패:', error);
        throw error;
    }
};

// =============================================================================
// 지원 현황 관련 API
// =============================================================================

/**
 * 지원 현황 데이터 조회
 */
export const getApplications = async (): Promise<ApplicationData[]> => {
    const userId = getUserId();
    console.log('🔍 지원현황 조회 API 호출:', userId);

    try {
        const response = await fetch(`${API_BASE_URL}/api/home/applications/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('accessToken')}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ 지원현황 조회 성공:', data);

        return data.map((app: any) => ({
            id: app.id,
            company: app.company,
            category: app.category,
            status: app.status // 백엔드에서 이미 한글로 변환되어 옴
        }));
    } catch (error) {
        console.error('❌ 지원현황 조회 실패:', error);
        throw error;
    }
};

/**
 * 지원 현황 데이터 저장
 */
export const updateApplications = async (applications: ApplicationData[]): Promise<void> => {
    console.log('💾 지원현황 저장 API 호출:', applications);

    try {
        // 백엔드는 batch update를 사용하고 userId를 각 항목에 포함해야 함
        const userId = parseInt(getUserId());
        const applicationsWithUserId = applications.map(app => ({
            ...app,
            userId: userId
        }));

        const response = await fetch(`${API_BASE_URL}/api/home/applications/batch`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('accessToken')}`
            },
            credentials: 'include',
            body: JSON.stringify(applicationsWithUserId)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 지원현황 저장 실패 응답:', errorText);
            throw new Error(`지원현황 저장 실패: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ 지원현황 저장 성공:', result);
    } catch (error) {
        console.error('❌ 지원현황 저장 실패:', error);
        throw error;
    }
};


// =============================================================================
// 통계 데이터 관련 API
// =============================================================================

/**
 * 홈 통계 데이터 조회
 */
export const getHomeStats = async (): Promise<HomeStats> => {
    return await apiRequest<HomeStats>('/api/home/stats');
};

// =============================================================================
// 프로필 완성도 관련 API
// =============================================================================

/**
 * 프로필 완성도 조회
 */
export const getProfileCompletion = async (): Promise<ProfileCompletion> => {
    return await apiRequest<ProfileCompletion>('/api/home/completion');
};

// =============================================================================
// 할일 목록 관련 API
// =============================================================================

// =============================================================================
// 🔥 공고 추천 관련 API (새로 추가)
// =============================================================================

/**
 * 공고 추천 데이터 조회
 */
export const getJobRecommendations = async (
    userId: number,
    keywords: string[],
    locations: string[]
): Promise<JobRecommendation[]> => {
    try {
        const data = await apiRequest<JobRecommendation[]>(`/api/home/job-recommendations/${userId}`, {
            method: 'POST',
            body: JSON.stringify({
                keywords: keywords,
                locations: locations
            })
        });

        // 백엔드에서 LocalDate를 문자열로 변환해서 오므로 추가 처리
        return data.map(job => ({
            ...job,
            deadline: job.deadline || '정보 없음',
            postedDate: job.postedDate || '',
            id: job.id || `${job.company}-${job.title}-${Math.random()}`,
            // URL이 null이면 빈 문자열로 처리
            url: job.url || '#'
        }));

    } catch (error) {
        console.error('Failed to fetch job recommendations:', error);
        throw error;
    }
};

// =============================================================================
// 유틸리티 함수들
// =============================================================================

/**
 * 에러 처리 유틸리티
 */
export const handleApiError = (error: Error): string => {
    if (error.message.includes('401')) {
        return '로그인이 필요합니다.';
    } else if (error.message.includes('403')) {
        return '권한이 없습니다.';
    } else if (error.message.includes('404')) {
        return '요청한 데이터를 찾을 수 없습니다.';
    } else if (error.message.includes('500')) {
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else {
        return error.message || '알 수 없는 오류가 발생했습니다.';
    }
};

/**
 * 지원 상태를 한글로 변환하는 유틸리티
 */
export const getStatusDisplayName = (status: ApplicationStatusEnum): ApplicationData['status'] => {
    const statusMap: Record<ApplicationStatusEnum, ApplicationData['status']> = {
        'APPLIED': '지원 완료',
        'DOCUMENT_PASSED': '서류 합격',
        'FINAL_PASSED': '최종 합격',
        'REJECTED': '불합격'
    };
    return statusMap[status] || '지원 완료';
};

/**
 * 한글 상태를 영문으로 변환하는 유틸리티
 */
export const getStatusEnumValue = (displayName: ApplicationData['status']): ApplicationStatusEnum => {
    const statusMap: Record<ApplicationData['status'], ApplicationStatusEnum> = {
        '지원 완료': 'APPLIED',
        '서류 합격': 'DOCUMENT_PASSED',
        '최종 합격': 'FINAL_PASSED',
        '불합격': 'REJECTED'
    };
    return statusMap[displayName] || 'APPLIED';
};

/**
 * 데이터 변환 유틸리티: 백엔드 데이터를 프론트엔드 형식으로 변환
 */
export const transformDashboardData = (backendData: any): DashboardData => {
    return {
        profile: backendData.profile || { name: '', email: '', career: '신입', job: '개발자' },
        conditions: backendData.conditions || { jobs: [], locations: [], salary: '0', others: [] },
        applications: (backendData.applications || []).map((app: BackendApplicationData) => ({
            ...app,
            status: getStatusDisplayName(app.status)
        })),
        stats: backendData.stats || {
            totalApplications: 0,
            documentPassed: 0,
            finalPassed: 0,
            rejected: 0,
            totalResumes: 0,
            totalCoverLetters: 0,
            bookmarkedCompanies: 0,
            deadlineSoon: 0
        },
        completion: backendData.completion || {
            basicInfo: false,
            desiredConditions: false,
            workExperience: false,
            education: false,
            certificates: false,
            languages: false,
            skills: false,
            links: false,
            military: false,
            portfolio: false
        },
        todos: (backendData.todos || []).map((todo: BackendTodoItem) => ({
            id: todo.id,
            text: todo.text,
            completed: todo.completed
        }))
    };
};

/**
 * 데이터 변환 유틸리티: 프론트엔드 데이터를 백엔드 형식으로 변환
 */
export const transformApplicationsForBackend = (frontendApplications: ApplicationData[]): BackendApplicationData[] => {
    return frontendApplications.map(app => ({
        ...app,
        status: getStatusEnumValue(app.status)
    }));
};

// =============================================================================
// React Query용 쿼리 키들 (선택사항)
// =============================================================================

export const QUERY_KEYS = {
    dashboard: ['dashboard'] as const,
    profile: ['profile'] as const,
    conditions: ['conditions'] as const,
    applications: ['applications'] as const,
    stats: ['stats'] as const,
    completion: ['completion'] as const,
    todos: ['todos'] as const,
    jobRecommendations: ['jobRecommendations'] as const, // 🔥 추가
} as const;

// =============================================================================
// 캐시 관련 유틸리티 (선택사항)
// =============================================================================

interface CacheData {
    data: DashboardData;
    timestamp: number;
    expiry: number;
}

/**
 * 로컬 스토리지에 대시보드 데이터 캐시
 */
export const cacheDashboardData = (data: DashboardData): void => {
    if (typeof window !== 'undefined') {
        try {
            const cacheData: CacheData = {
                data,
                timestamp: Date.now(),
                expiry: Date.now() + (5 * 60 * 1000) // 5분 캐시
            };
            localStorage.setItem('dashboardCache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('캐시 저장 실패:', error);
        }
    }
};

/**
 * 로컬 스토리지에서 대시보드 데이터 캐시 조회
 */
export const getCachedDashboardData = (): DashboardData | null => {
    if (typeof window !== 'undefined') {
        try {
            const cached = localStorage.getItem('dashboardCache');
            if (cached) {
                const { data, expiry }: CacheData = JSON.parse(cached);
                if (Date.now() < expiry) {
                    return data;
                } else {
                    localStorage.removeItem('dashboardCache');
                }
            }
        } catch (error) {
            console.warn('캐시 조회 실패:', error);
        }
    }
    return null;
};

/**
 * 캐시 삭제
 */
export const clearDashboardCache = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('dashboardCache');
    }
};

// =============================================================================
// 커스텀 훅 (선택사항)
// =============================================================================

/**
 * 대시보드 데이터를 위한 커스텀 훅 타입
 */
export interface UseDashboardDataReturn {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * API 호출 상태 타입
 */
export interface ApiCallState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

// =============================================================================
// 🔥 API 객체로 내보내기 (기존 컴포넌트 호환성)
// =============================================================================

export const api = {
    // 기존 API 함수들
    getDashboardData,
    getProfileData,
    updateProfileData,
    getDesiredConditions,
    updateDesiredConditions,
    getApplications,
    updateApplications,
    getHomeStats,
    getProfileCompletion,


    // 🔥 공고 추천 API 추가
    getJobRecommendations,
};