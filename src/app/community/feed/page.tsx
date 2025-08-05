"use client"

//import SideLayout from "../sidebar/SideLayout"
import CommunityLayout from "@/components/layouts/CommunityLayout"
import {useState, useEffect, useRef, useCallback} from "react"
import {useRouter} from "next/navigation";
import Image from "next/image"
import {UpwardMenu} from "../components/upward-menu";
// 🔥 수정 1: 타입 추가 import
import {
    getPosts, getFollowingPosts, getPostsByCategory, searchPosts, toggleLike, toggleBookmark, addComment, getComments,
    deleteComment, toggleFollow, checkFollowStatus, type PostResponse, type CommentResponse, type ApiResponse
} from "@/lib/post-api"
import {getCurrentUserId} from "@/utils/auth"
import {getFullImageUrl} from "@/utils/imageUtils"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Badge} from "@/components/ui/badge"
import {Textarea} from "@/components/ui/textarea"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog"
import {
    Search, Users, Globe, Briefcase, Palette, Code, TrendingUp, Phone,
    Coffee, Lightbulb, GraduationCap, Target, Heart, MessageCircle,
    Bookmark, Rss, FilterX, BookOpen, ClipboardList, Package,
    Building, Star, Brain, UserPlus, UserCheck, Send, type LucideIcon
} from "lucide-react"
import {Carousel, AdaptedPostCard} from "../components/carousel/carousel-components"
import {CategoryDropdown} from "../components/category-dropdown"
import '../components/carousel/carousel.css'
import {motion} from "framer-motion";
import {useCommunityProfile} from "@/hooks/useCommunityProfile";

export interface Category {
    icon: LucideIcon
    label: string
    key: string
    color: string
    type: "job" | "topic"
}

export interface Comment {
    id: number | string
    author: {
        id: number          // CommunityProfile ID
        userId: number      // 🔥 User ID로 수정 (권한 체크용)
        name: string;
        avatar: string;
        title?: string
    }
    content: string
    timeAgo: string
}

export interface Post {
    id: number
    author: { id: number; name: string; avatar: string; title: string; isFollowing?: boolean }
    content: string
    imageUrl?: string
    hashtags: string[]
    likes: number
    comments: number
    timeAgo: string
    jobCategory?: string
    topicCategory?: string
    likedByMe?: boolean
    bookmarkedByMe?: boolean
    commentsList?: Comment[]
}

const jobCategoriesList: Category[] = [
    {icon: Briefcase, label: "경영/기획/전략", key: "management", color: "#3498db", type: "job"},
    {icon: Palette, label: "디자인/컨텐츠", key: "design", color: "#e74c3c", type: "job"},
    {icon: Code, label: "개발/IT", key: "dev", color: "#356ae4", type: "job"},
    {icon: TrendingUp, label: "마케팅/브랜딩", key: "marketing", color: "#f39c12", type: "job"},
    {icon: Phone, label: "영업/고객관리", key: "sales", color: "#27ae60", type: "job"},
    {icon: BookOpen, label: "교육/강의/연구", key: "education", color: "#9b59b6", type: "job"},
    {icon: ClipboardList, label: "운영/사무관리", key: "operations", color: "#34495e", type: "job"},
    {icon: Package, label: "생산/물류/품질관리", key: "logistics", color: "#795548", type: "job"},
    {icon: Building, label: "사회/공공기관", key: "public", color: "#607d8b", type: "job"},
    {icon: Star, label: "특수직", key: "special", color: "#ff5722", type: "job"},
]

const topicCategoriesList: Category[] = [
    {icon: Coffee, label: "일상공유", key: "daily", color: "#8B4513", type: "topic"},
    {icon: Lightbulb, label: "업무관련팁", key: "tips", color: "#FFCC00", type: "topic"},
    {icon: GraduationCap, label: "커리어조언", key: "career", color: "#4B0082", type: "topic"},
    {icon: Target, label: "취업준비", key: "job-prep", color: "#DC143C", type: "topic"},
    {icon: Brain, label: "자기계발", key: "self-dev", color: "#1abc9c", type: "topic"},
]

const allCategories = [...jobCategoriesList, ...topicCategoriesList]

// 🔥 수정 2: PostResponse를 Post로 변환하는 함수 추가
const convertPostResponseToPost = (postResponse: PostResponse): Post => {
    return {
        id: postResponse.id,
        author: {
            id: postResponse.author.id,
            name: postResponse.author.name,
            avatar: postResponse.author.avatar || "/placeholder_person.svg",
            title: postResponse.author.jobTitle || "없음",
            isFollowing: postResponse.author.isFollowing || false
        },
        content: postResponse.content,
        imageUrl: postResponse.imageUrl,
        hashtags: postResponse.hashtags,
        likes: postResponse.likesCount,
        comments: postResponse.commentsCount,
        timeAgo: postResponse.timeAgo,
        jobCategory: postResponse.jobCategory,
        topicCategory: postResponse.topicCategory,
        likedByMe: postResponse.likedByMe,
        bookmarkedByMe: postResponse.bookmarkedByMe,
        commentsList: [] // 기본값, 상세보기에서 별도 로딩
    }
}

