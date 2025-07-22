// lib/auth-api.ts
//const API_BASE_URL = `http://localhost:8080/api`;
const API_BASE_URL = `https://initback-production-67bf.up.railway.app/api`;


export const authApi = {
    /**
     * 아이디 중복 확인
     * @param userId 확인할 아이디
     * @returns 중복이면 true, 사용 가능하면 false
     */
    checkUserIdDuplicate: async (userId: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/check-userid/${encodeURIComponent(userId)}`, {
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

    /**
     * 이메일 중복 확인
     * @param email 확인할 이메일
     * @returns 중복이면 true, 사용 가능하면 false
     */
    checkEmailDuplicate: async (email: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/check-email/${encodeURIComponent(email)}`, {
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

    /**
     * 🆕 이메일 인증 코드 발송 (중복확인 포함)
     */
    sendEmailVerificationCode: async (email: string): Promise<string> => {
        try {
            const response = await fetch(`${API_BASE_URL}/send-email-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include', // 🔥 쿠키 포함하여 세션 유지
                body: `email=${encodeURIComponent(email)}`,
            });

            const result = await response.text();

            if (!response.ok) {
                throw new Error(result || '이메일 인증 코드 발송에 실패했습니다.');
            }

            return result;
        } catch (error) {
            console.error('이메일 인증 코드 발송 실패:', error);
            throw error;
        }
    },

    /**
     * 🆕 이메일 인증 코드 검증
     */
    verifyEmailCode: async (email: string, code: string): Promise<string> => {
        try {
            const response = await fetch(`${API_BASE_URL}/verify-email-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include', // 🔥 쿠키 포함하여 세션 유지
                body: `email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
            });

            const result = await response.text();

            if (!response.ok) {
                throw new Error(result || '이메일 인증에 실패했습니다.');
            }

            return result;
        } catch (error) {
            console.error('이메일 인증 검증 실패:', error);
            throw error;
        }
    },

    /**
     * 회원가입
     */
    signup: async (signupData: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // 🔥 세션 유지를 위해 쿠키 포함
                body: JSON.stringify(signupData),
            });

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

    /**
     * 로그인
     */
    login: async (loginData: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
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