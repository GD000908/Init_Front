// 🔥 완전 수정된 post-api.ts - 백엔드 호환성 개선

const API_BASE_URL = "https://initback-production-67bf.up.railway.app/api"

// 인증 헤더 생성
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    console.log('🔍 인증 정보 확인:', {
        hasToken: !!token,
        hasUserId: !!userId,
        tokenLength: token?.length || 0
    });

    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
        console.error('❌ 유효한 인증 토큰이 없습니다.');
        throw new Error('로그인이 필요합니다.');
    }

    if (!userId || userId === 'undefined' || userId === 'null') {
        console.error('❌ 사용자 ID가 없습니다.');
        throw new Error('로그인 정보가 불완전합니다.');
    }

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

// 🔥 백엔드 응답 구조에 맞춘 타입 정의
export interface PostResponse {
    id: number
    content: string
    imageUrl?: string
    jobCategory?: string
    topicCategory?: string
    status: string
    likesCount: number
    commentsCount: number
    bookmarksCount: number
    createdAt: string
    updatedAt: string
    author: {
        id: number; // 🔥 undefined 제거 - 필수 필드로 변경
        name: string
        avatar?: string
        jobTitle: string;
        isFollowing?: boolean
    }
    user?: {
        id: number          // 실제 User ID
        username?: string
        email?: string
    }
    hashtags: string[]
    likedByMe: boolean
    bookmarkedByMe: boolean
    commentsList: CommentResponse[]  // 🔥 수정: string → CommentResponse[]
    timeAgo: string
}

export interface CommentResponse {
    id: number
    postId: number
    content: string
    createdAt: string
    updatedAt: string
    author: {
        id: number          // CommunityProfile ID
        userId: number      // 🔥 백엔드 응답과 일치하도록 수정 (User ID)
        name: string
        avatar?: string
        title?: string
    }
    timeAgo: string
    post?: {
        id: number
        content: string
        imageUrl?: string    // 🔥 백엔드 PostSummaryDto 수정에 맞춰 optional로 변경
        hashtags: string[]
        likesCount: number
        commentsCount: number
        timeAgo: string
        jobCategory?: string
        topicCategory?: string
        author: {
            name: string
            avatar?: string
        }
        commentsList: CommentResponse[]  // 🔥 수정: string → CommentResponse[]
    }
}

// 🔥 수정: CreatePostData - 백엔드 정확한 스펙에 맞춤
export interface CreatePostData {
    content: string
    imageUrl?: string | null
    jobCategory?: string | null
    topicCategory?: string | null
    status: "DRAFT" | "PUBLISHED"
    hashtags?: string[]
}

// API 응답 래퍼 타입
export interface ApiResponse<T> {
    success: boolean
    data?: T
    message?: string
}

// 페이지네이션 응답 타입
export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
    first: boolean
    last: boolean
}

// 🔥 헬퍼 함수: User ID 유효성 검증
const ensureValidUserId = (userId: number, context: string): number => {
    if (!userId || userId <= 0) {
        throw new Error(`${context}: 유효하지 않은 사용자 ID입니다.`);
    }
    return userId;
}

/**
 * 🔥 전체 게시글 조회
 */
export async function getPosts(
    currentUserId: number | null = null,
    page: number = 0,
    size: number = 20
): Promise<ApiResponse<PostResponse[]>> {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        if (currentUserId) {
            params.append('currentUserId', currentUserId.toString());
        }

        const response = await fetch(`${API_BASE_URL}/posts?${params}`, {
            method: "GET",
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error(`게시글 조회에 실패했습니다: ${response.status}`)
        }

        const result: ApiResponse<PageResponse<PostResponse>> = await response.json()

        if (!result.success || !result.data) {
            throw new Error(result.message || "게시글 조회에 실패했습니다")
        }

        return {
            success: true,
            data: result.data.content || []
        }

    } catch (error) {
        console.error('❌ 게시글 조회 오류:', error);
        return {
            success: false,
            data: [],
            message: error instanceof Error ? error.message : "알 수 없는 오류"
        }
    }
}

