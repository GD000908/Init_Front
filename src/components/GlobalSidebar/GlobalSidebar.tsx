'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Link2,
  FileText,
  PenTool,
  Calendar,
  Users,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // 🔥 추가
import styles from './GlobalSidebar.module.css';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export default function GlobalSidebar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { userId } = useAuth(); // 🔥 유저 ID 가져오기

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: '이력 관리 홈', icon: Home, href: '/dashboard' },
    { id: 'spec-management', label: '스펙 관리', icon: Link2, href: '/spec-management' },
    { id: 'resume', label: '이력서 작성', icon: FileText, href: '/resume' },
    { id: 'introduce', label: '자소서 작성', icon: PenTool, href: '/introduce' },
    {
      id: 'calendar',
      label: '공고 캘린더',
      icon: Calendar,
      href: userId ? `/job-calendar/${userId}` : '/login'
    },
    { id: 'community', label: '커뮤니티', icon: Users, href: '/community' },
  ];

  useEffect(() => {
    setIsMounted(true);
    loadUserProfile();
    loadThemePreference();
  }, []);

  // 🔥 페이지 이동 시에도 다크모드 상태 확인
  useEffect(() => {
    if (isMounted) {
      loadThemePreference();
    }
  }, [pathname, isMounted]);

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

  const loadUserProfile = () => {
    try {
      const userName = localStorage.getItem('userName') || getCookie('userName');
      const userEmail = localStorage.getItem('userEmail') || getCookie('userEmail');

      if (userName && userName.trim() && userName !== 'undefined') {
        setUserProfile({
          name: decodeURIComponent(userName),
          email: userEmail && userEmail !== 'undefined' ? decodeURIComponent(userEmail) : '환영합니다!'
        });
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      setUserProfile(null);
    }
  };

  const loadThemePreference = () => {
    try {
      // 🔥 localStorage와 documentElement 클래스 모두 확인
      const savedTheme = localStorage.getItem('theme');
      const hasCurrentDarkClass = document.documentElement.classList.contains('dark');

      console.log('🎨 Theme check:', { savedTheme, hasCurrentDarkClass, pathname });

      // localStorage에 저장된 테마가 dark이거나, 현재 DOM에 dark 클래스가 있는 경우
      const shouldBeDark = savedTheme === 'dark' || hasCurrentDarkClass;

      if (shouldBeDark) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('❌ Theme load error:', error);
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    console.log('🔄 Toggling theme:', { from: isDarkMode, to: newDarkMode });

    setIsDarkMode(newDarkMode);

    // 🔥 DOM 클래스와 localStorage 모두 즉시 업데이트
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // 🔥 다른 탭/창에서도 동기화되도록 storage 이벤트 발생
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: newDarkMode ? 'dark' : 'light',
      storageArea: localStorage
    }));
  };

  // 🔥 다른 탭에서 테마 변경 시 동기화
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const isDark = e.newValue === 'dark';
        setIsDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    try {
      [
        'userId', 'userName', 'userEmail', 'name', 'email',
        'token', 'refreshToken', 'authToken', 'accessToken',
        'loginTime', 'sessionId', 'userInfo'
      ].forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      [
        'userId', 'userName', 'userEmail', 'name', 'email',
        'token', 'refreshToken', 'authToken', 'accessToken',
        'JSESSIONID', 'sessionId'
      ].forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      setUserProfile(null);
      window.location.href = '/login';
    } catch (error) {
      window.location.href = '/login';
    }
  };

  if (!isMounted) {
    return (
        <aside className={styles.sidebar}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <span className={styles.logoText}>Init</span>
            </div>
          </div>
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </aside>
    );
  }

  if (!userProfile) {
    return (
        <aside className={`${styles.sidebar} ${isDarkMode ? styles.dark : ''}`}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <span className={styles.logoText}>Init</span>
            </div>
          </div>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#356ae4] mx-auto mb-4"></div>
              <p className="text-gray-600">사용자 정보 로딩 중...</p>
            </div>
          </div>
        </aside>
    );
  }

  return (
      <aside className={`${styles.sidebar} ${isDarkMode ? styles.dark : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoText}>Init</span>
          </div>
          <div className={styles.headerControls}>
            <button className={styles.themeToggle} onClick={toggleTheme}>
              {isDarkMode ? <Sun className={styles.themeIcon} /> : <Moon className={styles.themeIcon} />}
            </button>
          </div>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.menuList}>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                  <li key={item.id} className={styles.menuItem}>
                    <Link href={item.href} className={`${styles.menuLink} ${isActive ? styles.active : ''}`}>
                      <Icon className={styles.menuIcon} />
                      <span className={styles.menuLabel}>{item.label}</span>
                      {isActive && <div className={styles.activeIndicator} />}
                    </Link>
                  </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.userProfile}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {userProfile.avatar ? (
                  <Image src={userProfile.avatar} alt={userProfile.name} width={40} height={40} className={styles.avatarImage} />
              ) : (
                  <div className={styles.avatarPlaceholder}>
                    {userProfile.name.charAt(0).toUpperCase()}
                  </div>
              )}
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>{userProfile.name}</div>
              <div className={styles.userEmail}>{userProfile.email}</div>
            </div>
          </div>
        </div>

        <div className={styles.logoutSection}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </aside>
  );
}