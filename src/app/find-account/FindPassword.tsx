"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Lock, CheckCircle, AlertCircle, Eye, EyeOff, Shield } from "lucide-react"
import { findAccountApi } from "@/lib/find-account-api"

type Step = "input" | "verify" | "reset" | "complete"

export default function FindPassword() {
    const [step, setStep] = useState<Step>("input")
    const [formData, setFormData] = useState({
        userId: "",
        email: "",
        verificationCode: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // 비밀번호 유효성 검사
    const isPasswordValid =
        formData.newPassword.length >= 8 &&
        /[a-zA-Z]/.test(formData.newPassword) &&
        /\d/.test(formData.newPassword) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)

    const isPasswordMatch = formData.newPassword === formData.confirmPassword

    // 1단계: 아이디, 이메일 입력 및 인증 코드 발송
    const handleSendCode = async () => {
        if (!formData.userId || !formData.email) {
            setError("아이디와 이메일을 모두 입력해주세요.")
            return
        }

        if (!formData.email.includes("@")) {
            setError("올바른 이메일 형식을 입력해주세요.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            await findAccountApi.sendPasswordResetCode(formData.userId, formData.email);
            setStep("verify")
            setError("")
        } catch (error) {
            console.error("인증 코드 발송 오류:", error)

            let errorMessage = "인증 코드 발송에 실패했습니다.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    // 2단계: 인증 코드 확인
    const handleVerifyCode = async () => {
        if (!formData.verificationCode || formData.verificationCode.length !== 6) {
            setError("인증 코드 6자리를 모두 입력해주세요.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            await findAccountApi.verifyPasswordResetCode(formData.userId, formData.email, formData.verificationCode);
            setStep("reset")
            setError("")
        } catch (error) {
            console.error("인증 코드 확인 오류:", error)

            let errorMessage = "인증 코드 확인에 실패했습니다.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    // 3단계: 새 비밀번호 설정
    const handleResetPassword = async () => {
        if (!isPasswordValid) {
            setError("비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다.")
            return
        }

        if (!isPasswordMatch) {
            setError("비밀번호가 일치하지 않습니다.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            await findAccountApi.resetPassword(formData.userId, formData.email, formData.newPassword);
            setStep("complete")
            setError("")
        } catch (error) {
            console.error("비밀번호 재설정 오류:", error)

            let errorMessage = "비밀번호 재설정에 실패했습니다.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setStep("input")
        setFormData({
            userId: "",
            email: "",
            verificationCode: "",
            newPassword: "",
            confirmPassword: ""
        })
        setError("")
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="text-center">
                <Lock className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">비밀번호 찾기</h3>
                <div className="flex justify-center space-x-2 mb-4">
                    {["input", "verify", "reset", "complete"].map((stepName, index) => (
                        <div
                            key={stepName}
                            className={`w-3 h-3 rounded-full transition-colors ${
                                ["input", "verify", "reset", "complete"].indexOf(step) >= index
                                    ? "bg-indigo-500"
                                    : "bg-gray-300"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-3 mx-2 sm:mx-0"
                >
                    <p className="text-sm text-red-600 text-center break-words">{error}</p>
                </motion.div>
            )}

            {/* 1단계: 계정 정보 입력 */}
            {step === "input" && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 px-2 sm:px-0"
                >
                    <p className="text-sm text-gray-600 text-center px-4">
                        아이디와 가입한 이메일을 입력해주세요
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            아이디
                        </label>
                        <input
                            type="text"
                            value={formData.userId}
                            onChange={(e) => setFormData({...formData, userId: e.target.value})}
                            placeholder="아이디를 입력하세요"
                            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            이메일
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="example@email.com"
                            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                        />
                    </div>

                    <motion.button
                        onClick={handleSendCode}
                        disabled={isLoading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLoading ? "발송 중..." : "인증 코드 발송"}
                    </motion.button>
                </motion.div>
            )}

            {/* 2단계: 인증 코드 확인 */}
            {step === "verify" && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 px-2 sm:px-0"
                >
                    <div className="text-center">
                        <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 px-4">
                            <span className="font-semibold text-indigo-500 break-all">{formData.email}</span>로<br/>
                            인증 코드가 발송되었습니다
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            인증 코드 (6자리)
                        </label>
                        <input
                            type="text"
                            value={formData.verificationCode}
                            onChange={(e) => setFormData({...formData, verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                            placeholder="000000"
                            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-xl sm:text-2xl font-mono tracking-wider"
                            maxLength={6}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setStep("input")}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                        >
                            이전
                        </button>
                        <motion.button
                            onClick={handleVerifyCode}
                            disabled={isLoading || formData.verificationCode.length !== 6}
                            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLoading ? "확인 중..." : "확인"}
                        </motion.button>
                    </div>

                    <button
                        onClick={handleSendCode}
                        className="w-full text-sm text-gray-500 hover:text-indigo-500 py-2 transition-colors"
                    >
                        인증 코드를 받지 못하셨나요? 다시 발송
                    </button>
                </motion.div>
            )}

            {/* 3단계: 새 비밀번호 설정 */}
            {step === "reset" && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 px-2 sm:px-0"
                >
                    <div className="text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 px-4">
                            인증이 완료되었습니다<br/>
                            새로운 비밀번호를 설정해주세요
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            새 비밀번호
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.newPassword}
                                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                placeholder="8자 이상, 영문+숫자+특수문자"
                                className="w-full px-3 sm:px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {formData.newPassword && (
                            <div className="mt-2 space-y-1 text-xs">
                                <div className={`flex items-center gap-2 ${formData.newPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formData.newPassword.length >= 8 ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                    <span>8자 이상</span>
                                </div>
                                <div className={`flex items-center gap-2 ${isPasswordValid ? 'text-green-600' : 'text-red-600'}`}>
                                    {isPasswordValid ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                    <span>영문, 숫자, 특수문자 포함</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            비밀번호 확인
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                placeholder="비밀번호를 다시 입력하세요"
                                className="w-full px-3 sm:px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {formData.confirmPassword && (
                            <div className="mt-1 text-xs flex items-center gap-2">
                                {isPasswordMatch ? (
                                    <>
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        <span className="text-green-600">비밀번호가 일치합니다</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3 h-3 text-red-500" />
                                        <span className="text-red-600">비밀번호가 일치하지 않습니다</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <motion.button
                        onClick={handleResetPassword}
                        disabled={isLoading || !isPasswordValid || !isPasswordMatch}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLoading ? "변경 중..." : "비밀번호 변경"}
                    </motion.button>
                </motion.div>
            )}

            {/* 4단계: 완료 */}
            {step === "complete" && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4 px-2 sm:px-0"
                >
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                    <div>
                        <h4 className="text-xl font-semibold text-gray-800 mb-2">
                            비밀번호 변경 완료!
                        </h4>
                        <p className="text-sm text-gray-600">
                            새로운 비밀번호로 로그인해주세요
                        </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700 break-all">
                            🔐 <span className="font-semibold">{formData.userId}</span> 계정의<br/>
                            비밀번호가 성공적으로 변경되었습니다
                        </p>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => window.location.href = "/login"}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                        >
                            로그인하러 가기
                        </button>
                        <button
                            onClick={resetForm}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                        >
                            다른 계정 찾기
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}