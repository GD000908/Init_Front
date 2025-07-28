"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { motion, AnimatePresence, animate } from "framer-motion"
import {
    User, Edit, Plus, X, ChevronDown,
    Target, CheckCircle,
    AlertCircle, Star, Edit2, Loader2,
    PieChart as PieChartIcon, TrendingUp, Briefcase, ArrowRight,
    Award, Camera, Link, Languages, GraduationCap, Trash2,
    Shield
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import EnhancedJobRecommendations from '@/components/EnhancedJobRecommendations'

// API 기본 URL
const API_BASE_URL = "https://initback-production-67bf.up.railway.app/api/home";

// 유틸리티 함수
const cn = (...inputs: (string | undefined | null | boolean)[]) => {
    const classes = inputs.filter(Boolean);
    return classes.join(' ');
}

// 타입 정의
interface ProfileData {
    id?: number;
    userId?: number;
    name: string;
    email: string;
    careerType: string;
    jobTitle: string;
    isMatching?: boolean;
}

interface ConditionsData {
    id?: number;
    userId?: number;
    jobs: string[];
    locations: string[];
    salary: string;
    others: string[];
}

interface ApplicationData {
    id: number;
    userId?: number;
    company: string;
    category: string;
    status: string;
    deadline?: string;
}

interface StatsData {
    totalApplications: number;
    documentPassed: number;
    finalPassed: number;
    rejected: number;
    resumeCount: number;
    coverLetterCount: number;
    bookmarkedCompanies: number;
    deadlinesApproaching: number;
    profileCompletion: ProfileCompletionData;
}

interface ProfileCompletionData {
    basicInfo: boolean;
    desiredConditions: boolean;
    workExperience: boolean;
    education: boolean;
    certificate: boolean;
    language: boolean;
    skill: boolean;
    link: boolean;
    military: boolean;
    portfolio: boolean;
    completionPercentage: number;
}

// 토큰 관리 유틸리티
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('No authentication token found');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// 에러 처리 헬퍼
const handleApiError = async (response: Response) => {
    console.log('🔍 API 응답 상태 확인:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
    });

    if (response.status === 401) {
        console.log('🚫 인증 만료, 로그인 페이지로 이동');
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        window.location.href = '/login';
        throw new Error('Authentication failed');
    }

    if (response.ok) {
        console.log('✅ API 응답 성공');
        return;
    }

    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
        const errorText = await response.text();
        if (errorText) {
            errorMessage = errorText;
        }
    } catch (e) {
        console.warn('에러 메시지 파싱 실패:', e);
    }

    console.error('❌ API 에러:', errorMessage);
    throw new Error(errorMessage);
};

// API 함수들 (공고 관련 제거)
const api = {
    // Profile
    getProfile: async (userId: number): Promise<ProfileData> => {
        const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
            headers: getAuthHeaders()
        });
        await handleApiError(response);
        return response.json();
    },

    updateProfile: async (userId: number, data: ProfileData): Promise<ProfileData> => {
        const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        await handleApiError(response);
        return response.json();
    },

    // Conditions
    getConditions: async (userId: number): Promise<ConditionsData> => {
        const response = await fetch(`${API_BASE_URL}/conditions/${userId}`, {
            headers: getAuthHeaders()
        });
        await handleApiError(response);
        return response.json();
    },

    updateConditions: async (userId: number, data: ConditionsData): Promise<ConditionsData> => {
        const response = await fetch(`${API_BASE_URL}/conditions/${userId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        await handleApiError(response);
        return response.json();
    },

    // Applications
    getApplications: async (userId: number): Promise<ApplicationData[]> => {
        const response = await fetch(`${API_BASE_URL}/applications/${userId}`, {
            headers: getAuthHeaders()
        });
        await handleApiError(response);
        return response.json();
    },

    updateApplicationsBatch: async (userId: number, applications: ApplicationData[]): Promise<ApplicationData[]> => {
        console.log('📤 지원현황 일괄 업데이트 API 호출:', {
            userId,
            count: applications.length
        });

        const response = await fetch(`${API_BASE_URL}/applications/batch/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(applications)
        });

        await handleApiError(response);
        const result = await response.json();

        console.log('✅ 지원현황 일괄 업데이트 응답:', {
            userId,
            requestCount: applications.length,
            resultCount: result.length
        });

        return result;
    },

    // Stats
    getStats: async (userId: number): Promise<StatsData> => {
        const response = await fetch(`${API_BASE_URL}/stats/${userId}`, {
            headers: getAuthHeaders()
        });
        await handleApiError(response);
        return response.json();
    },

    // All data
    getAllData: async (userId: number) => {
        const response = await fetch(`${API_BASE_URL}/all/${userId}`, {
            headers: getAuthHeaders()
        });
        await handleApiError(response);
        return response.json();
    }
};