export default function FeedPage() {
    const [currentPostIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
    const [posts, setPosts] = useState<Post[]>([])
    const [detailedPost, setDetailedPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)
    const [feedMode, setFeedMode] = useState<"all" | "following">("all")
    const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null)
    const [newComment, setNewComment] = useState("")
    const [visibleComments, setVisibleComments] = useState(5)
    const [activeTab, setActiveTab] = useState<"post" | "comments">("post")
    const contentRef = useRef<HTMLDivElement>(null)
    const {profile: myProfile} = useCommunityProfile();
    const handleOpenPostDetail = async (post: Post) => {
        console.log('🎯 게시글 상세보기 열기:', post.id);
        setDetailedPost(post);

        // 🔥 댓글 로딩 후 detailedPost 업데이트
        const comments = await loadCommentsForPost(post);

        // detailedPost에도 댓글 추가
        setDetailedPost(prev => prev ? {
            ...prev,
            commentsList: comments,
            comments: comments.length
        } : null);
    };

    const handleOpenPostComments = async (post: Post) => {
        console.log('🎯 댓글 탭 직접 열기:', post.id);
        setDetailedPost(post);
        setActiveTab("comments");
        setVisibleComments(5);

        // 🔥 댓글 로딩 후 detailedPost 업데이트
        const comments = await loadCommentsForPost(post);

        // detailedPost에도 댓글 추가
        setDetailedPost(prev => prev ? {
            ...prev,
            commentsList: comments,
            comments: comments.length
        } : null);
    };

    // 🔥 임시 수정: 댓글 로딩 문제 디버깅을 위한 간단한 버전
    const loadCommentsForPost = async (post: Post) => {
        try {
            console.log('🔍 댓글 로딩 시작:', post.id);
            console.log('🔍 현재 사용자 ID:', userId);

            const response = await getComments(post.id, userId);
            console.log('🔍 댓글 API 응답:', response);

            if (response.success && response.data && Array.isArray(response.data)) {
                console.log('🔍 댓글 데이터 개수:', response.data.length);

                const comments: Comment[] = response.data.map((commentResponse: CommentResponse, index: number) => {
                    console.log(`🔍 댓글 ${index + 1}:`, commentResponse);

                    return {
                        id: commentResponse.id,
                        author: {
                            id: commentResponse.author.id,
                            userId: commentResponse.author.userId,
                            name: commentResponse.author.name,
                            avatar: commentResponse.author.avatar || "/placeholder_person.svg",
                            title: commentResponse.author.title || "사용자"
                        },
                        content: commentResponse.content,
                        timeAgo: commentResponse.timeAgo
                    };
                });

                console.log('✅ 변환된 댓글 목록:', comments);

                // 🔥 게시글 목록에서 해당 게시글의 댓글 업데이트
                const updatedPosts = posts.map(p =>
                    p.id === post.id
                        ? {...p, commentsList: comments, comments: comments.length}
                        : p
                );
                setPosts(updatedPosts);

                console.log('✅ 댓글 로딩 완료:', comments.length + '개');
                return comments;
            } else {
                console.log('⚠️ 댓글 응답 문제:', {
                    success: response.success,
                    hasData: !!response.data,
                    isArray: Array.isArray(response.data),
                    dataLength: response.data?.length
                });

                // 댓글이 없는 경우도 빈 배열로 설정
                const updatedPosts = posts.map(p =>
                    p.id === post.id
                        ? {...p, commentsList: [], comments: 0}
                        : p
                );
                setPosts(updatedPosts);

                return [];
            }
        } catch (error) {
            console.error('❌ 댓글 로딩 실패:', error);
            console.error('❌ 에러 상세:', {
                message: error instanceof Error ? error.message : '알 수 없는 오류',
                type: typeof error,
                stack: error instanceof Error ? error.stack : undefined
            });

            // 에러 발생시에도 빈 배열로 설정
            const updatedPosts = posts.map(p =>
                p.id === post.id
                    ? {...p, commentsList: [], comments: 0}
                    : p
            );
            setPosts(updatedPosts);

            return [];
        }
    };

    const userId = getCurrentUserId();
    const router = useRouter()

    // 검색어 debounce 처리 - 리렌더링 최적화
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 800);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // 🔥 수정 3: useEffect 중복 제거 및 완전 수정
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!isMounted) return;

            //setLoading(true); // 🔥 로딩 상태 설정

            let fetchFunction: () => Promise<ApiResponse<PostResponse[]>>;

            // 🔥 사용자 ID 로그 추가
            console.log('🔍 현재 사용자 ID:', userId);

            if (feedMode === "following") {
                // 🔥 팔로우 모드일 때 사용자 ID 필수 체크
                if (!userId) {
                    console.warn('⚠️ 팔로우 피드 요청했지만 사용자 ID가 없습니다.');
                    setPosts([]);
                    setLoading(false);
                    return;
                }

                console.log('🎯 팔로잉 사용자 게시글 요청:', userId);

                // 검색어가 있으면 팔로우한 사용자 게시글 중에서 검색
                if (debouncedSearchQuery.trim()) {
                    console.log('🔍 팔로우 + 검색:', debouncedSearchQuery);
                    fetchFunction = async () => {
                        // 먼저 팔로우한 사용자들의 게시글을 가져온 후 클라이언트에서 필터링
                        const followingRes = await getFollowingPosts(userId);
                        if (followingRes.success && followingRes.data) {
                            const filtered = followingRes.data.filter(post =>
                                post.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                                post.hashtags.some(tag => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
                            );
                            return {...followingRes, data: filtered};
                        }
                        return followingRes;
                    };
                } else {
                    fetchFunction = () => getFollowingPosts(userId);
                }
            } else if (selectedCategoryKey) {
                console.log('🏷️ 카테고리별 게시글 요청:', selectedCategoryKey);
                fetchFunction = () => getPostsByCategory(selectedCategoryKey, userId);
            } else if (debouncedSearchQuery.trim()) {
                console.log('🔍 검색 요청:', {
                    query: debouncedSearchQuery,
                    userId: userId
                });
                fetchFunction = async () => {
                    // 🔥 1단계: 백엔드 검색 API 먼저 시도
                    console.log('🔄 1단계: 백엔드 검색 시도...');
                    const searchResult = await searchPosts(debouncedSearchQuery, userId);

                    if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
                        console.log('✅ 백엔드 검색 성공:', searchResult.data.length + '개');
                        return searchResult;
                    }

                    // 🔥 2단계: 백엔드 검색 결과가 부족하면 전체 게시글에서 클라이언트 필터링
                    console.log('🔄 2단계: 클라이언트 필터링 시도...');
                    const allPostsResult = await getPosts(userId);

                    if (allPostsResult.success && allPostsResult.data) {
                        const searchTerm = debouncedSearchQuery.toLowerCase().trim();
                        const filteredPosts = allPostsResult.data.filter(post => {
                            // 게시글 내용 검색
                            const contentMatch = post.content.toLowerCase().includes(searchTerm);

                            // 해시태그 검색 (# 제거하고 검색)
                            const hashtagMatch = post.hashtags.some(tag =>
                                tag.toLowerCase().replace('#', '').includes(searchTerm.replace('#', ''))
                            );

                            // 작성자 이름 검색
                            const authorMatch = post.author.name.toLowerCase().includes(searchTerm);

                            // 작성자 직책 검색
                            const jobTitleMatch = post.author.jobTitle?.toLowerCase().includes(searchTerm);

                            const isMatch = contentMatch || hashtagMatch || authorMatch || jobTitleMatch;

                            if (isMatch) {
                                console.log(`✅ 매칭된 게시글 ${post.id}:`, {
                                    content: contentMatch ? '내용 매칭' : '',
                                    hashtag: hashtagMatch ? '해시태그 매칭' : '',
                                    author: authorMatch ? '작성자 매칭' : '',
                                    jobTitle: jobTitleMatch ? '직책 매칭' : ''
                                });
                            }

                            return isMatch;
                        });

                        console.log('✅ 클라이언트 필터링 결과:', filteredPosts.length + '개');

                        // 백엔드 결과와 클라이언트 필터링 결과 합치기 (중복 제거)
                        const backendIds = new Set((searchResult.data || []).map(p => p.id));
                        const additionalPosts = filteredPosts.filter(p => !backendIds.has(p.id));
                        const combinedPosts = [...(searchResult.data || []), ...additionalPosts];

                        console.log('🎯 최종 검색 결과:', {
                            백엔드: searchResult.data?.length || 0,
                            클라이언트추가: additionalPosts.length,
                            최종: combinedPosts.length
                        });

                        return {
                            success: true,
                            data: combinedPosts
                        };
                    }

                    return searchResult; // 실패 시 원본 결과 반환
                };
            } else {
                console.log('📋 전체 게시글 요청, userId:', userId);
                fetchFunction = () => getPosts(userId);
            }

            try {
                console.log('🔍 데이터 가져오기 시작...', {feedMode, userId, selectedCategoryKey, debouncedSearchQuery});
                const res = await fetchFunction();

                if (isMounted && res.success) {
                    // 🔥 데이터가 있는지 확인
                    const posts = res.data || [];
                    console.log('✅ 데이터 가져오기 성공:', {
                        mode: feedMode,
                        postsCount: posts.length,
                        userId: userId,
                        query: debouncedSearchQuery
                    });

                    // 🔥 PostResponse를 Post로 변환
                    const convertedPosts = posts.map(convertPostResponseToPost);
                    setPosts(convertedPosts);

                    // 팔로우 상태 초기화
                    if (userId && convertedPosts.length > 0) {
                        await initializeFollowStates(convertedPosts);
                    }

                    // 🔥 검색 결과가 없을 때 로그
                    if (debouncedSearchQuery.trim() && posts.length === 0) {
                        console.log('ℹ️ 검색 결과가 없습니다:', debouncedSearchQuery);
                    }

                    // 🔥 팔로우 모드에서 결과가 없을 때 로그
                    if (feedMode === "following" && posts.length === 0) {
                        console.log('ℹ️ 팔로잉 사용자의 게시글이 없습니다.');
                    }
                } else {
                    // 🔥 데이터가 없거나 실패한 경우
                    console.log('⚠️ 데이터 가져오기 실패 또는 빈 결과:', {
                        success: res.success,
                        message: res.message,
                        dataLength: res.data?.length || 0
                    });

                    if (isMounted) {
                        setPosts([]);
                    }
                }
            } catch (err: any) {
                console.error("❌ 게시글 로딩 오류:", err);

                if (isMounted) {
                    setPosts([]);

                    // 개발 환경에서만 상세 에러 메시지 표시
                    if (process.env.NODE_ENV === 'development') {
                        console.log('⚠️ 백엔드 서버 연결 실패. 빈 피드를 표시합니다.');
                        console.log('백엔드 서버(localhost:8080)가 실행 중인지 확인해주세요.');

                        // 에러 타입별 상세 정보
                        const errorMessage = err?.message || err?.toString() || '알 수 없는 오류';
                        console.log('에러 메시지:', errorMessage);

                        if (errorMessage.includes('Network Error') ||
                            errorMessage.includes('ECONNREFUSED') ||
                            errorMessage.includes('fetch') ||
                            errorMessage.includes('500')) {
                            console.log('💡 해결 방법:');
                            console.log('   1. 백엔드 서버를 먼저 실행해주세요');
                            console.log('   2. 서버가 8080 포트에서 실행 중인지 확인해주세요');
                            console.log('   3. 서버의 CORS 설정을 확인해주세요');
                            console.log('   4. 방화벽이나 보안 소프트웨어가 차단하지 않는지 확인해주세요');
                        }
                    }
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // 클린업 함수
        return () => {
            isMounted = false;
        };
    }, [feedMode, selectedCategoryKey, debouncedSearchQuery, userId]);

    // 🔥 수정 4: 팔로우 상태 초기화 함수 개선
    const initializeFollowStates = async (postList: Post[]) => {
        if (!userId || postList.length === 0) return;

        console.log('🔄 팔로우 상태 초기화 시작...');

        try {
            // 1. 고유한 작성자 ID 목록 추출 (중복 제거)
            const uniqueAuthorIds = Array.from(
                new Set(
                    postList
                        .map(post => post.author.id)
                        .filter(authorId => authorId !== userId) // 자기 자신 제외
                )
            );

            console.log(`📊 확인할 작성자 수: ${uniqueAuthorIds.length}명`);

            if (uniqueAuthorIds.length === 0) {
                console.log('✅ 확인할 팔로우 상태가 없습니다.');
                return;
            }

            // 2. 팔로우 상태를 저장할 맵 생성
            const followStatusMap = new Map<number, boolean>();

            // 3. 각 작성자의 팔로우 상태를 순차적으로 확인 (과부하 방지)
            for (const authorId of uniqueAuthorIds) {
                try {
                    console.log(`🔍 팔로우 상태 확인: 작성자 ID ${authorId}`);

                    // post-api.ts의 checkFollowStatus 함수 사용
                    const response = await checkFollowStatus(userId, authorId);

                    const isFollowing = response.data?.isFollowing || false;
                    followStatusMap.set(authorId, isFollowing);
                    console.log(`✅ 작성자 ID ${authorId}: ${isFollowing ? '팔로잉' : '팔로우 안함'}`);

                    // 4. 요청 간격 조절 (서버 과부하 방지)
                    if (uniqueAuthorIds.length > 5) {
                        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 대기
                    }

                } catch (error) {
                    console.warn(`❌ 작성자 ID ${authorId} 상태 확인 오류:`, error);
                    followStatusMap.set(authorId, false); // 오류 시 기본값
                }
            }

            // 5. 게시글 목록 업데이트 (한 번에 처리)
            const updatedPosts = postList.map(post => {
                if (post.author.id === userId) {
                    // 자기 자신은 팔로우 버튼 숨김
                    return {...post, author: {...post.author, isFollowing: false}};
                }

                const isFollowing = followStatusMap.get(post.author.id) || false;
                return {...post, author: {...post.author, isFollowing}};
            });

            // 6. 상태 업데이트
            setPosts(updatedPosts);
            console.log('✅ 팔로우 상태 초기화 완료');

        } catch (error) {
            console.error('❌ 팔로우 상태 초기화 실패:', error);
        }
    };

    // 🔥 수정 5: 페이지 포커스 시 팔로우 상태 새로고침 개선
    useEffect(() => {
        let focusTimeout: NodeJS.Timeout;

        const handlePageFocus = () => {
            // 디바운싱: 연속된 포커스 이벤트 방지
            clearTimeout(focusTimeout);
            focusTimeout = setTimeout(() => {
                if (userId && posts.length > 0) {
                    console.log('🔄 페이지 포커스 - 팔로우 상태 새로고침');
                    initializeFollowStates(posts);
                }
            }, 1000); // 1초 후 실행
        };

        // 페이지 가시성 변경 이벤트만 사용 (윈도우 포커스는 제거)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                handlePageFocus();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearTimeout(focusTimeout);
        };
    }, [userId, posts.length]);

    const handleCategoryClick = useCallback((key: string) => {
        setSelectedCategoryKey(key === selectedCategoryKey ? null : key)
    }, [selectedCategoryKey])

    // 🔥 수정 6: handleLikeToggle 함수 개선 (에러 핸들링 추가)
    const handleLikeToggle = async (postId: number) => {
        if (!userId) {
            alert('로그인이 필요합니다.');
            return;
        }

        // 낙관적 업데이트
        const newPosts = posts.map(p =>
            p.id === postId ? {...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1} : p
        )
        setPosts(newPosts)

        if (detailedPost && detailedPost.id === postId) {
            setDetailedPost(prev =>
                prev ? {
                    ...prev,
                    likedByMe: !prev.likedByMe,
                    likes: prev.likedByMe ? prev.likes - 1 : prev.likes + 1
                } : null
            )
        }

        try {
            // 서버에 좋아요 토글 요청
            const response = await toggleLike(postId, userId);

            if (response.success && response.data) {
                // 서버 응답에 따라 최종 상태 업데이트
                const serverLikedState = response.data.isLiked;
                const serverLikesCount = response.data.likesCount;

                const finalPosts = posts.map(p =>
                    p.id === postId ? {...p, likedByMe: serverLikedState, likes: serverLikesCount} : p
                )
                setPosts(finalPosts)

                if (detailedPost && detailedPost.id === postId) {
                    setDetailedPost(prev =>
                        prev ? {...prev, likedByMe: serverLikedState, likes: serverLikesCount} : null
                    )
                }
            }
        } catch (error) {
            console.error('❌ 좋아요 처리 실패:', error);

            // 실패 시 원래 상태로 되돌리기
            const revertedPosts = posts.map(p => {
                const originalPost = posts.find(op => op.id === postId);
                return p.id === postId && originalPost ? originalPost : p;
            });
            setPosts(revertedPosts);

            if (detailedPost && detailedPost.id === postId) {
                const originalDetailedPost = posts.find(p => p.id === postId);
                if (originalDetailedPost) {
                    setDetailedPost(originalDetailedPost);
                }
            }
        }
    }

    // 🔥 수정 7: handleFollowToggle 함수 완전 수정
    const handleFollowToggle = async (authorName: string, targetUserId: number) => {
        console.log('🎯 팔로우 토글 시도:', {authorName, targetUserId, currentUserId: userId});

        if (!userId || !targetUserId) {
            console.error('❌ 사용자 ID가 없습니다.');
            alert('로그인이 필요합니다.');
            return;
        }

        if (userId === targetUserId) {
            alert('❌ 자기 자신을 팔로우할 수 없습니다.');
            return;
        }

        // 현재 팔로우 상태 확인
        const currentPost = posts.find(p => p.author.id === targetUserId);
        const isCurrentlyFollowing = currentPost?.author.isFollowing || false;

        console.log('📊 현재 팔로우 상태:', isCurrentlyFollowing);

        // UI 즉시 업데이트 (낙관적 업데이트)
        const optimisticNewState = !isCurrentlyFollowing;

        const updatedPosts = posts.map(p =>
            p.author.id === targetUserId
                ? {...p, author: {...p.author, isFollowing: optimisticNewState}}
                : p
        );
        setPosts(updatedPosts);

        // 상세보기 모달도 업데이트
        if (detailedPost && detailedPost.author.id === targetUserId) {
            setDetailedPost(prev =>
                prev ? {...prev, author: {...prev.author, isFollowing: optimisticNewState}} : null
            );
        }

        try {
            console.log('🚀 API 호출 시작...');

            // post-api.ts의 toggleFollow 함수 사용
            const response = await toggleFollow(userId, targetUserId);

            console.log('✅ 팔로우 토글 응답:', response.data);

            if (response.success && response.data && response.data.success) {
                const serverFollowingState = response.data.following;
                console.log('🎯 서버에서 확인된 팔로우 상태:', serverFollowingState);

                // 서버 응답에 따라 최종 상태 확정
                const finalUpdatedPosts = posts.map(p =>
                    p.author.id === targetUserId
                        ? {...p, author: {...p.author, isFollowing: serverFollowingState}}
                        : p
                );
                setPosts(finalUpdatedPosts);

                // 상세보기 모달도 최종 업데이트
                if (detailedPost && detailedPost.author.id === targetUserId) {
                    setDetailedPost(prev =>
                        prev ? {...prev, author: {...prev.author, isFollowing: serverFollowingState}} : null
                    );
                }

                const actionText = serverFollowingState ? '팔로우' : '언팔로우';
                console.log(`🎉 ${actionText} 성공!`);

            } else {
                console.error('❌ 팔로우 처리 실패:', response.message);
                alert('팔로우 처리에 실패했습니다.');

                // 실패 시 원래 상태로 되돌리기
                const revertedPosts = posts.map(p =>
                    p.author.id === targetUserId
                        ? {...p, author: {...p.author, isFollowing: isCurrentlyFollowing}}
                        : p
                );
                setPosts(revertedPosts);

                if (detailedPost && detailedPost.author.id === targetUserId) {
                    setDetailedPost(prev =>
                        prev ? {...prev, author: {...prev.author, isFollowing: isCurrentlyFollowing}} : null
                    );
                }
            }
        } catch (error) {
            console.error('❌ 팔로우 토글 중 오류:', error);

            // 상세한 에러 정보 표시
            let errorMessage = '팔로우 처리 중 오류가 발생했습니다.';
            if (error instanceof Error) {
                if (error.message.includes('500')) {
                    errorMessage = '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else if (error.message.includes('Network Error')) {
                    errorMessage = '네트워크 연결을 확인해주세요.';
                }
            }

            alert(errorMessage);

            // 오류 시 원래 상태로 되돌리기
            const revertedPosts = posts.map(p =>
                p.author.id === targetUserId
                    ? {...p, author: {...p.author, isFollowing: isCurrentlyFollowing}}
                    : p
            );
            setPosts(revertedPosts);

            // 상세보기 모달도 되돌리기
            if (detailedPost && detailedPost.author.id === targetUserId) {
                setDetailedPost(prev =>
                    prev ? {...prev, author: {...prev.author, isFollowing: isCurrentlyFollowing}} : null
                );
            }
        }
    };

    // 🔥 북마크 토글 함수
    const handleBookmarkToggle = async (postId: number) => {
        if (!userId || typeof userId !== 'number') {
            alert('로그인이 필요합니다.');
            return;
        }

        console.log('🔖 북마크 토글 시작:', {postId, userId});

        // 현재 북마크 상태 확인
        const currentPost = posts.find(p => p.id === postId);
        const currentBookmarkedState = currentPost?.bookmarkedByMe || false;

        // 낙관적 업데이트
        const optimisticBookmarkedState = !currentBookmarkedState;

        // UI 즉시 업데이트
        const newPosts = posts.map(p =>
            p.id === postId
                ? {...p, bookmarkedByMe: optimisticBookmarkedState}
                : p
        );
        setPosts(newPosts);

        // 상세보기 모달도 업데이트
        if (detailedPost && detailedPost.id === postId) {
            setDetailedPost(prev =>
                prev ? {
                    ...prev,
                    bookmarkedByMe: optimisticBookmarkedState
                } : null
            );
        }

        try {
            // 서버에 북마크 토글 요청
            const response = await toggleBookmark(postId, userId);

            if (response.success && response.data) {
                // 서버 응답에 따라 최종 상태 업데이트
                const serverBookmarkedState = response.data.isBookmarked;

                // 낙관적 업데이트와 서버 응답이 다른 경우 서버 상태로 수정
                if (serverBookmarkedState !== optimisticBookmarkedState) {
                    console.log('⚠️ 북마크 상태 불일치, 서버 상태로 수정');

                    const finalPosts = posts.map(p =>
                        p.id === postId
                            ? {...p, bookmarkedByMe: serverBookmarkedState}
                            : p
                    );
                    setPosts(finalPosts);

                    if (detailedPost && detailedPost.id === postId) {
                        setDetailedPost(prev =>
                            prev ? {
                                ...prev,
                                bookmarkedByMe: serverBookmarkedState
                            } : null
                        );
                    }
                }

                console.log('✅ 북마크 토글 완료:', {
                    finalState: serverBookmarkedState
                });

            } else {
                throw new Error(response.message || '북마크 처리에 실패했습니다');
            }
        } catch (error) {
            console.error('❌ 북마크 처리 실패:', error);

            // 실패 시 원래 상태로 되돌리기
            const revertedPosts = posts.map(p =>
                p.id === postId
                    ? {...p, bookmarkedByMe: currentBookmarkedState}
                    : p
            );
            setPosts(revertedPosts);

            if (detailedPost && detailedPost.id === postId) {
                setDetailedPost(prev =>
                    prev ? {
                        ...prev,
                        bookmarkedByMe: currentBookmarkedState
                    } : null
                );
            }

            alert('북마크 처리 중 오류가 발생했습니다.');
        }
    };

    // 🔥 완전 수정된 handleCommentSubmit 함수 - 실시간 업데이트
    const handleCommentSubmit = async () => {
        if (!newComment.trim() || !detailedPost || typeof userId !== "number") {
            if (!userId) {
                alert('로그인이 필요합니다.');
            }
            return;
        }

        // 입력 필드 먼저 초기화 (UX 개선)
        const commentContent = newComment.trim();
        setNewComment("");

        try {
            console.log('🔄 댓글 추가 시작:', {
                postId: detailedPost.id,
                userId: userId,
                content: commentContent
            });

            // 🔥 서버에 댓글 추가 요청 (낙관적 업데이트 없이)
            const response = await addComment(detailedPost.id, userId, commentContent);

            if (response.success && response.data) {
                console.log('✅ 댓글 추가 성공:', response.data);

                // 🔥 서버 응답으로 받은 실제 댓글 데이터 사용
                const serverComment: Comment = {
                    id: response.data.id,
                    author: {
                        id: response.data.author.id,           // CommunityProfile ID
                        userId: response.data.author.userId,   // User ID
                        name: response.data.author.name,
                        avatar: response.data.author.avatar || "/placeholder_person.svg",
                        title: response.data.author.title || "사용자"
                    },
                    content: response.data.content,
                    timeAgo: response.data.timeAgo
                };

                console.log('📝 새 댓글 추가:', serverComment);

                // 🔥 댓글 목록과 카운트 업데이트
                const updatedCommentsList = [...(detailedPost.commentsList || []), serverComment];

                // 게시글 목록에서 댓글 수 업데이트
                const updatedPosts = posts.map(p =>
                    p.id === detailedPost.id
                        ? {
                            ...p,
                            comments: updatedCommentsList.length,
                            commentsList: updatedCommentsList
                        }
                        : p
                );
                setPosts(updatedPosts);

                // 상세보기 모달 업데이트
                setDetailedPost(prev =>
                    prev ? {
                        ...prev,
                        comments: updatedCommentsList.length,
                        commentsList: updatedCommentsList
                    } : null
                );

                console.log('✅ 댓글 UI 업데이트 완료');

            } else {
                throw new Error(response.message || '댓글 추가에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 댓글 추가 실패:', error);

            // 에러 메시지 표시
            const errorMessage = error instanceof Error ? error.message : '댓글 추가에 실패했습니다.';
            alert(errorMessage);

            // 실패 시 입력 필드 복원
            setNewComment(commentContent);
        }
    }

    // 🔥 완전 수정된 댓글 삭제 함수 - 실시간 업데이트
    const handleCommentDelete = async (postId: number, commentId: number) => {
        if (!userId || typeof userId !== "number") {
            alert('로그인이 필요합니다.');
            return;
        }

        console.log('🗑️ 댓글 삭제 시도:', {
            postId,
            commentId,
            userId,
            commentIdType: typeof commentId,
            userIdType: typeof userId
        });

        // 삭제될 댓글 찾기
        const commentToDelete = detailedPost?.commentsList?.find(c => Number(c.id) === commentId);
        if (!commentToDelete) {
            console.error('❌ 삭제할 댓글을 찾을 수 없습니다.');
            alert('댓글을 찾을 수 없습니다.');
            return;
        }

        console.log('📝 삭제할 댓글 정보:', {
            commentId: commentToDelete.id,
            communityProfileId: commentToDelete.author.id,
            userId: commentToDelete.author.userId,
            currentUserId: userId,
            isOwner: commentToDelete.author.userId === userId
        });

        // 🔥 권한 확인 - User ID로 비교
        if (Number(commentToDelete.author.userId) !== Number(userId)) {
            console.warn('❌ 댓글 삭제 권한 없음:', {
                commentUserId: commentToDelete.author.userId,
                currentUserId: userId
            });
            alert('본인이 작성한 댓글만 삭제할 수 있습니다.');
            return;
        }

        if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
            return;
        }

        try {
            console.log('🚀 댓글 삭제 API 호출 시작...');

            // 🔥 현재 로그인한 사용자의 User ID를 전달
            const response = await deleteComment(postId, commentId, userId);

            if (response.success) {
                console.log('✅ 댓글 삭제 성공');

                // 🔥 성공 후 댓글 목록에서 제거하고 카운트 업데이트
                const updatedCommentsList = (detailedPost?.commentsList || []).filter(c => Number(c.id) !== commentId);

                const updatedPosts = posts.map(p =>
                    p.id === postId
                        ? {
                            ...p,
                            comments: updatedCommentsList.length,
                            commentsList: updatedCommentsList
                        }
                        : p
                );
                setPosts(updatedPosts);

                if (detailedPost && detailedPost.id === postId) {
                    setDetailedPost(prev =>
                        prev ? {
                            ...prev,
                            comments: updatedCommentsList.length,
                            commentsList: updatedCommentsList
                        } : null
                    );
                }

                console.log('✅ 댓글 삭제 UI 업데이트 완료');

            } else {
                throw new Error(response.message || '댓글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 댓글 삭제 실패:', error);

            // 🔥 더 사용자 친화적인 에러 메시지
            const errorMessage = error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.';
            alert(errorMessage);
        }
    }

    if (loading) return <div className="flex justify-center items-center h-full">로딩중...</div>

    return (
        <CommunityLayout>
            <motion.div
                initial={{opacity: 0, y: 30}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.6, ease: "easeOut"}}
                className="flex flex-1 flex-col min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 pl-6"
            >
                <div className="community-container bg-gradient-to-br from-violet-50 to-indigo-100 pl-6">
                    <div className="community-main" ref={contentRef}>
                        <div className="community-feed-container">
                            {/* 필터 헤더 */}
                            <div className="mb-6 pt-8">
                                <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                                    <Rss className="mr-2 h-6 w-6"/>
                                    피드
                                </h1>
                                <p className="text-gray-500">커뮤니티의 최신 소식을 확인하고 이야기를 나눠보세요.</p>
                            </div>

                            {/* 카테고리 & 검색 */}
                            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                <div
                                    className="flex justify-center md:justify-start gap-2 order-2 md:order-1 w-full md:w-auto md:flex-grow">
                                    <CategoryDropdown
                                        label="직무별 카테고리"
                                        categories={jobCategoriesList}
                                        selectedKey={selectedCategoryKey}
                                        onSelect={handleCategoryClick}
                                        dropdownWidth={jobCategoriesList.length > 5 ? 700 : jobCategoriesList.length * 140}
                                        gridCols={jobCategoriesList.length > 5 ? 5 : jobCategoriesList.length}
                                        align="left"
                                    />
                                    <CategoryDropdown
                                        label="주제별 카테고리"
                                        categories={topicCategoriesList}
                                        selectedKey={selectedCategoryKey}
                                        onSelect={handleCategoryClick}
                                        dropdownWidth={topicCategoriesList.length * 130}
                                        gridCols={topicCategoriesList.length}
                                        align="left"
                                    />
                                    {selectedCategoryKey && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedCategoryKey(null)}
                                            className="text-gray-600 hover:text-red-500 h-full px-3 py-2.5 rounded-full"
                                            title="필터 해제"
                                        >
                                            <FilterX className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </div>
                                <div className="relative w-full md:w-auto md:max-w-xs order-1 md:order-2">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"/>
                                    <Input
                                        placeholder="검색..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 w-full border-gray-300 focus:border-[#6366f1] focus:ring-[#8b5cf6] rounded-full text-sm"
                                    />
                                </div>
                            </div>

                            {/* 전체 / 팔로우 탭 */}
                            <div className="mb-8 flex justify-center">
                                <div className="filter-toggle">
                                    <button
                                        className={`filter-button ${feedMode === "all" ? "active" : ""}`}
                                        onClick={() => setFeedMode("all")}
                                    >
                                        <div className="filter-icon"><Globe size={18}/></div>
                                        <div className="filter-content"><span className="filter-text">전체</span></div>
                                    </button>
                                    <button
                                        className={`filter-button ${feedMode === "following" ? "active" : ""}`}
                                        onClick={() => {
                                            setFeedMode("following");
                                            // 팔로우 모드에서는 검색창을 초기화하지 않음
                                            // 사용자가 명시적으로 검색어를 지우거나 다른 액션을 할 때만 초기화
                                        }}
                                    >
                                        <div className="filter-icon"><Users size={18}/></div>
                                        <div className="filter-content"><span className="filter-text">팔로우</span></div>
                                    </button>
                                    <div
                                        className={`filter-background ${feedMode === "following" ? "right" : "left"}`}/>
                                </div>
                            </div>

                            {/* 게시글 Carousel */}
                            {posts.length > 0 ? (
                                <div className="carousel-container-wrapper">
                                    <Carousel initialActiveIndex={currentPostIndex} onCardClick={handleOpenPostDetail}
                                              onCommentClick={handleOpenPostComments}>
                                        {posts.map((post) => (
                                            <AdaptedPostCard
                                                key={post.id}
                                                post={post}
                                                allCategories={allCategories}
                                                onCardClick={handleOpenPostDetail}
                                                onCommentClick={handleOpenPostComments}
                                                onLike={handleLikeToggle}
                                                onBookmark={handleBookmarkToggle}
                                                onFollowToggle={() => handleFollowToggle(post.author.name, post.author.id)}
                                                isActive={false}
                                            />
                                        ))}
                                    </Carousel>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6">
                                        <Rss className="h-12 w-12 text-gray-400"/>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                        {loading ? "로딩 중..." : "게시글이 없습니다"}
                                    </h3>
                                    <p className="text-gray-500 mb-6 max-w-md">
                                        {loading ? "잠시만 기다려주세요..." :
                                            feedMode === "following"
                                                ? "팔로우한 사용자의 게시글이 없습니다. 더 많은 사람들을 팔로우해보세요!"
                                                : selectedCategoryKey
                                                    ? "선택한 카테고리에 게시글이 없습니다. 다른 카테고리를 확인해보세요."
                                                    : debouncedSearchQuery.trim()
                                                        ? `'${debouncedSearchQuery}'에 대한 검색 결과가 없습니다. 다른 검색어를 시도해보세요.`
                                                        : "아직 게시글이 없습니다. 첫 번째 게시글을 작성해보세요!"
                                        }
                                    </p>
                                    {!loading && (
                                        <Button
                                            onClick={() => router.push("/community/write")}
                                            className="bg-[#6366f1] hover:bg-[#6366f1]/90 text-white px-6 py-2"
                                        >
                                            게시글 작성하기
                                        </Button>
                                    )}

                                    {!loading && process.env.NODE_ENV === 'development' && (
                                        <div
                                            className="mt-8 p-4 bg-violet-50 border border-violet-200 rounded-lg max-w-md">
                                            <p className="text-sm text-violet-800">
                                                <strong>📝 데모 모드:</strong> 백엔드 서버가 연결되지 않아 목 데이터를 표시 중입니다.
                                                <br/>실제 서버 연결 시 모든 기능이 정상 작동합니다.
                                                {feedMode === "following" && (
                                                    <>
                                                        <br/><strong>팔로우 피드:</strong> 팔로우한 사용자가 있고 해당 사용자들이 게시글을 작성했는지
                                                        확인해주세요.
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <UpwardMenu
                        className="fixed bottom-6 right-6 z-[999]"
                        onFollowClick={() => router.push("/community/follow")}
                        onMyPostsClick={() => router.push("/community/write")}
                        onMyCommentsClick={() => router.push("/community/reply")}
                        onSavedClick={() => router.push("/community/bookmark")}
                    />
                </div>

                {/* 상세보기 모달 */}
                {detailedPost && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <Dialog open={!!detailedPost} onOpenChange={() => {
                            setDetailedPost(null);
                            setActiveTab("post");
                            setVisibleComments(5);
                        }}>
                            <DialogContent
                                className="w-full max-w-3xl sm:p-6 p-4 h-[85vh] max-h-[900px] flex flex-col overflow-hidden mx-auto md:ml-[10rem]">
                                <DialogHeader className="p-6 pb-3 border-b border-gray-100 flex-shrink-0">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage
                                                    src={detailedPost.author.avatar || "/placeholder_person.svg"}/>
                                                <AvatarFallback>{detailedPost.author.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <DialogTitle
                                                    className="text-base font-semibold">{detailedPost.author.name}</DialogTitle>
                                                <DialogDescription className="text-xs text-gray-500">
                                                    {detailedPost.author.title} · {detailedPost.timeAgo}
                                                </DialogDescription>
                                            </div>
                                        </div>
                                        {/* 🔥 수정 9: 자기 자신의 게시글에는 팔로우 버튼 숨김 */}
                                        {detailedPost.author.id !== userId && (
                                            <Button
                                                variant={detailedPost.author.isFollowing ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handleFollowToggle(detailedPost.author.name, detailedPost.author.id)}
                                                className={`${detailedPost.author.isFollowing ? "bg-violet-500 hover:bg-violet-600 text-white" : "border-violet-500 text-violet-500 hover:bg-violet-50"}`}
                                            >
                                                {detailedPost.author.isFollowing ? (
                                                    <UserCheck className="h-4 w-4 mr-1.5"/>
                                                ) : (
                                                    <UserPlus className="h-4 w-4 mr-1.5"/>
                                                )}
                                                {detailedPost.author.isFollowing ? "팔로잉" : "팔로우"}
                                            </Button>
                                        )}
                                    </div>
                                </DialogHeader>

                                <Tabs value={activeTab}
                                      onValueChange={(value) => setActiveTab(value as "post" | "comments")}
                                      className="flex-1 flex flex-col overflow-hidden">
                                    <TabsList
                                        className="grid w-full grid-cols-2 bg-transparent px-6 py-2 border-b border-gray-100">
                                        <TabsTrigger value="post"
                                                     className="text-sm font-medium px-2 py-2 data-[state=active]:text-black data-[state=inactive]:text-gray-400">
                                            게시글
                                        </TabsTrigger>
                                        <TabsTrigger value="comments"
                                                     className="text-sm font-medium px-2 py-2 data-[state=active]:text-black data-[state=inactive]:text-gray-400">
                                            댓글 {detailedPost.commentsList?.length || 0}개
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* 게시글 탭 */}
                                    <TabsContent value="post" className="flex-1 px-6 py-4 overflow-auto bg-white"
                                                 style={{minHeight: '500px', maxHeight: 'calc(85vh - 150px)'}}>
                                        <div className="space-y-4 pr-2">
                                            {detailedPost.imageUrl && (
                                                <div className="relative w-full h-[300px] rounded-md">
                                                    {detailedPost.imageUrl?.trim() ? (
                                                        <div className="relative w-full h-[300px] rounded-md">
                                                            <Image
                                                                src={getFullImageUrl(detailedPost.imageUrl.trim()) || detailedPost.imageUrl.trim()}
                                                                alt={"Post image"}
                                                                fill
                                                                style={{objectFit: "contain"}}
                                                                className="rounded-md"
                                                                onError={(e) => {
                                                                    console.error('🖼️ 이미지 로딩 실패:', detailedPost.imageUrl);
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                            <p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
                                                {detailedPost.content}
                                            </p>
                                            <div className="flex flex-wrap gap-2 pt-4">
                                                {detailedPost.hashtags.map((tag, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="secondary"
                                                        className="text-xs bg-violet-100 text-violet-700 hover:bg-violet-200"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* 댓글 탭 */}
                                    <TabsContent value="comments" className="flex-1 flex flex-col min-h-0">
                                        <div className="flex-1 overflow-auto px-6 py-4">
                                            {detailedPost.commentsList && detailedPost.commentsList.length > 0 ? (
                                                <div className="space-y-4">
                                                    {detailedPost.commentsList.slice(0, visibleComments).map((comment) => (
                                                        <div key={comment.id}
                                                             className="py-3 border-b border-gray-100 last:border-b-0">
                                                            <div className="flex items-start gap-3">
                                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                                    <AvatarImage
                                                                        src={comment.author.avatar || "/placeholder_person.svg"}/>
                                                                    <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <p className="font-semibold text-sm truncate">{comment.author.name}</p>
                                                                        {comment.author.title && (
                                                                            <p className="text-xs text-gray-500 truncate">{comment.author.title}</p>
                                                                        )}
                                                                        <p className="text-xs text-gray-400 ml-auto flex-shrink-0">{comment.timeAgo}</p>

                                                                        {/* 🔥 댓글 삭제 버튼 - 본인 댓글에만 표시 (수정됨) */}
                                                                        {(() => {
                                                                            // 🔥 User ID로 비교하여 권한 체크
                                                                            const commentUserId = comment.author.userId;
                                                                            const currentUserId = userId;
                                                                            const isMyComment = commentUserId !== undefined &&
                                                                                commentUserId !== null &&
                                                                                currentUserId !== undefined &&
                                                                                currentUserId !== null &&
                                                                                Number(commentUserId) === Number(currentUserId);

                                                                            console.log('🔍 댓글 삭제 버튼 표시 확인:', {
                                                                                commentId: comment.id,
                                                                                commentUserId: commentUserId,
                                                                                commentUserIdType: typeof commentUserId,
                                                                                currentUserId: currentUserId,
                                                                                currentUserIdType: typeof currentUserId,
                                                                                numberComparison: `${Number(commentUserId)} === ${Number(currentUserId)}`,
                                                                                isMyComment: isMyComment,
                                                                                shouldShowDeleteButton: isMyComment
                                                                            });

                                                                            return isMyComment ? (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation(); // 이벤트 버블링 방지
                                                                                        handleCommentDelete(detailedPost.id, Number(comment.id));
                                                                                    }}
                                                                                    className="ml-2 w-6 h-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors"
                                                                                    title="댓글 삭제"
                                                                                >
                                                                                    <span
                                                                                        className="text-sm font-bold">×</span>
                                                                                </Button>
                                                                            ) : null;
                                                                        })()}
                                                                    </div>
                                                                    <p className="text-sm text-gray-700 break-words">{comment.content}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {visibleComments < (detailedPost.commentsList?.length || 0) && (
                                                        <div className="text-center py-4">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-violet-600 hover:bg-violet-50"
                                                                onClick={() => setVisibleComments((prev) => prev + 5)}
                                                            >
                                                                댓글 더 보기
                                                                ({detailedPost.commentsList!.length - visibleComments}개
                                                                남음)
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                                    <div className="text-center">
                                                        <MessageCircle
                                                            className="h-12 w-12 mx-auto mb-2 text-gray-300"/>
                                                        <p>아직 댓글이 없습니다.</p>
                                                        <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* 🔥 수정 10: 댓글 입력 섹션 개선 */}
                                        <div className="p-4 flex-shrink-0">
                                            <div className="border-t border-gray-200 p-4 flex items-center gap-3">
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                    <AvatarImage
                                                        src={myProfile?.profileImageUrl || "/placeholder_person.svg"}/>
                                                    <AvatarFallback>{myProfile?.displayName?.charAt(0) || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div
                                                    className="flex-1 flex items-center gap-2 bg-white rounded-md px-3 py-2">
                                                    <Textarea
                                                        placeholder="댓글을 작성하세요"
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        className="flex-1 resize-none border-gray-300 focus:border-violet-500 focus:ring-violet-500 rounded-md text-sm min-h-[40px] max-h-[120px]"
                                                        rows={2}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault()
                                                                handleCommentSubmit()
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        size="icon"
                                                        className="rounded-full p-2 bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50"
                                                        onClick={handleCommentSubmit}
                                                        disabled={!newComment.trim()}
                                                    >
                                                        <Send className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <div className="border-t border-gray-100 p-4 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`text-gray-600 transition-all duration-200 ${
                                                    detailedPost.likedByMe
                                                        ? 'text-red-500 hover:text-red-600'
                                                        : 'hover:text-red-500'
                                                }`}
                                                onClick={() => handleLikeToggle(detailedPost.id)}
                                            >
                                                <Heart
                                                    className={`h-4 w-4 mr-1 transition-all duration-200 ${
                                                        detailedPost.likedByMe
                                                            ? 'text-red-500 scale-105'
                                                            : ''
                                                    }`}
                                                    fill={detailedPost.likedByMe ? "#ef4444" : "none"}
                                                    stroke={detailedPost.likedByMe ? "#ef4444" : "currentColor"}
                                                />
                                                {detailedPost.likes}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-600 hover:text-violet-500"
                                                onClick={() => setActiveTab("comments")}
                                            >
                                                <MessageCircle className="h-4 w-4 mr-1"/>
                                                {detailedPost.comments}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`text-gray-600 transition-all duration-200 ${
                                                    detailedPost.bookmarkedByMe
                                                        ? 'text-orange-500 hover:text-orange-600'
                                                        : 'hover:text-orange-500'
                                                }`}
                                                onClick={() => handleBookmarkToggle(detailedPost.id)}
                                            >
                                                <Bookmark
                                                    className={`h-4 w-4 mr-1 transition-all duration-200 ${
                                                        detailedPost.bookmarkedByMe
                                                            ? 'text-orange-500 scale-105'
                                                            : ''
                                                    }`}
                                                    fill={detailedPost.bookmarkedByMe ? "#f97316" : "none"}
                                                    stroke={detailedPost.bookmarkedByMe ? "#f97316" : "currentColor"}
                                                />
                                                저장
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </motion.div>
        </CommunityLayout>
    )
}