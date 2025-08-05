"use client"

//import SideLayout from "../sidebar/SideLayout"
import CommunityLayout from "@/components/layouts/CommunityLayout"
import {useState, useEffect} from "react"
import {useRouter} from "next/navigation";
import {UpwardMenu} from "../components/upward-menu";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Card, CardContent, CardFooter} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Button} from "@/components/ui/button"
import {
    Search,
    MessageSquare,
    Calendar,
    Trash2,
    type LucideIcon,
} from "lucide-react"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {getUserComments, deleteComment, getComments, type CommentResponse, type ApiResponse} from "@/lib/post-api"
import {getCurrentUserId} from "@/utils/auth"
//import { useCommunityProfile } from "@/hooks/useCommunityProfile"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {Comment} from "@/app/community/feed/page";
import {motion} from "framer-motion";
import {Badge} from "@/components/ui/badge";

interface CategoryInfo {
    label: string
    key: string
    color: string
    icon?: LucideIcon
}

// 댓글 데이터 타입 (백엔드 응답에 맞춘 타입) - 수정됨
interface UserComment {
    id: number
    postId: number
    content: string
    createdAt: string
    timeAgo: string
    author: {
        id: number          // CommunityProfile ID
        userId: number      // 🔥 User ID (권한 체크용)
        name: string
        avatar?: string
        title?: string
    }
    post: {
        id: number
        author: {
            name: string
            avatar?: string
        }
        content: string
        imageUrl?: string  // 🔥 optional로 변경 (백엔드 PostSummaryDto 수정에 맞춤)
        hashtags: string[]
        likesCount: number
        commentsCount: number
        timeAgo: string
        jobCategory?: string
        topicCategory?: string
        commentsList: Comment[]
    }
}

// 카테고리 정의
const allCategories: CategoryInfo[] = [
    {label: "경영/기획/전략", key: "management", color: "#3498db"},
    {label: "디자인/컨텐츠", key: "design", color: "#e74c3c"},
    {label: "개발/IT", key: "dev", color: "#356ae4"},
    {label: "마케팅/브랜딩", key: "marketing", color: "#f39c12"},
    {label: "영업/고객관리", key: "sales", color: "#27ae60"},
    {label: "교육/강의/연구", key: "education", color: "#9b59b6"},
    {label: "운영/사무관리", key: "operations", color: "#34495e"},
    {label: "생산/물류/품질관리", key: "logistics", color: "#795548"},
    {label: "사회/공공기관", key: "public", color: "#607d8b"},
    {label: "특수직", key: "special", color: "#ff5722"},
    {label: "일상공유", key: "daily", color: "#8B4513"},
    {label: "업무관련팁", key: "tips", color: "#FFCC00"},
    {label: "커리어조언", key: "career", color: "#4B0082"},
    {label: "취업준비", key: "job-prep", color: "#DC143C"},
    {label: "자기계발", key: "self-dev", color: "#1abc9c"},
]