/**
 * 🔥 팔로잉한 사용자의 게시글 조회
 */
export async function getFollowingPosts(
    userId: number,
    page: number = 0,
    size: number = 20
): Promise<ApiResponse<PostResponse[]>> {
    try {
        const validUserId = ensureValidUserId(userId, "팔로잉 게시글 조회");

        const response = await fetch(`${API_BASE_URL}/posts/following/${validUserId}?page=${page}&size=${size}`, {
            method: "GET",
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error(`팔로잉 게시글 조회에 실패했습니다: ${response.status}`)
        }

        const result: ApiResponse<PageResponse<PostResponse>> = await response.json()

        if (!result.success || !result.data) {
            throw new Error(result.message || "팔로잉 게시글 조회에 실패했습니다")
        }

        return {
            success: true,
            data: result.data.content || []
        }

    } catch (error) {
        console.error('❌ 팔로잉 게시글 조회 오류:', error);
        return {
            success: false,
            data: [],
            message: error instanceof Error ? error.message : "알 수 없는 오류"
        }
    }
}

/**
 * 🔥 카테고리별 게시글 조회
 */
export async function getPostsByCategory(
    category: string,
    currentUserId: number | null = null,
    page: number = 0,
    size: number = 20
): Promise<ApiResponse<PostResponse[]>> {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        if (currentUserId) {
            params.append('currentUserId', currentUserId.toString());
        }

        const response = await fetch(`${API_BASE_URL}/posts/category/${category}?${params}`, {
            method: "GET",
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error(`카테고리별 게시글 조회에 실패했습니다: ${response.status}`)
        }

        const result: ApiResponse<PageResponse<PostResponse>> = await response.json()

        if (!result.success || !result.data) {
            throw new Error(result.message || "카테고리별 게시글 조회에 실패했습니다")
        }

        return {
            success: true,
            data: result.data.content || []
        }

    } catch (error) {
        console.error('❌ 카테고리별 게시글 조회 오류:', error);
        return {
            success: false,
            data: [],
            message: error instanceof Error ? error.message : "알 수 없는 오류"
        }
    }
}

/**
 * 🔥 게시글 검색
 */
export async function searchPosts(
    query: string,
    currentUserId: number | null = null,
    page: number = 0,
    size: number = 20
): Promise<ApiResponse<PostResponse[]>> {
    try {
        if (!query || query.trim() === '') {
            console.warn('⚠️ 빈 검색어로 검색 시도');
            return {
                success: true,
                data: []
            };
        }

        const params = new URLSearchParams({
            q: encodeURIComponent(query.trim()),
            page: page.toString(),
            size: size.toString()
        });

        if (currentUserId) {
            params.append('currentUserId', currentUserId.toString());
        }

        const searchUrl = `${API_BASE_URL}/posts/search?${params}`;
        console.log('🔍 검색 API 호출:', {
            query: query.trim(),
            currentUserId,
            url: searchUrl
        });

        const response = await fetch(searchUrl, {
            method: "GET",
            headers: getAuthHeaders()
        });

        console.log('🔍 검색 응답:', response.status, response.statusText);

        if (!response.ok) {
            // 에러 응답 내용을 확인
            let errorMessage = '';
            try {
                const errorText = await response.text();
                console.error('❌ 검색 에러 응답:', errorText);
                errorMessage = errorText;
            } catch (e) {
                console.error('❌ 에러 응답 파싱 실패:', e);
            }

            throw new Error(`게시글 검색에 실패했습니다: ${response.status} - ${errorMessage}`);
        }

        const result: ApiResponse<PageResponse<PostResponse>> = await response.json();
        console.log('✅ 검색 결과:', {
            success: result.success,
            totalResults: result.data?.totalElements || 0,
            resultsCount: result.data?.content?.length || 0
        });

        if (!result.success || !result.data) {
            throw new Error(result.message || "게시글 검색에 실패했습니다");
        }

        return {
            success: true,
            data: result.data.content || []
        };

    } catch (error) {
        console.error('❌ 게시글 검색 오류:', error);
        return {
            success: false,
            data: [],
            message: error instanceof Error ? error.message : "알 수 없는 오류"
        };
    }
}

/**
 * 🔥 좋아요 토글
 */
export async function toggleLike(
    postId: number,
    userId: number
): Promise<ApiResponse<{ isLiked: boolean; likesCount: number }>> {
    try {
        const validUserId = ensureValidUserId(userId, "좋아요 토글");

        const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({userId: validUserId})
        })

        if (!response.ok) {
            throw new Error(`좋아요 처리에 실패했습니다: ${response.status}`)
        }

        const result: ApiResponse<{ isLiked: boolean; likesCount: number }> = await response.json()

        if (!result.success || !result.data) {
            throw new Error(result.message || "좋아요 처리에 실패했습니다")
        }

        return result

    } catch (error) {
        console.error('❌ 좋아요 토글 오류:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "알 수 없는 오류"
        }
    }
}