// --- 최적화된 기본 컴포넌트들 ---
const Card = React.memo(React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "rounded-2xl bg-white border border-gray-100 dark:bg-gray-900/50 dark:border-gray-800 shadow-sm backdrop-blur-sm",
                className
            )}
            {...props}
        />
    )
))
Card.displayName = "Card"

const Button = React.memo(React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "ghost" | "secondary"
    size?: "sm" | "md" | "lg" | "icon"
}
>(({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const variants = {
        default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
        outline: "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
        ghost: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
        secondary: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    }

    const sizes = {
        sm: "px-3 py-1.5 text-sm h-8",
        md: "px-4 py-2 text-sm h-10",
        lg: "px-6 py-3 text-base h-12",
        icon: "h-10 w-10"
    }

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            ref={ref}
            {...props}
        >
            {children}
        </button>
    )
}))
Button.displayName = "Button"

const Input = React.memo(React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input
            className={cn(
                "flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200",
                className
            )}
            ref={ref}
            {...props}
        />
    )
))
Input.displayName = "Input"

const Select = React.memo(React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, ...props }, ref) => (
        <select
            ref={ref}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    )
));
Select.displayName = "Select";

const Switch = React.memo(React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void; }
>(({ className, checked = false, onCheckedChange, ...props }, ref) => {
    return (
        <button
            className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-gray-900",
                checked ? 'bg-indigo-600 shadow-md' : 'bg-gray-200 dark:bg-gray-700'
            )}
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange?.(!checked)}
            ref={ref}
            {...props}
        >
            <motion.span
                className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
                animate={{ x: checked ? '1.25rem' : '0.125rem' }}
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
            />
        </button>
    );
}));
Switch.displayName = "Switch"

const Badge = React.memo(React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "outline" | "danger" | "warning" | "success" }>(
    ({ className, variant = "default", ...props }, ref) => {
        const variants = {
            default: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
            outline: "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300",
            danger: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
            warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
            success: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200",
                    variants[variant],
                    className
                )}
                {...props}
            />
        )
    }
))
Badge.displayName = "Badge"

// 최적화된 애니메이션 카운터 컴포넌트
const AnimatedCounter = ({ end, label, duration = 1.5, delay = 0 }: {
    end: number, label: string, duration?: number, delay?: number
}) => {
    const nodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;

        const controls = animate(0, end, {
            duration,
            delay,
            ease: "easeOut",
            onUpdate(value) {
                node.textContent = Math.round(value).toString();
            }
        });

        return () => controls.stop();
    }, [end, duration, delay]);

    return (
        <div className="text-center">
            <div ref={nodeRef} className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                0
            </div>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
    );
};

// --- 페이지 컴포넌트들 (메모이제이션 적용) ---
const ProfileCard = React.memo(({ profile, onEdit }: { profile: ProfileData, onEdit: () => void }) => {
    const [isMatching] = useState(profile.isMatching ?? true)
    return (
        <Card className="p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-full -mr-32 -mt-32 opacity-60"></div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between relative z-10">
                <div className="flex items-center">
                    <div className="relative">
                        <div className="w-16 h-16 overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-2xl shadow-lg flex items-center justify-center text-white">
                            <span className="text-2xl font-bold">{profile.name.charAt(0)}</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="ml-4">
                        <div className="flex items-center">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{profile.name}</h2>
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span>{profile.careerType}</span>
                            <span className="mx-2">•</span>
                            <span>{profile.jobTitle}</span>
                        </div>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={onEdit} className="mt-4 md:mt-0 shadow-sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    프로필 수정
                </Button>
            </div>
        </Card>
    )
});
ProfileCard.displayName = "ProfileCard";

const DesiredConditionsCard = React.memo(({ conditions, onEdit }: { conditions: ConditionsData, onEdit: () => void }) => {
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">희망 조건</h3>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-indigo-600" onClick={onEdit}>
                    <Edit className="w-4 h-4" />
                </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">직군 • 직무</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{conditions.jobs.join(', ')}</p>
                </div>
                <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">근무 지역</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{conditions.locations.join(', ')}</p>
                </div>
                <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">연봉</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{conditions.salary}만원 이상</p>
                </div>
                <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">기타 희망사항</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{conditions.others.join(', ')}</p>
                </div>
            </div>
        </Card>
    )
});
DesiredConditionsCard.displayName = "DesiredConditionsCard";

