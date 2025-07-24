"use client"

import React, {useState} from "react"
import {Eye, EyeOff, Check, X, Loader2} from "lucide-react"
import {authApi} from "@/lib/auth-api"
import Link from "next/link"

interface SignupFormProps {
    formData: {
        userId: string
        name: string,
        password: string
        confirmPassword: string
        phone: string
        email: string
        interests: string[]
    }
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onInterestChange: (val: string) => void
    showPassword: boolean
    showConfirmPassword: boolean
    setShowPassword: (v: boolean) => void
    setShowConfirmPassword: (v: boolean) => void
    onFlip: () => void
}

const interests = [
    "경영/기획/전략",
    "디자인/컨텐츠",
    "개발/IT",
    "마케팅/브랜딩",
    "영업/고객관리",
    "교육/강의/연구",
    "운영/사무관리",
    "생산/물류/품질관리",
    "사회/공공기관",
    "특수직",
]

// 사용 가능한 특수문자 목록
const ALLOWED_SPECIAL_CHARS = "!@#$%^&*(),.?\":{}|<>";

// 특수문자 검증을 위한 정규식
const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

function PasswordCheck({ok, label}: { ok: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2">
            {ok ? <Check className="h-3 w-3 text-green-500"/> : <X className="h-3 w-3 text-red-500"/>}
            <span className={ok ? "text-green-600" : "text-red-600"}>{label}</span>
        </div>
    )
}

// 아이디 유효성 검사 함수
function validateUserId(userId: string): { isValid: boolean; message: string } {
    if (!userId) {
        return { isValid: false, message: '' };
    }

    if (userId.length < 4) {
        return { isValid: false, message: '아이디는 4자 이상이어야 합니다.' };
    }

    if (userId.length > 12) {
        return { isValid: false, message: '아이디는 12자 이하여야 합니다.' };
    }

    // 영문과 숫자만 허용하는 정규식
    const userIdPattern = /^[a-zA-Z0-9]+$/;
    if (!userIdPattern.test(userId)) {
        return { isValid: false, message: '아이디는 영문과 숫자만 사용 가능합니다.' };
    }

    // 최소한 영문은 포함되어야 함 (순수 숫자만은 불가)
    const hasLetter = /[a-zA-Z]/.test(userId);

    if (!hasLetter) {
        return { isValid: false, message: '아이디는 최소한 영문을 포함해야 합니다.' };
    }

    return { isValid: true, message: '사용 가능한 아이디 형식입니다.' };
}

