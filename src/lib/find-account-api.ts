// lib/find-account-api.ts
//const API_BASE_URL = 'http://localhost:8080/api';
const API_BASE_URL = 'https://initback-production-67bf.up.railway.app/api';


export const findAccountApi = {
    /**
     * 아이디 찾기
     * @param email 이메일 주소
     * @returns 사용자 아이디
     */
    findUserId: async (email: string): Promise<string> => {
        try {
            console.log('🔍 아이디 찾기 API 호출:', email);

            const response = await fetch(`${API_BASE_URL}/find-userid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include', // 🔥 추가
                body: `email=${encodeURIComponent(email)}`,
            });

            console.log('📡 응답 상태:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API 오류 응답:', errorText);
                throw new Error(errorText || '아이디를 찾을 수 없습니다.');
            }

            const result = await response.text();
            console.log('✅ 아이디 찾기 성공:', result);
            return result;
        } catch (error) {
            console.error('❌ 아이디 찾기 실패:', error);

            // 네트워크 오류인지 확인
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
            }

            throw error;
        }
    },

    /**
     * 비밀번호 재설정 인증 코드 발송
     * @param userId 사용자 아이디
     * @param email 이메일 주소
     * @returns 성공 메시지
     */
    sendPasswordResetCode: async (userId: string, email: string): Promise<string> => {
        try {
            console.log('📧 비밀번호 재설정 코드 발송:', { userId, email });

            const response = await fetch(`${API_BASE_URL}/send-password-reset-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: `userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}`,
            });

            console.log('📡 응답 상태:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API 오류 응답:', errorText);
                throw new Error(errorText || '인증 코드 발송에 실패했습니다.');
            }

            const result = await response.text();
            console.log('✅ 인증 코드 발송 성공:', result);
            return result;
        } catch (error) {
            console.error('❌ 인증 코드 발송 실패:', error);

            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
            }

            throw error;
        }
    },

    /**
     * 비밀번호 재설정 인증 코드 확인
     * @param userId 사용자 아이디
     * @param email 이메일 주소
     * @param code 인증 코드
     * @returns 성공 메시지
     */
    verifyPasswordResetCode: async (userId: string, email: string, code: string): Promise<string> => {
        try {
            console.log('🔐 인증 코드 확인:', { userId, email, code });

            const response = await fetch(`${API_BASE_URL}/verify-password-reset-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: `userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
            });

            console.log('📡 응답 상태:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API 오류 응답:', errorText);
                throw new Error(errorText || '인증 코드 확인에 실패했습니다.');
            }

            const result = await response.text();
            console.log('✅ 인증 코드 확인 성공:', result);
            return result;
        } catch (error) {
            console.error('❌ 인증 코드 확인 실패:', error);

            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
            }

            throw error;
        }
    },

    /**
     * 비밀번호 재설정
     * @param userId 사용자 아이디
     * @param email 이메일 주소
     * @param newPassword 새 비밀번호
     * @returns 성공 메시지
     */
    resetPassword: async (userId: string, email: string, newPassword: string): Promise<string> => {
        try {
            console.log('🔑 비밀번호 재설정:', { userId, email });

            const response = await fetch(`${API_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: `userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(newPassword)}`,
            });

            console.log('📡 응답 상태:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API 오류 응답:', errorText);
                throw new Error(errorText || '비밀번호 재설정에 실패했습니다.');
            }

            const result = await response.text();
            console.log('✅ 비밀번호 재설정 성공:', result);
            return result;
        } catch (error) {
            console.error('❌ 비밀번호 재설정 실패:', error);

            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
            }

            throw error;
        }
    },
};