"use client"

import {ChangeEvent, useState} from "react"
import SignupForm from "./back_join"
import LoginForm from "./front_login"
import {useSearchParams} from "next/navigation"

export default function LoginPage() {
    const searchParams = useSearchParams()
    const signupParam = searchParams.get("signup")

    // ✅ 초기값에서 바로 쿼리 파라미터 반영
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
        <div className="flex items-center justify-center min-h-screen">
            <div className="relative perspective w-[520px]">
                <div
                    className="relative w-full transition-transform duration-700"
                    style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                >
                    {/* 앞면: 로그인 */}
                    <div
                        className="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
                        style={{backfaceVisibility: "hidden"}}
                    >
                        <LoginForm onFlip={() => setIsFlipped(true)}/>
                    </div>

                    {/* 뒷면: 회원가입 */}
                    <div
                        className="absolute left-1/2 top-1/2"
                        style={{
                            backfaceVisibility: "hidden",
                            transform: "translate(-50%, -50%) rotateY(180deg)",
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
    )
}