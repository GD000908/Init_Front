// src/lib/spec-api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';


// =============================================================================
// 타입 정의 (기존 컴포넌트와 호환)
// =============================================================================

export interface SpecApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 기존 컴포넌트에서 사용하는 타입들 그대로 사용
export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  careerLevel: string;
  jobTitle: string;
  introduction: string;
}

export interface CareerStats {
  experience: string;
  workRecords: string;
  careerGoal: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  acquisitionDate: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
}

export interface Language {
  id: string;
  language: string;
  level: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface Activity {
  id: string;
  name: string;
  organization: string;
  startDate: string;
  endDate: string;
}

export interface Military {
  id: string;
  serviceType: string;
  militaryBranch: string;
  startDate: string;
  endDate: string;
}

export interface UserSpecData {
  profile: ProfileData;
  careerStats: CareerStats;
  skills: string[];
  workExperiences: WorkExperience[];
  educations: Education[];
  certificates: Certificate[];
  links: Link[];
  languages: Language[];
  projects: Project[];
  activities: Activity[];
  military: Military[];
}

// =============================================================================
// HTTP 클라이언트
// =============================================================================

const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<SpecApiResponse<T>> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const responseBody = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    throw new Error(responseBody.message || `API 호출 실패: ${response.status}`);
  }
  return responseBody;
};

// =============================================================================
// 데이터 변환 함수
// =============================================================================

const transformBackendData = (backendData: any): UserSpecData => {
  return {
    profile: backendData.profile || { name: "", email: "", phone: "", location: "", careerLevel: "", jobTitle: "", introduction: "" },
    careerStats: backendData.careerStats || { experience: "", workRecords: "", careerGoal: "" },
    skills: (backendData.skills || []).map((skill: any) => typeof skill === 'string' ? skill : skill.name),
    workExperiences: (backendData.workExperiences || []).map((exp: any) => ({
      ...exp,
      id: exp.id?.toString() || Date.now().toString()
    })),
    educations: (backendData.educations || []).map((edu: any) => ({
      ...edu,
      id: edu.id?.toString() || Date.now().toString()
    })),
    certificates: (backendData.certificates || []).map((cert: any) => ({
      ...cert,
      id: cert.id?.toString() || Date.now().toString(),
      issuer: cert.organization || cert.issuer || ""
    })),
    links: (backendData.links || []).map((link: any) => ({
      ...link,
      id: link.id?.toString() || Date.now().toString()
    })),
    languages: (backendData.languages || []).map((lang: any) => ({
      ...lang,
      id: lang.id?.toString() || Date.now().toString(),
      language: lang.language || lang.name || ""
    })),
    projects: (backendData.projects || []).map((proj: any) => ({
      ...proj,
      id: proj.id?.toString() || Date.now().toString()
    })),
    activities: (backendData.activities || []).map((act: any) => ({
      ...act,
      id: act.id?.toString() || Date.now().toString()
    })),
    military: (backendData.militaries || []).map((mil: any) => ({
      ...mil,
      id: mil.id?.toString() || Date.now().toString()
    })),
  };
};

// =============================================================================
// API 함수들
// =============================================================================

export const fetchUserSpec = async (userId: number): Promise<UserSpecData> => {
  const result = await apiCall<any>(`/spec/${userId}`);
  if (!result.success) throw new Error(result.message || '스펙 데이터를 불러오는데 실패했습니다.');
  return transformBackendData(result.data);
};

export const updateProfile = async (userId: number, profileData: ProfileData): Promise<any> => {
  const result = await apiCall(`/spec/${userId}/profile`, {
    method: 'PUT', body: JSON.stringify(profileData),
  });
  if (!result.success) throw new Error(result.message || '프로필 업데이트에 실패했습니다.');
  return result.data;
};

export const updateSkills = async (userId: number, skills: string[]): Promise<string[]> => {
  const result = await apiCall<string[]>(`/spec/${userId}/skills`, {
    method: 'PUT', body: JSON.stringify(skills),
  });
  if (!result.success) throw new Error(result.message || '스킬 업데이트에 실패했습니다.');
  return result.data;
};

export const updateWorkExperiences = async (userId: number, experiences: WorkExperience[]): Promise<any> => {
  const result = await apiCall(`/spec/${userId}/careers`, {
    method: 'PUT', body: JSON.stringify(experiences),
  });
  if (!result.success) throw new Error(result.message || '업무 경력 업데이트에 실패했습니다.');
  return result.data;
};

export const updateEducations = async (userId: number, educations: Education[]): Promise<any> => {
  const result = await apiCall(`/spec/${userId}/educations`, {
    method: 'PUT', body: JSON.stringify(educations),
  });
  if (!result.success) throw new Error(result.message || '학력 업데이트에 실패했습니다.');
  return result.data;
};

export const updateCertificates = async (userId: number, certificates: Certificate[]): Promise<any> => {
  const backendCerts = certificates.map(cert => ({...cert, organization: cert.issuer }));
  const result = await apiCall(`/spec/${userId}/certificates`, {
    method: 'PUT', body: JSON.stringify(backendCerts),
  });
  if (!result.success) throw new Error(result.message || '자격증 업데이트에 실패했습니다.');
  return result.data;
};

export const updateLinks = async (userId: number, links: Link[]): Promise<any> => {
  const result = await apiCall(`/spec/${userId}/links`, {
    method: 'PUT', body: JSON.stringify(links),
  });
  if (!result.success) throw new Error(result.message || '링크 업데이트에 실패했습니다.');
  return result.data;
};

export const updateLanguages = async (userId: number, languages: Language[]): Promise<any> => {
  const backendLanguages = languages.map(lang => ({...lang, name: lang.language }));
  const result = await apiCall(`/spec/${userId}/languages`, {
    method: 'PUT', body: JSON.stringify(backendLanguages),
  });
  if (!result.success) throw new Error(result.message || '어학 정보 업데이트에 실패했습니다.');
  return result.data;
};

export const updateProjects = async (userId: number, projects: Project[]): Promise<any> => {
  const result = await apiCall(`/spec/${userId}/projects`, {
    method: 'PUT', body: JSON.stringify(projects),
  });
  if (!result.success) throw new Error(result.message || '프로젝트 업데이트에 실패했습니다.');
  return result.data;
};

export const updateActivities = async (userId: number, activities: Activity[]): Promise<any> => {
  const result = await apiCall(`/spec/${userId}/activities`, {
    method: 'PUT', body: JSON.stringify(activities),
  });
  if (!result.success) throw new Error(result.message || '활동 정보 업데이트에 실패했습니다.');
  return result.data;
};

export const updateMilitary = async (userId: number, military: Military[]): Promise<any> => {
  const result = await apiCall(`/spec/${userId}/militaries`, {
    method: 'PUT', body: JSON.stringify(military),
  });
  if (!result.success) throw new Error(result.message || '병역 정보 업데이트에 실패했습니다.');
  return result.data;
};

export const updateCareerStats = async (userId: number, stats: CareerStats): Promise<any> => {
  const result = await apiCall(`/spec/${userId}/career-stats`, {
    method: 'PUT', body: JSON.stringify(stats),
  });
  if (!result.success) throw new Error(result.message || '경력 통계 업데이트에 실패했습니다.');
  return result.data;
};