// src/lib/spec-api.ts

//const BASE_URL = 'http://localhost:8080/api';

const BASE_URL = `https://initback-production-67bf.up.railway.app/api`;


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

// 백엔드 데이터 타입 정의 (any 타입 제거)
interface BackendSkill {
  id?: number;
  name: string;
}

interface BackendWorkExperience {
  id?: number;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface BackendEducation {
  id?: number;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
}

interface BackendCertificate {
  id?: number;
  name: string;
  organization?: string;
  issuer?: string;
  acquisitionDate: string;
}

interface BackendLink {
  id?: number;
  title: string;
  url: string;
}

interface BackendLanguage {
  id?: number;
  language?: string;
  name?: string;
  level: string;
}

interface BackendProject {
  id?: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface BackendActivity {
  id?: number;
  name: string;
  organization: string;
  startDate: string;
  endDate: string;
}

interface BackendMilitary {
  id?: number;
  serviceType: string;
  militaryBranch: string;
  startDate: string;
  endDate: string;
}

interface BackendSpecData {
  profile?: ProfileData;
  careerStats?: CareerStats;
  skills?: (BackendSkill | string)[];
  workExperiences?: BackendWorkExperience[];
  educations?: BackendEducation[];
  certificates?: BackendCertificate[];
  links?: BackendLink[];
  languages?: BackendLanguage[];
  projects?: BackendProject[];
  activities?: BackendActivity[];
  militaries?: BackendMilitary[];
}

// =============================================================================
// HTTP 클라이언트
// =============================================================================

const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<SpecApiResponse<T>> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const responseBody = await response.json() as SpecApiResponse<T>;

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
      throw new Error(responseBody.message || `API 호출 실패: ${response.status}`);
    }

    return responseBody;
  } catch (error) {
    console.error('API 호출 중 오류 발생:', error);
    throw error;
  }
};

// =============================================================================
// 데이터 변환 함수
// =============================================================================

const transformBackendData = (backendData: BackendSpecData): UserSpecData => {
  return {
    profile: backendData.profile || {
      name: "",
      email: "",
      phone: "",
      location: "",
      careerLevel: "",
      jobTitle: "",
      introduction: ""
    },
    careerStats: backendData.careerStats || {
      experience: "",
      workRecords: "",
      careerGoal: ""
    },
    skills: (backendData.skills || []).map((skill: BackendSkill | string) =>
        typeof skill === 'string' ? skill : skill.name
    ),
    workExperiences: (backendData.workExperiences || []).map((exp: BackendWorkExperience) => ({
      ...exp,
      id: exp.id?.toString() || Date.now().toString()
    })),
    educations: (backendData.educations || []).map((edu: BackendEducation) => ({
      ...edu,
      id: edu.id?.toString() || Date.now().toString()
    })),
    certificates: (backendData.certificates || []).map((cert: BackendCertificate) => ({
      ...cert,
      id: cert.id?.toString() || Date.now().toString(),
      issuer: cert.organization || cert.issuer || ""
    })),
    links: (backendData.links || []).map((link: BackendLink) => ({
      ...link,
      id: link.id?.toString() || Date.now().toString()
    })),
    languages: (backendData.languages || []).map((lang: BackendLanguage) => ({
      ...lang,
      id: lang.id?.toString() || Date.now().toString(),
      language: lang.language || lang.name || ""
    })),
    projects: (backendData.projects || []).map((proj: BackendProject) => ({
      ...proj,
      id: proj.id?.toString() || Date.now().toString()
    })),
    activities: (backendData.activities || []).map((act: BackendActivity) => ({
      ...act,
      id: act.id?.toString() || Date.now().toString()
    })),
    military: (backendData.militaries || []).map((mil: BackendMilitary) => ({
      ...mil,
      id: mil.id?.toString() || Date.now().toString()
    }))
  };
};

// =============================================================================
// API 함수들
// =============================================================================

export const fetchUserSpec = async (userId: number): Promise<UserSpecData> => {
  const result = await apiCall<BackendSpecData>(`/spec/${userId}`);
  if (!result.success) {
    throw new Error(result.message || '스펙 데이터를 불러오는데 실패했습니다.');
  }
  return transformBackendData(result.data);
};