const ProfileCompletion = React.memo(({ profileCompletion }: { profileCompletion?: ProfileCompletionData }) => {
    const [progress, setProgress] = useState(0)
    const [isExpanded, setIsExpanded] = useState(false)

    const completionItems = [
        { icon: User, name: '기본 정보', completed: profileCompletion?.basicInfo ?? false, color: 'text-blue-500' },
        { icon: Target, name: '희망 조건', completed: profileCompletion?.desiredConditions ?? false, color: 'text-indigo-500' },
        { icon: Briefcase, name: '업무 경력', completed: profileCompletion?.workExperience ?? false, color: 'text-purple-500' },
        { icon: GraduationCap, name: '학력', completed: profileCompletion?.education ?? false, color: 'text-green-500' },
        { icon: Award, name: '자격증', completed: profileCompletion?.certificate ?? false, color: 'text-yellow-500' },
        { icon: Languages, name: '외국어', completed: profileCompletion?.language ?? false, color: 'text-red-500' },
        { icon: Star, name: '스킬', completed: profileCompletion?.skill ?? false, color: 'text-pink-500' },
        { icon: Link, name: '링크', completed: profileCompletion?.link ?? false, color: 'text-cyan-500' },
        { icon: Shield, name: '병역', completed: profileCompletion?.military ?? false, color: 'text-orange-500' },
        { icon: Camera, name: '프로젝트', completed: profileCompletion?.portfolio ?? false, color: 'text-teal-500' },
    ];

    const completedCount = completionItems.filter(item => item.completed).length

    useEffect(() => {
        const timer = setTimeout(() => {
            setProgress(profileCompletion?.completionPercentage ?? 0)
        }, 500)
        return () => clearTimeout(timer)
    }, [profileCompletion])

    return (
        <Card className="overflow-hidden">
            <div
                className="p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">프로필 완성도</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-indigo-600">{Math.round(progress)}%</span>
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                        </motion.div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">전체 완성도</span>
                        <span className="text-gray-500 font-medium">{completedCount}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <motion.div
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full shadow-sm"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="border-t border-gray-100 dark:border-gray-800"
                    >
                        <div className="p-6 pt-4">
                            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">전체 항목</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {completionItems.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl transition-all duration-200 group",
                                            item.completed
                                                ? "bg-gray-50 dark:bg-gray-800/50"
                                                : "bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg", item.completed ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-gray-200 dark:bg-gray-700")}>
                                                <item.icon className={cn("w-4 h-4", item.color)} />
                                            </div>
                                            <span className={cn( "font-medium", "text-sm text-gray-700 dark:text-gray-300")}>
                                                {item.name}
                                            </span>
                                        </div>
                                        {item.completed && (<CheckCircle className="w-5 h-5 text-green-500" />)}
                                    </motion.div>
                                ))}
                            </div>
                            <div className="mt-6 text-center">
                                <Button className="shadow-md" onClick={() => window.location.href = '/spec-management'}>
                                    프로필 작성하러 가기
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    )
});
ProfileCompletion.displayName = "ProfileCompletion";

