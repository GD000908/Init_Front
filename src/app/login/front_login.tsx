"use client"

import React, {useState} from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from 'next/navigation'

interface LoginFormProps {
    onFlip: () => void
}

export default function LoginForm({ onFlip }: LoginFormProps) {
    const router = useRouter()
    const [formData, setFormData] = useState({
        userId: "",
        password: ""
    })
    const [isLoading, setIsLoading] = useState(false)

    // 쿠키 설정 헬퍼 함수
    const setCookie = (name: string, value: string, days: number = 7) => {
        const expires = new Date()
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
    }

    async function handleLogin() {
        if (isLoading) return
        setIsLoading(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                const userData = await res.json()

                const token = userData.token;
                if (token) {
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('accessToken', token);
                    setCookie('authToken', token);
                }

                localStorage.setItem('userId', userData.id.toString())
                localStorage.setItem('userName', userData.name)
                localStorage.setItem('userRole', userData.role)

                setCookie('userId', userData.id.toString())
                setCookie('userName', userData.name)
                setCookie('userRole', userData.role)

                if (userData.role === 'ADMIN') {
                    alert(`관리자 ${userData.name}님, 환영합니다!`)
                    router.push('/admin')
                } else {
                    alert(`${userData.name}님, 환영합니다!`)
                    router.push('/dashboard')
                }

            } else {
                try {
                    const errorText = await res.text();
                    let errorMessage = "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.";

                    if (errorText && errorText.trim().length > 0) {
                        try {
                            const errorData = JSON.parse(errorText);
                            if (errorData.message) {
                                errorMessage = errorData.message;
                            }
                        } catch (jsonParseError) {
                            if (errorText.length > 0 && errorText.length < 200) {
                                errorMessage = errorText;
                            }
                        }
                    }

                    if (res.status === 401) {
                        errorMessage = "아이디 또는 비밀번호가 일치하지 않습니다.";
                    } else if (res.status === 404) {
                        errorMessage = "존재하지 않는 사용자입니다.";
                    } else if (res.status >= 500) {
                        errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
                    }

                    alert(errorMessage);

                } catch (responseError) {
                    console.error('응답 읽기 실패:', responseError);
                    alert("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
                }
            }
        } catch (err) {
            console.error('❌ 로그인 네트워크 에러:', err)
            alert("로그인 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl
                       p-4 sm:p-6 md:p-8
                       h-[600px] sm:h-[650px]
                       flex flex-col justify-center"
            style={{ backfaceVisibility: "hidden" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <Link
                href="/"
                className="logo text-3xl sm:text-4xl md:text-5xl
                         font-bold text-[#555555] text-center
                         mb-6 sm:mb-7 md:mb-8
                         hover:scale-105 transition-transform"
            >
                Init
            </Link>

            {/* ID 필드 */}
            <div className="form-floating relative mb-4 sm:mb-5">
                <input
                    type="text"
                    id="loginId"
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4
                             border border-slate-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#8b5cf6]
                             peer pt-5 sm:pt-6 bg-white/50
                             text-sm sm:text-base"
                    placeholder=" "
                    required
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <label
                    htmlFor="loginId"
                    className="absolute text-xs sm:text-sm text-slate-500
                             duration-300 transform -translate-y-3 scale-75
                             top-3 sm:top-4 left-3 sm:left-4 origin-[0]
                             peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                             peer-focus:scale-75 peer-focus:-translate-y-3"
                >
                    ID
                </label>
            </div>

            {/* Password 필드 */}
            <div className="form-floating relative mb-4 sm:mb-5">
                <input
                    type="password"
                    id="loginPw"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4
                             border border-slate-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#8b5cf6]
                             peer pt-5 sm:pt-6 bg-white/50
                             text-sm sm:text-base"
                    placeholder=" "
                    required
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <label
                    htmlFor="loginPw"
                    className="absolute text-xs sm:text-sm text-slate-500
                             duration-300 transform -translate-y-3 scale-75
                             top-3 sm:top-4 left-3 sm:left-4 origin-[0]
                             peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                             peer-focus:scale-75 peer-focus:-translate-y-3"
                >
                    Password
                </label>
            </div>

            {/* Remember me */}
            <div className="remember flex items-center justify-between mb-4 sm:mb-5">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        id="remember"
                        className="h-3 w-3 sm:h-4 sm:w-4 text-[#6366f1] focus:ring-[#6366f1] border-slate-300 rounded"
                    />
                    <span className="ml-2 text-xs sm:text-sm text-slate-700">
                        아이디 저장
                    </span>
                </label>
                <Link
                    href="/find-account"
                    className="text-xs sm:text-sm text-gray-600 hover:text-[#6366f1] transition-colors"
                >
                    아이디 · 비밀번호 찾기
                </Link>
            </div>

            {/* 로그인 버튼 */}
            <motion.button
                onClick={handleLogin}
                className="bg-[#6366f1] hover:bg-[#8b5cf6] text-white
                         py-3 sm:py-4 rounded-lg
                         mb-4 sm:mb-5
                         transition-all font-semibold disabled:opacity-50
                         text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
            >
                {isLoading ? '로그인 중...' : '로그인'}
            </motion.button>

            {/* 회원가입 이동 */}
            <div className="text-center text-xs sm:text-sm">
                <span className="text-slate-600">아직 회원이 아니신가요? </span>
                <span
                    className="text-[#6366f1] cursor-pointer hover:underline font-semibold"
                    onClick={onFlip}
                >
                    회원가입
                </span>
            </div>
        </motion.div>
    )
}