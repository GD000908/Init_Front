"use client"

import React, {useState, useEffect} from "react"
import { motion } from "framer-motion"
import Image from "next/image"
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
    }

    // 쿠키 설정 헬퍼 함수
    const setCookie = (name: string, value: string, days: number = 7) => {
        const expires = new Date()
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
    }

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const googleLogin = urlParams.get('googleLogin');
        const error = urlParams.get('error');

        console.log('🔍 URL 파라미터 확인:', { googleLogin, error });

        if (googleLogin === 'success') {
            console.log('🎉 구글 로그인 성공 감지');

            // 🔥 현재 모든 쿠키 확인
            console.log('🍪 전체 쿠키:', document.cookie);

            // 쿠키 읽기 시도
            const authToken = getCookie('authToken');
            const userId = getCookie('userId');
            const userName = getCookie('userName');
            const userRole = getCookie('userRole');

            console.log('🔍 개별 쿠키 확인:', {
                authToken: authToken ? '***' + authToken.slice(-10) : '❌ 없음',
                userId: userId || '❌ 없음',
                userName: userName || '❌ 없음',
                userRole: userRole || '❌ 없음'
            });

            if (authToken && userId && userName && userRole) {
                console.log('✅ 모든 필요한 쿠키 존재');

                // localStorage에 저장
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('accessToken', authToken);
                localStorage.setItem('userId', userId);
                localStorage.setItem('userName', decodeURIComponent(userName));
                localStorage.setItem('userRole', userRole);

                console.log('✅ localStorage 저장 완료');

                // 성공 메시지
                const decodedName = decodeURIComponent(userName);
                if (userRole === 'ADMIN') {
                    alert(`관리자 ${decodedName}님, 구글 로그인 성공!`);
                } else {
                    alert(`${decodedName}님, 구글 로그인 성공!`);
                }

                // URL 파라미터 제거 후 리다이렉트
                window.history.replaceState({}, document.title, window.location.pathname);

                // 역할에 따른 리다이렉트
                setTimeout(() => {
                    if (userRole === 'ADMIN') {
                        router.push('/admin');
                    } else {
                        router.push('/dashboard');
                    }
                }, 1000);

            } else {
                console.error('❌ 필요한 쿠키가 없음');
                console.log('🔍 브라우저 개발자도구 > Application > Cookies에서 쿠키 확인 필요');

                // 🆕 더 자세한 디버깅 정보
                if (!authToken) console.error('❌ authToken 쿠키 없음');
                if (!userId) console.error('❌ userId 쿠키 없음');
                if (!userName) console.error('❌ userName 쿠키 없음');
                if (!userRole) console.error('❌ userRole 쿠키 없음');

                alert('구글 로그인 처리 중 오류가 발생했습니다.\n개발자도구 콘솔을 확인해주세요.');

                // URL 파라미터 제거
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } else if (error) {
            console.error('❌ 구글 로그인 에러:', error);

            let errorMessage = "구글 로그인에 실패했습니다.";

            switch (error) {
                case 'invalid_google_account':
                    errorMessage = "구글 계정 정보가 부족합니다. 다른 구글 계정으로 시도해주세요.";
                    break;
                case 'google_login_failed':
                    errorMessage = "구글 로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
                    break;
                case 'oauth2_failed':
                    errorMessage = "OAuth2 인증에 실패했습니다.";
                    break;
            }

            alert(errorMessage);

            // URL 파라미터 제거
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [router]);

    // 🔥 수정된 handleLogin 함수 - role 기반 리다이렉트
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

                console.log('🔥 백엔드 로그인 응답:', userData);

                // 🔥 토큰 저장
                const token = userData.token;
                if (token) {
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('accessToken', token);
                    setCookie('authToken', token);
                    console.log('✅ 토큰 저장 완료');
                }

                // 🔥 사용자 정보 저장
                localStorage.setItem('userId', userData.id.toString())
                localStorage.setItem('userName', userData.name)
                localStorage.setItem('userRole', userData.role) // 🔥 역할 정보 저장

                setCookie('userId', userData.id.toString())
                setCookie('userName', userData.name)
                setCookie('userRole', userData.role) // 🔥 역할 정보 쿠키 저장

                console.log('✅ 사용자 정보 저장 완료:', {
                    userId: userData.id,
                    userName: userData.name,
                    userRole: userData.role
                });

                // 🔥 역할 기반 리다이렉트
                if (userData.role === 'ADMIN') {
                    alert(`관리자 ${userData.name}님, 환영합니다!`)
                    router.push('/admin')
                } else {
                    alert(`${userData.name}님, 환영합니다!`)
                    router.push('/dashboard')
                }

            } else {
                // 에러 처리
                try {
                    const errorText = await res.text();
                    console.log('❌ 로그인 실패 응답:', errorText);

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

                    // HTTP 상태 코드별 추가 처리
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
            className="w-[450px] h-[650px] bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl flex flex-col justify-center"
            style={{ backfaceVisibility: "hidden" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <Link
                href="/"
                className="logo text-5xl font-bold text-[#555555] text-center mb-8 hover:scale-105 transition-transform"
            >
                Init
            </Link>

            {/* ID 필드 */}
            <div className="form-floating relative mb-6">
                <input
                    type="text"
                    id="loginId"
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    className="w-full px-4 py-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#8b5cf6] peer pt-6 bg-white/50"
                    placeholder=" "
                    required
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <label
                    htmlFor="loginId"
                    className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 left-4 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
                >
                    ID
                </label>
            </div>

            {/* Password 필드 */}
            <div className="form-floating relative mb-6">
                <input
                    type="password"
                    id="loginPw"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#8b5cf6] peer pt-6 bg-white/50"
                    placeholder=" "
                    required
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <label
                    htmlFor="loginPw"
                    className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 left-4 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
                >
                    Password
                </label>
            </div>

            {/* Remember me */}
            <div className="remember flex items-center mb-6">
                <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-[#6366f1] focus:ring-[#6366f1] border-slate-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-slate-700">
                    아이디 저장
                </label>
            </div>



            {/* 로그인 버튼 */}
            <motion.button
                onClick={handleLogin}
                className="bg-[#6366f1] hover:bg-[#8b5cf6] text-white py-4 rounded-lg mb-6 transition-all font-semibold disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
            >
                {isLoading ? '로그인 중...' : '로그인'}
            </motion.button>

            <div className="text-center mb-6">
                <Link
                    href="/find-account"
                    className="text-sm text-gray-600 hover:text-[#6366f1] transition-colors"
                >
                    아이디 · 비밀번호 찾기
                </Link>
            </div>

            {/* 소셜 로그인 */}
            <div className="social-login-row flex justify-center gap-4 mb-6">
                <SocialButton
                    src="/naver.png"
                    alt="Naver"
                    onClick={() => alert("현재는 구글 로그인만 사용 가능합니다.\n네이버, 카카오는 추후 지원 예정입니다.")}
                />
                <SocialButton
                    src="/kakao.png"
                    alt="Kakao"
                    onClick={() => alert("현재는 구글 로그인만 사용 가능합니다.\n네이버, 카카오는 추후 지원 예정입니다.")}
                />
                <SocialButton
                    src="/google.png"
                    alt="Google"
                    onClick={() => {
                        console.log('🔍 구글 로그인 버튼 클릭');
                        // 🔥 올바른 OAuth2 엔드포인트로 이동
                        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`;

                    }}
                />
            </div>

            {/* 회원가입 이동 */}
            <div className="text-center text-sm">
                아직 회원이 아니신가요?{" "}
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

function SocialButton({
                          src,
                          alt,
                          onClick
                      }: {
    src: string
    alt: string
    onClick?: () => void
}) {
    return (
        <motion.button
            className="p-3 rounded-full bg-sky-50 hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
        >
            <div className="aspect-square relative overflow-hidden rounded">
                <Image src={src} alt={alt} width={32} height={32} className="rounded-full" />
            </div>
        </motion.button>
    )
}