const StatsSection = React.memo(({ applications, stats, onEdit }: { applications: ApplicationData[], stats?: StatsData, onEdit: () => void }) => {
    const getStatusCount = (status: string) => applications.filter(app => app.status === status).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-6 relative overflow-hidden min-h-[180px] cursor-pointer" onClick={onEdit}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100 via-blue-50 to-indigo-50 rounded-full -mr-16 -mt-16 opacity-60 dark:from-indigo-900/20 dark:via-blue-900/10 dark:to-indigo-900/10" />
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4 relative z-10">지원 현황</h3>
                <div className="grid grid-cols-4 gap-2 relative z-10">
                    <AnimatedCounter end={stats?.totalApplications ?? applications.length} label="지원 완료" />
                    <AnimatedCounter end={stats?.documentPassed ?? getStatusCount('서류 합격')} label="서류 합격" delay={0.2} />
                    <AnimatedCounter end={stats?.finalPassed ?? getStatusCount('최종 합격')} label="최종 합격" delay={0.4} />
                    <AnimatedCounter end={stats?.rejected ?? getStatusCount('불합격')} label="불합격" delay={0.6} />
                </div>
            </Card>
            <Card className="p-6 relative overflow-hidden min-h-[180px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100 via-pink-50 to-purple-50 rounded-full -mr-16 -mt-16 opacity-60 dark:from-purple-900/20 dark:via-pink-900/10 dark:to-purple-900/10" />
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4 relative z-10">나의 활동 요약</h3>
                <div className="grid grid-cols-4 gap-2 relative z-10">
                    <AnimatedCounter end={stats?.resumeCount ?? 0} label="작성한 이력서" />
                    <AnimatedCounter end={stats?.coverLetterCount ?? 0} label="완성한 자소서" delay={0.2} />
                    <AnimatedCounter end={stats?.bookmarkedCompanies ?? 0} label="저장된 기업 공고" delay={0.4} />
                    <AnimatedCounter end={stats?.deadlinesApproaching ?? 0} label="지원 마감 임박" delay={0.6} />
                </div>
            </Card>
        </div>
    )
});
StatsSection.displayName = "StatsSection";

