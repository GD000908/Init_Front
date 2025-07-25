// lib/auth-api.ts - 모바일 완전 대응

const API_BASE_URL = `https://initback-production-67bf.up.railway.app/api`;

// 🔥 세션 ID 추적을 위한 저장소
let sessionTracker = {
    sendSessionId: null as string | null,
    verifySessionId: null as string | null,
    sendTimestamp: null as number | null,
    verifyTimestamp: null as number | null,
};

// 🔥 모든 세션 관련 쿠키 확인
const getAllSessionIds = (): string[] => {
    if (typeof document === 'undefined') return [];

    const sessionIds: string[] = [];
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (['JSESSIONID', 'SESSIONID', 'SESSID'].includes(name) && value) {
            sessionIds.push(value);
        }
    }
    return sessionIds;
};

// 🔥 주 세션 ID 가져오기
const getSessionId = (): string | null => {
    const sessionIds = getAllSessionIds();
    return sessionIds.length > 0 ? sessionIds[0] : null;
};

// 🔥 모바일 감지 함수 개선
const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;

    return mobileRegex.test(userAgent) ||
        window.innerWidth <= 768 ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0;
};

// 🔥 쿠키 강제 설정 함수
const forceSetCookie = (sessionId: string) => {
    if (!sessionId) return;

    const cookieSettings = [
        `JSESSIONID=${sessionId}; path=/; SameSite=None; Secure`,
        `JSESSIONID=${sessionId}; path=/; SameSite=Lax; Secure`,
        `JSESSIONID=${sessionId}; path=/; Secure`,
        `JSESSIONID=${sessionId}; path=/`,
        `SESSIONID=${sessionId}; path=/; SameSite=None; Secure`,
        `SESSID=${sessionId}; path=/; SameSite=Lax; Secure`
    ];

    cookieSettings.forEach(setting => {
        document.cookie = setting;
    });

    console.log('🍪 강제 쿠키 설정 완료:', sessionId.substring(0, 8));
};

// 🔥 세션 상태 로깅 함수
const logSessionState = (action: string, response?: Response) => {
    const currentSessionIds = getAllSessionIds();
    const serverSessionId = response?.headers.get('X-Session-ID');

    const logData = {
        action,
        timestamp: new Date().toISOString(),
        clientSessionIds: currentSessionIds,
        serverSessionId: serverSessionId,
        allCookies: document.cookie,
        userAgent: navigator.userAgent,
        isMobile: isMobile(),
        url: window.location.href,
    };

    console.log(`🔍 [${action}] 세션 상태:`, logData);

    // 트래커 업데이트
    if (action === 'SEND') {
        sessionTracker.sendSessionId = currentSessionIds[0] || null;
        sessionTracker.sendTimestamp = Date.now();
    } else if (action === 'VERIFY') {
        sessionTracker.verifySessionId = currentSessionIds[0] || null;
        sessionTracker.verifyTimestamp = Date.now();
    }

    // 🔥 서버에서 세션 ID를 반환했다면 강제 설정
    if (serverSessionId && !currentSessionIds.includes(serverSessionId)) {
        console.warn('⚠️ 서버 세션 ID와 클라이언트 불일치, 강제 설정');
        forceSetCookie(serverSessionId);
    }

    return logData;
};

// 🔥 향상된 fetch 옵션
const createEnhancedFetchOptions = (options: RequestInit): RequestInit => {
    const sessionIds = getAllSessionIds();

    const enhancedOptions: RequestInit = {
        ...options,
        credentials: 'include',
        mode: 'cors',
        headers: {
            ...options.headers,
            'Accept': 'application/json, text/plain, */*',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            // 🔥 모바일 식별 헤더
            'X-Mobile-Client': isMobile() ? 'true' : 'false',
            'X-Client-Type': isMobile() ? 'mobile' : 'desktop',
            // 🔥 세션 ID 헤더로도 전송
            ...(sessionIds.length > 0 && {
                'X-Session-ID': sessionIds[0],
                'X-All-Session-IDS': sessionIds.join(',')
            })
        },
    };

    return enhancedOptions;
};

