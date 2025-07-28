const API_BASE_URL = `https://initback-production-67bf.up.railway.app/api`;



class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('로그인이 필요합니다.');
    }

    return {
      'X-User-ID': userId,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // 인증 오류 처리
        if (response.status === 401) {
          localStorage.removeItem('userId');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userName');
          window.location.href = '/login';
          throw new Error('로그인이 필요합니다.');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * 자기소개서 생성
   */
  async createCoverLetter(data: CoverLetterRequest): Promise<CoverLetterCreateResponse> {
    const requestData = {
      title: data.title,
      isDraft: data.isDraft,
      company: data.company,
      position: data.position,
      questions: data.questions.map(q => ({
        title: q.title,
        content: q.content,
        wordLimit: 500,
        displayOrder: 0,
      })),
    };

    return this.request<CoverLetterCreateResponse>('/cover-letters', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  /**
   * 자기소개서 수정
   */
  async updateCoverLetter(id: number, data: CoverLetterRequest): Promise<void> {
    const requestData = {
      title: data.title,
      isDraft: data.isDraft,
      company: data.company,
      position: data.position,
      questions: data.questions.map(q => ({
        title: q.title,
        content: q.content,
        wordLimit: 500,
        displayOrder: 0,
      })),
    };

    return this.request<void>(`/cover-letters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
  }

  /**
   * 자기소개서 목록 조회
   */
  async getCoverLetters(): Promise<CoverLetterResponse[]> {
    return this.request<CoverLetterResponse[]>('/cover-letters');
  }

  /**
   * 자기소개서 단건 조회
   */
  async getCoverLetter(id: number): Promise<CoverLetterResponse> {
    return this.request<CoverLetterResponse>(`/cover-letters/${id}`);
  }

  /**
   * 자기소개서 삭제
   */
  async deleteCoverLetter(id: number): Promise<CoverLetterDeleteResponse> {
    return this.request<CoverLetterDeleteResponse>(`/cover-letters/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/health');
  }
}

// === 타입 정의 ===

export interface CoverLetterRequest {
  title: string;
  isDraft: boolean;
  company?: string;
  position?: string;
  questions: QuestionRequest[];
}

export interface QuestionRequest {
  id: string;
  title: string;
  content: string;
}

export interface CoverLetterResponse {
  id: number;
  title: string;
  isDraft: boolean;
  company?: string;
  position?: string;
  questions: QuestionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionResponse {
  id: number;
  title: string;
  content: string;
  wordLimit: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoverLetterCreateResponse {
  id: number;
}

export interface CoverLetterDeleteResponse {
  message: string;
}

// API 클라이언트 인스턴스 생성
export const apiClient = new ApiClient(API_BASE_URL);

//뭐가 문제인거지