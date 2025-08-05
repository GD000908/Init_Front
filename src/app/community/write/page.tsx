"use client"

//import SideLayout from "../sidebar/SideLayout"
import CommunityLayout from "@/components/layouts/CommunityLayout"
import {useEffect, useRef, useState, useCallback} from "react"
import {useRouter} from "next/navigation";
import {getCurrentUserId} from "@/utils/auth"
// 🔥 수정된 API 함수들 import
import {
    createPost,
    updatePost,
    deletePost,
    getUserDraftPosts,
    getUserPublishedPosts,
    type CreatePostData
} from "@/lib/post-api"
import {uploadImageSimple} from "@/utils/imageUpload"
import {getFullImageUrl, handleImageError} from "@/utils/imageUtils"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Badge} from "@/components/ui/badge"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {ScrollArea} from "@/components/ui/scroll-area"
import {Popover, PopoverTrigger, PopoverContent} from "@/components/ui/popover"
import {Command, CommandGroup, CommandItem} from "@/components/ui/command"
import {
    PenSquare, FileText, Clock, Eye, ChevronDown, Hash, ImageIcon, X, Heart, MessageCircle,
    AlertCircle, Briefcase, Palette, Code, TrendingUp, Phone, BookOpen, ClipboardList,
    Package, Building, Star, Coffee, Lightbulb, GraduationCap, Target, Brain, Check, type LucideIcon
} from "lucide-react"
import {UpwardMenu} from "../components/upward-menu"
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {motion} from "framer-motion";

// Types
interface Category {
    icon: LucideIcon
    label: string
    key: string
    color: string
    type: "job" | "topic"
}

interface Post {
    id: number
    content: string
    category: string
    hashtags: string[]
    image?: string
    status: "draft" | "published"
    createdAt: string
    likes: number
    comments: number
}

interface NewPost {
    category: string
    content: string
    hashtags: string
    image: string | null
}

const allCategories: Category[] = [
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
    {icon: Coffee, label: "일상공유", key: "daily", color: "#8B4513", type: "topic"},
    {icon: Lightbulb, label: "업무관련팁", key: "tips", color: "#FFD700", type: "topic"},
    {icon: GraduationCap, label: "커리어조언", key: "career", color: "#4B0082", type: "topic"},
    {icon: Target, label: "취업준비", key: "job-prep", color: "#DC143C", type: "topic"},
    {icon: Brain, label: "자기계발", key: "self-dev", color: "#1abc9c", type: "topic"},
]

// Custom Hooks
const useImageUpload = () => {
    const [isUploading, setIsUploading] = useState(false)

    const uploadImage = useCallback(async (file: File): Promise<string> => {
        setIsUploading(true)

        try {
            console.log('🔄 이미지 업로드 시작:', file.name)

            const result = await uploadImageSimple(file)

            if (result.success && result.imageUrl) {
                console.log('✅ 이미지 업로드 성공')
                return result.imageUrl
            } else {
                throw new Error(result.error || '이미지 업로드에 실패했습니다.')
            }
        } catch (error) {
            console.error('❌ 이미지 업로드 에러:', error)
            throw error
        } finally {
            setIsUploading(false)
        }
    }, [])

    return {uploadImage, isUploading}
}

