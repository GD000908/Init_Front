"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import FindUserId from "./FindUserId"
import FindPassword from "./FindPassword"

export default function FindAccountPage() {
    const [activeTab, setActiveTab] = useState<"userId" | "password">("userId")

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 px-4 py-8">
            <div className="w-full max-w-md">
                {/* 헤더 */}
                <div className="text-center mb-6 sm:mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-3xl sm:text-4xl font-bold text-[#555555] hover:scale-105 transition-transform">
                            Init
                        </h1>
                    </Link>
                    <p className="text-gray-600 mt-2 text-sm sm:text-base">계정 정보를 찾아보세요</p>
                </div>

                {/* 메인 카드 */}
                <motion.div
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden mx-2 sm:mx-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* 탭 헤더 */}
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab("userId")}
                            className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold transition-all ${
                                activeTab === "userId"
                                    ? "bg-indigo-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            아이디 찾기
                        </button>
                        <button
                            onClick={() => setActiveTab("password")}
                            className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold transition-all ${
                                activeTab === "password"
                                    ? "bg-indigo-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            비밀번호 찾기
                        </button>
                    </div>

                    {/* 탭 컨텐츠 */}
                    <div className="p-6 sm:p-8">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === "userId" ? (
                                <FindUserId />
                            ) : (
                                <FindPassword />
                            )}
                        </motion.div>
                    </div>
                </motion.div>

                {/* 하단 링크 */}
                <div className="text-center mt-4 sm:mt-6 space-y-2 px-4">
                    <Link
                        href="/login"
                        className="text-sm text-gray-600 hover:text-indigo-500 transition-colors block"
                    >
                        로그인으로 돌아가기
                    </Link>
                    <div className="text-xs text-gray-500">
                        계정이 없으신가요?{" "}
                        <Link
                            href="/login?signup=true"
                            className="text-indigo-500 hover:underline font-semibold"
                        >
                            회원가입
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}