// 🔥 CommentResponse를 UserComment로 변환하는 함수 (수정됨)
const convertCommentResponseToUserComment = (comment: CommentResponse): {
    id: number;
    postId: number;
    content: string;
    createdAt: string;
    timeAgo: string;
    author: { id: number; userId: number; name: string; avatar?: string; title?: string };
    post: {
        id: number;
        author: { name: string; avatar: string | undefined };
        content: string;
        imageUrl: string;
        hashtags: string[];
        likesCount: number;
        commentsCount: number;
        timeAgo: string;
        jobCategory: string | undefined;
        topicCategory: string | undefined;
        commentsList: Comment[];
    } | {
        id: number;
        author: { name: string; avatar: string };
        content: string;
        imageUrl: string;
        hashtags: any[];
        likesCount: number;
        commentsCount: number;
        timeAgo: string;
        jobCategory: undefined;
        topicCategory: undefined;
        commentsList: Comment[];
    }
} => {
    return {
        id: comment.id,
        postId: comment.postId,
        content: comment.content,
        createdAt: comment.createdAt,
        timeAgo: comment.timeAgo,
        author: {
            id: comment.author.id,        // CommunityProfile ID
            userId: comment.author.userId, // 🔥 User ID (권한 체크용)
            name: comment.author.name,
            avatar: comment.author.avatar,
            title: comment.author.title
        },
        post: comment.post ? {
            id: comment.post.id,
            author: {
                name: comment.post.author.name,
                avatar: comment.post.author.avatar
            },
            content: comment.post.content,
            imageUrl: comment.post.imageUrl || "", // 🔥 optional 처리
            hashtags: comment.post.hashtags || [],
            likesCount: comment.post.likesCount || 0,
            commentsCount: comment.post.commentsCount || 0,
            timeAgo: comment.post.timeAgo || "",
            jobCategory: comment.post.jobCategory,
            topicCategory: comment.post.topicCategory,
            commentsList: comment.post.commentsList as Comment[] // 🔥 수정: 배열로 처리
        } : {
            id: 0,
            author: {name: "Unknown", avatar: ""},
            content: "게시글을 찾을 수 없습니다.",
            imageUrl: "",
            hashtags: [],
            likesCount: 0,
            commentsCount: 0,
            timeAgo: "",
            jobCategory: undefined,
            topicCategory: undefined,
            commentsList: []
        }
    }
}