// 🔥 수정된 usePosts 훅 - 백엔드 API에 맞춤
const usePosts = (userId: number | null) => {
    const [drafts, setDrafts] = useState<Post[]>([])
    const [published, setPublished] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const loadDraftPosts = useCallback(async () => {
        if (!userId) return

        setIsLoading(true)
        try {
            console.log('🔄 임시저장 글 로딩 시작...')
            const draftPosts = await getUserDraftPosts(userId, userId)

            // PostResponse를 Post 타입으로 변환
            const convertedDrafts: Post[] = draftPosts.map(post => ({
                id: post.id,
                content: post.content,
                category: post.jobCategory || post.topicCategory || 'etc',
                hashtags: post.hashtags || [],
                image: post.imageUrl,
                status: "draft" as const,
                createdAt: post.createdAt,
                likes: post.likesCount,
                comments: post.commentsCount
            }))

            setDrafts(convertedDrafts)
            console.log('✅ 임시저장 글 로딩 성공:', convertedDrafts.length, '개')

        } catch (error) {
            console.error("❌ 임시저장 글 불러오기 실패:", error)
            setDrafts([])
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    const loadPublishedPosts = useCallback(async () => {
        if (!userId) return

        setIsLoading(true)
        try {
            console.log('🔄 발행된 글 로딩 시작...')
            const publishedPosts = await getUserPublishedPosts(userId, userId)

            // PostResponse를 Post 타입으로 변환
            const convertedPublished: Post[] = publishedPosts.map(post => ({
                id: post.id,
                content: post.content,
                category: post.jobCategory || post.topicCategory || 'etc',
                hashtags: post.hashtags || [],
                image: post.imageUrl,
                status: "published" as const,
                createdAt: post.createdAt,
                likes: post.likesCount,
                comments: post.commentsCount
            }))

            setPublished(convertedPublished)
            console.log('✅ 발행된 글 로딩 성공:', convertedPublished.length, '개')

        } catch (error) {
            console.error("❌ 발행된 게시글 불러오기 실패:", error)
            setPublished([])
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    return {
        drafts,
        published,
        isLoading,
        setDrafts,
        setPublished,
        loadDraftPosts,
        loadPublishedPosts
    }
}

// Component
export default function WritePage() {
    const userId = getCurrentUserId()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const {uploadImage, isUploading} = useImageUpload()
    const {
        drafts,
        published,
        setDrafts,
        setPublished,
        loadDraftPosts,
        loadPublishedPosts
    } = usePosts(userId)

    // State
    const [activeTab, setActiveTab] = useState<"write" | "drafts" | "published">("write")
    const [editingPost, setEditingPost] = useState<Post | null>(null)
    const [showPreview, setShowPreview] = useState(false)
    const [categoryType, setCategoryType] = useState<"job" | "topic">("job")
    const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null)
    const [displayCategoryText, setDisplayCategoryText] = useState("카테고리 선택")
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [newPost, setNewPost] = useState<NewPost>({
        category: "",
        content: "",
        hashtags: "",
        image: null,
    })

    // Effects
    useEffect(() => {
        if (userId) {
            loadPublishedPosts()
            loadDraftPosts()
        }
    }, [userId, loadPublishedPosts, loadDraftPosts])

    // Computed values
    const visibleCategories = allCategories.filter(c => c.type === categoryType)
    const combinedCategories = allCategories

    // Handlers
    const resetForm = useCallback(() => {
        setNewPost({category: "", content: "", hashtags: "", image: null})
        setEditingPost(null)
        setShowPreview(false)
        setSelectedCategoryKey(null)
        setDisplayCategoryText("카테고리 선택")
    }, [])

    // 🔥 완전 수정된 handleSavePost 함수 - 백엔드 API 스펙에 맞춤
    const handleSavePost = useCallback(async (status: "draft" | "published") => {
        if (!userId) {
            alert("로그인이 필요합니다.")
            return
        }

        if (!newPost.content.trim()) {
            alert("게시글 내용을 입력해주세요.")
            return
        }

        if (!selectedCategoryKey) {
            alert("카테고리를 선택해주세요.")
            return
        }

        // 해시태그 처리 - 더 안전한 처리
        const hashtagsArr = newPost.hashtags
            .split(",")
            .map(t => t.trim())
            .filter(Boolean)
            .map(t => {
                // 이미 #로 시작하는 태그는 그대로, 아닌 것은 #를 추가
                return t.startsWith("#") ? t : `#${t}`
            })

        // 🔥 백엔드 CreatePostData 형식에 맞춰 데이터 준비
        const categoryInfo = allCategories.find(c => c.key === selectedCategoryKey)
        const isJobCategory = categoryInfo?.type === "job"

        const postData: CreatePostData = {
            content: newPost.content.trim(),
            imageUrl: newPost.image || null,
            // 🔥 백엔드 스펙에 맞춰 jobCategory 또는 topicCategory 중 하나만 설정
            jobCategory: isJobCategory ? selectedCategoryKey : null,
            topicCategory: !isJobCategory ? selectedCategoryKey : null,
            status: status.toUpperCase() as "DRAFT" | "PUBLISHED",
            hashtags: hashtagsArr
        }

        console.log('🔄 게시글 저장 요청:', {
            userId,
            status,
            postData,
            editingPost: editingPost?.id
        })

        try {
            if (editingPost) {
                // 수정 모드
                console.log('📝 게시글 수정 중...')
                await updatePost(editingPost.id, userId, postData)
                alert("글이 수정되었습니다!")
            } else {
                // 생성 모드
                console.log('✏️ 새 게시글 생성 중...')
                await createPost(postData, userId)
                alert(status === "published" ? "글이 발행되었습니다!" : "글이 임시저장되었습니다!")
            }

            resetForm()
            setActiveTab(status === "draft" ? "drafts" : "published")

            // 목록 새로고침
            if (status === "draft") {
                await loadDraftPosts()
            } else {
                await loadPublishedPosts()
            }

            console.log('✅ 게시글 저장 완료')

        } catch (err: any) {
            console.error("❌ 글 저장 실패:", err)

            // 더 상세한 에러 메시지 제공
            let errorMessage = "글 저장에 실패했습니다."
            if (err.message) {
                if (err.message.includes('400')) {
                    errorMessage = "입력 데이터에 오류가 있습니다. 모든 필드를 확인해주세요."
                } else if (err.message.includes('401')) {
                    errorMessage = "로그인이 만료되었습니다. 다시 로그인해주세요."
                } else if (err.message.includes('403')) {
                    errorMessage = "게시글 작성 권한이 없습니다."
                } else if (err.message.includes('500')) {
                    errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
                } else {
                    errorMessage = `오류: ${err.message}`
                }
            }

            alert(errorMessage)
        }
    }, [userId, newPost, selectedCategoryKey, resetForm, loadDraftPosts, loadPublishedPosts, editingPost])

    const handleEditPost = useCallback((post: Post) => {
        console.log('📝 게시글 수정 모드 진입:', post)

        setEditingPost(post)

        // 🔥 기존 게시글 데이터를 정확히 복원
        setNewPost({
            category: post.category,
            content: post.content,
            hashtags: post.hashtags.map(tag => tag.startsWith('#') ? tag.slice(1) : tag).join(", "), // # 제거
            image: post.image || null
        })

        // 🔥 카테고리 설정 - 더 안전한 처리
        const categoryInfo = allCategories.find(c => c.key === post.category)
        if (categoryInfo) {
            setSelectedCategoryKey(post.category)
            setDisplayCategoryText(categoryInfo.label)
            setCategoryType(categoryInfo.type)

            console.log('📝 카테고리 복원:', {
                key: post.category,
                label: categoryInfo.label,
                type: categoryInfo.type
            })
        } else {
            console.warn('⚠️ 카테고리 정보를 찾을 수 없음:', post.category)
            // 기본값 설정
            setSelectedCategoryKey(null)
            setDisplayCategoryText("카테고리 선택")
            setCategoryType("job")
        }

        setActiveTab("write")
        setShowPreview(false)

        console.log('✅ 수정 모드 설정 완료')
    }, [])

    const handleImageUpload = useCallback(async (
        e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault()

        let file: File | null = null

        if ("dataTransfer" in e) {
            file = e.dataTransfer.files?.[0] || null
        } else {
            file = e.target.files?.[0] || null
        }

        if (!file) return

        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('파일 크기는 5MB 이하여야 합니다.')
            return
        }

        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드할 수 있습니다.')
            return
        }

        try {
            // 즉시 미리보기를 위한 Object URL 생성
            const previewUrl = URL.createObjectURL(file)

            // 임시로 미리보기 URL 설정
            setNewPost(prev => ({
                ...prev,
                image: previewUrl
            }))

            console.log('🔄 이미지 업로드 시작:', file.name)

            // 서버에 실제 업로드
            const serverImageUrl = await uploadImage(file)

            // 서버 업로드 성공시 실제 URL로 교체
            setNewPost(prev => ({
                ...prev,
                image: serverImageUrl
            }))

            // 미리보기용 Object URL 해제
            URL.revokeObjectURL(previewUrl)

            console.log('✅ 이미지 업로드 성공:', serverImageUrl)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.'
            alert(errorMessage)
            console.error('❌ 이미지 업로드 에러:', error)

            // 업로드 실패시 이미지 제거
            setNewPost(prev => ({...prev, image: null}))
        }
    }, [uploadImage])

    // 컴포넌트 언마운트시 Object URL 정리
    useEffect(() => {
        return () => {
            if (newPost.image && newPost.image.startsWith('blob:')) {
                URL.revokeObjectURL(newPost.image)
            }
        }
    }, [newPost.image])

    // 🔥 완전 수정된 handleToggleStatus 함수 - 기존 데이터 보존
    const handleToggleStatus = useCallback(async (postToToggle: Post) => {
        if (!userId) {
            alert("로그인이 필요합니다.")
            return
        }

        const newStatus = postToToggle.status === "draft" ? "published" : "draft"

        console.log('🔄 게시글 상태 변경:', {
            postId: postToToggle.id,
            currentStatus: postToToggle.status,
            newStatus
        })

        try {
            // 🔥 기존 게시글 데이터를 보존하면서 상태만 변경
            const categoryInfo = allCategories.find(c => c.key === postToToggle.category)

            const updateData: CreatePostData = {
                content: postToToggle.content,                    // ✅ 기존 content 보존
                imageUrl: postToToggle.image || null,            // ✅ 기존 image 보존
                jobCategory: categoryInfo?.type === "job" ? postToToggle.category : null,   // ✅ 기존 category 보존
                topicCategory: categoryInfo?.type === "topic" ? postToToggle.category : null,
                status: newStatus.toUpperCase() as "DRAFT" | "PUBLISHED",  // ✅ 상태만 변경
                hashtags: postToToggle.hashtags                   // ✅ 기존 hashtags 보존
            }

            console.log('📤 전송할 업데이트 데이터:', updateData)

            await updatePost(postToToggle.id, userId, updateData)

            // 성공시 로컬 상태 업데이트
            const updatedPost: Post = {
                ...postToToggle,
                status: newStatus as "draft" | "published"
            }

            if (postToToggle.status === "draft") {
                setDrafts(prev => prev.filter(d => d.id !== postToToggle.id))
                setPublished(prev => [updatedPost, ...prev])
            } else {
                setPublished(prev => prev.filter(p => p.id !== postToToggle.id))
                setDrafts(prev => [updatedPost, ...prev])
            }

            alert(newStatus === "published" ? "글이 발행되었습니다!" : "글이 임시저장되었습니다!")
            console.log('✅ 게시글 상태 변경 완료')

        } catch (error) {
            console.error("❌ 상태 변경 실패:", error)
            alert("상태 변경에 실패했습니다.")
        }
    }, [userId, setDrafts, setPublished])

    // 🔥 수정된 handleDeletePost 함수
    const handleDeletePost = useCallback(async (postToDelete: Post) => {
        if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            return
        }

        if (!userId) {
            alert("로그인이 필요합니다.")
            return
        }

        console.log('🗑️ 게시글 삭제:', postToDelete.id)

        try {
            await deletePost(postToDelete.id, userId)

            // 성공시 로컬 상태 업데이트
            if (postToDelete.status === "draft") {
                setDrafts(prev => prev.filter(d => d.id !== postToDelete.id))
            } else {
                setPublished(prev => prev.filter(p => p.id !== postToDelete.id))
            }

            alert("게시글이 삭제되었습니다.")
            console.log('✅ 게시글 삭제 완료')

        } catch (error) {
            console.error("❌ 게시글 삭제 실패:", error)
            alert("게시글 삭제에 실패했습니다.")
        }
    }, [userId, setDrafts, setPublished])

    const handleCategorySelect = useCallback((category: Category) => {
        setSelectedCategoryKey(category.key)
        setNewPost(prev => ({...prev, category: category.key}))
        setDisplayCategoryText(category.label)
        setPopoverOpen(false)
    }, [])

    const handleCategoryTypeChange = useCallback((type: "job" | "topic") => {
        setCategoryType(type)
        setSelectedCategoryKey(null)
        setNewPost(prev => ({...prev, category: ""}))
        setDisplayCategoryText("카테고리 선택")
    }, [])

    // PostCardDisplay 컴포넌트
    const PostCardDisplay = ({post}: { post: Post }) => {
        const categoryInfo = combinedCategories.find(c => c.key === post.category)
        if (!categoryInfo) return null

        const CategoryIconRender = categoryInfo.icon || FileText

        return (
            <Card className="flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow min-h-[180px] h-full">
                {/* 헤더 */}
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge
                                style={{backgroundColor: `${categoryInfo.color}20`, color: categoryInfo.color}}
                                className="font-normal"
                            >
                                <CategoryIconRender className="h-3 w-3 mr-1"/>
                                {categoryInfo.label}
                            </Badge>
                            {post.status === "draft" && (
                                <Badge variant="outline" className="text-gray-500 border-gray-300">
                                    임시저장
                                </Badge>
                            )}
                        </div>
                        <span className="text-xs text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </CardHeader>

                {/* 본문 */}
                <CardContent className="flex-1 flex flex-col justify-between pb-3 px-4">
                    <div>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{post.content}</p>

                        {post.image && (
                            <div className="mb-3">
                                <img
                                    src={getFullImageUrl(post.image) || post.image}
                                    alt="Post image"
                                    className="mx-auto max-h-48 object-contain rounded-md"
                                    onError={(e) => handleImageError(post.image!, e.currentTarget)}
                                />
                            </div>
                        )}

                        <div className="flex flex-wrap gap-1 mb-3">
                            {post.hashtags.slice(0, 3).map((tag, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>

                {/* 푸터 */}
                <CardFooter className="pt-3 pb-4 px-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            {post.status === "published" && (
                                <>
                                    <div className="flex items-center text-gray-500 text-sm">
                                        <Heart className="h-4 w-4 mr-1"/>
                                        {post.likes}
                                    </div>
                                    <div className="flex items-center text-gray-500 text-sm">
                                        <MessageCircle className="h-4 w-4 mr-1"/>
                                        {post.comments}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-gray-600 hover:text-[#6366f1] hover:bg-[#6366f1]/10"
                                onClick={() => handleEditPost(post)}
                            >
                                수정
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-gray-600 hover:text-[#6366f1] hover:bg-[#6366f1]/10"
                                onClick={() => handleToggleStatus(post)}
                            >
                                {post.status === "draft" ? "발행하기" : "임시저장"}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-gray-600 hover:text-red-500 hover:bg-red-50"
                                onClick={() => handleDeletePost(post)}
                            >
                                삭제
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    // 🔥 로그인 체크
    if (!userId) {
        return (
            <CommunityLayout>
                <div className="community-content">
                    <div className="community-container">
                        <div className="community-main">
                            <div className="flex items-center justify-center min-h-screen">
                                <div className="text-center">
                                    <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4"/>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">로그인이 필요합니다</h3>
                                    <p className="text-gray-500 mb-4">글을 작성하려면 먼저 로그인해주세요.</p>
                                    <Button onClick={() => router.push('/login')}>
                                        로그인하러 가기
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CommunityLayout>
        )
    }

    return (
        <CommunityLayout>
            <motion.div
                initial={{opacity: 0, y: 30}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.6, ease: "easeOut"}}
                className="community-content"
            >
                <div className="community-container bg-green-50">
                    <div className="community-main">
                        <div className="community-write-container">
                            {/* Header */}
                            <div className="mb-6 pt-8">
                                <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                                    <FileText className="mr-2 h-6 w-6"/>
                                    글 작성하기
                                </h1>
                                <p className="text-gray-500">게시글을 작성하고 관리하세요.</p>
                            </div>

                            {/* Tabs */}
                            <Tabs
                                value={activeTab}
                                onValueChange={(value) => setActiveTab(value as "write" | "drafts" | "published")}
                            >
                                <TabsList className="grid w-full grid-cols-3 mb-6">
                                    <TabsTrigger value="write" className="flex items-center">
                                        <PenSquare className="h-4 w-4 mr-2"/>
                                        글쓰기 {editingPost ? "(수정중)" : ""}
                                    </TabsTrigger>
                                    <TabsTrigger value="drafts" className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2"/>
                                        임시저장 ({drafts.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="published" className="flex items-center">
                                        <Eye className="h-4 w-4 mr-2"/>
                                        발행됨 ({published.length})
                                    </TabsTrigger>
                                </TabsList>

                                {/* Write Tab */}
                                <TabsContent value="write" className="space-y-6 pb-20">
                                    {!showPreview ? (
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-xl font-semibold">
                                                        {editingPost ? "게시글 수정하기" : "새 게시글 작성하기"}
                                                    </h2>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowPreview(true)}
                                                        disabled={!newPost.content || !selectedCategoryKey}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2"/>
                                                        미리보기
                                                    </Button>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                {/* 카테고리 선택 */}
                                                <div className="space-y-2">
                                                    <label htmlFor="postCategory" className="text-sm font-medium">
                                                        카테고리 <span className="text-red-500">*</span>
                                                    </label>
                                                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={popoverOpen}
                                                                className="w-full justify-between pr-3"
                                                            >
                                                                {displayCategoryText}
                                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                            <div className="p-4 space-y-4">
                                                                <div className="flex p-1 rounded-md bg-gray-100 mb-2">
                                                                    <Button
                                                                        variant={categoryType === "job" ? "default" : "ghost"}
                                                                        className="flex-1 justify-center py-2 text-sm font-medium rounded-md"
                                                                        onClick={() => handleCategoryTypeChange("job")}
                                                                    >
                                                                        직무별
                                                                    </Button>
                                                                    <Button
                                                                        variant={categoryType === "topic" ? "default" : "ghost"}
                                                                        className="flex-1 justify-center py-2 text-sm font-medium rounded-md"
                                                                        onClick={() => handleCategoryTypeChange("topic")}
                                                                    >
                                                                        주제별
                                                                    </Button>
                                                                </div>

                                                                <ScrollArea className="h-[200px]">
                                                                    <Command>
                                                                        <CommandGroup>
                                                                            {visibleCategories.map((category) => {
                                                                                const CategoryIcon = category.icon
                                                                                const isSelected = selectedCategoryKey === category.key
                                                                                return (
                                                                                    <CommandItem
                                                                                        key={category.key}
                                                                                        value={category.label}
                                                                                        onSelect={() => handleCategorySelect(category)}
                                                                                        className="flex items-center justify-between cursor-pointer py-2 px-3 text-sm hover:bg-violet-100 focus:bg-violet-100"
                                                                                    >
                                                                                        <div className="flex items-center gap-2">
                                                                                            <CategoryIcon
                                                                                                className="h-4 w-4"
                                                                                                style={{color: category.color}}
                                                                                            />
                                                                                            {category.label}
                                                                                        </div>
                                                                                        {isSelected && (
                                                                                            <Check className="ml-auto h-4 w-4 text-[#5B21B6]"/>
                                                                                        )}
                                                                                    </CommandItem>
                                                                                )
                                                                            })}
                                                                        </CommandGroup>
                                                                    </Command>
                                                                </ScrollArea>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                {/* 내용 입력 */}
                                                <div className="space-y-2">
                                                    <label htmlFor="postMainContent" className="text-sm font-medium">
                                                        내용 <span className="text-red-500">*</span>
                                                    </label>
                                                    <Textarea
                                                        id="postMainContent"
                                                        placeholder="게시글 내용을 입력하세요..."
                                                        value={newPost.content}
                                                        onChange={(e) => setNewPost(prev => ({
                                                            ...prev,
                                                            content: e.target.value
                                                        }))}
                                                        className="min-h-[200px]"
                                                    />
                                                </div>

                                                {/* 해시태그 입력 */}
                                                <div className="space-y-2">
                                                    <label htmlFor="postHashtags" className="text-sm font-medium">
                                                        해시태그
                                                    </label>
                                                    <div className="flex items-center">
                                                        <Hash className="h-4 w-4 mr-2 text-gray-400"/>
                                                        <Input
                                                            id="postHashtags"
                                                            placeholder="해시태그 입력 (쉼표로 구분)"
                                                            value={newPost.hashtags}
                                                            onChange={(e) => setNewPost(prev => ({
                                                                ...prev,
                                                                hashtags: e.target.value
                                                            }))}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-500">예: #취업팁, #면접준비, #포트폴리오</p>
                                                </div>

                                                {/* 이미지 업로드 */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">이미지 첨부</label>
                                                    <div
                                                        className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={handleImageUpload}
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        {newPost.image ? (
                                                            <div className="relative">
                                                                <img
                                                                    src={newPost.image}
                                                                    alt="Uploaded preview"
                                                                    className="mx-auto max-h-48 object-contain rounded-md"
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white shadow-md"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setNewPost(prev => ({...prev, image: null}))
                                                                    }}
                                                                    disabled={isUploading}
                                                                >
                                                                    <X className="h-4 w-4"/>
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <ImageIcon className="h-10 w-10 mx-auto text-gray-300 mb-2"/>
                                                                <p className="text-sm text-gray-500 mb-1">
                                                                    이미지를 드래그하거나 클릭하여 업로드하세요
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    JPG, PNG, GIF 파일 (최대 5MB)
                                                                </p>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    ref={fileInputRef}
                                                                    onChange={handleImageUpload}
                                                                    className="hidden"
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="mt-2"
                                                                    disabled={isUploading}
                                                                >
                                                                    {isUploading ? "업로드 중..." : "이미지 선택"}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <CardFooter className="flex items-center justify-between w-full">
                                                <Button variant="outline" onClick={resetForm}>
                                                    {editingPost ? "수정 취소" : "새로 작성"}
                                                </Button>
                                                <div className="space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleSavePost("draft")}
                                                        disabled={!newPost.content.trim() || !selectedCategoryKey || isUploading}
                                                    >
                                                        임시저장
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleSavePost("published")}
                                                        disabled={!newPost.content.trim() || !selectedCategoryKey || isUploading}
                                                        className="bg-[#6366f1] hover:bg-[#6366f1]/90"
                                                    >
                                                        {editingPost ? "수정 완료" : "발행하기"}
                                                    </Button>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ) : (
                                        // 미리보기 모드
                                        <Card>
                                            <CardHeader>
                                                <div className="flex justify-between items-center">
                                                    <h2 className="text-xl font-semibold">미리보기</h2>
                                                    <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                                                        <PenSquare className="h-4 w-4 mr-2"/>
                                                        편집으로 돌아가기
                                                    </Button>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                {/* 카테고리 표시 */}
                                                {selectedCategoryKey && (
                                                    <div className="flex items-center gap-2">
                                                        {(() => {
                                                            const categoryInfo = allCategories.find(c => c.key === selectedCategoryKey)
                                                            if (!categoryInfo) return null
                                                            const CategoryIcon = categoryInfo.icon
                                                            return (
                                                                <Badge
                                                                    style={{
                                                                        backgroundColor: `${categoryInfo.color}20`,
                                                                        color: categoryInfo.color
                                                                    }}
                                                                    className="font-normal"
                                                                >
                                                                    <CategoryIcon className="h-3 w-3 mr-1"/>
                                                                    {categoryInfo.label}
                                                                </Badge>
                                                            )
                                                        })()}
                                                    </div>
                                                )}

                                                {/* 이미지 표시 */}
                                                {newPost.image && (
                                                    <div className="mb-4">
                                                        <img
                                                            src={getFullImageUrl(newPost.image) || newPost.image}
                                                            alt="Post preview"
                                                            className="mx-auto max-h-64 object-contain rounded-md"
                                                            onError={(e) => handleImageError(newPost.image!, e.currentTarget)}
                                                        />
                                                    </div>
                                                )}

                                                {/* 내용 표시 */}
                                                <div className="prose max-w-none">
                                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                                                        {newPost.content}
                                                    </p>
                                                </div>

                                                {/* 해시태그 표시 */}
                                                {newPost.hashtags && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {newPost.hashtags
                                                            .split(",")
                                                            .map(t => t.trim())
                                                            .filter(Boolean)
                                                            .map(t => t.startsWith("#") ? t : `#${t}`)
                                                            .map((tag, index) => (
                                                                <Badge
                                                                    key={index}
                                                                    variant="secondary"
                                                                    className="text-xs bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20"
                                                                >
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                    </div>
                                                )}
                                            </CardContent>

                                            <CardFooter className="flex items-center justify-between w-full">
                                                <Button variant="outline" onClick={() => setShowPreview(false)}>
                                                    편집으로 돌아가기
                                                </Button>
                                                <div className="space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleSavePost("draft")}
                                                        disabled={!newPost.content.trim() || !selectedCategoryKey || isUploading}
                                                    >
                                                        임시저장
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleSavePost("published")}
                                                        disabled={!newPost.content.trim() || !selectedCategoryKey || isUploading}
                                                        className="bg-[#6366f1] hover:bg-[#6366f1]/90"
                                                    >
                                                        {editingPost ? "수정 완료" : "발행하기"}
                                                    </Button>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    )}
                                </TabsContent>

                                {/* Drafts Tab */}
                                <TabsContent value="drafts" className="pb-20">
                                    {drafts.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {drafts.map((post) => (
                                                <PostCardDisplay key={post.id} post={post}/>
                                            ))}
                                        </div>
                                    ) : (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4"/>
                                            <AlertTitle>임시저장된 게시글이 없습니다</AlertTitle>
                                            <AlertDescription>새 게시글을 작성하고 임시저장해보세요.</AlertDescription>
                                        </Alert>
                                    )}
                                </TabsContent>

                                {/* Published Tab */}
                                <TabsContent value="published" className="pb-20">
                                    {published.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {published.map((post) => (
                                                <PostCardDisplay key={post.id} post={post}/>
                                            ))}
                                        </div>
                                    ) : (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4"/>
                                            <AlertTitle>발행된 게시글이 없습니다</AlertTitle>
                                            <AlertDescription>새 게시글을 작성하고 발행해보세요.</AlertDescription>
                                        </Alert>
                                    )}
                                </TabsContent>
                            </Tabs>

                            <UpwardMenu
                                className="fixed bottom-6 right-6 z-[999]"
                                onFollowClick={() => router.push("/community/follow")}
                                onMyPostsClick={() => router.push("/community/write")}
                                onMyCommentsClick={() => router.push("/community/reply")}
                                onSavedClick={() => router.push("/community/bookmark")}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </CommunityLayout>
    )
}