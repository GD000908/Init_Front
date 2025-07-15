"use client"

import React, {useState, useEffect} from "react"
import {Eye, EyeOff, Check, X, Loader2} from "lucide-react"
import {authApi} from "@/lib/auth-api"

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
    isPasswordValid: boolean
    isPasswordMatch: boolean
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

function PasswordCheck({ok, label}: { ok: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2">
            {ok ? <Check className="h-3 w-3 text-green-500"/> : <X className="h-3 w-3 text-red-500"/>}
            <span className={ok ? "text-green-600" : "text-red-600"}>{label}</span>
        </div>
    )
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
                                   }: Omit<SignupFormProps, "isPasswordValid" | "isPasswordMatch">) {

    // 🆕 중복확인 상태 관리
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

    // 🆕 구글 회원가입 상태 관리
    const [isGoogleSignup, setIsGoogleSignup] = useState(false);
    const [googleInfo, setGoogleInfo] = useState<{
        email: string;
        name: string;
        googleId: string;
    } | null>(null);

    // 🔥 초기화 완료 상태 추가 (무한 alert 방지)
    const [isInitialized, setIsInitialized] = useState(false);

    // 비밀번호 유효성 검사
    const isPasswordValid =
        formData.password.length >= 8 &&
        /[a-zA-Z]/.test(formData.password) &&
        /\d/.test(formData.password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

    const isPasswordMatch = formData.password === formData.confirmPassword;

    // 🆕 쿠키 읽기 헬퍼 함수
    const getCookie = (name: string): string | null => {
        try {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                return parts.pop()?.split(';').shift() || null;
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    // 🆕 쿠키 삭제 헬퍼 함수
    const deleteCookie = (name: string) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    };

    // 🔥 구글 회원가입 정보 자동 입력 useEffect (무한 alert 해결)
    useEffect(() => {
        // 🔥 한 번만 실행되도록 보장
        if (isInitialized) return;

        const urlParams = new URLSearchParams(window.location.search);
        const googleSignupParam = urlParams.get('googleSignup');

        if (googleSignupParam === 'true') {
            console.log('🔍 구글 회원가입 모드 감지');
            setIsGoogleSignup(true);

            // 임시 구글 정보 쿠키에서 데이터 읽기
            const tempEmail = getCookie('tempGoogleEmail');
            const tempName = getCookie('tempGoogleName');
            const tempGoogleId = getCookie('tempGoogleId');

            if (tempEmail && tempName) {
                const decodedEmail = decodeURIComponent(tempEmail);
                const decodedName = decodeURIComponent(tempName);

                console.log('✅ 구글 정보 감지:', {decodedEmail, decodedName, tempGoogleId});

                // 구글 정보 상태 저장
                setGoogleInfo({
                    email: decodedEmail,
                    name: decodedName,
                    googleId: tempGoogleId || ''
                });

                // 🔥 FormData 업데이트를 비동기로 처리 (무한 루프 방지)
                const updateFormData = async () => {
                    // 이메일 설정
                    onChange({
                        target: {name: 'email', value: decodedEmail}
                    } as React.ChangeEvent<HTMLInputElement>);

                    // 약간의 지연 후 이름 설정
                    await new Promise(resolve => setTimeout(resolve, 100));

                    onChange({
                        target: {name: 'name', value: decodedName}
                    } as React.ChangeEvent<HTMLInputElement>);
                };

                updateFormData();

                // 이메일은 구글에서 인증된 것으로 간주
                setEmailCheck({
                    status: 'verified',
                    message: '구글 계정으로 인증된 이메일입니다.'
                });

                // 🔥 alert를 딜레이와 함께 한 번만 표시
                setTimeout(() => {
                    if (!isInitialized) { // 다시 한 번 확인
                        alert(`구글 계정 ${decodedName}님의 정보가 자동으로 입력되었습니다.\n추가 정보를 입력하여 회원가입을 완료해주세요.`);
                    }
                }, 1000);

            } else {
                console.warn('⚠️ 구글 정보 쿠키를 찾을 수 없습니다.');
                setTimeout(() => {
                    if (!isInitialized) {
                        alert('구글 로그인 정보를 가져올 수 없습니다. 다시 시도해주세요.');
                    }
                }, 800);
                setIsGoogleSignup(false);
            }
        }

        // 🔥 초기화 완료 표시 (한 번만 실행되도록)
        setIsInitialized(true);

    }, []); // 🔥 의존성 배열을 비움 (한 번만 실행)

    // 휴대폰 번호 포맷팅 함수
    const formatPhoneNumber = (value: string): string => {
        // 숫자만 추출
        const numbers = value.replace(/[^\d]/g, '');

        // 11자리 초과 시 자름
        const limitedNumbers = numbers.slice(0, 11);

        // 형식에 맞게 하이픈 추가
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
        // 010, 011, 016, 017, 018, 019로 시작하는 10-11자리 번호
        const phoneRegex = /^(010|011|016|017|018|019)\d{7,8}$/;
        return phoneRegex.test(numbers);
    };

    // 🆕 아이디 중복확인 함수
    const handleUserIdCheck = async () => {
        if (!formData.userId || formData.userId.trim().length < 4) {
            setUserIdCheck({
                status: 'error',
                message: '아이디는 4자 이상 입력해주세요.'
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

    // 🆕 이메일 인증번호 발송 함수 (구글 회원가입 시 비활성화)
    const handleEmailVerificationSend = async () => {
        if (isGoogleSignup) {
            alert('구글 계정으로 이미 인증된 이메일입니다.');
            return;
        }

        if (!formData.email || !formData.email.includes('@')) {
            setEmailCheck({
                status: 'error',
                message: '올바른 이메일을 입력해주세요.'
            });
            return;
        }

        setEmailCheck({status: 'checking', message: '이메일 확인 중...'});

        try {
            // 1단계: 중복확인
            const isDuplicate = await authApi.checkEmailDuplicate(formData.email);

            if (isDuplicate) {
                setEmailCheck({
                    status: 'duplicate',
                    message: '이미 가입된 이메일입니다.'
                });
                return;
            }

            // 2단계: 중복되지 않으면 인증번호 발송
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

    // 🆕 이메일 인증번호 확인 함수
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

    // 🆕 이메일 입력 변경 시 처리 (구글 회원가입 시 변경 방지)
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isGoogleSignup && googleInfo) {
            alert('구글 계정으로 회원가입 중에는 이메일을 변경할 수 없습니다.');
            return;
        }
        onChange(e);
        setEmailCheck({status: 'none', message: ''});
    };

    // 휴대폰 번호 입력 핸들러
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        onChange({...e, target: {...e.target, name: 'phone', value: formatted}});
    };

    // 🆕 회원가입 함수 (구글 정보 포함)
    async function handleSignup() {
        // 중복확인 완료 체크
        if (userIdCheck.status !== 'available') {
            alert('아이디 중복확인을 완료해주세요.');
            return;
        }

        if (emailCheck.status !== 'verified') {
            alert('이메일 인증을 완료해주세요.');
            return;
        }

        // 구글 회원가입인 경우 이메일 일치 확인
        if (isGoogleSignup && googleInfo && formData.email !== googleInfo.email) {
            alert('구글 계정의 이메일과 입력한 이메일이 일치하지 않습니다.');
            return;
        }

        setIsSignupLoading(true);

        try {
            // 🆕 구글 정보를 포함한 회원가입 데이터 준비
            const signupData = {
                ...formData,
                ...(isGoogleSignup && googleInfo && {googleId: googleInfo.googleId})
            };

            await authApi.signup(signupData);

            // 성공 시 임시 쿠키 삭제
            if (isGoogleSignup) {
                deleteCookie('tempGoogleEmail');
                deleteCookie('tempGoogleName');
                deleteCookie('tempGoogleId');
                console.log('🧹 임시 구글 쿠키 삭제 완료');
            }

            alert("회원가입 성공!");
            onFlip();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "회원가입에 실패했습니다.";
            alert(errorMessage);
        } finally {
            setIsSignupLoading(false);
        }
    }

    // 🆕 회원가입 버튼 활성화 조건
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
        <div className="w-[650px] h-[90vh] bg-white/90 backdrop-blur-sm p-5 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
             style={{backfaceVisibility: "hidden"}}>

            <div className="relative mb-6">
                <h2 className="absolute inset-x-0 mx-auto text-2xl font-bold text-center text-[#8b5cf6]">회원가입</h2>

                {isGoogleSignup && (
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full justify-end">
                        <span className="text-xs text-blue-700">🔗 구글 계정 연동</span>
                    </div>
                )}
            </div>


            <div className="flex-1 overflow-y-auto pr-4"
                 style={{scrollbarWidth: "thin", scrollbarColor: "rgba(100,100,100,0.3) transparent"}}>

                {/* 이름 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        이름 {isGoogleSignup && <span className="text-blue-600 text-xs">(구글에서 자동 입력)</span>}
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={onChange}
                        placeholder="이름을 입력하세요"
                        className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6] ${
                            isGoogleSignup ? 'bg-blue-50/50' : ''
                        }`}
                        readOnly={isGoogleSignup}
                    />
                </div>

                {/* 아이디 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">아이디</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="userId"
                            value={formData.userId}
                            onChange={e => {onChange(e); setUserIdCheck({status: 'none', message: ''})}}
                            placeholder="영문, 숫자 조합 4-12자"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <button
                            type="button"
                            onClick={handleUserIdCheck}
                            disabled={userIdCheck.status === 'checking' || !formData.userId}
                            className="bg-[#6366f1] text-white hover:bg-[#8b5cf6] px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                            {userIdCheck.status === 'checking' && <Loader2 className="w-3 h-3 animate-spin"/>}
                            중복확인
                        </button>
                    </div>
                    {userIdCheck.message && (
                        <div className={`mt-1 text-xs flex items-center gap-1 ${
                            userIdCheck.status==='available'?'text-green-600':userIdCheck.status==='duplicate'?'text-red-600':'text-gray-600'}`}>
                            {userIdCheck.status==='available'&&<Check className="h-3 w-3"/>}
                            {userIdCheck.status==='duplicate'&&<X className="h-3 w-3"/>}
                            {userIdCheck.status==='checking'&&<Loader2 className="h-3 w-3 animate-spin"/>}
                            <span>{userIdCheck.message}</span>
                        </div>
                    )}
                </div>

                {/* 비밀번호 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">비밀번호</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={onChange}
                            placeholder="8자 이상, 영문+숫자+특수문자"
                            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                        </button>
                    </div>
                    {formData.password && (
                        <div className="mt-2 space-y-1 text-xs">
                            <PasswordCheck ok={formData.password.length >= 8} label="8자 이상"/>
                            <PasswordCheck
                                ok={/[a-zA-Z]/.test(formData.password)&&/\d/.test(formData.password)&&/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)}
                                label="영문, 숫자, 특수문자 포함"
                            />
                        </div>
                    )}
                </div>

                {/* 비밀번호 확인 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">비밀번호 확인</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={onChange}
                            placeholder="비밀번호를 다시 입력하세요"
                            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
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
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">휴대폰 번호</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="010-1234-5678"
                        className={`w-full px-3 py-2 border rounded-lg text-sm bg-white/50 focus:outline-none 
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
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        이메일 {isGoogleSignup && <span className="text-blue-600 text-xs">(구글에서 자동 입력)</span>}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleEmailChange}
                            placeholder="example@email.com"
                            className={`flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6] ${
                                isGoogleSignup ? 'bg-blue-50/50' : ''
                            }`}
                            readOnly={isGoogleSignup}
                        />
                        <button
                            type="button"
                            onClick={handleEmailVerificationSend}
                            disabled={emailCheck.status === 'checking' || !formData.email || isGoogleSignup}
                            className="bg-[#6366f1] text-white hover:bg-[#8b5cf6] px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                            {emailCheck.status === 'checking' && <Loader2 className="w-3 h-3 animate-spin"/>}
                            {isGoogleSignup ? '인증완료' : '인증번호'}
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
                    {emailCheck.status==='sent' && !isGoogleSignup && (
                        <div className="mt-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={emailVerificationCode}
                                    onChange={e=>setEmailVerificationCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                                    placeholder="인증번호 6자리"
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white/50 focus:outline-none focus:border-[#8b5cf6]"
                                    maxLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={handleEmailVerificationCheck}
                                    disabled={emailVerificationCode.length !== 6}
                                    className="bg-[#6366f1] text-white hover:bg-[#8b5cf6] px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
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
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-3">관심 분야 (복수 선택 가능)</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {interests.map((interest, idx) => (
                            <label
                                key={idx}
                                className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors 
                                ${formData.interests.includes(interest)?"bg-[#6366f1]/10 border border-[#6366f1]/30":"hover:bg-slate-50 border border-slate-200"}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.interests.includes(interest)}
                                    onChange={()=>onInterestChange(interest)}
                                    className="mr-2 h-3 w-3 text-[#6366f1] focus:border-[#8b5cf6] rounded"
                                />
                                <span className="text-slate-700">{interest}</span>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">선택: {formData.interests.length}개</p>
                </div>

                {/* 회원가입 버튼 */}
                <button
                    onClick={handleSignup}
                    disabled={isSignupDisabled}
                    className="w-full bg-[#6366f1] hover:bg-[#8b5cf6] text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    {isSignupLoading && <Loader2 className="w-4 h-4 animate-spin"/>}
                    {isSignupLoading ? '회원가입 중...' : (isGoogleSignup ? '구글 계정 연동하여 회원가입' : '회원가입')}
                </button>

                <div className="text-center mt-3 text-sm">
                    <span className="text-slate-600">이미 계정이 있으신가요? </span>
                    <span className="text-[#8b5cf6] cursor-pointer hover:underline font-semibold" onClick={onFlip}>로그인</span>
                </div>
            </div>
        </div>
    )
}