export default function SignupForm({
                                       formData,
                                       onChange,
                                       onInterestChange,
                                       showPassword,
                                       showConfirmPassword,
                                       setShowPassword,
                                       setShowConfirmPassword,
                                       onFlip,
                                   }: SignupFormProps) {

    // 중복확인 상태 관리
    const [userIdCheck, setUserIdCheck] = useState<{
        status: 'none' | 'checking' | 'available' | 'duplicate' | 'error';
        message: string;
    }>({status: 'none', message: ''});

    const [emailCheck, setEmailCheck] = useState<{
        status: 'none' | 'checking' | 'available' | 'duplicate' | 'error' | 'sent' | 'verified';
        message: string;
    }>({status: 'none', message: ''});

    const [emailVerificationCode, setEmailVerificationCode] = useState('');
    const [isSignupLoading, setIsSignupLoading] = useState(false);

    // 아이디 유효성 검사
    const userIdValidation = validateUserId(formData.userId);

    // 비밀번호 유효성 검사
    const isPasswordValid =
        formData.password.length >= 8 &&
        /[a-zA-Z]/.test(formData.password) &&
        /\d/.test(formData.password) &&
        SPECIAL_CHAR_REGEX.test(formData.password);

    const isPasswordMatch = formData.password === formData.confirmPassword;

    // 휴대폰 번호 포맷팅 함수
    const formatPhoneNumber = (value: string): string => {
        const numbers = value.replace(/[^\d]/g, '');
        const limitedNumbers = numbers.slice(0, 11);

        if (limitedNumbers.length <= 3) {
            return limitedNumbers;
        } else if (limitedNumbers.length <= 7) {
            return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
        } else {
            return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
        }
    };

    // 휴대폰 번호 유효성 검사 함수
    const validatePhoneNumber = (phone: string): boolean => {
        const numbers = phone.replace(/[^\d]/g, '');
        const phoneRegex = /^(010|011|016|017|018|019)\d{7,8}$/;
        return phoneRegex.test(numbers);
    };

    // 아이디 중복확인 함수
    const handleUserIdCheck = async () => {
        if (!userIdValidation.isValid) {
            setUserIdCheck({
                status: 'error',
                message: userIdValidation.message
            });
            return;
        }

        setUserIdCheck({status: 'checking', message: '확인 중...'});

        try {
            const isDuplicate = await authApi.checkUserIdDuplicate(formData.userId);

            if (isDuplicate) {
                setUserIdCheck({
                    status: 'duplicate',
                    message: '이미 사용중인 아이디입니다.'
                });
            } else {
                setUserIdCheck({
                    status: 'available',
                    message: '사용 가능한 아이디입니다.'
                });
            }
        } catch (error) {
            setUserIdCheck({
                status: 'error',
                message: error instanceof Error ? error.message : '확인 중 오류가 발생했습니다.'
            });
        }
    };

    // 이메일 인증번호 발송 함수
    const handleEmailVerificationSend = async () => {
        if (!formData.email || !formData.email.includes('@')) {
            setEmailCheck({
                status: 'error',
                message: '올바른 이메일을 입력해주세요.'
            });
            return;
        }

        setEmailCheck({status: 'checking', message: '이메일 확인 중...'});

        try {
            const isDuplicate = await authApi.checkEmailDuplicate(formData.email);

            if (isDuplicate) {
                setEmailCheck({
                    status: 'duplicate',
                    message: '이미 가입된 이메일입니다.'
                });
                return;
            }

            const result = await authApi.sendEmailVerificationCode(formData.email);

            setEmailCheck({
                status: 'sent',
                message: result
            });

        } catch (error) {
            setEmailCheck({
                status: 'error',
                message: error instanceof Error ? error.message : '오류가 발생했습니다.'
            });
        }
    };

    // 이메일 인증번호 확인 함수
    const handleEmailVerificationCheck = async () => {
        if (!emailVerificationCode || emailVerificationCode.length !== 6) {
            alert('인증번호 6자리를 입력해주세요.');
            return;
        }

        try {
            const result = await authApi.verifyEmailCode(formData.email, emailVerificationCode);

            setEmailCheck({
                status: 'verified',
                message: result
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '인증 확인 중 오류가 발생했습니다.';
            alert(errorMessage);
        }
    };

    // 이메일 입력 변경 시 처리
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
        setEmailCheck({status: 'none', message: ''});
    };

    // 아이디 입력 변경 시 처리
    const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
        setUserIdCheck({status: 'none', message: ''});
    };

    // 휴대폰 번호 입력 핸들러
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        onChange({...e, target: {...e.target, name: 'phone', value: formatted}});
    };

    // 회원가입 함수
    async function handleSignup() {
        if (userIdCheck.status !== 'available') {
            alert('아이디 중복확인을 완료해주세요.');
            return;
        }

        if (emailCheck.status !== 'verified') {
            alert('이메일 인증을 완료해주세요.');
            return;
        }

        setIsSignupLoading(true);

        try {
            await authApi.signup(formData);
            alert("회원가입 성공!");
            onFlip();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "회원가입에 실패했습니다.";
            alert(errorMessage);
        } finally {
            setIsSignupLoading(false);
        }
    }

    // 회원가입 버튼 활성화 조건
    const isSignupDisabled =
        !isPasswordValid ||
        !isPasswordMatch ||
        !formData.userId ||
        !formData.email ||
        !formData.name ||
        userIdCheck.status !== 'available' ||
        emailCheck.status !== 'verified' ||
        isSignupLoading;

    return (
        <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm
                       rounded-2xl shadow-2xl
                       p-4 sm:p-5 md:p-6
                       max-h-[75vh] sm:max-h-[80vh]
                       flex flex-col overflow-hidden"
             style={{backfaceVisibility: "hidden"}}>

            <div className="text-center mb-4 sm:mb-5">
                {/* 홈으로 가는 로고 - 크게 */}
                <Link
                    href="/"
                    className="inline-block text-3xl sm:text-4xl md:text-5xl font-bold text-[#8b5cf6] hover:text-[#6366f1] transition-all hover:scale-105 mb-2"
                >
                    Init
                </Link>

                {/* 회원가입 텍스트 - 작게 */}
                <h2 className="text-lg sm:text-xl font-semibold text-slate-600">
                    회원가입
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 sm:pr-3 space-y-3 sm:space-y-4"
                 style={{scrollbarWidth: "thin", scrollbarColor: "rgba(100,100,100,0.3) transparent"}}>

                {/* 이름 */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                        이름
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={onChange}
                        placeholder="이름을 입력하세요"
                        className="w-full px-2 sm:px-3 py-2 sm:py-3 border border-slate-300 rounded-lg
                                  text-xs sm:text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6]"
                    />
                </div>

                {/* 아이디 */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">아이디</label>
                    <div className="flex gap-1 sm:gap-2">
                        <input
                            type="text"
                            name="userId"
                            value={formData.userId}
                            onChange={handleUserIdChange}
                            placeholder="영문 또는 영문+숫자 4-12자"
                            className="flex-1 px-2 sm:px-3 py-2 sm:py-3 border border-slate-300 rounded-lg
                                     text-xs sm:text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <button
                            type="button"
                            onClick={handleUserIdCheck}
                            disabled={userIdCheck.status === 'checking' || !formData.userId || !userIdValidation.isValid}
                            className="bg-[#6366f1] text-white hover:bg-[#8b5cf6]
                                     px-2 sm:px-3 py-2 sm:py-3 rounded-lg
                                     text-xs font-medium flex items-center gap-1 disabled:opacity-50
                                     whitespace-nowrap"
                        >
                            {userIdCheck.status === 'checking' && <Loader2 className="w-3 h-3 animate-spin"/>}
                            중복확인
                        </button>
                    </div>

                    {/* 아이디 유효성 검사 메시지 */}
                    {formData.userId && !userIdValidation.isValid && (
                        <div className="mt-1 text-xs flex items-center gap-1 text-red-600">
                            <X className="h-3 w-3"/>
                            <span>{userIdValidation.message}</span>
                        </div>
                    )}

                    {/* 아이디 중복확인 메시지 */}
                    {userIdCheck.message && (
                        <div className={`mt-1 text-xs flex items-center gap-1 ${
                            userIdCheck.status==='available'?'text-green-600':userIdCheck.status==='duplicate'?'text-red-600':'text-gray-600'}`}>
                            {userIdCheck.status==='available'&&<Check className="h-3 w-3"/>}
                            {userIdCheck.status==='duplicate'&&<X className="h-3 w-3"/>}
                            {userIdCheck.status==='checking'&&<Loader2 className="h-3 w-3 animate-spin"/>}
                            <span>{userIdCheck.message}</span>
                        </div>
                    )}

                    {/* 아이디 규칙 안내 */}
                    <div className="mt-1 text-xs text-slate-500">
                        • 영문 필수, 숫자 선택적 포함 가능한 4-12자
                        • 특수문자는 사용할 수 없습니다
                    </div>
                </div>

                {/* 비밀번호 */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">비밀번호</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={onChange}
                            placeholder="8자 이상, 영문+숫자+특수문자"
                            className="w-full px-2 sm:px-3 py-2 sm:py-3 pr-8 sm:pr-10 border border-slate-300 rounded-lg
                                     text-xs sm:text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4"/> : <Eye className="w-3 h-3 sm:w-4 sm:h-4"/>}
                        </button>
                    </div>
                    {formData.password && (
                        <div className="mt-2 space-y-1 text-xs">
                            <PasswordCheck ok={formData.password.length >= 8} label="8자 이상"/>
                            <PasswordCheck
                                ok={/[a-zA-Z]/.test(formData.password)&&/\d/.test(formData.password)}
                                label="영문, 숫자 포함"
                            />
                            <PasswordCheck
                                ok={SPECIAL_CHAR_REGEX.test(formData.password)}
                                label="특수문자 포함"
                            />
                        </div>
                    )}

                    {/* 사용 가능한 특수문자 목록 */}
                    <div className="mt-1 text-xs text-slate-500">
                        사용 가능한 특수문자: {ALLOWED_SPECIAL_CHARS}
                    </div>
                </div>

                {/* 비밀번호 확인 */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">비밀번호 확인</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={onChange}
                            placeholder="비밀번호를 다시 입력하세요"
                            className="w-full px-2 sm:px-3 py-2 sm:py-3 pr-8 sm:pr-10 border border-slate-300 rounded-lg
                                     text-xs sm:text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showConfirmPassword ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4"/> : <Eye className="w-3 h-3 sm:w-4 sm:h-4"/>}
                        </button>
                    </div>
                    {formData.confirmPassword && (
                        <div className="mt-1 text-xs flex items-center gap-2">
                            {isPasswordMatch ?
                                <><Check className="h-3 w-3 text-green-500"/><span className="text-green-600">비밀번호가 일치합니다</span></> :
                                <><X className="h-3 w-3 text-red-500"/><span className="text-red-600">비밀번호가 일치하지 않습니다</span></>
                            }
                        </div>
                    )}
                </div>

                {/* 휴대폰 번호 */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">휴대폰 번호</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="010-1234-5678"
                        className={`w-full px-2 sm:px-3 py-2 sm:py-3 border rounded-lg text-xs sm:text-sm bg-white/50 focus:outline-none 
                        ${formData.phone && !validatePhoneNumber(formData.phone)?'border-red-300 focus:border-red-500':'border-slate-300 focus:border-[#8b5cf6]'}`}
                        maxLength={13}
                    />
                    {formData.phone && (
                        <div className="mt-1 text-xs">
                            {validatePhoneNumber(formData.phone) ?
                                <span className="text-green-600">✓ 올바른 형식입니다</span> :
                                <span className="text-red-600">올바른 번호를 입력해주세요 (010-xxxx-xxxx)</span>
                            }
                        </div>
                    )}
                </div>

                {/* 이메일 */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                        이메일
                    </label>
                    <div className="flex gap-1 sm:gap-2">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleEmailChange}
                            placeholder="example@email.com"
                            className="flex-1 px-2 sm:px-3 py-2 sm:py-3 border border-slate-300 rounded-lg
                                      text-xs sm:text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <button
                            type="button"
                            onClick={handleEmailVerificationSend}
                            disabled={emailCheck.status === 'checking' || !formData.email}
                            className="bg-[#6366f1] text-white hover:bg-[#8b5cf6]
                                     px-2 sm:px-3 py-2 sm:py-3 rounded-lg
                                     text-xs font-medium flex items-center gap-1 disabled:opacity-50
                                     whitespace-nowrap"
                        >
                            {emailCheck.status === 'checking' && <Loader2 className="w-3 h-3 animate-spin"/>}
                            인증번호
                        </button>
                    </div>
                    {emailCheck.message && (
                        <div className={`mt-1 text-xs flex items-center gap-1 ${
                            emailCheck.status==='verified'||emailCheck.status==='sent'?'text-green-600':emailCheck.status==='duplicate'?'text-red-600':'text-gray-600'}`}>
                            {(emailCheck.status==='verified'||emailCheck.status==='sent')&&<Check className="h-3 w-3"/>}
                            {emailCheck.status==='duplicate'&&<X className="h-3 w-3"/>}
                            {emailCheck.status==='checking'&&<Loader2 className="h-3 w-3 animate-spin"/>}
                            <span>{emailCheck.message}</span>
                        </div>
                    )}
                    {emailCheck.status==='sent' && (
                        <div className="mt-2">
                            <div className="flex gap-1 sm:gap-2">
                                <input
                                    type="text"
                                    value={emailVerificationCode}
                                    onChange={e=>setEmailVerificationCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                                    placeholder="인증번호 6자리"
                                    className="flex-1 px-2 sm:px-3 py-2 border border-slate-300 rounded-lg
                                             text-xs sm:text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6]"
                                    maxLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={handleEmailVerificationCheck}
                                    disabled={emailVerificationCode.length !== 6}
                                    className="bg-[#6366f1] text-white hover:bg-[#8b5cf6]
                                             px-2 sm:px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50
                                             whitespace-nowrap"
                                >
                                    확인
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                인증번호가 전송되었습니다. 이메일을 확인해주세요.
                            </p>
                        </div>
                    )}
                </div>

                {/* 관심분야 */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">관심 분야 (복수 선택 가능)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs">
                        {interests.map((interest, idx) => (
                            <label
                                key={idx}
                                className={`flex items-center p-1.5 sm:p-2 rounded-lg cursor-pointer transition-colors 
                                ${formData.interests.includes(interest)?"bg-[#6366f1]/10 border border-[#6366f1]/30":"hover:bg-slate-50 border border-slate-200"}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.interests.includes(interest)}
                                    onChange={()=>onInterestChange(interest)}
                                    className="mr-1 sm:mr-2 h-3 w-3 text-[#6366f1] focus:border-[#8b5cf6] rounded"
                                />
                                <span className="text-slate-700 text-xs">{interest}</span>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">선택: {formData.interests.length}개</p>
                </div>
            </div>

            {/* 하단 버튼 영역 */}
            <div className="mt-4 space-y-3">
                {/* 회원가입 버튼 */}
                <button
                    onClick={handleSignup}
                    disabled={isSignupDisabled}
                    className="w-full bg-[#6366f1] hover:bg-[#8b5cf6] text-white
                             py-2.5 sm:py-3 rounded-lg font-semibold disabled:opacity-50
                             flex justify-center items-center gap-2 text-sm sm:text-base"
                >
                    {isSignupLoading && <Loader2 className="w-4 h-4 animate-spin"/>}
                    {isSignupLoading ? '회원가입 중...' : '회원가입'}
                </button>

                <div className="text-center text-xs sm:text-sm">
                    <span className="text-slate-600">이미 계정이 있으신가요? </span>
                    <span className="text-[#8b5cf6] cursor-pointer hover:underline font-semibold" onClick={onFlip}>로그인</span>
                </div>
            </div>
        </div>
    )
}