/**
 * 🔥 북마크 토글 - 백엔드 PostBookmarkController에 맞춘 API
 */
export async function toggleBookmark(
    postId: number,
    userId: number
): Promise<ApiResponse<{ isBookmarked: boolean }>> {
    try {
        const validUserId = ensureValidUserId(userId, "북마크 토글");

        // 백엔드 PostBookmarkController API 호출
        const response = await fetch(`${API_BASE_URL}/bookmarks/toggle`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                postId: postId,
                userId: validUserId
            })
        })

        if (!response.ok) {
            throw new Error(`북마크 처리에 실패했습니다: ${response.status}`)
        }

        const result: ApiResponse<{ isBookmarked: boolean }> = await response.json()

        if (!result.success || !result.data) {
            throw new Error(result.message || "북마크 처리에 실패했습니다")
        }

        return result

    } catch (error) {
        console.error('❌ 북마크 토글 오류:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "알 수 없는 오류"
        }
    }
}

/**
 * 🔥 댓글 추가 - 백엔드 CommentController 기본 API 사용 (재수정)
 */
export async function addComment(
    postId: number,
    userId: number,
    content: string
): Promise<ApiResponse<CommentResponse>> {
    try {
        const validUserId = ensureValidUserId(userId, "댓글 추가");

        console.log('🎯 댓글 추가 API 호출:', {
            postId,
            authorId: validUserId,
            content: content.trim(),
            url: `${API_BASE_URL}/posts/${postId}/comments?authorId=${validUserId}`
        });

        // 🔥 백엔드 CommentController 기본 API 사용
        // POST /api/posts/{postId}/comments?authorId={userId}
        // Body: { content: string, userId: number }
        const requestBody = {
            content: content.trim(),
            userId: validUserId  // CreateCommentRequest의 userId 필드
        };

        console.log('📤 요청 본문:', requestBody);

        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments?authorId=${validUserId}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        console.log('📥 댓글 추가 응답:', response.status, response.statusText);

        if (!response.ok) {
            // 에러 응답 내용을 확인
            let errorMessage = '';
            try {
                const errorText = await response.text();
                console.error('❌ 댓글 추가 에러 응답:', errorText);

                // JSON 형태의 에러 응답인지 확인
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorText;
                } catch {
                    errorMessage = errorText;
                }
            } catch (e) {
                console.error('❌ 에러 응답 파싱 실패:', e);
                errorMessage = '알 수 없는 오류가 발생했습니다';
            }

            // 상태 코드별 구체적인 에러 메시지
            if (response.status === 400) {
                throw new Error(`잘못된 요청입니다: ${errorMessage}`);
            } else if (response.status === 401) {
                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            } else if (response.status === 403) {
                throw new Error('댓글 작성 권한이 없습니다.');
            } else if (response.status === 404) {
                throw new Error('게시글을 찾을 수 없습니다.');
            } else if (response.status === 500) {
                throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } else {
                throw new Error(`댓글 추가에 실패했습니다: ${response.status} - ${errorMessage}`);
            }
        }

        const result: ApiResponse<CommentResponse> = await response.json();
        console.log('✅ 댓글 추가 성공:', result);

        if (!result.success) {
            throw new Error(result.message || "댓글 추가에 실패했습니다");
        }

        return result;

    } catch (error) {
        console.error('❌ 댓글 추가 오류:', error);

        // 에러 타입별 재포장
        if (error instanceof Error) {
            return {
                success: false,
                message: error.message
            };
        } else {
            return {
                success: false,
                message: "알 수 없는 오류가 발생했습니다"
            };
        }
    }
}

