"use client"
import {useState, useEffect} from "react"
import type React from "react"

import {motion} from "framer-motion"
import {useInView} from "react-intersection-observer"
import {Card} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Calendar, Plus, X, Bookmark, Loader2} from "lucide-react"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {CustomCalendar} from "./CustomCalendar"
import {format} from "date-fns"
import {ko} from "date-fns/locale"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog"
import {Badge} from "@/components/ui/badge"
import BookmarkList from "./bookmark-list"
import SimpleCalendar from "./SimpleCalendar"
import {useAuth} from "@/hooks/useAuth"
import {useRouter} from 'next/navigation'

// API 타입 정의
interface JobPostingDto {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    location?: string;
    position?: string;
    salary?: string;
    color?: string;
    status: 'ACTIVE' | 'EXPIRED' | 'UPCOMING' | 'CLOSED';
    description?: string;
    company?: string;
    department?: string;
    experienceLevel?: string;
    employmentType?: string;
    createdAt: string;
    updatedAt: string;
}

interface JobBookmarkDto {
    id: number;
    userId?: number;
    jobPosting: JobPostingDto;
    memo?: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
    createdAt: string;
}

interface CreateJobPostingRequest {
    title: string;
    startDate: string;
    endDate: string;
    location?: string;
    position?: string;
    salary?: string;
    color?: string;
    description?: string;
    company?: string;
    department?: string;
    experienceLevel?: string;
    employmentType?: string;
}

interface CreateJobBookmarkRequest {
    userId: number;
    jobPostingId: number;
    memo?: string;
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    errorCode?: string;
}

// API 서비스 클래스
class JobPostingApi {
    private API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/job-calendar`;


    private async request<T>(endpoint: string, options?: RequestInit & { userId?: string }): Promise<T> {
        const url = `${this.API_BASE_URL}${endpoint}`;

        const defaultHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (options?.userId) {
            defaultHeaders['x-user-id'] = options.userId;
        }

        const response = await fetch(url, {
            headers: {
                ...defaultHeaders,
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse<T> = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'API 요청 실패');
        }

        return result.data;
    }

    async getBookmarksByUserId(userId: number): Promise<JobBookmarkDto[]> {
        return this.request<JobBookmarkDto[]>(`/bookmarks/user/${userId}`, {
            userId: userId.toString()
        });
    }

    async createJobPosting(request: CreateJobPostingRequest, userId: number): Promise<JobPostingDto> {
        return this.request<JobPostingDto>('/job-postings', {
            method: 'POST',
            body: JSON.stringify(request),
            userId: userId.toString()
        });
    }

    async updateJobPosting(id: number, request: CreateJobPostingRequest, userId: number): Promise<JobPostingDto> {
        return this.request<JobPostingDto>(`/job-postings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(request),
            userId: userId.toString()
        });
    }

    async createBookmark(request: CreateJobBookmarkRequest): Promise<JobBookmarkDto> {
        return this.request<JobBookmarkDto>('/bookmarks', {
            method: 'POST',
            body: JSON.stringify(request),
            userId: request.userId.toString()
        });
    }

    async deleteBookmarkByUserAndJob(userId: number, jobPostingId: number): Promise<void> {
        return this.request<void>(`/bookmarks/user/${userId}/job/${jobPostingId}`, {
            method: 'DELETE',
            userId: userId.toString()
        });
    }

    // 유틸리티 메소드
    static dateToISOString(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    static convertDatesToStrings(request: {
        title: string;
        start: Date;
        end: Date;
        position?: string;
        location?: string;
        salary?: string;
        color?: string;
        description?: string;
        company?: string;
        department?: string;
        experienceLevel?: string;
        employmentType?: string;
    }): CreateJobPostingRequest {
        return {
            title: request.title,
            startDate: this.dateToISOString(request.start),
            endDate: this.dateToISOString(request.end),
            position: request.position,
            location: request.location,
            salary: request.salary,
            color: request.color,
            description: request.description,
            company: request.company,
            department: request.department,
            experienceLevel: request.experienceLevel,
            employmentType: request.employmentType,
        };
    }
}

const jobPostingApi = new JobPostingApi();

// 간단한 토스트 함수
const toast = ({title, description, variant}: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive'
}) => {
    const message = `${title}: ${description}`;
    if (variant === 'destructive') {
        alert(`❌ ${message}`);
    } else {
        alert(`✅ ${message}`);
    }
};

interface Company {
    id: string
    title: string
    start: Date
    end: Date
    color?: string
    status?: 'active' | 'expired' | 'upcoming'
    location?: string
    position?: string
    salary?: string
}