const ChartSection = React.memo(({ applications }: { applications: ApplicationData[] }) => {
    const [chartView, setChartView] = useState<"pie" | "interest">("pie")

    const StatusChart = React.memo(() => {
        if (!applications || applications.length === 0) {
            return (
                <div className="h-[350px] w-full flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-4">
                        <PieChartIcon className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-center">지원 현황이 없습니다</p>
                        <p className="text-sm text-center mt-1">지원 현황을 추가해보세요!</p>
                    </div>
                </div>
            );
        }

        const data = [
            { name: "지원 완료", value: applications.filter(a=>a.status === '지원 완료').length, color: "#6366f1" },
            { name: "서류 합격", value: applications.filter(a=>a.status === '서류 합격').length, color: "#8b5cf6" },
            { name: "최종 합격", value: applications.filter(a=>a.status === '최종 합격').length, color: "#10b981" },
            { name: "불합격", value: applications.filter(a=>a.status === '불합격').length, color: "#f43f5e" }
        ].filter(d => d.value > 0);

        if (data.length === 0) {
            return (
                <div className="h-[350px] w-full flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-4">
                        <PieChartIcon className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-center">지원 현황이 없습니다</p>
                        <p className="text-sm text-center mt-1">지원 현황을 추가해보세요!</p>
                    </div>
                </div>
            );
        }

        const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
            cx: number;
            cy: number;
            midAngle: number;
            innerRadius: number;
            outerRadius: number;
            percent: number;
        }) => {
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            if (percent < 0.1) return null;
            return (<text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-xs font-bold drop-shadow-md">{`${(percent * 100).toFixed(0)}%`}</text>);
        };

        return (
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={100} innerRadius={40} fill="#8884d8" dataKey="value" animationDuration={1200} paddingAngle={5} cornerRadius={8}>
                            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />))}
                        </Pie>
                        <Tooltip content={({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
                            if (active && payload && payload.length) {
                                return (<div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"><p className="text-sm font-semibold">{`${payload[0].name}: ${payload[0].value}개`}</p></div>)
                            }
                            return null
                        }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center mt-4">
                    <div className="flex flex-wrap justify-center gap-4">
                        {data.map((entry, index) => (
                            <div key={`legend-${index}`} className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    })
    StatusChart.displayName = "StatusChart";

    const InterestChart = React.memo(({data}: {data: ApplicationData[]}) => {
        if (!data || data.length === 0) {
            return (
                <div className="h-[350px] w-full flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-4">
                        <TrendingUp className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-center">관심 직무 데이터가 없습니다</p>
                        <p className="text-sm text-center mt-1">지원 현황을 추가해보세요!</p>
                    </div>
                </div>
            );
        }

        const categoryCounts = data.reduce((acc, app) => {
            acc[app.category] = (acc[app.category] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});

        const chartData = Object.keys(categoryCounts).map(key => ({
            name: key,
            지원수: categoryCounts[key],
        })).sort((a, b) => b.지원수 - a.지원수);

        if (chartData.length === 0) {
            return (
                <div className="h-[350px] w-full flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-4">
                        <TrendingUp className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-center">관심 직무 데이터가 없습니다</p>
                        <p className="text-sm text-center mt-1">지원 현황을 추가해보세요!</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}}/>
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="지원수" fill="#8884d8" barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    });
    InterestChart.displayName = "InterestChart";

    return (
        <Card className="border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800/50 flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">지원 현황 분석</h3>
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <Button
                        variant={chartView === "pie" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setChartView("pie")}
                        className={cn(
                            chartView === "pie" ? "bg-white dark:bg-gray-700 shadow-sm" : "",
                            "transition-all duration-200"
                        )}
                    >
                        <PieChartIcon className="w-4 h-4 mr-1" />
                        <span>지원 현황</span>
                    </Button>
                    <Button
                        variant={chartView === "interest" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setChartView("interest")}
                        className={cn(
                            chartView === "interest" ? "bg-white dark:bg-gray-700 shadow-sm" : "",
                            "transition-all duration-200"
                        )}
                    >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>관심 직무</span>
                    </Button>
                </div>
            </div>
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {chartView === "pie" && (
                        <motion.div
                            key="pie"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <StatusChart />
                        </motion.div>
                    )}
                    {chartView === "interest" && (
                        <motion.div
                            key="interest"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <InterestChart data={applications} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    )
});
ChartSection.displayName = "ChartSection";

const Header = React.memo(({ userName }: { userName?: string }) => {
    return (
        <header className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    {userName ? `${userName}님의 이력 관리 홈` : '이력 관리 홈'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">나의 모든 취업 활동을 한눈에 확인하세요.</p>
            </div>
        </header>
    )
});
Header.displayName = "Header";

// 범용 Modal 컴포넌트
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;
    const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg m-4"
                onClick={handleContentClick}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8"><X className="w-5 h-5" /></Button>
                </div>
                <div className="p-6">{children}</div>
            </motion.div>
        </div>
    );
};

const ProfileEditModal = ({ isOpen, onClose, profileData, onSave }: { isOpen: boolean, onClose: () => void, profileData: ProfileData, onSave: (data: ProfileData) => void }) => {
    const [data, setData] = useState(profileData);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => { setData(profileData) }, [profileData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, [e.target.name]: e.target.value })
    };

    const handleSave = async () => {
        if (profileData.userId) {
            try {
                setIsLoading(true);
                const updated = await api.updateProfile(profileData.userId, data);
                onSave(updated);
                onClose();
            } catch (error) {
                console.error('Failed to update profile:', error);
                alert('프로필 수정에 실패했습니다. 다시 시도해주세요.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="프로필 수정">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이름</label>
                    <Input name="name" value={data.name} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이메일</label>
                    <Input name="email" type="email" value={data.email} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">경력</label>
                    <Input name="careerType" value={data.careerType} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">직무</label>
                    <Input name="jobTitle" value={data.jobTitle} onChange={handleChange} />
                </div>
            </div>
            <div className="flex gap-3 mt-8 justify-end">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>취소</Button>
                <Button onClick={handleSave} className="shadow-md" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    저장
                </Button>
            </div>
        </Modal>
    )
}

const DesiredConditionsEditModal = ({ isOpen, onClose, conditionsData, onSave }: { isOpen: boolean, onClose: () => void, conditionsData: ConditionsData, onSave: (data: ConditionsData) => void }) => {
    const [data, setData] = useState(conditionsData);
    const [isLoading, setIsLoading] = useState(false);

    const ALL_JOB_KEYWORDS = React.useMemo(() => [
        "사업관리", "경영", "회계", "사무", "금융", "보험", "교육", "자연과학", "사회과학",
        "법률", "경찰", "소방", "교도", "국방", "보건", "의료", "사회복지", "종교",
        "문화", "예술", "디자인", "방송", "운전", "운송", "영업", "판매", "경비", "청소",
        "이용", "숙박", "여행", "오락", "스포츠", "음식", "건설", "기계", "재료", "화학",
        "섬유", "의복", "전기", "전자", "정보통신", "IT", "개발", "프로그래머", "소프트웨어",
        "식품", "가공", "인쇄", "목재", "가구", "공예", "환경", "에너지", "안전", "농림어업"
    ], []);

    useEffect(() => { setData(conditionsData) }, [conditionsData, isOpen]);

    const handleSave = async () => {
        if (conditionsData.userId) {
            try {
                setIsLoading(true);
                const updated = await api.updateConditions(conditionsData.userId, data);
                onSave(updated);
                onClose();
            } catch (error) {
                console.error('Failed to update conditions:', error);
                alert('희망 조건 수정에 실패했습니다. 다시 시도해주세요.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const TagInput = ({ label, field, placeholder, suggestionsList }: {
        label: string,
        field: keyof ConditionsData,
        placeholder: string,
        suggestionsList?: string[]
    }) => {
        const [inputValue, setInputValue] = useState("");
        const [suggestions, setSuggestions] = useState<string[]>([]);
        const wrapperRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            function handleClickOutside(event: MouseEvent) {
                if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                    setSuggestions([]);
                }
            }
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, [wrapperRef]);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setInputValue(value);
            if (value && suggestionsList) {
                const filtered = suggestionsList.filter(item =>
                    item.toLowerCase().includes(value.toLowerCase())
                );
                setSuggestions(filtered);
            } else {
                setSuggestions([]);
            }
        };

        const handleAddItem = (item: string) => {
            const currentItems = data[field] as string[];
            if (item.trim() && !currentItems.includes(item.trim())) {
                setData({ ...data, [field]: [...currentItems, item.trim()] });
            }
            setInputValue("");
            setSuggestions([]);
        };

        const handleRemoveItem = (itemToRemove: string) => {
            const currentItems = data[field] as string[];
            setData({ ...data, [field]: currentItems.filter((item: string) => item !== itemToRemove) })
        };

        return (
            <div ref={wrapperRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
                <div className="flex flex-wrap gap-2 mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[44px] bg-gray-50 dark:bg-gray-800/50">
                    {(data[field] as string[]).map((item: string, i: number) => (
                        <Badge key={i} className="flex items-center gap-1.5 shadow-sm">
                            {item}
                            <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-100 transition-colors" onClick={() => handleRemoveItem(item)}>
                                <X size={12} />
                            </button>
                        </Badge>
                    ))}
                </div>
                <div className="relative">
                    <div className="flex gap-2">
                        <Input
                            placeholder={placeholder}
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem(inputValue)}
                        />
                        <Button size="sm" onClick={() => handleAddItem(inputValue)} className="shadow-sm"><Plus size={16} /></Button>
                    </div>
                    {suggestions.length > 0 && (
                        <motion.ul
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => handleAddItem(suggestion)}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="희망 조건 수정">
            <div className="space-y-6">
                <TagInput label="직군 • 직무" field="jobs" placeholder="직무 추가 (예: 개발)" suggestionsList={ALL_JOB_KEYWORDS} />
                <TagInput label="근무 지역" field="locations" placeholder="지역 추가" />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">희망 연봉(만원)</label>
                    <Input
                        type="number"
                        value={data.salary || ''}
                        onChange={(e) => setData({ ...data, salary: e.target.value || '0' })}
                    />
                </div>
                <TagInput label="기타 희망사항" field="others" placeholder="희망사항 추가" />
            </div>
            <div className="flex gap-3 mt-8 justify-end">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>취소</Button>
                <Button onClick={handleSave} className="shadow-md" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} 저장
                </Button>
            </div>
        </Modal>
    )
}

const ApplicationStatusModal = ({ isOpen, onClose, applications, onSave, userId }: {
    isOpen: boolean,
    onClose: () => void,
    applications: ApplicationData[],
    onSave: (data: ApplicationData[]) => void,
    userId: number
}) => {
    const [apps, setApps] = useState<ApplicationData[]>([])
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setApps(applications.map(app => ({
            ...app,
            userId: userId,
            deadline: app.deadline ? app.deadline.split('T')[0] : ''
        })));
    }, [isOpen, applications, userId])

    const handleAdd = () => {
        const newApp: ApplicationData = {
            id: -Date.now(),
            company: "",
            category: "",
            status: '지원 완료',
            userId: userId
        };
        setApps([newApp, ...apps]);
    }

    const handleRemove = (id: number) => {
        setApps(apps.filter(app => app.id !== id));
    }

    const handleUpdate = (id: number, field: keyof ApplicationData, value: string) => {
        setApps(apps.map(app => app.id === id ? {
            ...app,
            [field]: value,
            userId: userId
        } : app));
    }

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const appsWithUserId = apps.map(app => ({
                ...app,
                userId: userId
            }));

            const response = await fetch(`${API_BASE_URL}/applications/batch/${userId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(appsWithUserId)
            });

            await handleApiError(response);
            const updated = await response.json();

            onSave(updated);
            onClose();

            alert(`지원현황이 성공적으로 저장되었습니다! (${updated.length}개)`);

        } catch (error) {
            console.error('❌ ApplicationStatusModal 저장 실패:', error);
            alert('지원 현황 수정에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    }

    if (!isOpen) return null;

    const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div
            className="fixed inset-0 lg:left-[280px] bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
        >
            <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px] lg:max-w-[900px] max-h-[90vh] sm:max-h-[85vh]"
                    onClick={handleContentClick}
                >
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                                <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">지원 현황 관리</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    지원한 회사들의 현황을 관리하세요
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <Button
                                onClick={handleAdd}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl px-6 py-3 shadow-lg"
                                disabled={isLoading}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                새 지원내역 추가
                            </Button>
                        </div>

                        {apps.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg mb-2">등록된 지원내역이 없습니다.</p>
                                <p className="text-sm">위의 버튼을 클릭해서 지원내역을 추가해보세요.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {apps.map(app => (
                                    <motion.div
                                        key={app.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-10 gap-2 sm:gap-3 items-end">
                                            <div className="sm:col-span-3">
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    회사명
                                                </label>
                                                <Input
                                                    placeholder="예: 네이버"
                                                    value={app.company}
                                                    onChange={e => handleUpdate(app.id, 'company', e.target.value)}
                                                    className="rounded-lg border-gray-300 dark:border-gray-600"
                                                />
                                            </div>

                                            <div className="sm:col-span-3">
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    직무
                                                </label>
                                                <Input
                                                    placeholder="예: 프론트엔드"
                                                    value={app.category}
                                                    onChange={e => handleUpdate(app.id, 'category', e.target.value)}
                                                    className="rounded-lg border-gray-300 dark:border-gray-600"
                                                />
                                            </div>

                                            <div className="sm:col-span-3">
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    상태
                                                </label>
                                                <Select
                                                    value={app.status}
                                                    onChange={e => handleUpdate(app.id, 'status', e.target.value)}
                                                    className="rounded-lg border-gray-300 dark:border-gray-600 text-sm"
                                                >
                                                    <option value="지원 완료">지원 완료</option>
                                                    <option value="서류 합격">서류 합격</option>
                                                    <option value="최종 합격">최종 합격</option>
                                                    <option value="불합격">불합격</option>
                                                </Select>
                                            </div>

                                            <div className="sm:col-span-1 flex justify-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-9 h-9 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => handleRemove(app.id)}
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            총 {apps.length}개의 지원내역
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                                className="rounded-xl px-6"
                            >
                                취소
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl px-6 shadow-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        저장 중...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        저장하기
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

// 메인 컴포넌트
export default function CareerLogHomePage() {
    const { userId, userName, isLoading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [conditionsData, setConditionsData] = useState<ConditionsData | null>(null);
    const [applicationData, setApplicationData] = useState<ApplicationData[]>([]);
    const [stats, setStats] = useState<StatsData | null>(null);

    const [loading, setLoading] = useState(true);
    const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
    const [isConditionsEditOpen, setIsConditionsEditOpen] = useState(false);
    const [isApplicationStatusOpen, setIsApplicationStatusOpen] = useState(false);

    // 인증 체크
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || !userId) {
                console.log('🚫 인증되지 않은 사용자, 로그인 페이지로 리다이렉트');
                router.push('/login');
                return;
            }
        }
    }, [authLoading, isAuthenticated, userId, router]);

    // 데이터 로드
    const loadData = async () => {
        if (!userId) {
            console.log('❌ userId가 없어서 데이터 로드 중단');
            return;
        }

        try {
            setLoading(true);
            console.log('📊 사용자 데이터 로드 중...', { userId });

            const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
            if (!token) {
                console.log('❌ 인증 토큰이 없음, 로그인 페이지로 이동');
                router.push('/login');
                return;
            }

            const allData = await api.getAllData(Number(userId));
            console.log('✅ 데이터 로드 완료:', allData);

            setProfileData(allData.profile || {
                name: userName || '사용자',
                email: '',
                careerType: '신입',
                jobTitle: '',
                userId: Number(userId),
                isMatching: true
            });

            setConditionsData(allData.conditions || {
                jobs: [],
                locations: [],
                salary: '0',
                others: [],
                userId: Number(userId)
            });

            setApplicationData(allData.applications || []);
            setStats(allData.stats);

        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);

            setProfileData({
                name: userName || '사용자',
                email: '',
                careerType: '신입',
                jobTitle: '',
                userId: Number(userId),
                isMatching: true
            });
            setConditionsData({
                jobs: [],
                locations: [],
                salary: '0',
                others: [],
                userId: Number(userId)
            });
            setApplicationData([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId && isAuthenticated && !authLoading) {
            loadData();
        }
    }, [userId, isAuthenticated, authLoading, userName]);

    const handleProfileSave = async (newData: ProfileData) => {
        try {
            console.log('🔄 프로필 저장 시작:', newData);
            const updatedProfile = await api.updateProfile(Number(userId), newData);
            setProfileData(updatedProfile);
            console.log('✅ 프로필 저장 및 상태 업데이트 완료:', updatedProfile);
            alert('프로필이 성공적으로 저장되었습니다!');
        } catch (error) {
            console.error('❌ 프로필 저장 실패:', error);
            alert('프로필 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleConditionsSave = async (newConditionsData: ConditionsData) => {
        try {
            console.log('🔄 희망조건 저장 시작:', newConditionsData);

            if ((!newConditionsData.jobs || newConditionsData.jobs.length === 0) &&
                profileData?.jobTitle &&
                profileData.jobTitle.trim() !== '') {
                newConditionsData.jobs = [profileData.jobTitle];
                console.log('🔧 빈 jobs에 기본 직무 설정:', newConditionsData.jobs);
            }

            const updatedConditions = await api.updateConditions(Number(userId), newConditionsData);
            setConditionsData(updatedConditions);
            console.log('✅ 희망조건 저장 및 상태 업데이트 완료:', updatedConditions);
            alert('희망 조건이 성공적으로 저장되었습니다!');
        } catch (error) {
            console.error('❌ 희망조건 저장 실패:', error);
            alert('희망 조건 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleApplicationSave = (newData: ApplicationData[]) => {
        setApplicationData(newData);
        if (userId) {
            api.getStats(Number(userId)).then(setStats);
        }
    };

    // 로딩 상태
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="flex items-center gap-2 text-lg">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ ease: "linear", duration: 1, repeat: Infinity }}
                    >
                        <Loader2 className="w-6 h-6" />
                    </motion.div>
                    {authLoading ? '인증 확인 중...' : '데이터 로딩 중...'}
                </div>
            </div>
        );
    }

    // 인증되지 않은 경우
    if (!isAuthenticated || !userId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        로그인이 필요합니다
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        대시보드를 이용하려면 먼저 로그인해주세요.
                    </p>
                    <Button onClick={() => router.push('/login')}>
                        로그인하러 가기
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-black dark:via-gray-950 dark:to-black text-gray-800 dark:text-gray-200">
            <main className="ml-0 md:ml-[280px] p-4 lg:p-8 transition-all duration-300">
                <div className="w-full space-y-6">
                    <Header userName={userName} />

                    {profileData && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                            <ProfileCard profile={profileData} onEdit={() => setIsProfileEditOpen(true)} />
                        </motion.div>
                    )}

                    {conditionsData && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                            <DesiredConditionsCard conditions={conditionsData} onEdit={() => setIsConditionsEditOpen(true)} />
                        </motion.div>
                    )}

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                        <ProfileCompletion profileCompletion={stats?.profileCompletion} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                        <StatsSection applications={applicationData} stats={stats || undefined} onEdit={() => setIsApplicationStatusOpen(true)} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
                        <ChartSection applications={applicationData} />
                    </motion.div>

                    {/* 🔥 EnhancedJobRecommendations만 사용 - 모든 공고 기능 포함 */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
                        <EnhancedJobRecommendations
                            conditions={conditionsData}
                            userId={Number(userId)}
                            isParentLoading={loading}
                        />
                    </motion.div>

                </div>
            </main>

            <AnimatePresence>
                {isProfileEditOpen && profileData && (
                    <ProfileEditModal
                        isOpen={isProfileEditOpen}
                        onClose={() => setIsProfileEditOpen(false)}
                        profileData={profileData}
                        onSave={handleProfileSave}
                    />
                )}
                {isConditionsEditOpen && conditionsData && (
                    <DesiredConditionsEditModal
                        isOpen={isConditionsEditOpen}
                        onClose={() => setIsConditionsEditOpen(false)}
                        conditionsData={conditionsData}
                        onSave={handleConditionsSave}
                    />
                )}
                {isApplicationStatusOpen && userId && (
                    <ApplicationStatusModal
                        isOpen={isApplicationStatusOpen}
                        onClose={() => setIsApplicationStatusOpen(false)}
                        applications={applicationData}
                        onSave={handleApplicationSave}
                        userId={Number(userId)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}