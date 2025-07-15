"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform } from "framer-motion"
import { FileText, Briefcase, Award, User } from "lucide-react"
import { useRouter } from "next/navigation"

// 무거운 컴포넌트들을 지연 로딩
const EnhancedSignupModal = dynamic(
    () => import('@/components/enhanced-signup-modal'),
    { ssr: false }
)

export default function Home() {
    const [showSignup, setShowSignup] = useState(false)
    const [activeFeature, setActiveFeature] = useState<string | null>(null)
    const { scrollYProgress } = useScroll()
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // 패럴랙스 효과만 유지
    const heroImageY = useTransform(scrollYProgress, [0, 0.5], [0, -100])

    const handleGetStarted = () => {
        router.push("/login?signup=true")
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node) && showSignup) {
                setShowSignup(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showSignup])

    // 고정된 위치 배열 (랜덤 대신)
    const floatingElements = [
        { left: 20, top: 15 },
        { left: 80, top: 25 },
        { left: 15, top: 70 },
        { left: 85, top: 80 },
        { left: 50, top: 10 },
        { left: 10, top: 45 },
        { left: 90, top: 60 },
        { left: 60, top: 85 }
    ]

    return (
        <main
            className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-x-hidden relative"
            ref={containerRef}
        >
            {/* 배경 장식 요소들 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 via-purple-500/5 to-pink-500/5" />
                <motion.div
                    className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#6366f1]/20 to-purple-500/20 rounded-full blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
                    animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.3, 1] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-[#6366f1]/10 to-indigo-500/10 rounded-full blur-3xl"
                    animate={{ x: [0, 150, -150, 0], y: [0, -100, 100, 0], scale: [1, 1.1, 0.9, 1] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* 헤더 */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-4xl font-bold text-slate-800">Init</span>
                    </motion.div>
                    <motion.nav
                        className="hidden md:flex items-center gap-8"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <a href="#about" className="text-slate-600 hover:text-[#6366f1] transition-colors">소개</a>
                        <a href="#features" className="text-slate-600 hover:text-[#6366f1] transition-colors">기능</a>
                        <a href="#vision" className="text-slate-600 hover:text-[#6366f1] transition-colors">비전</a>
                    </motion.nav>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                        <Link href="/login">
                            <button className="inline-flex items-center px-4 py-2 text-slate-600 hover:text-[#6366f1] hover:bg-blue-50 transition-all rounded-md">
                                <User className="h-5 w-5 mr-2" />
                                로그인
                            </button>
                        </Link>
                    </motion.div>
                </div>
            </header>

            {/* 회원가입 모달 */}
            {showSignup && <EnhancedSignupModal isOpen={showSignup} onClose={() => setShowSignup(false)} />}

            {/* 히어로 섹션 */}
            <section className="relative h-screen flex items-center overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(53,106,228,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(53,106,228,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

                    {/* 고정된 위치 사용으로 hydration 에러 방지 */}
                    {floatingElements.map((element, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{ left: `${element.left}%`, top: `${element.top}%` }}
                            animate={{ y: [0, -30, 0], rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                            transition={{ duration: 15 + i * 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                        >
                            {i % 3 === 0 && <div className="w-4 h-4 bg-gradient-to-br from-[#6366f1]/30 to-purple-500/30 rounded-full" />}
                            {i % 3 === 1 && <div className="w-6 h-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rotate-45" />}
                            {i % 3 === 2 && <div className="w-3 h-8 bg-gradient-to-b from-[#6366f1]/25 to-indigo-500/25 rounded-full" />}
                        </motion.div>
                    ))}
                </div>

                <div className="container mx-auto px-4 z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="text-center md:text-left">
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                                <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
                                    이력서 관리의 <br />
                                    <span className="text-[#6366f1] relative">
                                        새로운 시작
                                        <motion.span
                                            className="absolute bottom-0 left-0 w-full h-1 bg-[#6366f1]"
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 1, delay: 1 }}
                                        />
                                    </span>
                                </h1>
                            </motion.div>
                            <motion.p
                                className="text-lg text-slate-600 mb-8 max-w-lg mx-auto md:mx-0"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                            >
                                이력서와 자소서를 한 곳에서 관리하고, 원하는 회사 공고에 빠르게 지원하세요. 더 이상 지원할 때마다 새로 작성할 필요가 없습니다.
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                            >
                                <button
                                    className="bg-[#6366f1] hover:bg-[#8b5cf6] text-white px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                                    onClick={handleGetStarted}
                                >
                                    시작하기
                                </button>
                            </motion.div>
                        </div>
                        <motion.div
                            className="relative h-[400px] md:h-[500px] hidden md:block"
                            style={{ y: heroImageY }}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.3 }}
                        >
                            <div className="relative w-full h-full">
                                <motion.div
                                    className="absolute inset-0 bg-white/80 rounded-2xl shadow-2xl transform"
                                    animate={{ rotateY: [0, 5, 0, -5, 0], rotateX: [0, -5, 0, 5, 0] }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <div className="p-6 h-full flex flex-col">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-3 h-3 rounded-full bg-red-400" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                            <div className="w-3 h-3 rounded-full bg-green-400" />
                                        </div>
                                        <div className="flex-1 flex flex-col gap-4">
                                            <div className="h-6 bg-slate-200 rounded-md w-3/4" />
                                            <div className="h-3 bg-slate-200 rounded-md w-full" />
                                            <div className="h-3 bg-slate-200 rounded-md w-5/6" />
                                            <div className="h-3 bg-slate-200 rounded-md w-4/6" />
                                            <div className="h-16 bg-slate-200 rounded-md w-full mt-4" />
                                            <div className="h-16 bg-slate-200 rounded-md w-full" />
                                        </div>
                                    </div>
                                </motion.div>
                                <motion.div
                                    className="absolute inset-0 bg-white/80 rounded-2xl shadow-2xl transform translate-x-6 translate-y-6"
                                    animate={{ rotateY: [0, -5, 0, 5, 0], rotateX: [0, 5, 0, -5, 0] }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                >
                                    <div className="p-6 h-full flex flex-col">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-3 h-3 rounded-full bg-red-400" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                            <div className="w-3 h-3 rounded-full bg-green-400" />
                                        </div>
                                        <div className="flex-1 flex flex-col gap-4">
                                            <div className="h-6 bg-slate-200 rounded-md w-2/3" />
                                            <div className="h-3 bg-slate-200 rounded-md w-full" />
                                            <div className="h-3 bg-slate-200 rounded-md w-4/5" />
                                            <div className="h-3 bg-slate-200 rounded-md w-3/4" />
                                            <div className="h-16 bg-slate-200 rounded-md w-full mt-4" />
                                            <div className="h-16 bg-slate-200 rounded-md w-full" />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 소개 섹션 - 첫 번째로 이동 */}
            <section id="about" className="py-20 bg-white/60 backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-gradient-to-l from-[#6366f1]/5 to-indigo-500/5" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Init은 취업 준비 과정에서 누구나 한 번쯤 겪는 불편함에서 출발했습니다.</h2>
                            <p className="text-lg text-slate-600">
                                사람인, 잡플래닛, 원티드, 링크드인 등 수많은 취업 플랫폼이 있지만, 기업마다 공고를 올리는 사이트가 다르기 때문에 취준생은 여러 플랫폼에 가입하고, 같은 내용을 반복해서 작성해야 했습니다.
                                “내 스펙을 어디에 적었더라?”
                                “자소서는 어느 사이트에 저장했지?”
                                이처럼 흩어진 정보와 반복적인 작업 속에서, 비효율적인 취업 준비가 이어졌습니다.
                            </p>
                            <p className="text-lg text-slate-600">
                                Init은 이러한 문제를 해결하기 위해 만들어졌습니다.
                                이력서, 자소서, 스펙을 한 곳에 정리하고, 필요할 때마다 꺼내 보고, 복사하거나 공유할 수 있도록 돕는 플랫폼입니다.
                                Init이 여러분의 스펙 정리를 단순하게, 취업 준비를 효율적으로 만들어 드립니다.
                            </p>
                        </motion.div>

                        <motion.div
                            className="relative h-[400px] rounded-xl overflow-hidden shadow-xl"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: false }}
                        >
                            <div className="w-full h-full bg-gradient-to-br flex items-center justify-center">
                                <div className="text-center">
                                    <img src={"/intro.png"} alt={"introduce image"}/>
                                </div>
                            </div>

                            <motion.div
                                className="absolute bottom-6 left-6 right-6 text-white"
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                viewport={{ once: false }}
                            >
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 기능 소개 섹션 - 두 번째로 이동 */}
            <section id="features" className="py-20 bg-white/70 backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/5 to-purple-500/5" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">주요 기능</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Init은 취업 준비의 모든 과정을 더 쉽고 효율적으로 만들어 드립니다.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            className="relative h-[400px] rounded-xl overflow-hidden shadow-2xl"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center p-4">
                                <div className="text-center w-full h-full flex flex-col items-center justify-center">
                                    {activeFeature === "resume" && (
                                        <img src="/job.png" alt="맞춤 공고" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                                    )}
                                    {activeFeature === "template" && (
                                        <img src="/resume.png" alt="이력서 템플릿" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                                    )}
                                    {activeFeature === "dashboard" && (
                                        <img src="/dash.png" alt="스펙 대시보드" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                                    )}
                                    {activeFeature === "community" && (
                                        <img src="/community.png" alt="커뮤니티" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                                    )}
                                    {!activeFeature && (
                                        <div className="text-blue-800">
                                            <FileText className="h-20 w-20 mx-auto mb-4" />
                                            <p className="text-lg font-medium">Init 기능</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <div
                                className="flex gap-4 cursor-pointer"
                                onMouseEnter={() => setActiveFeature("resume")}
                                onMouseLeave={() => setActiveFeature(null)}
                            >
                                <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-[#6366f1]" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold text-slate-800 mb-2">맞춤형 이력서</h4>
                                    <p className="text-slate-600">
                                        지원하는 회사와 직무에 맞게 이력서를 쉽게 커스터마이징할 수 있습니다.
                                    </p>
                                </div>
                            </div>

                            <div
                                className="flex gap-4 cursor-pointer"
                                onMouseEnter={() => setActiveFeature("template")}
                                onMouseLeave={() => setActiveFeature(null)}
                            >
                                <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Briefcase className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold text-slate-800 mb-2">자소서 템플릿</h4>
                                    <p className="text-slate-600">자주 사용하는 자기소개서 항목을 템플릿으로 저장하고 재사용하세요.</p>
                                </div>
                            </div>

                            <div
                                className="flex gap-4 cursor-pointer"
                                onMouseEnter={() => setActiveFeature("dashboard")}
                                onMouseLeave={() => setActiveFeature(null)}
                            >
                                <div className="flex-shrink-0 h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <Award className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold text-slate-800 mb-2">스펙 대시보드</h4>
                                    <p className="text-slate-600">나의 스펙과 이력서 현황을 한눈에 보고 부족한 부분을 파악할 수 있습니다.</p>
                                </div>
                            </div>

                            <div
                                className="flex gap-4 cursor-pointer"
                                onMouseEnter={() => setActiveFeature("community")}
                                onMouseLeave={() => setActiveFeature(null)}
                            >
                                <div className="flex-shrink-0 h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold text-slate-800 mb-2">커뮤니티</h4>
                                    <p className="text-slate-600">같은 목표를 가진 취업 준비생들과 정보를 공유하고 서로 응원할 수 있습니다.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 비전 섹션 - 세 번째로 이동 */}
            <section id="vision" className="scroll-mt-32 py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-purple-50/80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(53,106,228,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.1),transparent_50%)]" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-[900px] mx-auto text-center">
                        <motion.h2
                            className="text-3xl md:text-4xl font-bold text-slate-800 mb-6"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            우리의 비전
                        </motion.h2>

                        <motion.p
                            className="text-xl text-slate-600 mb-12 text-center leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            Init은 취업 준비생들이 자신의 역량을 가장 효과적으로 표현할 수 있도록 돕는 것을 목표로 합니다.<br />
                            복잡한 취업 준비 과정을 단순화하고, 지원자들이 자신의 강점에 집중할 수 있는 환경을 제공합니다.
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        {[
                            { title: "효율성", desc: "반복적인 작업을 줄이고 지원 과정을 간소화하여 시간을 절약합니다." },
                            { title: "맞춤화", desc: "각 회사와 직무에 맞는 최적의 이력서와 자소서를 준비할 수 있습니다." },
                            { title: "성장", desc: "지원 과정에서 얻은 피드백과 합격자들과의 소셜을 통해 지속적으로 성장할 수 있습니다." },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                className="bg-white p-8 rounded-xl shadow-lg"
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                            >
                                <h3 className="text-xl font-bold text-slate-800 mb-4">{item.title}</h3>
                                <p className="text-slate-600">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* 비전 섹션 마지막에 시작하기 버튼 추가 */}
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">지금 바로 시작해보세요!</h3>
                        <p className="text-lg text-slate-600 mb-8">
                            Init과 함께 더 효율적인 취업 준비를 시작하세요. 몇 분만에 가입하고 바로 이용할 수 있습니다.
                        </p>
                        <motion.button
                            className="bg-[#6366f1] hover:bg-[#8b5cf6] text-white px-10 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                            onClick={handleGetStarted}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            무료로 시작하기
                        </motion.button>
                    </motion.div>
                </div>
            </section>

            {/* 푸터 */}
            <footer className="py-12 bg-slate-800 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-2 mb-6 md:mb-0">
                            <span className="text-3xl font-bold">Init</span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <a href="#" className="text-slate-300 hover:text-white transition-colors">이용약관</a>
                            <a href="#" className="text-slate-300 hover:text-white transition-colors">개인정보처리방침</a>
                            <a href="#" className="text-slate-300 hover:text-white transition-colors">문의하기</a>
                        </div>
                    </div>
                    <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
                        <p>© 2025 Init. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </main>
    )
}