interface NewCompanyForm {
    title: string
    start: Date | null
    end: Date | null
    position?: string
    location?: string
    salary?: string
    company?: string
}

export default function JobCalendarView() {
    const {ref, inView} = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    // 인증 관련
    const {userId, userName, isLoading: authLoading, isAuthenticated} = useAuth()
    const router = useRouter()

    // 상태 관리
    const [currentHoverCompany] = useState<Company | null>(null)
    const [bookmarkedCompanies, setBookmarkedCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [showAddForm, setShowAddForm] = useState(false)
    const [newCompany, setNewCompany] = useState<NewCompanyForm>({
        title: "",
        start: null,
        end: null,
        position: "",
        location: "",
        salary: "",
        company: "",
    })

    const [selectedEvent, setSelectedEvent] = useState<Company | null>(null)
    const [showEventDetails, setShowEventDetails] = useState(false)
    const [showBookmarkModal, setShowBookmarkModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)
    const [calendarDate, setCalendarDate] = useState(new Date())

    // 인증 체크
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/job-calendar')
        }
    }, [isAuthenticated, authLoading, router])

    // DTO를 Company 형태로 변환하는 함수
    const convertBookmarkToCompany = (bookmark: JobBookmarkDto): Company => {
        const jobPosting = bookmark.jobPosting;
        return {
            id: jobPosting.id.toString(),
            title: jobPosting.company || jobPosting.title,
            start: new Date(jobPosting.startDate),
            end: new Date(jobPosting.endDate),
            color: jobPosting.color || "#4f46e5",
            status: jobPosting.status.toLowerCase() as 'active' | 'expired' | 'upcoming',
            location: jobPosting.location,
            position: jobPosting.position,
            salary: jobPosting.salary,
        };
    };

    // 북마크 데이터 로드
    const loadBookmarks = async () => {
        if (!userId) return

        try {
            setLoading(true);
            setError(null);
            const bookmarks = await jobPostingApi.getBookmarksByUserId(parseInt(userId));
            const companies = bookmarks.map(convertBookmarkToCompany);
            setBookmarkedCompanies(companies);
        } catch (err) {
            console.error('북마크 로드 실패:', err);
            setError('북마크를 불러오는데 실패했습니다.');
            toast({
                title: "오류",
                description: "북마크를 불러오는데 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (isAuthenticated && userId) {
            loadBookmarks();
        }
    }, [isAuthenticated, userId]);

    // 북마크 삭제
    const handleDeleteCompany = async (id: string) => {
        if (!userId) return

        try {
            const jobPostingId = parseInt(id);
            await jobPostingApi.deleteBookmarkByUserAndJob(parseInt(userId), jobPostingId);
            setBookmarkedCompanies((prev) => prev.filter((company) => company.id !== id));
            toast({
                title: "성공",
                description: "북마크가 삭제되었습니다.",
            });
        } catch (err) {
            console.error('북마크 삭제 실패:', err);
            toast({
                title: "오류",
                description: "북마크 삭제에 실패했습니다.",
                variant: "destructive",
            });
        }
    }

    // 회사 편집
    const handleEditCompany = (company: Company) => {
        setEditingCompany({...company})
        setIsEditing(true)
        setShowEventDetails(false)
    }

    // 편집 저장
    const handleSaveEdit = async () => {
        if (!editingCompany || !userId) return

        if (!editingCompany.title.trim()) {
            toast({
                title: "입력 오류",
                description: "회사명을 입력해주세요.",
                variant: "destructive",
            });
            return
        }

        if (editingCompany.start > editingCompany.end) {
            toast({
                title: "입력 오류",
                description: "시작일은 마감일보다 앞서야 합니다.",
                variant: "destructive",
            });
            return
        }

        try {
            const jobPostingId = parseInt(editingCompany.id);
            const updateRequest = JobPostingApi.convertDatesToStrings({
                title: editingCompany.title,
                start: editingCompany.start,
                end: editingCompany.end,
                location: editingCompany.location,
                position: editingCompany.position,
                salary: editingCompany.salary,
                color: editingCompany.color,
                company: editingCompany.title,
            });

            await jobPostingApi.updateJobPosting(jobPostingId, updateRequest, parseInt(userId));

            // 로컬 상태 업데이트
            const today = new Date()
            const endDate = new Date(editingCompany.end)
            let status: 'active' | 'expired' | 'upcoming' = 'active'
            if (endDate < today) {
                status = 'expired'
            } else if (editingCompany.start > today) {
                status = 'upcoming'
            }

            const updatedCompany = {
                ...editingCompany,
                status: status
            }

            setBookmarkedCompanies((prev) =>
                prev.map((company) =>
                    company.id === editingCompany.id ? updatedCompany : company
                )
            )

            setIsEditing(false)
            setEditingCompany(null)

            toast({
                title: "성공",
                description: `${editingCompany.title} 정보가 수정되었습니다.`,
            });
        } catch (err) {
            console.error('공고 수정 실패:', err);
            toast({
                title: "오류",
                description: "공고 수정에 실패했습니다.",
                variant: "destructive",
            });
        }
    }

    // 편집 취소
    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditingCompany(null)
    }

    // 이벤트 클릭
    const handleEventClick = (company: Company) => {
        setSelectedEvent(company)
        setShowEventDetails(true)
    }

    // 회사 클릭
    const handleCompanyClick = (company: Company) => {
        setCalendarDate(new Date(company.start))
        setSelectedEvent(company)
        setShowEventDetails(true)
        setShowBookmarkModal(false)
    }

    // 공고 추가
    const handleAddCompany = async () => {
        if (!userId) return

        if (!newCompany.title.trim()) {
            toast({
                title: "입력 오류",
                description: "회사명을 입력해주세요.",
                variant: "destructive",
            });
            return
        }

        if (!newCompany.start || !newCompany.end) {
            toast({
                title: "입력 오류",
                description: "시작일과 마감일을 모두 선택해주세요.",
                variant: "destructive",
            });
            return
        }

        if (newCompany.start > newCompany.end) {
            toast({
                title: "입력 오류",
                description: "시작일은 마감일보다 앞서야 합니다.",
                variant: "destructive",
            });
            return
        }

        try {
            const colors = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"]
            const randomColor = colors[Math.floor(Math.random() * colors.length)]

            // 1. 채용공고 생성
            const createJobRequest = JobPostingApi.convertDatesToStrings({
                title: newCompany.title.trim(),
                start: newCompany.start,
                end: newCompany.end,
                location: newCompany.location,
                position: newCompany.position,
                salary: newCompany.salary,
                color: randomColor,
                company: newCompany.company || newCompany.title.trim(),
            });

            const createdJob = await jobPostingApi.createJobPosting(createJobRequest, parseInt(userId));

            // 2. 북마크 생성
            await jobPostingApi.createBookmark({
                userId: parseInt(userId),
                jobPostingId: createdJob.id,
            });

            // 3. 로컬 상태 업데이트
            const today = new Date()
            const startDate = new Date(newCompany.start)
            const endDate = new Date(newCompany.end)

            let status: 'active' | 'expired' | 'upcoming' = 'active'
            if (endDate < today) {
                status = 'expired'
            } else if (startDate > today) {
                status = 'upcoming'
            }

            const newCompanyWithId: Company = {
                id: createdJob.id.toString(),
                title: newCompany.title.trim(),
                start: startDate,
                end: endDate,
                color: randomColor,
                status: status,
                location: newCompany.location,
                position: newCompany.position,
                salary: newCompany.salary,
            }

            setBookmarkedCompanies((prev) => [...prev, newCompanyWithId])

            setNewCompany({
                title: "",
                start: null,
                end: null,
                position: "",
                location: "",
                salary: "",
                company: "",
            })
            setShowAddForm(false)

            toast({
                title: "성공",
                description: `${newCompany.title} 공고가 추가되었습니다.`,
            });
        } catch (err) {
            console.error('공고 생성 실패:', err);
            toast({
                title: "오류",
                description: "공고 추가에 실패했습니다.",
                variant: "destructive",
            });
        }
    }

    const activeCount = bookmarkedCompanies.filter(c => c.status !== 'expired').length
    const expiredCount = bookmarkedCompanies.filter(c => c.status === 'expired').length

    // 인증 로딩 중
    if (authLoading) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4 flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500"/>
                    <span className="text-gray-600 dark:text-gray-400">인증 정보 확인 중...</span>
                </div>
            </div>
        )
    }

    // 인증되지 않은 사용자
    if (!isAuthenticated || !userId) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4">
                <div className="text-center py-12">
                    <div className="text-red-500 text-lg mb-2">🔒 로그인이 필요합니다</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">공고 캘린더를 이용하려면 먼저 로그인해주세요.</p>
                    <Button onClick={() => router.push('/login')} variant="outline">
                        로그인하기
                    </Button>
                </div>
            </div>
        )
    }

    // 데이터 로딩 중
    if (loading) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4 flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500"/>
                    <span className="text-gray-600 dark:text-gray-400">북마크 로딩 중...</span>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4">
                <div className="text-center py-12">
                    <div className="text-red-500 text-lg mb-2">⚠️ 오류가 발생했습니다</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Button onClick={loadBookmarks} variant="outline">
                        다시 시도
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            ref={ref}
            initial={{opacity: 0, y: 20}}
            animate={inView ? {opacity: 1, y: 0} : {}}
            transition={{duration: 0.5}}
            className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
            {/* 헤더 */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <div className="min-w-0 flex-1"> {/* 텍스트 영역 */}
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <span className="whitespace-nowrap">📅 공고 캘린더</span>
                        {userName && (
                            <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2 whitespace-nowrap">
                    ({userName}님)
                </span>
                        )}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs sm:text-sm">
                        북마크한 채용공고의 마감일을 한눈에 확인하세요
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3 flex-shrink-0">
                    <div className="text-xs text-gray-600 dark:text-gray-400 text-center sm:text-left">
                        진행중 {activeCount}개 · 마감됨 {expiredCount}개
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        {/* 북마크 목록 버튼 */}
                        <Button
                            variant="outline"
                            onClick={() => setShowBookmarkModal(true)}
                            className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl px-4 py-2 text-sm"
                        >
                            <Bookmark className="w-4 h-4 mr-2"/>
                            공고 목록
                        </Button>

                        {/* 공고 추가 버튼 */}
                        <Button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm"
                        >
                            {showAddForm ? <X className="w-4 h-4 mr-1"/> : <Plus className="w-4 h-4 mr-1"/>}
                            {showAddForm ? "취소" : "공고 추가"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 공고 추가 폼 */}
            {showAddForm && (
                <motion.div
                    initial={{opacity: 0, height: 0}}
                    animate={{opacity: 1, height: "auto"}}
                    exit={{opacity: 0, height: 0}}
                    className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="md:col-span-2 lg:col-span-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                회사명 *
                            </label>
                            <Input
                                placeholder="예: 네이버, 카카오"
                                value={newCompany.title}
                                onChange={(e) => setNewCompany({...newCompany, title: e.target.value})}
                                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                지원 시작일 *
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                                    >
                                        <Calendar className="mr-2 h-4 w-4"/>
                                        {newCompany.start ? format(newCompany.start, "yyyy년 MM월 dd일", {locale: ko}) :
                                            <span className="text-gray-500">시작일 선택</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CustomCalendar
                                        selected={newCompany.start || undefined}
                                        onSelect={(date) => setNewCompany({...newCompany, start: date || null})}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                지원 마감일 *
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                                    >
                                        <Calendar className="mr-2 h-4 w-4"/>
                                        {newCompany.end ? format(newCompany.end, "yyyy년 MM월 dd일", {locale: ko}) :
                                            <span className="text-gray-500">마감일 선택</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CustomCalendar
                                        selected={newCompany.end || undefined}
                                        onSelect={(date) => setNewCompany({...newCompany, end: date || null})}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                포지션
                            </label>
                            <Input
                                placeholder="예: 프론트엔드 개발자"
                                value={newCompany.position}
                                onChange={(e) => setNewCompany({...newCompany, position: e.target.value})}
                                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                근무지
                            </label>
                            <Input
                                placeholder="예: 서울 강남구"
                                value={newCompany.location}
                                onChange={(e) => setNewCompany({...newCompany, location: e.target.value})}
                                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                연봉
                            </label>
                            <Input
                                placeholder="예: 3000~5000만원"
                                value={newCompany.salary}
                                onChange={(e) => setNewCompany({...newCompany, salary: e.target.value})}
                                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6"
                            onClick={handleAddCompany}
                            disabled={!newCompany.title.trim() || !newCompany.start || !newCompany.end}
                        >
                            추가하기
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* 전체 화면 캘린더 */}
            <Card className="p-6 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-2xl shadow-sm">
                <SimpleCalendar
                    currentHoverCompany={currentHoverCompany}
                    bookmarkedCompanies={bookmarkedCompanies}
                    onEventClick={handleEventClick}
                    currentDate={calendarDate}
                    onDateChange={setCalendarDate}
                />
            </Card>

            {/* 북마크 목록 모달 */}
            <Dialog open={showBookmarkModal} onOpenChange={setShowBookmarkModal}>
                <DialogContent
                    className="mx-2 w-[calc(100vw-1rem)] sm:mx-4 sm:w-[calc(100vw-2rem)] md:mx-auto md:w-full md:max-w-[400px] lg:max-w-[500px] max-h-[80vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                    style={{ maxWidth: '400px' }}>
                    <DialogHeader>
                        <DialogTitle
                            className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-100">
                            <Bookmark className="w-5 h-5 mr-2 text-indigo-500"/>
                            저장한 공고 목록
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <BookmarkList
                            companies={bookmarkedCompanies}
                            onDelete={handleDeleteCompany}
                            onCompanyMouseEnter={() => {
                            }} // 빈 함수
                            onCompanyMouseLeave={() => {
                            }} // 빈 함수
                            onCompanyClick={handleCompanyClick}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowBookmarkModal(false)}
                            className="rounded-xl"
                        >
                            닫기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 이벤트 상세 정보 모달 */}
            <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
                <DialogContent
                    className="mx-2 w-[calc(100vw-1rem)] sm:mx-4 sm:w-[calc(100vw-2rem)] md:mx-auto md:w-full md:max-w-[400px] lg:max-w-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                    {selectedEvent && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center">
                                    <div
                                        className="w-4 h-4 rounded-full mr-3"
                                        style={{backgroundColor: selectedEvent.color || "#4f46e5"}}
                                    ></div>
                                    <span className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                        {selectedEvent.title}
                                    </span>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">지원
                                            시작</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {format(selectedEvent.start, "yyyy년 MM월 dd일", {locale: ko})}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">지원
                                            마감</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {format(selectedEvent.end, "yyyy년 MM월 dd일", {locale: ko})}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">상태</p>
                                    <Badge
                                        variant="outline"
                                        className={
                                            selectedEvent.status === 'expired'
                                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        }
                                    >
                                        {selectedEvent.status === 'expired' ? '마감됨' : '지원 가능'}
                                    </Badge>
                                </div>

                                {selectedEvent.position && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">포지션</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.position}</p>
                                    </div>
                                )}

                                {selectedEvent.location && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">근무지</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.location}</p>
                                    </div>
                                )}

                                {selectedEvent.salary && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">연봉</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.salary}</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex justify-between">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
                                        onClick={() => handleEditCompany(selectedEvent)}
                                    >
                                        수정
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                        onClick={() => {
                                            handleDeleteCompany(selectedEvent.id)
                                            setShowEventDetails(false)
                                        }}
                                    >
                                        삭제
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={() => setShowEventDetails(false)}
                                    >
                                        닫기
                                    </Button>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* 편집 모달 */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent
                    className="mx-2 w-[calc(100vw-1rem)] sm:mx-4 sm:w-[calc(100vw-2rem)] md:mx-auto md:w-full md:max-w-[400px] lg:max-w-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                    style={{ maxWidth: '400px' }}>
                    {editingCompany && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                    ✏️ 공고 정보 수정
                                </DialogTitle>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                {/* 회사명 */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                        회사명 *
                                    </label>
                                    <Input
                                        value={editingCompany.title}
                                        onChange={(e) => setEditingCompany({...editingCompany, title: e.target.value})}
                                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                                    />
                                </div>

                                {/* 날짜 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                            지원 시작일 *
                                        </label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                                                >
                                                    <Calendar className="mr-2 h-4 w-4"/>
                                                    {format(editingCompany.start, "yyyy년 MM월 dd일", {locale: ko})}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CustomCalendar
                                                    selected={editingCompany.start}
                                                    onSelect={(date) => date && setEditingCompany({
                                                        ...editingCompany,
                                                        start: date
                                                    })}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div>
                                        <label
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                            지원 마감일 *
                                        </label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                                                >
                                                    <Calendar className="mr-2 h-4 w-4"/>
                                                    {format(editingCompany.end, "yyyy년 MM월 dd일", {locale: ko})}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CustomCalendar
                                                    selected={editingCompany.end}
                                                    onSelect={(date) => date && setEditingCompany({
                                                        ...editingCompany,
                                                        end: date
                                                    })}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* 포지션 */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                        포지션
                                    </label>
                                    <Input
                                        value={editingCompany.position || ''}
                                        onChange={(e) => setEditingCompany({
                                            ...editingCompany,
                                            position: e.target.value
                                        })}
                                        placeholder="예: 프론트엔드 개발자"
                                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                                    />
                                </div>

                                {/* 근무지 */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                        근무지
                                    </label>
                                    <Input
                                        value={editingCompany.location || ''}
                                        onChange={(e) => setEditingCompany({
                                            ...editingCompany,
                                            location: e.target.value
                                        })}
                                        placeholder="예: 서울 강남구"
                                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                                    />
                                </div>

                                {/* 연봉 */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                        연봉
                                    </label>
                                    <Input
                                        value={editingCompany.salary || ''}
                                        onChange={(e) => setEditingCompany({...editingCompany, salary: e.target.value})}
                                        placeholder="예: 3000~5000만원"
                                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-lg"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="rounded-xl"
                                >
                                    취소
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                    disabled={!editingCompany.title.trim()}
                                >
                                    저장
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}