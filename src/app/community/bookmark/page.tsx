"use client"

//import SideLayout from "../sidebar/SideLayout";
import CommunityLayout from "@/components/layouts/CommunityLayout"
import {useState, useEffect} from "react"
import {useRouter} from "next/navigation";
import {UpwardMenu} from "../components/upward-menu";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Badge} from "@/components/ui/badge"
import {Input} from "@/components/ui/input"
import {
    Heart,
    MessageCircle,
    Search,
    BookmarkIcon as BookmarkIconLucide,
    Trash2,
    ArrowUpRight,
    Loader2,
    RefreshCw,
    Filter,
    type LucideIcon,
} from "lucide-react"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {getUserBookmarkedPosts, toggleBookmark, PostResponse, getComments, CommentResponse} from "@/lib/post-api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {motion} from "framer-motion";

interface CategoryInfo {
    label: string
    key: string
    color: string
    icon?: LucideIcon
}

// 🔥 댓글 인터페이스 추가
interface Comment {
    id: number | string
    author: {
        id: number          // CommunityProfile ID
        userId: number      // User ID (권한 체크용)
        name: string;
        avatar: string;
        title?: string
    }
    content: string
    timeAgo: string
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

export default function BookmarkPage() {
    const [bookmarkedPosts, setBookmarkedPosts] = useState<PostResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>("all")
    const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent")
    const [viewMode] = useState<"grid" | "list">("grid")
    const [refreshing, setRefreshing] = useState(false)
    const router = useRouter();

    const [detailedPost, setDetailedPost] = useState<PostResponse | null>(null)
    const [activeTab, setActiveTab] = useState<"post" | "comments">("post")
    const [visibleComments, setVisibleComments] = useState(5)
    const [postComments, setPostComments] = useState<Comment[]>([]) // 🔥 댓글 상태 추가

    // 🔥 댓글 로딩 함수 추가
    const loadCommentsForPost = async (postId: number) => {
        try {
            console.log('🔍 [북마크] 댓글 로딩 시작:', postId);
            const userIdStr = localStorage.getItem('userId');
            const userId = userIdStr ? Number(userIdStr) : null;

            const response = await getComments(postId, userId);

            if (response.success && response.data) {
                console.log('🔍 [북마크] 댓글 데이터:', response.data);

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
                console.log('✅ [북마크] 댓글 로딩 완료:', comments.length + '개');
                return comments;
            } else {
                console.log('⚠️ [북마크] 댓글 없음');
                setPostComments([]);
                return [];
            }
        } catch (error) {
            console.error('❌ [북마크] 댓글 로딩 실패:', error);
            setPostComments([]);
            return [];
        }
    };

    // 🔥 모달 열기 함수 수정
    const handleOpenPostDetail = async (post: PostResponse) => {
        setDetailedPost(post);
        setActiveTab("post");
        setVisibleComments(5);
        setPostComments([]); // 초기화

        // 댓글 로딩
        if (post.commentsCount && post.commentsCount > 0) {
            await loadCommentsForPost(post.id);
        }
    };


    const fetchPosts = async (showRefreshing = false) => {
        const userIdStr = localStorage.getItem('userId');
        if (!userIdStr) {
            setError("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
            setLoading(false);
            setTimeout(() => router.push('/login'), 2000);
            return;
        }

        const userId = Number(userIdStr);

        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const posts = await getUserBookmarkedPosts(userId);
            setBookmarkedPosts(posts);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "북마크한 글을 불러오는 데 실패했습니다.");
            console.error(err);
        } finally {
            if (showRefreshing) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [router]);

    const filteredPosts = bookmarkedPosts
        .filter(
            (post) =>
                (searchQuery === "" ||
                    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    post.hashtags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    post.author.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (selectedCategoryKey === "all" || selectedCategoryKey === null ||
                    post.topicCategory === selectedCategoryKey || post.jobCategory === selectedCategoryKey)
        )
        .sort((a, b) => {
            if (sortBy === "recent") {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            } else {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            }
        })

    const handleRemoveBookmark = async (postId: number) => {
        const userIdStr = localStorage.getItem('userId');
        if (!userIdStr) {
            alert("로그인이 필요합니다.");
            return;
        }

        const originalPosts = [...bookmarkedPosts];

        // 낙관적 업데이트 - UI에서 즉시 제거
        setBookmarkedPosts(originalPosts.filter((post) => post.id !== postId));

        try {
            const result = await toggleBookmark(postId, Number(userIdStr));
            if (!result.success) {
                throw new Error(result.message || "북마크 해제에 실패했습니다.");
            }
        } catch (error) {
            console.error("북마크 삭제 실패:", error);
            // 실패 시 원래 상태로 복구
            setBookmarkedPosts(originalPosts);
            alert("북마크 삭제에 실패했습니다. 다시 시도해주세요.");
        }
    }

    const handleRefresh = () => {
        fetchPosts(true);
    }

    const handleClearSearch = () => {
        setSearchQuery("");
    }

    const handleClearFilters = () => {
        setSearchQuery("");
        setSelectedCategoryKey("all");
        setSortBy("recent");
    }

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

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-[#6366f1]"/>
                    <p className="ml-4 text-lg text-gray-600">저장한 글을 불러오는 중입니다...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-12 bg-red-50 rounded-lg shadow-sm">
                    <BookmarkIconLucide className="h-12 w-12 mx-auto text-red-300 mb-4"/>
                    <h3 className="text-lg font-medium text-red-900 mb-2">오류 발생</h3>
                    <p className="text-red-700 max-w-md mx-auto mb-4">{error}</p>
                    <Button
                        onClick={() => fetchPosts()}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                        <RefreshCw className="h-4 w-4 mr-2"/>
                        다시 시도
                    </Button>
                </div>
            );
        }

        if (filteredPosts.length > 0) {
            return (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
                    {filteredPosts.map((post) => {
                        const categoryInfo = allCategories.find((c) =>
                            c.key === post.topicCategory || c.key === post.jobCategory);

                        return (
                            <Card key={post.id}
                                  className="bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage
                                                    src={post.author.avatar || "/placeholder_person.svg?height=40&width=40"}/>
                                                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{post.author.name}</p>
                                                <p className="text-xs text-gray-500">{post.author.jobTitle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {categoryInfo && (
                                                <Badge
                                                    style={{
                                                        backgroundColor: `${categoryInfo.color}20`,
                                                        color: categoryInfo.color
                                                    }}
                                                    className="font-normal"
                                                >
                                                    {categoryInfo.label}
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {post.timeAgo || new Date(post.createdAt).toLocaleDateString()}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pb-3 flex-grow">
                                    <p className={`text-sm text-gray-700 mb-3 ${viewMode === "grid" ? "line-clamp-3" : ""}`}>
                                        {post.content}
                                    </p>
                                    {post.imageUrl && (
                                        <div className="mb-3">
                                            <img
                                                src={post.imageUrl}
                                                alt="Post image"
                                                className={`w-full object-cover rounded-md ${
                                                    viewMode === "grid" ? "h-[120px]" : "max-h-[200px]"
                                                }`}
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {post.hashtags.slice(0, viewMode === "grid" ? 3 : 5).map((tag, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="text-xs bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20 cursor-pointer"
                                                onClick={() => setSearchQuery(tag)}
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                        {post.hashtags.length > (viewMode === "grid" ? 3 : 5) && (
                                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
                                                +{post.hashtags.length - (viewMode === "grid" ? 3 : 5)}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-3 pb-4 border-t border-gray-100 bg-gray-50/50">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center text-gray-500 text-sm">
                                                <Heart className="h-4 w-4 mr-1 text-red-500"/>
                                                {post.likesCount}
                                            </div>
                                            <div className="flex items-center text-gray-500 text-sm">
                                                <MessageCircle className="h-4 w-4 mr-1 text-violet-500"/>
                                                {post.commentsCount}
                                            </div>
                                            <div className="flex items-center text-gray-500 text-sm">
                                                <BookmarkIconLucide className="h-4 w-4 mr-1 text-orange-500"/>
                                                {post.bookmarksCount}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 text-[#6366f1] border-[#6366f1] hover:bg-[#6366f1]/10 transition-colors"
                                                onClick={() => handleOpenPostDetail(post)}
                                            >
                                                <ArrowUpRight className="h-4 w-4 mr-1"/>
                                                보기
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors group-hover:opacity-100 opacity-70"
                                                onClick={() => handleRemoveBookmark(post.id)}
                                                title="북마크에서 제거"
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )
        } else {
            return (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <BookmarkIconLucide className="h-12 w-12 mx-auto text-gray-300 mb-4"/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {bookmarkedPosts.length === 0 ? "저장한 게시글이 없습니다" : "검색 결과가 없습니다"}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                        {bookmarkedPosts.length === 0
                            ? "마음에 드는 게시글을 북마크해서 나중에 다시 확인해보세요."
                            : "검색 조건에 맞는 게시글이 없습니다."}
                    </p>
                    {bookmarkedPosts.length > 0 && (
                        <Button
                            onClick={handleClearFilters}
                            variant="outline"
                            className="text-[#6366f1] border-[#6366f1] hover:bg-[#6366f1]/10"
                        >
                            <Filter className="h-4 w-4 mr-2"/>
                            필터 초기화
                        </Button>
                    )}
                </div>
            )
        }
    }
    return (
        <CommunityLayout>
            <motion.div
                initial={{opacity: 0, y: 30}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.6, ease: "easeOut"}}
                className="flex flex-1 flex-col min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100"
            >
                <div className="community-container bg-red-50">
                    <div className="community-main">
                        <div className="community-bookmark-container">
                            {/* Header */}
                            <div className="mb-6 pt-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                                            <BookmarkIconLucide className="mr-2 h-6 w-6"/>
                                            저장한 글
                                            {bookmarkedPosts.length > 0 && (
                                                <Badge variant="secondary" className="ml-2 text-sm">
                                                    {bookmarkedPosts.length}개
                                                </Badge>
                                            )}
                                        </h1>
                                        <p className="text-gray-500">나중에 다시 보기 위해 저장한 게시글을 확인하세요.</p>
                                    </div>
                                    <Button
                                        onClick={handleRefresh}
                                        variant="outline"
                                        size="icon"
                                        disabled={refreshing}
                                        className="h-10 w-10"
                                        title="새로고침"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}/>
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"/>
                                    <Input
                                        placeholder="게시글, 해시태그, 작성자 검색..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-[#6366f1] focus:ring-[#6366f1]"
                                    />
                                    {searchQuery && (
                                        <Button
                                            onClick={handleClearSearch}
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600"
                                        >
                                            ×
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedCategoryKey || "all"}
                                        onValueChange={(value) => setSelectedCategoryKey(value === "all" ? "all" : value)}
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
                                            onValueChange={(value) => setSortBy(value as "recent" | "oldest")}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="정렬 기준"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="recent">최신순</SelectItem>
                                            <SelectItem value="oldest">오래된순</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* 필터 상태 표시 */}
                            {(searchQuery || selectedCategoryKey !== "all") && (
                                <div className="flex items-center gap-2 mb-4 p-3 bg-violet-50 rounded-lg">
                                    <Filter className="h-4 w-4 text-violet-600"/>
                                    <span className="text-sm text-violet-700">
                  필터링됨: {filteredPosts.length}개 / 전체 {bookmarkedPosts.length}개
                </span>
                                    <Button
                                        onClick={handleClearFilters}
                                        variant="ghost"
                                        size="sm"
                                        className="text-violet-600 hover:text-violet-800 ml-auto"
                                    >
                                        초기화
                                    </Button>
                                </div>
                            )}

                            <div className="pb-20">
                                {renderContent()}
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
                                                <AvatarImage
                                                    src={detailedPost.author.avatar || "/placeholder_person.svg"}/>
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
                                            {detailedPost.imageUrl && (
                                                <div className="relative w-full h-[300px] rounded-md">
                                                    <img
                                                        src={detailedPost.imageUrl}
                                                        alt="Post image"
                                                        className="w-full h-full object-contain rounded-md"
                                                        onError={(e) => {
                                                            console.error('🖼️ 북마크 모달 이미지 로딩 실패:', detailedPost.imageUrl);
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
                                                <div className="relative w-full h-[300px] bg-gray-100 rounded-md">
                                                    <img
                                                        src={detailedPost.imageUrl}
                                                        alt="Post image"
                                                        className="w-full h-full object-contain rounded-md"
                                                        onError={(e) => {
                                                            console.error('🖼️ 북마크 댓글 탭 이미지 로딩 실패:', detailedPost.imageUrl);
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
                                                        <MessageCircle
                                                            className="h-12 w-12 mx-auto mb-2 text-gray-300"/>
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
                                            onClick={() => setDetailedPost(null)}
                                        >
                                            닫기
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </motion.div>
        </CommunityLayout>
    )
}