"use client"

import { useEffect, useState } from 'react'

export default function OrientationLock() {
    const [isLandscape, setIsLandscape] = useState(false)

    useEffect(() => {
        // 방향 변경 감지 함수
        const checkOrientation = () => {
            const isMobile = window.innerWidth <= 768
            const isLandscapeMode = window.innerWidth > window.innerHeight
            const isShortHeight = window.innerHeight <= 500

            // 모바일에서 가로모드이고 높이가 500px 이하일 때만 경고 표시
            setIsLandscape(isMobile && isLandscapeMode && isShortHeight)
        }

        // 초기 체크
        checkOrientation()

        // 이벤트 리스너 등록
        window.addEventListener('resize', checkOrientation)
        window.addEventListener('orientationchange', () => {
            // orientationchange 이벤트는 약간의 지연이 있을 수 있으므로 setTimeout 사용
            setTimeout(checkOrientation, 100)
        })

        // 정리
        return () => {
            window.removeEventListener('resize', checkOrientation)
            window.removeEventListener('orientationchange', checkOrientation)
        }
    }, [])

    // Screen Orientation API 시도 (지원하는 브라우저에서만)
    useEffect(() => {
        if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
            // 전체화면 모드에서만 orientation lock이 가능
            const lockOrientation = async () => {
                try {
                    if (document.fullscreenElement) {
                        await (window.screen.orientation as any).lock('portrait')
                    }
                } catch (error) {
                    console.log('Orientation lock not supported or failed:', error)
                }
            }

            // 전체화면 모드 감지
            document.addEventListener('fullscreenchange', lockOrientation)

            return () => {
                document.removeEventListener('fullscreenchange', lockOrientation)
            }
        }
    }, [])

    if (!isLandscape) return null

    return (
        <div className="landscape-warning">
            <div className="icon">📱</div>
            <div className="title">세로 모드로 사용해주세요</div>
            <div className="subtitle">
                더 나은 경험을 위해<br />
                휴대폰을 세로로 회전해주세요
            </div>
        </div>
    )
}