export const updateProfile = async (userId: number, profileData: ProfileData): Promise<ProfileData> => {
  const result = await apiCall<ProfileData>(`/spec/${userId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
  if (!result.success) {
    throw new Error(result.message || '프로필 업데이트에 실패했습니다.');
  }
  return result.data;
};

export const updateSkills = async (userId: number, skills: string[]): Promise<string[]> => {
  const result = await apiCall<string[]>(`/spec/${userId}/skills`, {
    method: 'PUT',
    body: JSON.stringify(skills),
  });
  if (!result.success) {
    throw new Error(result.message || '스킬 업데이트에 실패했습니다.');
  }
  return result.data;
};

export const updateWorkExperiences = async (userId: number, experiences: WorkExperience[]): Promise<WorkExperience[]> => {
  const result = await apiCall<WorkExperience[]>(`/spec/${userId}/careers`, {
    method: 'PUT',
    body: JSON.stringify(experiences),
  });
  if (!result.success) {
    throw new Error(result.message || '업무 경력 업데이트에 실패했습니다.');
  }
  return result.data;
};

export const updateEducations = async (userId: number, educations: Education[]): Promise<Education[]> => {
  const result = await apiCall<Education[]>(`/spec/${userId}/educations`, {
    method: 'PUT',
    body: JSON.stringify(educations),
  });
  if (!result.success) {
    throw new Error(result.message || '학력 업데이트에 실패했습니다.');
  }
  return result.data;
};

export const updateCertificates = async (userId: number, certificates: Certificate[]): Promise<Certificate[]> => {
  const backendCerts = certificates.map(cert => ({
    ...cert,
    organization: cert.issuer
  }));

  const result = await apiCall<Certificate[]>(`/spec/${userId}/certificates`, {
    method: 'PUT',
    body: JSON.stringify(backendCerts),
  });
  if (!result.success) {
    throw new Error(result.message || '자격증 업데이트에 실패했습니다.');
  }
  return result.data;
};

export const updateLinks = async (userId: number, links: Link[]): Promise<Link[]> => {
  const result = await apiCall<Link[]>(`/spec/${userId}/links`, {
    method: 'PUT',
    body: JSON.stringify(links),
  });
  if (!result.success) {
    throw new Error(result.message || '링크 업데이트에 실패했습니다.');
  }
  return result.data;
};

export const updateLanguages = async (userId: number, languages: Language[]): Promise<Language[]> => {
  const backendLanguages = languages.map(lang => ({
    ...lang,
    name: lang.language
  }));

  const result = await apiCall<Language[]>(`/spec/${userId}/languages`, {
    method: 'PUT',
    body: JSON.stringify(backendLanguages),
  });
  if (!result.success) {
    throw new Error(result.message || '어학 정보 업데이트에 실패했습니다.');
  }
  return result.data;
};

export const updateProjects = async (userId: number, projects: Project[]): Promise<Project[]> => {
  const result = await apiCall<Project[]>(`/spec/${userId}/projects`, {
    method: 'PUT',
    body: JSON.stringify(projects),
  });
  if (!result.success) {
    throw new Error(result.message || '프로젝트 업데이트에 실패했습니다.');
  }
  return result.data;
};

export const updateActivities = async (userId: number, activities: Activity[]): Promise<Activity[]> => {
  const result = await apiCall<Activity[]>(`/spec/${userId}/activities`, {
    method: 'PUT',
    body: JSON.stringify(activities),
  });
  if (!result.success) {
    throw new Error(result.message || '활동 정보 업데이트에 실패했습니다.');
  }
  return result.data;
};

export const updateMilitary = async (userId: number, military: Military[]): Promise<Military[]> => {
  const result = await apiCall<Military[]>(`/spec/${userId}/militaries`, {
    method: 'PUT',
    body: JSON.stringify(military),
  });
  if (!result.success) {
    throw new Error(result.message || '병역 정보 업데이트에 실패했습니다.');
  }
  return result.data;
};

export const updateCareerStats = async (userId: number, stats: CareerStats): Promise<CareerStats> => {
  const result = await apiCall<CareerStats>(`/spec/${userId}/career-stats`, {
    method: 'PUT',
    body: JSON.stringify(stats),
  });
  if (!result.success) {
    throw new Error(result.message || '경력 통계 업데이트에 실패했습니다.');
  }
  return result.data;
};