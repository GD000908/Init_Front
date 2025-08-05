/**
 * 이미지 URL 처리 유틸리티
 */

// 환경에 따른 API 베이스 URL 설정
const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    // 서버 사이드 렌더링 환경
    return 'https://initback-production-67bf.up.railway.app';
  }
  
  // 클라이언트 사이드 환경
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-domain.com';
  }
  
  return 'https://initback-production-67bf.up.railway.app';
};

/**
 * 이미지 URL을 전체 URL로 변환
 * @param imageUrl - 원본 이미지 URL (상대 경로 또는 전체 URL)
 * @returns 전체 이미지 URL 또는 기본 이미지 URL
 */
export const getFullImageUrl = (imageUrl?: string | null): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return '/placeholder_person.svg';  // 🔥 프론트엔드 public 폴더의 기본 이미지
  }

  const cleanUrl = imageUrl.trim();
  
  // 이미 전체 URL인 경우 그대로 반환
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  
  // placeholder_person.svg는 프론트엔드에서 제공
  if (cleanUrl === '/placeholder_person.svg') {
    return cleanUrl;
  }
  
  // 상대 경로인 경우 백엔드 서버 URL로 변환
  const baseUrl = getApiBaseUrl();
  const separator = cleanUrl.startsWith('/') ? '' : '/';
  
  return `${baseUrl}${separator}${cleanUrl}`;
};

/**
 * 이미지 로딩 에러 핸들러
 * @param imageUrl - 실패한 이미지 URL
 * @param element - 이미지 엘리먼트
 */
export const handleImageError = (imageUrl: string, element: HTMLImageElement) => {
  console.error('🖼️ 이미지 로딩 실패:', {
    url: imageUrl,
    fullUrl: getFullImageUrl(imageUrl)
  });
  
  // 이미지 숨김 처리
  element.style.display = 'none';
};

/**
 * 이미지 URL이 유효한지 확인
 * @param imageUrl - 확인할 이미지 URL
 * @returns Promise<boolean>
 */
export const validateImageUrl = async (imageUrl?: string | null): Promise<boolean> => {
  const fullUrl = getFullImageUrl(imageUrl);
  
  if (!fullUrl) {
    return false;
  }
  
  try {
    const response = await fetch(fullUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('이미지 URL 검증 실패:', error);
    return false;
  }
};

/**
 * 이미지 미리보기용 URL 생성 (Object URL 관리)
 * @param file - 이미지 파일
 * @returns Object URL
 */
export const createImagePreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Object URL 정리
 * @param url - 정리할 Object URL
 */
export const revokeImagePreviewUrl = (url: string) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