/**
 * 🔥 댓글 조회 - 백엔드 CommentController 기본 API 사용 (재수정)
 */
export async function getComments(
    postId: number,
    currentUserId: number | null = null,
    page: number = 0,
    size: number = 20
): Promise<ApiResponse<CommentResponse[]>> {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        if (currentUserId) {
            params.append('currentUserId', currentUserId.toString());
        }

        console.log('🔍 댓글 조회 API 호출:', {
            postId,
            currentUserId,
            url: `${API_BASE_URL}/posts/${postId}/comments?${params}`
        });

        // 🔥 백엔드 CommentController 기본 API 사용
        // GET /api/posts/{postId}/comments?currentUserId={userId}&page={page}&size={size}
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments?${params}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        console.log('📥 댓글 조회 응답:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`댓글 조회에 실패했습니다: ${response.status}`)
        }

        const result: ApiResponse<PageResponse<CommentResponse>> = await response.json()
        console.log('✅ 댓글 조회 성공:', {
            success: result.success,
            totalComments: result.data?.totalElements || 0,
            commentsCount: result.data?.content?.length || 0
        });

        if (!result.success || !result.data) {
            throw new Error(result.message || "댓글 조회에 실패했습니다")
        }

        return {
            success: true,
            data: result.data.content || []
        }

    } catch (error) {
        console.error('❌ 댓글 조회 오류:', error);
        return {
            success: false,
            data: [],
            message: error instanceof Error ? error.message : '댓글 조회에 실패했습니다.'
        }
    }
}

/**
 * 🔥 팔로우 토글 - 백엔드 FollowController에 맞춘 Query Parameter 방식
 */
export async function toggleFollow(
    userId: number,
    targetUserId: number
): Promise<ApiResponse<{ success: boolean; following: boolean; followersCount: number; followingCount: number }>> {
    try {
        const validUserId = ensureValidUserId(userId, "팔로우 토글");
        const validTargetUserId = ensureValidUserId(targetUserId, "팔로우 대상");

        console.log('🎯 팔로우 토글 API 호출:', {
            followerId: validUserId,
            followingId: validTargetUserId
        });

        // 🔥 백엔드 Controller의 Query Parameter 방식에 맞춘 API 호출
        const url = new URL(`${API_BASE_URL}/follows/toggle`)
        url.searchParams.append('followerId', validUserId.toString())
        url.searchParams.append('followingId', validTargetUserId.toString())

        console.log('📡 API 호출 URL:', url.toString())

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 팔로우 API 에러 응답:', errorText);
            throw new Error(`팔로우 처리에 실패했습니다: ${response.status} - ${errorText}`)
        }

        const result = await response.json()
        console.log('✅ 팔로우 토글 성공:', result);

        return {
            success: true,
            data: result.data || {
                success: result.success,
                following: result.data?.following || false,
                followersCount: result.data?.followersCount || 0,
                followingCount: result.data?.followingCount || 0
            }
        }

    } catch (error) {
        console.error('❌ 팔로우 토글 에러:', error);
        return {
            success: false,
            data: {success: false, following: false, followersCount: 0, followingCount: 0},
            message: error instanceof Error ? error.message : "알 수 없는 오류"
        }
    }
}

/**
 * 🔥 팔로우 상태 확인
 */
