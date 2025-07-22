// api/jobPostingApi.ts
//const API_BASE_URL = `http://localhost:8080/api/job-calendar`;
const API_BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL!}/job-calendar`;


export interface JobPostingDto {
    id: number;
    title: string;
    startDate: string; // ISO date string
    endDate: string;   // ISO date string
    location?: string;
    position?: string;
    salary?: string;
    color?: string;
    status: 'ACTIVE' | 'EXPIRED' | 'UPCOMING' | 'CLOSED';
    description?: string;
    company?: string;
    department?: string;
    experienceLevel?: string;
    employmentType?: string;
    createdAt: string;
    updatedAt: string;
}

export interface JobBookmarkDto {
    id: number;
    userId?: number;
    jobPosting: JobPostingDto;
    memo?: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
    createdAt: string;
}

export interface CreateJobPostingRequest {
    title: string;
    startDate: string; // ISO date string (YYYY-MM-DD)
    endDate: string;   // ISO date string (YYYY-MM-DD)
    location?: string;
    position?: string;
    salary?: string;
    color?: string;
    description?: string;
    company?: string;
    department?: string;
    experienceLevel?: string;
    employmentType?: string;
}

export interface CreateJobBookmarkRequest {
    userId: number;
    jobPostingId: number;
    memo?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    errorCode?: string;
}

class JobPostingApi {
    private async request<T>(endpoint: string, options?: RequestInit & { userId?: string }): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        // 기본 헤더 설정
        const defaultHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // 사용자 ID가 있으면 헤더에 추가
        if (options?.userId) {
            defaultHeaders['x-user-id'] = options.userId;
        }

        try {
            const response = await fetch(url, {
                headers: {
                    ...defaultHeaders,
                    ...options?.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: ApiResponse<T> = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'API 요청 실패');
            }

            return result.data;
        } catch (error) {
            console.error('API 요청 실패:', error);
            throw error;
        }
    }

    // ============= 채용공고 관련 API =============

    async getAllJobPostings(): Promise<JobPostingDto[]> {
        return this.request<JobPostingDto[]>('/job-postings');
    }

    async getJobPostingById(id: number): Promise<JobPostingDto> {
        return this.request<JobPostingDto>(`/job-postings/${id}`);
    }

    async searchJobPostings(keyword: string): Promise<JobPostingDto[]> {
        return this.request<JobPostingDto[]>(`/job-postings/search?keyword=${encodeURIComponent(keyword)}`);
    }

    async getActiveJobs(): Promise<JobPostingDto[]> {
        return this.request<JobPostingDto[]>('/job-postings/active');
    }

    async getJobsEndingSoon(days: number = 7): Promise<JobPostingDto[]> {
        return this.request<JobPostingDto[]>(`/job-postings/ending-soon?days=${days}`);
    }

    async getExpiredJobs(): Promise<JobPostingDto[]> {
        return this.request<JobPostingDto[]>('/job-postings/expired');
    }

    async getUpcomingJobs(): Promise<JobPostingDto[]> {
        return this.request<JobPostingDto[]>('/job-postings/upcoming');
    }

    async createJobPosting(request: CreateJobPostingRequest, userId: number): Promise<JobPostingDto> {
        return this.request<JobPostingDto>('/job-postings', {
            method: 'POST',
            body: JSON.stringify(request),
            userId: userId.toString()
        });
    }

    async updateJobPosting(id: number, request: CreateJobPostingRequest, userId: number): Promise<JobPostingDto> {
        return this.request<JobPostingDto>(`/job-postings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(request),
            userId: userId.toString()
        });
    }

    async deleteJobPosting(id: number, userId: number): Promise<void> {
        return this.request<void>(`/job-postings/${id}`, {
            method: 'DELETE',
            userId: userId.toString()
        });
    }

    // ============= 북마크 관련 API =============

    async getBookmarksByUserId(userId: number): Promise<JobBookmarkDto[]> {
        return this.request<JobBookmarkDto[]>(`/bookmarks/user/${userId}`, {
            userId: userId.toString()
        });
    }

    async getBookmarksEndingSoon(userId: number, days: number = 7): Promise<JobBookmarkDto[]> {
        return this.request<JobBookmarkDto[]>(`/bookmarks/user/${userId}/ending-soon?days=${days}`, {
            userId: userId.toString()
        });
    }

    async getActiveJobBookmarks(userId: number): Promise<JobBookmarkDto[]> {
        return this.request<JobBookmarkDto[]>(`/bookmarks/user/${userId}/active`, {
            userId: userId.toString()
        });
    }

    async getExpiredJobBookmarks(userId: number): Promise<JobBookmarkDto[]> {
        return this.request<JobBookmarkDto[]>(`/bookmarks/user/${userId}/expired`, {
            userId: userId.toString()
        });
    }

    async getBookmarkCount(userId: number): Promise<number> {
        return this.request<number>(`/bookmarks/user/${userId}/count`, {
            userId: userId.toString()
        });
    }

    async isBookmarked(userId: number, jobPostingId: number): Promise<boolean> {
        return this.request<boolean>(`/bookmarks/check?userId=${userId}&jobPostingId=${jobPostingId}`, {
            userId: userId.toString()
        });
    }

    async createBookmark(request: CreateJobBookmarkRequest): Promise<JobBookmarkDto> {
        return this.request<JobBookmarkDto>('/bookmarks', {
            method: 'POST',
            body: JSON.stringify(request),
            userId: request.userId.toString()
        });
    }

    async updateBookmarkMemo(bookmarkId: number, memo: string, userId: number): Promise<JobBookmarkDto> {
        return this.request<JobBookmarkDto>(`/bookmarks/${bookmarkId}/memo?memo=${encodeURIComponent(memo)}`, {
            method: 'PUT',
            userId: userId.toString()
        });
    }

    async deleteBookmark(bookmarkId: number, userId: number): Promise<void> {
        return this.request<void>(`/bookmarks/${bookmarkId}`, {
            method: 'DELETE',
            userId: userId.toString()
        });
    }

    async deleteBookmarkByUserAndJob(userId: number, jobPostingId: number): Promise<void> {
        return this.request<void>(`/bookmarks/user/${userId}/job/${jobPostingId}`, {
            method: 'DELETE',
            userId: userId.toString()
        });
    }

    // ============= 유틸리티 메소드 =============

    /**
     * Date 객체를 ISO 날짜 문자열(YYYY-MM-DD)로 변환
     */
    static dateToISOString(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    /**
     * ISO 날짜 문자열을 Date 객체로 변환
     */
    static isoStringToDate(dateString: string): Date {
        return new Date(dateString);
    }

    /**
     * CreateJobPostingRequest에서 Date를 문자열로 변환
     */
    static convertDatesToStrings(request: {
        title: string;
        start: Date;
        end: Date;
        position?: string;
        location?: string;
        salary?: string;
        color?: string;
        description?: string;
        company?: string;
        department?: string;
        experienceLevel?: string;
        employmentType?: string;
    }): CreateJobPostingRequest {
        return {
            title: request.title,
            startDate: this.dateToISOString(request.start),
            endDate: this.dateToISOString(request.end),
            position: request.position,
            location: request.location,
            salary: request.salary,
            color: request.color,
            description: request.description,
            company: request.company,
            department: request.department,
            experienceLevel: request.experienceLevel,
            employmentType: request.employmentType,
        };
    }
}

// 싱글톤 인스턴스 export
export const jobPostingApi = new JobPostingApi();

// 기본 export
export default jobPostingApi;