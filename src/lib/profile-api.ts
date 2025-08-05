// 🔥 프로필 관련 API 함수들

const API_BASE_URL = "https://initback-production-67bf.up.railway.app/api"

// 인증 헤더 생성
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
        throw new Error('로그인이 필요합니다.');
    }

    if (!userId || userId === 'undefined' || userId === 'null') {
        throw new Error('로그인 정보가 불완전합니다.');
    }

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

// 🔥 프로필 응답 타입 정의
export interface CommunityProfileResponse {
    id: number
    userId: number
    displayName: string
    bio?: string
    jobTitle?: string
    company?: string
    location?: string
    profileImageUrl?: string
    coverImageUrl?: string
    isPublic: boolean
    allowFollow: boolean
    postsCount: number
    followersCount: number
    followingCount: number
    createdAt: string
    updatedAt: string
    isOwner?: boolean
    isFollowing?: boolean
    isMutualFollow?: boolean
}

// 🔥 프로필 업데이트 요청 타입
export interface CommunityProfileUpdateRequest {
    displayName?: string
    bio?: string
    jobTitle?: string
    company?: string
    location?: string
    profileImageUrl?: string
    coverImageUrl?: string
    isPublic?: boolean
    allowFollow?: boolean
}

// 🔥 이미지 업로드 응답 타입
export interface ImageUploadResponse {
    success: boolean
    data?: {
        imageUrl: string
        message?: string
    }
    message?: string
}

/**
 * 🔥 커뮤니티 프로필 조회
 */
export async function getCommunityProfile(
    userId: number,
    currentUserId?: number
): Promise<CommunityProfileResponse> {
    try {
        const params = new URLSearchParams();
        if (currentUserId) {
            params.append('currentUserId', currentUserId.toString());
        }

        const response = await fetch(`${API_BASE_URL}/community/profile/${userId}?${params}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`프로필 조회에 실패했습니다: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.message || "프로필 조회에 실패했습니다");
        }

        return result.data;

    } catch (error) {
        console.error('❌ 프로필 조회 오류:', error);
        throw error;
    }
}

/**
 * 🔥 커뮤니티 프로필 업데이트
 */
export async function updateCommunityProfile(
    userId: number,
    profileData: CommunityProfileUpdateRequest
): Promise<CommunityProfileResponse> {
    try {
        console.log('🔄 프로필 업데이트 요청:', {userId, profileData});

        const response = await fetch(`${API_BASE_URL}/community/profile/${userId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 프로필 업데이트 실패:', errorText);
            throw new Error(`프로필 업데이트에 실패했습니다: ${response.status}`);
        }

        const updatedProfile: CommunityProfileResponse = await response.json();
        console.log('✅ 프로필 업데이트 성공:', updatedProfile);

        return updatedProfile;

    } catch (error) {
        console.error('❌ 프로필 업데이트 오류:', error);
        throw error;
    }
}

/**
 * 🔥 프로필 이미지 업로드 (전용 엔드포인트)
 */
export async function uploadProfileImage(
    userId: number,
    imageFile: File
): Promise<string> {
    try {
        console.log('🖼️ 프로필 이미지 업로드 시작:', {
            userId,
            fileName: imageFile.name,
            fileSize: imageFile.size,
            fileType: imageFile.type
        });

        // FormData 생성
        const formData = new FormData();
        formData.append('image', imageFile);

        // 🔥 인증 헤더 (multipart/form-data이므로 Content-Type 제외)
        const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
        if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            throw new Error('로그인이 필요합니다.');
        }

        const response = await fetch(`${API_BASE_URL}/community/profile/${userId}/upload-avatar`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
                // Content-Type을 설정하지 않음 - 브라우저가 자동으로 multipart/form-data로 설정
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 프로필 이미지 업로드 실패:', errorText);
            throw new Error(`프로필 이미지 업로드에 실패했습니다: ${response.status}`);
        }

        const result: ImageUploadResponse = await response.json();
        console.log('✅ 프로필 이미지 업로드 성공:', result);

        if (!result.success || !result.data?.imageUrl) {
            throw new Error(result.message || "이미지 업로드에 실패했습니다");
        }

        return result.data.imageUrl;

    } catch (error) {
        console.error('❌ 프로필 이미지 업로드 오류:', error);
        throw error;
    }
}

/**
 * 🔥 일반 이미지 업로드 (기존 ImageUploadController 사용)
 */
export async function uploadImage(imageFile: File): Promise<string> {
    try {
        console.log('🖼️ 이미지 업로드 시작:', {
            fileName: imageFile.name,
            fileSize: imageFile.size,
            fileType: imageFile.type
        });

        const formData = new FormData();
        formData.append('image', imageFile);

        const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
        if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            throw new Error('로그인이 필요합니다.');
        }

        const response = await fetch(`${API_BASE_URL}/upload/image`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 이미지 업로드 실패:', errorText);
            throw new Error(`이미지 업로드에 실패했습니다: ${response.status}`);
        }

        const result: ImageUploadResponse = await response.json();
        console.log('✅ 이미지 업로드 성공:', result);

        if (!result.success || !result.data?.imageUrl) {
            throw new Error(result.message || "이미지 업로드에 실패했습니다");
        }

        return result.data.imageUrl;

    } catch (error) {
        console.error('❌ 이미지 업로드 오류:', error);
        throw error;
    }
}
