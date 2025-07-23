"use client"

import {ChangeEvent, useState} from "react"
import SignupForm from "./back_join"
import LoginForm from "./front_login"
import {useSearchParams} from "next/navigation"

export default function LoginPage() {
    const searchParams = useSearchParams()
    const signupParam = searchParams.get("signup")

    // 초기값에서 바로 쿼리 파라미터 반영
    const [isFlipped, setIsFlipped] = useState(signupParam === "true")

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        userId: "",
        password: "",
        confirmPassword: "",
        phone: "",
        email: "",
        interests: [] as string[],
    })

    function handleInputChange(e: ChangeEvent<HTMLInputElement>): void {
        const {name, value} = e.target
        setFormData((prev) => ({...prev, [name]: value}))
    }

    function handleInterestChange(val: string): void {
        setFormData((prev) => {
            const interests = prev.interests.includes(val)
                ? prev.interests.filter((i) => i !== val)
                : [...prev.interests, val]
            return {...prev, interests}
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 relative overflow-auto px-4 py-4 sm:py-8">
            {/* 배경 장식 요소들 - 반응형 크기 조정 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* 모바일: 작은 크기, 데스크톱: 큰 크기 */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-10 blur-3xl animate-pulse" style={{animationDelay: "1s"}}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-80 md:h-80 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-5 blur-3xl animate-pulse" style={{animationDelay: "2s"}}></div>

                {/* 추가 장식 요소들 - 반응형 */}
                <div className="absolute top-10 right-10 w-16 h-16 md:w-32 md:h-32 bg-gradient-to-r from-violet-300 to-purple-300 rounded-full opacity-15 blur-2xl"></div>
                <div className="absolute bottom-10 left-10 w-20 h-20 md:w-40 md:h-40 bg-gradient-to-r from-pink-300 to-rose-300 rounded-full opacity-15 blur-2xl"></div>

                {/* 미묘한 점들 */}
                <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400 rounded-full opacity-20"></div>
                <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-indigo-400 rounded-full opacity-30"></div>
                <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-25"></div>
            </div>

            {/* 컨테이너 - 로그인은 중앙, 회원가입은 상단 */}
            <div className={`flex justify-center min-h-screen transition-all duration-700 ${
                isFlipped
                    ? 'items-start pt-8 sm:pt-16'
                    : 'items-center'
            }`}>
                {/* 반응형 컨테이너 - 로그인/회원가입 모두 동일한 크기 */}
                <div className="relative w-full max-w-md mx-auto z-10" style={{ perspective: '1000px' }}>
                    <div
                        className="relative w-full transition-transform duration-700"
                        style={{
                            transformStyle: "preserve-3d",
                            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        }}
                    >
                        {/* 앞면: 로그인 */}
                        <div
                            className="w-full"
                            style={{backfaceVisibility: "hidden"}}
                        >
                            <LoginForm onFlip={() => setIsFlipped(true)}/>
                        </div>

                        {/* 뒷면: 회원가입 */}
                        <div
                            className="absolute top-0 left-0 w-full"
                            style={{
                                backfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                            }}
                        >
                            <SignupForm
                                onFlip={() => setIsFlipped(false)}
                                formData={formData}
                                onChange={handleInputChange}
                                onInterestChange={handleInterestChange}
                                showPassword={showPassword}
                                showConfirmPassword={showConfirmPassword}
                                setShowPassword={setShowPassword}
                                setShowConfirmPassword={setShowConfirmPassword}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}