export async function checkFollowStatus(
    userId: number,
    targetUserId: number
): Promise<ApiResponse<{ isFollowing: boolean }>> {
    try {
        const validUserId = ensureValidUserId(userId, "팔로우 상태 확인");
        const validTargetUserId = ensureValidUserId(targetUserId, "팔로우 상태 확인 대상");

        const response = await fetch(`${API_BASE_URL}/follows/status?followerId=${validUserId}&followingId=${validTargetUserId}`, {
            method: "GET",
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error(`팔로우 상태 확인에 실패했습니다: ${response.status}`)
        }

        const result = await response.json()

        return {
            success: true,
            data: {isFollowing: result.data || false}
        }
    } catch (error) {
        console.warn(`⚠️ 팔로우 상태 확인 실패 (userId: ${userId}, targetUserId: ${targetUserId}):`, error);
        return {
            success: false,
            data: {isFollowing: false},
            message: error instanceof Error ? error.message : "알 수 없는 오류"
        }
    }
}

/**
 * 🔥 팔로잉 목록 조회 - 백엔드 FollowController API 사용
 */
export async function getFollowingList(
    userId: number,
    currentUserId: number | null = null,
    page: number = 0,
    size: number = 20
): Promise<ApiResponse<any[]>> {
    try {
        const validUserId = ensureValidUserId(userId, "팔로잉 목록 조회");

        const params = new URLSearchParams({
            userId: validUserId.toString(),
            page: page.toString(),
            size: size.toString()
        });

        if (currentUserId) {
            params.append('currentUserId', currentUserId.toString());
        }

        console.log('🔍 팔로잉 목록 API 호출:', `${API_BASE_URL}/follows/following?${params}`);

        const response = await fetch(`${API_BASE_URL}/follows/following?${params}`, {
            method: "GET",
            headers: getAuthHeaders()
        })

        console.log('📥 팔로잉 목록 응답:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`팔로잉 목록 조회에 실패했습니다: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ 팔로잉 목록 데이터:', result);

        return {
            success: result.success || true,
            data: result.data?.content || result.data || []
        }

    } catch (error) {
        console.error('❌ 팔로잉 목록 조회 오류:', error);
        return {
            success: false,
            data: [],
            message: error instanceof Error ? error.message : "알 수 없는 오류"
        }
    }
}

/**
 * 🔥 게시글 생성 - 임시저장 특화 개선
 */
export async function createPost(postData: CreatePostData, authorId: number): Promise<PostResponse> {
    try {
        const validAuthorId = ensureValidUserId(authorId, "게시글 생성");

        console.log('🔄 게시글 생성 요청:', {
            authorId: validAuthorId,
            data: postData,
            url: `${API_BASE_URL}/posts?authorId=${validAuthorId}`
        });

        // 🔥 임시저장 시 빈 내용도 허용하도록 데이터 검증 완화
        const requestData: CreatePostData = {
            content: postData.content || "", // 빈 문자열 허용
            imageUrl: postData.imageUrl || null,
            jobCategory: postData.jobCategory || null,
            topicCategory: postData.topicCategory || null,
            status: postData.status || "PUBLISHED",
            hashtags: postData.hashtags || []
        };

        // 🔥 발행하는 경우에만 내용 필수 체크
        if (requestData.status === "PUBLISHED" && !requestData.content.trim()) {
            throw new Error('발행하려면 내용을 입력해주세요.');
        }

        console.log('📤 실제 전송 데이터:', requestData);

        const response = await fetch(`${API_BASE_URL}/posts?authorId=${validAuthorId}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(requestData)
        });

        console.log('🔍 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
            // 🔥 더 상세한 에러 정보 수집
            let errorDetails = '';
            try {
                const errorText = await response.text();
                console.error('❌ 서버 에러 응답:', errorText);

                // JSON 형태의 에러 응답인지 확인
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetails = errorJson.message || errorText;
                } catch {
                    errorDetails = errorText;
                }
            } catch (e) {
                console.error('❌ 에러 응답 파싱 실패:', e);
                errorDetails = '알 수 없는 서버 오류';
            }

            // 🔥 상태 코드별 구체적인 에러 메시지
            if (response.status === 400) {
                throw new Error(`잘못된 요청입니다. 입력 데이터를 확인해주세요. (${errorDetails})`);
            } else if (response.status === 401) {
                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            } else if (response.status === 403) {
                throw new Error('게시글 작성 권한이 없습니다.');
            } else if (response.status === 404) {
                throw new Error('사용자 정보를 찾을 수 없습니다.');
            } else if (response.status === 500) {
                throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } else {
                throw new Error(`게시글 생성에 실패했습니다: ${response.status} - ${errorDetails}`);
            }
        }

        const result: ApiResponse<PostResponse> = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.message || "게시글 생성에 실패했습니다");
        }

        console.log('✅ 게시글 생성 성공:', result.data);
        return result.data;

    } catch (error) {
        console.error('❌ 게시글 생성 에러:', error);
        throw error;
    }
}


/**
 * 🔥 게시글 수정 - 임시저장 특화 개선
 */
export async function updatePost(
    postId: number,
    authorId: number,
    postData: CreatePostData
): Promise<PostResponse> {
    try {
        const validAuthorId = ensureValidUserId(authorId, "게시글 수정");

        console.log('🔄 게시글 수정 요청:', {
            postId,
            authorId: validAuthorId,
            data: postData,
            url: `${API_BASE_URL}/posts/${postId}?authorId=${validAuthorId}`
        });

        // 🔥 임시저장 시 빈 내용도 허용하도록 데이터 검증 완화
        const requestData: CreatePostData = {
            content: postData.content || "", // 빈 문자열 허용
            imageUrl: postData.imageUrl || null,
            jobCategory: postData.jobCategory || null,
            topicCategory: postData.topicCategory || null,
            status: postData.status || "PUBLISHED",
            hashtags: postData.hashtags || []
        };

        // 🔥 발행하는 경우에만 내용 필수 체크
        if (requestData.status === "PUBLISHED" && !requestData.content.trim()) {
            throw new Error('발행하려면 내용을 입력해주세요.');
        }

        console.log('📤 실제 전송 데이터:', requestData);

        const response = await fetch(`${API_BASE_URL}/posts/${postId}?authorId=${validAuthorId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(requestData)
        });

        console.log('🔍 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
            // 🔥 더 상세한 에러 정보 수집
            let errorDetails = '';
            try {
                const errorText = await response.text();
                console.error('❌ 서버 에러 응답:', errorText);

                // JSON 형태의 에러 응답인지 확인
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetails = errorJson.message || errorText;
                } catch {
                    errorDetails = errorText;
                }
            } catch (e) {
                console.error('❌ 에러 응답 파싱 실패:', e);
                errorDetails = '알 수 없는 서버 오류';
            }

            // 🔥 상태 코드별 구체적인 에러 메시지
            if (response.status === 400) {
                throw new Error(`잘못된 요청입니다. 입력 데이터를 확인해주세요. (${errorDetails})`);
            } else if (response.status === 401) {
                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            } else if (response.status === 403) {
                throw new Error('게시글 수정 권한이 없습니다.');
            } else if (response.status === 404) {
                throw new Error('게시글을 찾을 수 없습니다.');
            } else if (response.status === 500) {
                throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } else {
                throw new Error(`게시글 수정에 실패했습니다: ${response.status} - ${errorDetails}`);
            }
        }

        const result: ApiResponse<PostResponse> = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.message || "게시글 수정에 실패했습니다");
        }

        console.log('✅ 게시글 수정 성공:', result.data);
        return result.data;

    } catch (error) {
        console.error('❌ 게시글 수정 에러:', error);
        throw error;
    }
}