// 🔥 재시도 로직이 포함된 fetch (세션 복구 포함)
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 API 호출 시도 ${attempt + 1}/${maxRetries + 1}: ${url}`);

            const response = await fetch(url, createEnhancedFetchOptions(options));

            // 🔥 응답 헤더에서 세션 정보 확인
            const serverSessionId = response.headers.get('X-Session-ID');
            if (serverSessionId) {
                console.log(`📋 서버 응답 세션 ID: ${serverSessionId.substring(0, 8)}`);
                forceSetCookie(serverSessionId);
            }

            // 성공하거나 마지막 시도라면 반환
            if (response.ok || attempt === maxRetries) {
                return response;
            }

            console.warn(`⚠️ 시도 ${attempt + 1} 실패 (${response.status}), 재시도 중...`);

            // 🔥 세션 관련 오류시 쿠키 초기화 후 재시도
            if (response.status === 401 || response.status === 403) {
                console.log('🔄 세션 오류 감지, 쿠키 초기화 후 재시도');
                document.cookie.split(";").forEach(cookie => {
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    if (name.trim().includes('SESSION')) {
                        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                    }
                });
            }

            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // 점진적 대기

        } catch (error) {
            console.error(`❌ 시도 ${attempt + 1} 네트워크 오류:`, error);
            lastError = error as Error;

            if (attempt === maxRetries) {
                throw lastError;
            }

            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
    }

    throw lastError || new Error('모든 재시도 실패');
};

export const authApi = {
    /**
     * 🔥 이메일 인증 코드 발송 (완전 강화)
     */
    sendEmailVerificationCode: async (email: string): Promise<string> => {
        try {
            // 발송 전 세션 상태 로깅
            logSessionState('SEND_START');

            // 🔥 모바일에서 사전 대기
            if (isMobile()) {
                console.log('📱 모바일 환경 사전 준비...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const response = await fetchWithRetry(`${API_BASE_URL}/send-email-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(email)}`,
            });

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
     * 🔥 이메일 인증 코드 검증 (완전 강화)
     */
    verifyEmailCode: async (email: string, code: string): Promise<string> => {
        try {
            // 검증 전 세션 상태 로깅
            const preVerifyState = logSessionState('VERIFY_START');

            // 🔥 세션 ID 복구 시도
            if (sessionTracker.sendSessionId &&
                (!preVerifyState.clientSessionIds.length ||
                    !preVerifyState.clientSessionIds.includes(sessionTracker.sendSessionId))) {
                console.warn('🚨 세션 ID 불일치 감지, 복구 시도...');
                forceSetCookie(sessionTracker.sendSessionId);
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // 🔥 모바일에서 추가 대기 (세션 동기화)
            if (isMobile()) {
                console.log('📱 모바일 세션 동기화 대기...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const response = await fetchWithRetry(`${API_BASE_URL}/verify-email-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
            }, 5); // 재시도 횟수 증가

            // 검증 후 세션 상태 로깅
            logSessionState('VERIFY_COMPLETE', response);

            const result = await response.text();

            if (!response.ok) {
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
            all: getAllSessionIds(),
            tracker: sessionTracker,
            cookies: document.cookie,
            timeSinceSend: sessionTracker.sendTimestamp ? Date.now() - sessionTracker.sendTimestamp : null,
            isMobile: isMobile()
        };
    },

    // 기존 메서드들...
    checkUserIdDuplicate: async (userId: string): Promise<boolean> => {
        try {
            const response = await fetchWithRetry(`${API_BASE_URL}/check-userid/${encodeURIComponent(userId)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
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
        try {
            const response = await fetchWithRetry(`${API_BASE_URL}/check-email/${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
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

            // 🔥 회원가입 전 세션 확인 대기
            if (isMobile()) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const response = await fetchWithRetry(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            const response = await fetchWithRetry(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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