export default function ReplyPage() {
    const [userComments, setUserComments] = useState<UserComment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>("all")
    const [sortBy, setSortBy] = useState<"recent" | "likes">("recent")
    const [userId, setUserId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const [detailedPost, setDetailedPost] = useState<UserComment["post"] | null>(null)
    const [activeTab, setActiveTab] = useState<"post" | "comments">("comments")
    const [visibleComments, setVisibleComments] = useState(5)
    const [postComments, setPostComments] = useState<Comment[]>([]) // 🔥 댓글 상태 추가

    // 🔥 현재 사용자의 CommunityProfile 정보 가져오기
    //const { profile: currentUserProfile } = useCommunityProfile()

    // 🔥 사용자 ID 확인
    useEffect(() => {
        const id = getCurrentUserId()
        setUserId(id)
    }, [])

    // 🔥 댓글 데이터 로딩
    useEffect(() => {
        const loadUserComments = async () => {
            if (!userId) {
                console.log('🔍 사용자 ID가 없어서 댓글 로딩 대기 중...')
                setLoading(false)
                setError("로그인이 필요합니다.")
                return
            }

            console.log('🔄 사용자 댓글 로딩 시작:', userId)
            setLoading(true)
            setError(null)

            try {
                const response: ApiResponse<CommentResponse[]> = await getUserComments(userId, userId)

                if (response.success && response.data) {
                    console.log('✅ 댓글 로딩 성공:', response.data.length, '개')

                    // CommentResponse를 UserComment로 변환
                    const convertedComments = response.data.map(convertCommentResponseToUserComment)
                    setUserComments(convertedComments)
                } else {
                    console.warn('⚠️ 댓글 로딩 실패:', response.message)
                    setUserComments([])
                    setError(response.message || "댓글을 불러오는데 실패했습니다.")
                }
            } catch (error) {
                console.error('❌ 댓글 로딩 오류:', error)
                setUserComments([])
                setError("댓글을 불러오는 중 오류가 발생했습니다.")
            } finally {
                setLoading(false)
            }
        }

        loadUserComments()
    }, [userId])

    // 🔥 댓글 삭제 처리 - 권한 체크 개선됨
    const handleDeleteComment = async (postId: number, commentId: number) => {
        if (!userId) {
            alert('로그인이 필요합니다.')
            return
        }

        // 삭제할 댓글 찾기
        const commentToDelete = userComments.find(comment => comment.id === commentId);
        if (!commentToDelete) {
            console.error('❌ 삭제할 댓글을 찾을 수 없습니다.');
            alert('댓글을 찾을 수 없습니다.');
            return;
        }

        console.log('📝 댓글 삭제 권한 체크:', {
            commentId: commentToDelete.id,
            commentUserId: commentToDelete.author.userId,
            currentUserId: userId,
            isOwner: Number(commentToDelete.author.userId) === Number(userId)
        });

        // 🔥 User ID로 권한 확인
        if (Number(commentToDelete.author.userId) !== Number(userId)) {
            console.warn('❌ 댓글 삭제 권한 없음');
            alert('본인이 작성한 댓글만 삭제할 수 있습니다.');
            return;
        }

        if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
            return
        }

        try {
            console.log('🗑️ 댓글 삭제 시도:', {postId, commentId, currentUserId: userId})

            // 🔥 현재 로그인한 사용자의 User ID를 authorId로 전달
            const response = await deleteComment(postId, commentId, userId)

            if (response.success) {
                console.log('✅ 댓글 삭제 성공')

                // UI에서 댓글 제거
                setUserComments(prev => prev.filter(comment => comment.id !== commentId))

                // 🔥 더 사용자 친화적인 성공 메시지
                alert('댓글이 삭제되었습니다.')
            } else {
                console.error('❌ 댓글 삭제 실패:', response.message)
                alert(response.message || '댓글 삭제에 실패했습니다.')
            }
        } catch (error) {
            console.error('❌ 댓글 삭제 오류:', error)

            // 🔥 더 구체적인 에러 메시지
            const errorMessage = error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.';
            alert(errorMessage);
        }
    }

    // 검색어, 카테고리, 정렬 기준에 따른 댓글 필터링
    const filteredComments = userComments
        .filter((comment) => {
            // 검색 필터
            const matchesSearch = searchQuery === "" ||
                comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                comment.post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                comment.post.hashtags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                comment.post.author.name.toLowerCase().includes(searchQuery.toLowerCase())

            // 카테고리 필터
            const matchesCategory = selectedCategoryKey === "all" ||
                selectedCategoryKey === null ||
                comment.post.jobCategory === selectedCategoryKey ||
                comment.post.topicCategory === selectedCategoryKey

            return matchesSearch && matchesCategory
        })
        .sort((a, b) => {
            if (sortBy === "recent") {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            } else {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            }
        })

    // 🔥 댓글 로딩 함수 추가
    const loadCommentsForPost = async (postId: number) => {
        try {
            console.log('🔍 [댓글페이지] 댓글 로딩 시작:', postId);

            const response = await getComments(postId, userId);

            if (response.success && response.data) {
                console.log('🔍 [댓글페이지] 댓글 데이터:', response.data);

                const comments: Comment[] = response.data.map((commentResponse: CommentResponse) => ({
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
                }));

                setPostComments(comments);
                console.log('✅ [댓글페이지] 댓글 로딩 완료:', comments.length + '개');
                return comments;
            } else {
                console.log('⚠️ [댓글페이지] 댓글 없음');
                setPostComments([]);
                return [];
            }
        } catch (error) {
            console.error('❌ [댓글페이지] 댓글 로딩 실패:', error);
            setPostComments([]);
            return [];
        }
    };

    // 🔥 댓글 카드 컴포넌트
    const CommentCardDisplay = ({comment}: { comment: UserComment }) => {
        const handleCardClick = async () => {
            setDetailedPost(comment.post)
            setActiveTab("comments")
            setPostComments([]) // 초기화

            // 댓글 로딩
            if (comment.post.commentsCount && comment.post.commentsCount > 0) {
                await loadCommentsForPost(comment.post.id);
            }
        }
        return (
            <Card key={comment.id}
                  className="bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[120px]"
                  onClick={handleCardClick}>
                <CardContent className="pb-0 flex-1 p-4 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-3 flex-1">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={comment.author.avatar || "/placeholder_person.svg"}/>
                                <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">&#34;{comment.content}&#34;</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(comment.createdAt).toLocaleDateString()} • {comment.post.author.name}의 게시글
                                </p>
                            </div>
                        </div>

                        {/* 댓글 삭제 버튼 - 내 댓글 페이지이므로 모든 댓글이 내 댓글 */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation(); // 카드 클릭 이벤트 방지
                                handleDeleteComment(comment.postId, comment.id);
                            }}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors flex-shrink-0"
                            title="댓글 삭제"
                        >
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>

                    {/* 게시글 내용 */}
                    <div className="pl-11 flex-1 flex items-start">
                        <p className="text-sm text-[#6495ED] line-clamp-3 leading-tight">{comment.post.content}</p>
                    </div>
                </CardContent>

                <CardFooter className="pt-3 pb-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="w-full pl-11">
                        <div className="text-xs text-gray-400 flex items-center gap-2 mb-2">
                            <span>{comment.timeAgo}</span>
                            <span>·</span>
                            <span>{comment.post.likesCount} 좋아요</span>
                            <span>{comment.post.commentsCount} 댓글</span>
                        </div>

                        {/* 해시태그 표시 */}
                        <div className="min-h-[20px] flex items-center">
                            {comment.post.hashtags.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {comment.post.hashtags.slice(0, 3).map((tag, index) => (
                                        <span key={index}
                                              className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {tag}
                    </span>
                                    ))}
                                    {comment.post.hashtags.length > 3 && (
                                        <span
                                            className="text-xs text-gray-400 whitespace-nowrap">+{comment.post.hashtags.length - 3}개</span>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-5"></div>
                            )}
                        </div>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    const EmptyState = ({title, description, icon: Icon}: { title: string; description: string; icon: LucideIcon }) => (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Icon className="h-12 w-12 mx-auto text-gray-300 mb-4"/>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-md mx-auto">{description}</p>
        </div>
    )

    const windowWidth = useWindowWidth()
    const isLargeScreen = windowWidth >= 1024

    function useWindowWidth() {
        const [width, setWidth] = useState(1920)

        useEffect(() => {
            const handleResize = () => setWidth(window.innerWidth)
            handleResize()
            window.addEventListener("resize", handleResize)
            return () => window.removeEventListener("resize", handleResize)
        }, [])

        return width
    }

    // 로딩 상태
    if (loading) {
        return (
            <motion.div
                initial={{opacity: 0, y: 30}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.6, ease: "easeOut"}}
                className="community-content bg-gradient-to-br from-violet-50 to-indigo-100 min-h-screen"
            >
                <div className="community-container">
                    <div className="community-main">
                        <div className="flex justify-center items-center h-full py-20">
                            <div className="flex flex-col items-center">
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mb-4"></div>
                                <p className="text-gray-600">댓글을 불러오는 중...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    // 에러 상태
    if (error) {
        return (
            <motion.div
                initial={{opacity: 0, y: 30}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.6, ease: "easeOut"}}
                className="community-content bg-gradient-to-br from-violet-50 to-indigo-100 min-h-screen"
            >
                <div className="community-container">
                    <div className="community-main">
                        <div className="w-full max-w-[1200px] mx-auto px-12 md:px-6 lg:px-14 py-8">
                            <div className="mb-6 pt-8">
                                <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                                    <MessageSquare className="mr-2 h-6 w-6"/>
                                    내 댓글
                                </h1>
                                <p className="text-gray-500">내가 작성한 댓글과 해당 게시글을 확인하세요.</p>
                            </div>

                            <EmptyState
                                title="댓글을 불러올 수 없습니다"
                                description={error}
                                icon={MessageSquare}
                            />

                            <div className="text-center mt-4">
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="bg-violet-500 hover:bg-violet-600 text-white"
                                >
                                    다시 시도
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <CommunityLayout>
            <motion.div
                initial={{opacity: 0, y: 30}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.6, ease: "easeOut"}}
                className="community-content bg-gradient-to-br from-violet-50 to-indigo-100 min-h-screen"
            >
                <div className="community-container bg-yellow-50">
                    <div className="community-main">
                        <div className="community-reply-container">
                            {/* Header */}
                            <div className="mb-6 pt-8">
                                <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                                    <MessageSquare className="mr-2 h-6 w-6"/>
                                    내 댓글
                                </h1>
                                <p className="text-gray-500">내가 작성한 댓글과 해당 게시글을 확인하세요.</p>

                                {/* 개발 모드 상태 표시 */}
                                {process.env.NODE_ENV === 'development' && (
                                    <div
                                        className="mt-2 p-2 bg-violet-50 border border-violet-200 rounded text-sm text-violet-800">
                                        📊 <strong>총 {userComments.length}개</strong>의 댓글이 로드되었습니다.
                                        {userComments.length === 0 && " 댓글을 작성해보세요!"}
                                    </div>
                                )}
                            </div>

                            {/* Search and Filter */}
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"/>
                                    <Input
                                        placeholder="게시글, 댓글, 해시태그, 작성자 검색..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-[#356ae4] focus:ring-[#356ae4]"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Select
                                        value={selectedCategoryKey || "all"}
                                        onValueChange={(value) => setSelectedCategoryKey(value === "all" ? null : value)}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="카테고리 전체"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">카테고리 전체</SelectItem>
                                            {allCategories.map((category) => (
                                                <SelectItem key={category.key} value={category.key}>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={sortBy}
                                            onValueChange={(value) => setSortBy(value as "recent" | "likes")}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="정렬 기준"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="recent">최신순</SelectItem>
                                            <SelectItem value="likes">오래된순</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Tabs */}
                            <Tabs defaultValue="all" className="pb-20">
                                <TabsContent value="all" className="mt-0">
                                    {filteredComments.length > 0 ? (
                                        <div className="space-y-6">
                                            {filteredComments.map((comment) => (
                                                <CommentCardDisplay key={comment.id} comment={comment}/>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            title={searchQuery ? "검색 결과가 없습니다" : "댓글을 작성한 게시글이 없습니다"}
                                            description={
                                                searchQuery
                                                    ? `'${searchQuery}'에 대한 검색 결과가 없습니다.`
                                                    : "아직 댓글을 작성하지 않았거나, 검색 조건에 맞는 게시글이 없습니다."
                                            }
                                            icon={MessageSquare}
                                        />
                                    )}
                                </TabsContent>
                                <TabsContent value="today" className="mt-0">
                                    <EmptyState
                                        title="오늘 작성한 댓글이 없습니다"
                                        description="오늘 작성한 댓글이 없거나, 검색 조건에 맞는 게시글이 없습니다."
                                        icon={Calendar}
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>

                <UpwardMenu
                    className="fixed bottom-6 right-6 z-[999]"
                    onFollowClick={() => router.push("/community/follow")}
                    onMyPostsClick={() => router.push("/community/write")}
                    onMyCommentsClick={() => router.push("/community/reply")}
                    onSavedClick={() => router.push("/community/bookmark")}
                />

                {detailedPost && (
                    <Dialog
                        open={!!detailedPost}
                        onOpenChange={() => {
                            setDetailedPost(null);
                            setActiveTab("post");
                            setVisibleComments(5);
                            setPostComments([]); // 🔥 댓글 상태 초기화
                        }}
                    >
                        <DialogContent
                            style={{
                                top: '50%',
                                left: isLargeScreen ? 'calc((100vw + 280px) / 2)' : '50%',
                                transform: 'translate(-50%, -50%)',
                                position: 'fixed',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                            className="w-[90vw] sm:w-[800px] max-w-3xl sm:p-6 p-4 h-[85vh] max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300"
                        >
                            <DialogHeader className="p-6 pb-3 border-b border-gray-100 flex-shrink-0">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={detailedPost.author.avatar || "/placeholder_person.svg"}/>
                                            <AvatarFallback>{detailedPost.author.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <DialogTitle className="text-base font-semibold">
                                                {detailedPost.author.name}
                                            </DialogTitle>
                                            <DialogDescription className="text-xs text-gray-500">
                                                {detailedPost.timeAgo}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <Tabs
                                value={activeTab}
                                onValueChange={(value) => setActiveTab(value as "post" | "comments")}
                                className="flex-1 flex flex-col overflow-hidden"
                            >
                                <TabsList
                                    className="grid w-full grid-cols-2 bg-transparent px-6 py-2 border-b border-gray-100">
                                    <TabsTrigger value="post">게시글</TabsTrigger>
                                    <TabsTrigger value="comments">
                                        댓글 {postComments.length}개
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="post"
                                             className="flex-1 px-6 py-4 overflow-y-auto min-h-[500px] max-h-full bg-white">
                                    <div className="space-y-4 pr-2">
                                        {/* 🔥 게시글 이미지 표시 추가 */}
                                        {detailedPost.imageUrl && (
                                            <div className="relative w-full h-[300px] rounded-md">
                                                <img
                                                    src={detailedPost.imageUrl}
                                                    alt="Post image"
                                                    className="w-full h-full object-contain rounded-md"
                                                    onError={(e) => {
                                                        console.error('🖼️ 댓글페이지 모달 이미지 로딩 실패:', detailedPost.imageUrl);
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
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

                                <TabsContent value="comments" className="flex-1 flex flex-col min-h-0">
                                    {/* 🔥 댓글 탭에서도 게시글 이미지 표시 */}
                                    {/*{detailedPost.imageUrl && (
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <div className="relative w-full h-[300px] rounded-md">
                                                <img
                                                    src={detailedPost.imageUrl}
                                                    alt="Post image"
                                                    className="w-full h-full object-contain rounded-md"
                                                    onError={(e) => {
                                                        console.error('🖼️ 댓글페이지 댓글탭 이미지 로딩 실패:', detailedPost.imageUrl);
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}*/}
                                    <div className="flex-1 overflow-auto px-6 py-4">
                                        {postComments && postComments.length > 0 ? (
                                            <div className="space-y-4">
                                                {postComments.slice(0, visibleComments).map((comment) => (
                                                    <div
                                                        key={comment.id}
                                                        className="py-3 border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                                <AvatarImage
                                                                    src={comment.author.avatar || "/placeholder_person.svg"}
                                                                />
                                                                <AvatarFallback>
                                                                    {comment.author.name[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="font-semibold text-sm truncate">
                                                                        {comment.author.name}
                                                                    </p>
                                                                    {comment.author.title && (
                                                                        <p className="text-xs text-gray-500 truncate">{comment.author.title}</p>
                                                                    )}
                                                                    <p className="text-xs text-gray-400 ml-auto flex-shrink-0">
                                                                        {comment.timeAgo}
                                                                    </p>
                                                                </div>
                                                                <p className="text-sm text-gray-700 break-words">
                                                                    {comment.content}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {visibleComments < postComments.length && (
                                                    <div className="text-center py-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-violet-600 hover:bg-violet-50"
                                                            onClick={() => setVisibleComments((prev) => prev + 5)}
                                                        >
                                                            댓글 더 보기 ({postComments.length - visibleComments}개 남음)
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                                <div className="text-center">
                                                    <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300"/>
                                                    <p>아직 댓글이 없습니다.</p>
                                                    <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="border-t border-gray-100 p-4 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setDetailedPost(null);
                                            setPostComments([]); // 🔥 댓글 상태 초기화
                                        }}
                                    >
                                        닫기
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </motion.div>
        </CommunityLayout>
    )
}