/**
 * 🔥 게시글 삭제
 */
export async function deletePost(postId: number, authorId: number): Promise<void> {
    try {
        const validAuthorId = ensureValidUserId(authorId, "게시글 삭제");

        const response = await fetch(`${API_BASE_URL}/posts/${postId}?authorId=${validAuthorId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            const errorData = await response.text()
            throw new Error(`게시글 삭제에 실패했습니다: ${response.status}`)
        }

    } catch (error) {
        console.error('❌ 게시글 삭제 에러:', error);
        throw error
    }
}

/**
 * 🔥 사용자의 발행된 게시글 조회
 */
export async function getUserDraftPosts(
    userId: number,
    currentUserId: number | null = null,
    page: number = 0,
    size: number = 10
): Promise<PostResponse[]> {
    try {
        const validUserId = ensureValidUserId(userId, "임시저장 게시글 조회");

        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        if (currentUserId) {
            params.append('currentUserId', currentUserId.toString());
        }

        const url = `${API_BASE_URL}/posts/user/${validUserId}/drafts?${params}`;
        console.log('🔍 임시저장 게시글 조회 요청:', url);

        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders()
        });

        console.log('🔍 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
            // 🔥 더 상세한 에러 정보 수집
            let errorDetails = '';
            try {
                const errorText = await response.text();
                console.error('❌ 서버 에러 응답:', errorText);

                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetails = errorJson.message || errorText;
                } catch {
                    errorDetails = errorText;
                }
            } catch (e) {
                console.error('❌ 에러 응답 파싱 실패:', e);
                errorDetails = '알 수 없는 서버 오류';
            }

            if (response.status === 401) {
                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            } else if (response.status === 403) {
                throw new Error('임시저장 게시글 조회 권한이 없습니다.');
            } else if (response.status === 404) {
                throw new Error('사용자를 찾을 수 없습니다.');
            } else {
                throw new Error(`임시저장 게시글 조회에 실패했습니다: ${response.status} - ${errorDetails}`);
            }
        }

        const result: ApiResponse<PageResponse<PostResponse>> = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.message || "임시저장 게시글 조회에 실패했습니다");
        }

        console.log('✅ 임시저장 게시글 조회 성공:', {
            userId: validUserId,
            totalDrafts: result.data.totalElements,
            currentPageDrafts: result.data.content.length
        });

        return result.data.content;

    } catch (error) {
        console.error('❌ 임시저장 게시글 조회 에러:', error);
        throw error;
    }
}

/**
 * 🔥 사용자의 발행된 게시글 조회
 */
export async function getUserPublishedPosts(
    userId: number,
    currentUserId: number | null = null,
    page: number = 0,
    size: number = 10
): Promise<PostResponse[]> {
    try {
        const validUserId = ensureValidUserId(userId, "발행된 게시글 조회");

        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        if (currentUserId) {
            params.append('currentUserId', currentUserId.toString());
        }

        const url = `${API_BASE_URL}/posts/user/${validUserId}/published?${params}`;
        console.log('🔍 발행된 게시글 조회 요청:', url);

        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders()
        });

        console.log('🔍 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
            // 🔥 더 상세한 에러 정보 수집
            let errorDetails = '';
            try {
                const errorText = await response.text();
                console.error('❌ 서버 에러 응답:', errorText);

                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetails = errorJson.message || errorText;
                } catch {
                    errorDetails = errorText;
                }
            } catch (e) {
                console.error('❌ 에러 응답 파싱 실패:', e);
                errorDetails = '알 수 없는 서버 오류';
            }

            if (response.status === 401) {
                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            } else if (response.status === 403) {
                throw new Error('발행된 게시글 조회 권한이 없습니다.');
            } else if (response.status === 404) {
                throw new Error('사용자를 찾을 수 없습니다.');
            } else {
                throw new Error(`발행된 게시글 조회에 실패했습니다: ${response.status} - ${errorDetails}`);
            }
        }

        const result: ApiResponse<PageResponse<PostResponse>> = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.message || "발행된 게시글 조회에 실패했습니다");
        }

        console.log('✅ 발행된 게시글 조회 성공:', {
            userId: validUserId,
            totalPublished: result.data.totalElements,
            currentPagePublished: result.data.content.length
        });

        return result.data.content;

    } catch (error) {
        console.error('❌ 발행된 게시글 조회 에러:', error);
        throw error;
    }
}

/**
 * 🔥 사용자가 북마크한 게시글 조회 - 백엔드 PostService에 맞춘 API
 */
export async function getUserBookmarkedPosts(
    userId: number,
    page: number = 0,
    size: number = 20
): Promise<PostResponse[]> {
    try {
        const validUserId = ensureValidUserId(userId, "북마크한 게시글 조회");

        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });

        // 백엔드 PostService.getBookmarkedPosts에 맞춘 경로
        const response = await fetch(`${API_BASE_URL}/posts/bookmarked/${validUserId}?${params}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`북마크한 게시글 조회에 실패했습니다: ${response.status}`);
        }

        const result: ApiResponse<PageResponse<PostResponse>> = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.message || "북마크한 게시글 조회에 실패했습니다");
        }

        return result.data.content || [];

    } catch (error) {
        console.error('❌ 북마크한 게시글 조회 에러:', error);
        throw error;
    }
}

