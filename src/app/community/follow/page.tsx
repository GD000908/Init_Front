"use client"

//import SideLayout from "../sidebar/SideLayout"
import CommunityLayout from "@/components/layouts/CommunityLayout"
import {useEffect, useState} from "react"
import {useRouter} from "next/navigation";
import {UpwardMenu} from "../components/upward-menu";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Search, Users, UserMinus} from "lucide-react"
import {getCurrentUserId} from "@/utils/auth"
import {motion} from "framer-motion";
import ProfileModal from "@/components/ProfileModal"

// 백엔드 FollowDto.UserInfoDto에 맞춘 사용자 타입 정의
interface UserInfo {
    id: number           // Profile ID
    userId: number       // User ID
    displayName: string
    profileImageUrl?: string
    jobTitle?: string
    company?: string
    followersCount?: number
    followingCount?: number
    postsCount?: number
    isFollowing?: boolean
}

// 백엔드 FollowDto에 맞춘 팔로우 타입 정의
interface FollowData {
    id: number
    createdAt: string
    follower: UserInfo
    following: UserInfo  // 이 사용자가 팔로우하는 사람
}

export default function FollowPage() {
    const [followingUsers, setFollowingUsers] = useState<UserInfo[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const currentUserId = getCurrentUserId()
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

    // 팔로잉 목록을 가져오는 함수
    const fetchFollowingUsers = async () => {
        if (!currentUserId) {
            console.error('사용자 ID가 없습니다.');
            setLoading(false);
            return;
        }

        try {
            console.log('🔍 팔로잉 목록 조회 시도:', currentUserId);

            const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken')

            // 백엔드 API 엔드포인트에 맞춘 URL
            const url = new URL('https://initback-production-67bf.up.railway.app/api/follows/following')
            url.searchParams.append('userId', currentUserId.toString())
            url.searchParams.append('currentUserId', currentUserId.toString())
            url.searchParams.append('page', '0')
            url.searchParams.append('size', '50') // 충분한 크기로 설정

            console.log('📡 API 호출:', url.toString())

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            console.log('📥 응답 상태:', response.status, response.statusText)

            if (response.ok) {
                const result = await response.json()
                console.log('✅ 팔로우 응답 데이터:', result)

                if (result.success && result.data && result.data.content) {
                    const followList: FollowData[] = result.data.content

                    // following 사용자들만 추출
                    const users: UserInfo[] = followList.map((follow: FollowData) => {
                        const followingUser = follow.following
                        console.log('👤 팔로잉 사용자:', followingUser)

                        return {
                            id: followingUser.id,
                            userId: followingUser.userId,
                            displayName: followingUser.displayName,
                            profileImageUrl: followingUser.profileImageUrl,
                            jobTitle: followingUser.jobTitle || "정보 없음",
                            company: followingUser.company,
                            followersCount: followingUser.followersCount || 0,
                            followingCount: followingUser.followingCount || 0,
                            postsCount: followingUser.postsCount || 0,
                            isFollowing: true // 팔로잉 목록이므로 항상 true
                        }
                    })

                    setFollowingUsers(users)
                    console.log('✅ 변환된 사용자 목록:', users)
                } else {
                    console.log('⚠️ 팔로우 데이터가 비어있거나 형식이 올바르지 않습니다.')
                    setFollowingUsers([])
                }
            } else {
                console.error('❌ API 호출 실패:', response.status, response.statusText)
                setFollowingUsers([])
            }
        } catch (error) {
            console.error('❌ 팔로잉 목록 조회 중 오류:', error)
            setFollowingUsers([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFollowingUsers()
    }, [currentUserId])

    // 페이지에 포커스될 때마다 새로고침
    useEffect(() => {
        const handleFocus = () => {
            if (currentUserId && !loading) {
                console.log('🔄 페이지 포커스, 팔로우 목록 새로고침')
                fetchFollowingUsers()
            }
        }

        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [currentUserId, loading])

    // 검색어에 따른 사용자 필터링
    const filteredUsers = followingUsers.filter(
        (user) =>
            user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.userId.toString().includes(searchQuery.toLowerCase())
    )

    // 언팔로우 처리
    const handleUnfollow = async (targetUser: UserInfo) => {
        if (!currentUserId) {
            alert('로그인이 필요합니다.')
            return
        }

        console.log('🎯 언팔로우 시도:', {
            currentUserId,
            targetUserId: targetUser.userId,
            targetUserName: targetUser.displayName
        })

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken')

            // 🔥 백엔드 Controller의 Query Parameter 방식에 맞춘 API 호출
            const url = new URL('https://initback-production-67bf.up.railway.app/api/follows/toggle')
            url.searchParams.append('followerId', currentUserId.toString())
            url.searchParams.append('followingId', targetUser.userId.toString())

            console.log('📡 API 호출 URL:', url.toString())

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            console.log('📥 언팔로우 응답:', response.status, response.statusText)

            if (response.ok) {
                const result = await response.json()
                console.log('✅ 언팔로우 응답 데이터:', result)

                if (result.success && result.data && !result.data.following) {
                    // 언팔로우 성공 시 목록에서 제거
                    setFollowingUsers(prevUsers =>
                        prevUsers.filter(user => user.userId !== targetUser.userId)
                    )
                    console.log('✅ 언팔로우 성공 - UI 업데이트 완료')
                } else {
                    console.log('⚠️ 예상치 못한 상황: 언팔로우했는데 following=true')
                    alert('언팔로우 처리에 실패했습니다.')
                }
            } else {
                const errorText = await response.text()
                console.error('❌ 언팔로우 실패:', errorText)
                alert('언팔로우 처리에 실패했습니다.')
            }
        } catch (error) {
            console.error('❌ 언팔로우 중 오류:', error)
            alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
        }
    }

    return (
        <CommunityLayout>
            <motion.div
                initial={{opacity: 0, y: 30}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.6, ease: "easeOut"}}
                className="community-content"
            >
                <div className="community-container bg-blue-50">
                    <div className="community-main">
                        <div className="community-follow-container">
                            {/* Header */}
                            <div className="mb-6 pt-8">
                                <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                                    <Users className="mr-2 h-6 w-6"/>
                                    팔로우 ({followingUsers.length})
                                </h1>
                                <p className="text-gray-500">팔로우 중인 사용자를 확인하세요.</p>
                            </div>

                            {/* Search Bar */}
                            <div className="mb-6">
                                <div className="relative max-w-md">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"/>
                                    <Input
                                        placeholder="사용자 검색..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-[#6366f1] focus:ring-[#6366f1]"
                                    />
                                </div>
                            </div>

                            {/* Loading */}
                            {loading && (
                                <div className="flex justify-center py-12">
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                                </div>
                            )}

                            {/* Users Grid */}
                            {!loading && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <Card
                                                key={user.userId}
                                                className="bg-white shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <CardHeader className="pb-2">
                                                    <div
                                                        className="flex flex-col sm:flex-row flex-wrap justify-between gap-3 sm:items-center items-start">
                                                        {/* 아바타 + 유저 정보 */}
                                                        <div
                                                            className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                                            <Avatar className="h-12 w-12">
                                                                <AvatarImage
                                                                    src={
                                                                        user.profileImageUrl
                                                                            ? user.profileImageUrl.startsWith("http")
                                                                                ? user.profileImageUrl
                                                                                : `http://localhost:8080${user.profileImageUrl}`
                                                                            : "/placeholder_person.svg?height=48&width=48"
                                                                    }
                                                                />
                                                                <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h3 className="font-semibold text-gray-900">
                                                                    {user.displayName}
                                                                </h3>
                                                                <p className="text-sm text-gray-500">{user.jobTitle}</p>
                                                                {user.company && (
                                                                    <p className="text-xs text-gray-400">{user.company}</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* 팔로잉 버튼 */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUnfollow(user)}
                                                            className="w-full sm:w-auto border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1]/10 hover:text-[#6366f1]"
                                                        >
                                                            <UserMinus className="h-4 w-4 mr-1"/>
                                                            팔로잉
                                                        </Button>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="pt-2 pb-4">
                                                    <div className="flex justify-between text-sm">
                                                        <div>
                                                            <p className="font-medium">{user.followersCount}</p>
                                                            <p className="text-gray-500">팔로워</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{user.postsCount}</p>
                                                            <p className="text-gray-500">게시글</p>
                                                        </div>
                                                        <div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-[#6366f1] p-0 h-auto hover:bg-transparent"
                                                                onClick={() => {
                                                                    setSelectedUserId(user.userId)
                                                                    setModalOpen(true)
                                                                }}
                                                            >
                                                                프로필 보기
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div
                                            className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-white rounded-lg shadow-sm">
                                            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4"/>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                {searchQuery ? "검색 결과가 없습니다" : "팔로우하는 사용자가 없습니다"}
                                            </h3>
                                            <p className="text-gray-500 max-w-md mx-auto">
                                                {searchQuery ? "다른 검색어로 시도해보세요." : "피드에서 다른 사용자들을 팔로우해보세요."}
                                            </p>
                                            <Button
                                                onClick={() => router.push("/community/feed")}
                                                className="mt-4"
                                            >
                                                피드로 이동
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
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

                <ProfileModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    userId={selectedUserId}
                />
            </motion.div>
        </CommunityLayout>
    )
}
