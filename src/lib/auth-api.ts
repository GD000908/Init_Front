// auth-api.ts - 세션 추적 강화

const API_BASE_URL = `https://initback-production-67bf.up.railway.app/api`;

// 🔥 세션 ID 추적을 위한 저장소
let sessionTracker = {
    sendSessionId: null as string | null,
    verifySessionId: null as string | null,
    sendTimestamp: null as number | null,
    verifyTimestamp: null as number | null,
};

// 🔥 세션 ID 추출 함수 개선
const getSessionId = (): string | null => {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'JSESSIONID') {
            return value;
        }
    }
    return null;
};

// 🔥 세션 상태 로깅 함수
const logSessionState = (action: string, response?: Response) => {
    const currentSessionId = getSessionId();
    const serverSessionId = response?.headers.get('X-Session-ID');

    const logData = {
        action,
        timestamp: new Date().toISOString(),
        clientSessionId: currentSessionId,
        serverSessionId: serverSessionId,
        allCookies: document.cookie,
        userAgent: navigator.userAgent,
        isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent),
    };

    console.log(`🔍 [${action}] 세션 상태:`, logData);

    // 트래커 업데이트
    if (action === 'SEND') {
        sessionTracker.sendSessionId = currentSessionId;
        sessionTracker.sendTimestamp = Date.now();
    } else if (action === 'VERIFY') {
        sessionTracker.verifySessionId = currentSessionId;
        sessionTracker.verifyTimestamp = Date.now();
    }

    // 세션 ID 불일치 경고
    if (action === 'VERIFY' && sessionTracker.sendSessionId && currentSessionId !== sessionTracker.sendSessionId) {
        console.warn('⚠️ 세션 ID 변경 감지!', {
            send: sessionTracker.sendSessionId,
            verify: currentSessionId,
            timeDiff: sessionTracker.verifyTimestamp! - sessionTracker.sendTimestamp!
        });
    }

    return logData;
};

// 🔥 응답 헤더 로깅 함수
const logResponseHeaders = (response: Response) => {
    console.log('📤 응답 헤더:');
    response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
    });
};

export const authApi = {
    /**
     * 🔥 이메일 인증 코드 발송 (세션 추적 강화)
     */
    sendEmailVerificationCode: async (email: string): Promise<string> => {
        try {
            // 발송 전 세션 상태 로깅
            logSessionState('SEND_START');

            const response = await fetch(`${API_BASE_URL}/send-email-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: `email=${encodeURIComponent(email)}`,
            });

            // 응답 헤더 로깅
            logResponseHeaders(response);

            // 발송 후 세션 상태 로깅
            logSessionState('SEND_COMPLETE', response);

            const result = await response.text();

            if (!response.ok) {
                throw new Error(result || '이메일 인증 코드 발송에 실패했습니다.');
            }

            return result;
        } catch (error) {
            console.error('❌ 이메일 인증 코드 발송 실패:', error);
            logSessionState('SEND_ERROR');
            throw error;
        }
    },

    /**
     * 🔥 이메일 인증 코드 검증 (세션 추적 강화)
     */
    verifyEmailCode: async (email: string, code: string): Promise<string> => {
        try {
            // 검증 전 세션 상태 로깅
            const preVerifyState = logSessionState('VERIFY_START');

            // 🔥 세션 ID가 변경되었다면 경고 및 복구 시도
            if (sessionTracker.sendSessionId && preVerifyState.clientSessionId !== sessionTracker.sendSessionId) {
                console.warn('🚨 세션 ID 변경 감지, 복구 시도...');

                // 원래 세션 ID로 쿠키 복구 시도
                document.cookie = `JSESSIONID=${sessionTracker.sendSessionId}; path=/; SameSite=Lax`;

                // 잠시 대기
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const response = await fetch(`${API_BASE_URL}/verify-email-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    // 🔥 세션 ID를 헤더에도 포함
                    ...(sessionTracker.sendSessionId && {
                        'X-Expected-Session': sessionTracker.sendSessionId
                    })
                },
                credentials: 'include',
                body: `email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
            });

            // 응답 헤더 로깅
            logResponseHeaders(response);

            // 검증 후 세션 상태 로깅
            logSessionState('VERIFY_COMPLETE', response);

            const result = await response.text();

            if (!response.ok) {
                // 🔥 세션 관련 오류인지 확인
                if (result.includes('만료') || result.includes('expire')) {
                    console.error('🚨 세션 만료 오류 감지:', {
                        sendTime: sessionTracker.sendTimestamp,
                        verifyTime: Date.now(),
                        timeDiff: sessionTracker.sendTimestamp ? Date.now() - sessionTracker.sendTimestamp : null,
                        sessionState: sessionTracker
                    });
                }

                throw new Error(result || '이메일 인증에 실패했습니다.');
            }

            return result;
        } catch (error) {
            console.error('❌ 이메일 인증 검증 실패:', error);
            logSessionState('VERIFY_ERROR');
            throw error;
        }
    },

    // 🔥 세션 상태 확인 함수 (디버깅용)
    getSessionStatus: () => {
        return {
            current: getSessionId(),
            tracker: sessionTracker,
            cookies: document.cookie,
            timeSinceSend: sessionTracker.sendTimestamp ? Date.now() - sessionTracker.sendTimestamp : null
        };
    },

    // 나머지 메서드들은 기존과 동일...
    checkUserIdDuplicate: async (userId: string): Promise<boolean> => {
        // 기존 코드 유지
        try {
            const response = await fetch(`${API_BASE_URL}/check-userid/${encodeURIComponent(userId)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 400) {
                    const errorText = await response.text();
                    throw new Error(errorText || '잘못된 요청입니다.');
                }
                throw new Error('아이디 중복 확인 중 오류가 발생했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('아이디 중복 확인 실패:', error);
            throw error;
        }
    },

    checkEmailDuplicate: async (email: string): Promise<boolean> => {
        // 기존 코드 유지
        try {
            const response = await fetch(`${API_BASE_URL}/check-email/${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 400) {
                    const errorText = await response.text();
                    throw new Error(errorText || '잘못된 요청입니다.');
                }
                throw new Error('이메일 중복 확인 중 오류가 발생했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('이메일 중복 확인 실패:', error);
            throw error;
        }
    },

    signup: async (signupData: any) => {
        try {
            logSessionState('SIGNUP_START');

            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(signupData),
            });

            logSessionState('SIGNUP_COMPLETE', response);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || '회원가입에 실패했습니다.');
            }

            return await response.text();
        } catch (error) {
            console.error('회원가입 실패:', error);
            throw error;
        }
    },

    login: async (loginData: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(loginData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || '로그인에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('로그인 실패:', error);
            throw error;
        }
    }
};