import { useState, useEffect } from 'react';

// ProfileData 타입 정의
export interface ProfileData {
    id: number;
    userId: number;
    displayName: string;
    profileImageUrl?: string;
    jobTitle?: string;
    company?: string;
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
    isFollowing?: boolean;
}

export const useCommunityProfile = (userId: number | null) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
            
            const response = await fetch(`https://initback-production-67bf.up.railway.app/api/profile/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            } else {
                setError('프로필을 불러올 수 없습니다.');
            }
        } catch (err) {
            console.error('프로필 조회 실패:', err);
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    return {
        profile,
        loading,
        error,
        refetch: fetchProfile
    };
};

export default useCommunityProfile;
