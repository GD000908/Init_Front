// lib/dash-api.ts
// 홈 대시보드 페이지 API 클라이언트 (공고 검색 기능 추가)

//const API_BASE_URL = 'http://localhost:8080';
const API_BASE_URL  = process.env.NEXT_PUBLIC_BASE_URL!;

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

// 🔥 공고 검색 관련 타입 추가
export interface PublicJobPosting {
    recrutPblntSn: string
    instNm: string
    recrutPbancTtl: string
    recrutSeNm: string
    hireTypeNmLst: string
    workRgnNmLst: string
    acbgCondNmLst: string
    pbancBgngYmd: string
    pbancEndYmd: string
    srcUrl: string
    recrutNope: number
    aplyQlfcCn: string
    decimalDay: number
}

export interface PublicJobSearchRequest {
    keywords?: string[]
    locations?: string[]
    pageNo?: number
    numOfRows?: number
    hireTypeLst?: string[]
    recrutSe?: string
    acbgCondLst?: string[]
    ncsCdLst?: string[]
}

export interface PublicJobSearchResponse {
    resultCode: number
    resultMsg: string
    totalCount: number
    result: PublicJobPosting[]
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
        if (url.includes('/job-recommendations/') || url.includes('/public-jobs/')) {
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
// 🔥 공고 추천 관련 API
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
// 🔥 공고 검색 관련 API (새로 추가)
// =============================================================================

/**
 * 공공데이터포털 채용정보 검색
 */
export const searchPublicJobs = async (
    searchParams: PublicJobSearchRequest
): Promise<PublicJobSearchResponse> => {
    const config = createApiClient()

    try {
        console.log('📡 공공데이터 채용정보 검색 요청:', searchParams);

        const response = await fetch(`${API_BASE_URL}/api/public-jobs/search`, {
            method: 'POST',
            ...config,
            headers: {
                ...config.headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchParams)
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ 공공데이터 채용정보 검색 성공:', {
            totalCount: result.totalCount,
            resultCount: result.result?.length || 0
        });

        return result

    } catch (error) {
        console.error('❌ 공고 검색 API 실패:', error)
        throw error
    }
}

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
// 🔥 검색 필터 옵션들
// =============================================================================

export const JOB_SEARCH_FILTERS = {
    regions: [
        { code: "101000", name: "서울" },
        { code: "102000", name: "부산" },
        { code: "103000", name: "대구" },
        { code: "104000", name: "인천" },
        { code: "105000", name: "광주" },
        { code: "106000", name: "대전" },
        { code: "107000", name: "울산" },
        { code: "108000", name: "세종" },
        { code: "109000", name: "경기" },
        { code: "110000", name: "강원" },
        { code: "111000", name: "충북" },
        { code: "112000", name: "충남" },
        { code: "113000", name: "전북" },
        { code: "114000", name: "전남" },
        { code: "115000", name: "경북" },
        { code: "116000", name: "경남" },
        { code: "117000", name: "제주" }
    ],
    employmentTypes: [
        { code: "R1010", name: "정규직" },
        { code: "R1020", name: "무기계약직" },
        { code: "R1030", name: "기간제" },
        { code: "R1040", name: "비정규직" },
        { code: "R1050", name: "기타" }
    ],
    recruitmentTypes: [
        { code: "R2010", name: "신입" },
        { code: "R2020", name: "경력" },
        { code: "R2030", name: "인턴" },
        { code: "R2040", name: "기타" }
    ],
    educationLevels: [
        { code: "R7010", name: "학력무관" },
        { code: "R7020", name: "고등학교졸업" },
        { code: "R7030", name: "대학교졸업(2,3년)" },
        { code: "R7040", name: "대학교졸업(4년)" },
        { code: "R7050", name: "대학원졸업(석사)" },
        { code: "R7060", name: "대학원졸업(박사)" }
    ],
    ncsClassifications: [
        { code: "01", name: "사업관리" },
        { code: "02", name: "경영·회계·사무" },
        { code: "03", name: "금융·보험" },
        { code: "04", name: "교육·자연·사회과학" },
        { code: "05", name: "법률·경찰·소방·교도·국방" },
        { code: "06", name: "보건·의료" },
        { code: "07", name: "사회복지·종교" },
        { code: "08", name: "문화·예술·디자인·방송" },
        { code: "09", name: "운전·운송" },
        { code: "10", name: "영업판매" },
        { code: "11", name: "경비·청소" },
        { code: "12", name: "이용·숙박·여행·오락·스포츠" },
        { code: "13", name: "음식서비스" },
        { code: "14", name: "건설" },
        { code: "15", name: "기계" },
        { code: "16", name: "재료" },
        { code: "17", name: "화학" },
        { code: "18", name: "섬유·의복" },
        { code: "19", name: "전기·전자" },
        { code: "20", name: "정보통신" },
        { code: "21", name: "식품가공" },
        { code: "22", name: "인쇄·목재·가구·공예" },
        { code: "23", name: "환경·에너지·안전" },
        { code: "24", name: "농림어업" }
    ]
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
    jobRecommendations: ['jobRecommendations'] as const,
    publicJobSearch: ['publicJobSearch'] as const, // 🔥 추가
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
    getJobRecommendations,

    // 🔥 새로운 공고 검색 API 추가
    searchPublicJobs,
};