/**
 * 🔥 사용자가 작성한 댓글 목록 조회 - 백엔드 CommentController에 맞춘 API
 */
export async function getUserComments(
    userId: number,
    currentUserId: number | null = null,
    page: number = 0,
    size: number = 20
): Promise<ApiResponse<CommentResponse[]>> {
    try {
        const validUserId = ensureValidUserId(userId, "사용자 댓글 조회");

        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        if (currentUserId) {
            params.append('currentUserId', currentUserId.toString());
        }

        // 백엔드 UserCommentController API 호출 (/api/users/{userId}/comments)
        const response = await fetch(`${API_BASE_URL}/users/${validUserId}/comments?${params}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`사용자 댓글 조회에 실패했습니다: ${response.status}`);
        }

        const result: ApiResponse<PageResponse<CommentResponse>> = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.message || "사용자 댓글 조회에 실패했습니다");
        }

        return {
            success: true,
            data: result.data.content || []
        };

    } catch (error) {
        console.error('❌ 사용자 댓글 조회 오류:', error);
        return {
            success: false,
            data: [],
            message: error instanceof Error ? error.message : "알 수 없는 오류"
        };
    }
}

/**
 * 🔥 댓글 삭제 - 백엔드 CommentController에 맞춘 API (수정됨)
 */
export async function deleteComment(
    postId: number,
    commentId: number,
    authorId: number
): Promise<ApiResponse<void>> {
    try {
        const validAuthorId = ensureValidUserId(authorId, "댓글 삭제");

        console.log('🗑️ 댓글 삭제 API 호출:', {
            postId,
            commentId,
            authorId: validAuthorId,
            url: `${API_BASE_URL}/posts/${postId}/comments/${commentId}?authorId=${validAuthorId}`
        });

        // 🔥 백엔드 CommentController의 deleteComment 엔드포인트 호출
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}?authorId=${validAuthorId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        console.log('🔍 댓글 삭제 응답:', response.status, response.statusText);

        if (!response.ok) {
            // 에러 응답 내용을 확인
            let errorMessage = '';
            try {
                const errorText = await response.text();
                console.error('❌ 댓글 삭제 에러 응답:', errorText);

                // 🔥 JSON 형태의 에러 응답인지 확인
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorText;
                } catch {
                    errorMessage = errorText;
                }
            } catch (e) {
                console.error('❌ 에러 응답 파싱 실패:', e);
                errorMessage = '알 수 없는 오류가 발생했습니다';
            }

            // 🔥 상태 코드별 구체적인 에러 메시지
            if (response.status === 400) {
                throw new Error('잘못된 요청입니다. 댓글 정보를 확인해주세요.');
            } else if (response.status === 401) {
                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            } else if (response.status === 403) {
                throw new Error('본인이 작성한 댓글만 삭제할 수 있습니다.');
            } else if (response.status === 404) {
                throw new Error('댓글을 찾을 수 없습니다.');
            } else if (response.status === 500) {
                throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } else {
                throw new Error(`댓글 삭제에 실패했습니다: ${errorMessage}`);
            }
        }

        const result: ApiResponse<void> = await response.json();
        console.log('✅ 댓글 삭제 성공:', result);

        if (!result.success) {
            throw new Error(result.message || "댓글 삭제에 실패했습니다");
        }

        return result;

    } catch (error) {
        console.error('❌ 댓글 삭제 오류:', error);

        // 🔥 에러 타입별 재포장
        if (error instanceof Error) {
            return {
                success: false,
                message: error.message
            };
        } else {
            return {
                success: false,
                message: "알 수 없는 오류가 발생했습니다"
            };
        }
    }
}
