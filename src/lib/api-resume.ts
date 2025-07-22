//const API_BASE_URL = `http://localhost:8080/api`;

const API_BASE_URL = `https://initback-production-67bf.up.railway.app/api`;

class ResumeApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    // 실제 로그인된 사용자 ID를 가져오는 함수
    private getUserId(): number {
        if (typeof window !== 'undefined') {
            const userId = localStorage.getItem('userId');
            if (userId) {
                return parseInt(userId);
            }
        }
        return 1; // 기본값 (테스트용)
    }

    // 사용자 ID를 헤더로 전달하는 공통 메서드
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const userId = this.getUserId();

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId.toString(), // 실제 로그인된 사용자 ID 사용
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    url,
                    userId,
                    error: errorData
                });
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // 백엔드 ApiResponse 구조 처리
            const result = await response.json();
            return result.data || result; // ApiResponse.data 추출
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // 이력서 목록 조회 - userId 파라미터 제거 (자동으로 localStorage에서 가져옴)
    async getResumes(): Promise<ResumeListResponse[]> {
        return this.request<ResumeListResponse[]>('/resumes', {
            method: 'GET',
        });
    }

    // 특정 이력서 조회
    async getResume(id: number): Promise<ResumeResponse> {
        return this.request<ResumeResponse>(`/resumes/${id}`, {
            method: 'GET',
        });
    }

    // 이력서 생성
    async createResume(data: ResumeCreateRequest): Promise<ResumeResponse> {
        return this.request<ResumeResponse>('/resumes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // 이력서 수정
    async updateResume(id: number, data: ResumeUpdateRequest): Promise<ResumeResponse> {
        return this.request<ResumeResponse>(`/resumes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // 이력서 삭제
    async deleteResume(id: number): Promise<void> {
        return this.request<void>(`/resumes/${id}`, {
            method: 'DELETE',
        });
    }

    // 대표 이력서 설정
    async setPrimaryResume(id: number): Promise<ResumeResponse> {
        return this.request<ResumeResponse>(`/resumes/${id}/primary`, {
            method: 'PATCH',
        });
    }

    // 공개/비공개 토글
    async togglePublicStatus(id: number): Promise<ResumeResponse> {
        return this.request<ResumeResponse>(`/resumes/${id}/public`, {
            method: 'PATCH',
        });
    }

    // 이력서 복사
    async copyResume(id: number): Promise<ResumeResponse> {
        return this.request<ResumeResponse>(`/resumes/${id}/copy`, {
            method: 'POST',
        });
    }
}

// 기존 타입 정의들은 그대로 유지...
export interface WorkExperienceResponse {
    id: number;
    company: string;
    position?: string;
    department?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
    achievements?: string;
    employmentType?: string;
}

export interface WorkExperienceCreateRequest {
    company: string;
    position?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
    achievements?: string;
    employmentType?: string;
}

export interface WorkExperienceUpdateRequest {
    id?: number;
    company: string;
    position?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
    achievements?: string;
    employmentType?: string;
}

export interface EducationResponse {
    id: number;
    school: string;
    major?: string;
    degree?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    gpa?: number;
    maxGpa?: number;
    description?: string;
}

export interface EducationCreateRequest {
    school: string;
    major?: string;
    degree?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    gpa?: number;
    maxGpa?: number;
    description?: string;
}

export interface EducationUpdateRequest {
    id?: number;
    school: string;
    major?: string;
    degree?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    gpa?: number;
    maxGpa?: number;
    description?: string;
}

export interface SkillResponse {
    id: number;
    name: string;
    category: string;
    proficiencyLevel?: number;
}

export interface SkillCreateRequest {
    name: string;
    category: string;
    proficiencyLevel?: number;
}

export interface SkillUpdateRequest {
    id?: number;
    name: string;
    category: string;
    proficiencyLevel?: number;
}

export interface CertificateResponse {
    id: number;
    name: string;
    organization?: string;
    acquisitionDate?: string;
    expirationDate?: string;
    certificateNumber?: string;
    displayOrder?: number;
}

export interface CertificateCreateRequest {
    name: string;
    organization?: string;
    acquisitionDate?: string;
    expirationDate?: string;
    certificateNumber?: string;
    displayOrder?: number;
}

export interface CertificateUpdateRequest {
    id?: number;
    name: string;
    organization?: string;
    acquisitionDate?: string;
    expirationDate?: string;
    certificateNumber?: string;
    displayOrder?: number;
}

export interface LanguageResponse {
    id: number;
    name: string;
    proficiencyLevel: string;
    testName?: string;
    testScore?: string;
}

export interface LanguageCreateRequest {
    name: string;
    proficiencyLevel: string;
    testName?: string;
    testScore?: string;
}

export interface LanguageUpdateRequest {
    id?: number;
    name: string;
    proficiencyLevel: string;
    testName?: string;
    testScore?: string;
}

export interface ResumeResponse {
    id: number;
    title: string;
    summary?: string;
    isPrimary: boolean;
    isPublic: boolean;
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    birthDate?: string;
    gender?: string;
    profileImageUrl?: string;
    githubUrl?: string;
    blogUrl?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    jobCategory?: string;
    companyType?: string;
    preferredLocation?: string;
    jobPosition?: string;
    workExperiences?: WorkExperienceResponse[];
    educations?: EducationResponse[];
    skills?: SkillResponse[];
    certificates?: CertificateResponse[];
    languages?: LanguageResponse[];
    createdAt: string;
    updatedAt: string;
}

export interface ResumeListResponse {
    id: number;
    title: string;
    summary?: string;
    isPrimary: boolean;
    isPublic: boolean;
    jobCategory?: string;
    companyType?: string;
    preferredLocation?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ResumeCreateRequest {
    title: string;
    summary?: string;
    isPrimary?: boolean;
    isPublic?: boolean;
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    birthDate?: string;
    gender?: string;
    profileImageUrl?: string;
    githubUrl?: string;
    blogUrl?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    jobCategory?: string;
    companyType?: string;
    preferredLocation?: string;
    jobPosition?: string;
    workExperiences?: WorkExperienceCreateRequest[];
    educations?: EducationCreateRequest[];
    skills?: SkillCreateRequest[];
    certificates?: CertificateCreateRequest[];
    languages?: LanguageCreateRequest[];
}

export interface ResumeUpdateRequest {
    title: string;
    summary?: string;
    isPrimary?: boolean;
    isPublic?: boolean;
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    birthDate?: string;
    gender?: string;
    profileImageUrl?: string;
    githubUrl?: string;
    blogUrl?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    jobCategory?: string;
    companyType?: string;
    preferredLocation?: string;
    jobPosition?: string;
    workExperiences?: WorkExperienceUpdateRequest[];
    educations?: EducationUpdateRequest[];
    skills?: SkillUpdateRequest[];
    certificates?: CertificateUpdateRequest[];
    languages?: LanguageUpdateRequest[];
}

export const resumeApiClient = new ResumeApiClient(API_BASE_URL);