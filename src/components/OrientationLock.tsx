"use client"

import { useEffect, useState } from 'react'

export default function OrientationLock() {
    const [isLandscape, setIsLandscape] = useState(false)
    const [debugInfo, setDebugInfo] = useState('')

    useEffect(() => {
        console.log('🔍 OrientationLock 컴포넌트 마운트됨')

        // 방향 변경 감지 함수
        const checkOrientation = () => {
            const width = window.innerWidth
            const height = window.innerHeight
            const isMobile = width <= 768
            const isLandscapeMode = width > height
            const isShortHeight = height <= 500

            const shouldShowWarning = isMobile && isLandscapeMode && isShortHeight

            // 디버깅 정보
            const debug = `
                Width: ${width}px
                Height: ${height}px
                IsMobile: ${isMobile}
                IsLandscape: ${isLandscapeMode}
                IsShortHeight: ${isShortHeight}
                ShouldShow: ${shouldShowWarning}
            `

            console.log('📱 Orientation Check:', debug)
            setDebugInfo(debug)
            setIsLandscape(shouldShowWarning)
        }

        // 초기 체크
        checkOrientation()

        // 이벤트 리스너 등록
        const handleResize = () => {
            console.log('📏 Resize 이벤트 발생')
            checkOrientation()
        }

        const handleOrientationChange = () => {
            console.log('🔄 OrientationChange 이벤트 발생')
            setTimeout(checkOrientation, 100)
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('orientationchange', handleOrientationChange)

        // 정리
        return () => {
            console.log('🧹 OrientationLock 정리')
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('orientationchange', handleOrientationChange)
        }
    }, [])

    console.log('🎯 OrientationLock 렌더링:', { isLandscape })

    // 항상 디버그 정보 표시 (개발 중에만)
    if (process.env.NODE_ENV === 'development') {
        return (
            <>
                {/* 디버그 정보 - 개발 모드에서만 표시 */}
                <div style={{
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '10px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    zIndex: 999999,
                    borderRadius: '5px',
                    whiteSpace: 'pre-line'
                }}>
                    DEBUG: {debugInfo}
                    <br />
                    Show Warning: {isLandscape ? 'YES' : 'NO'}
                </div>

                {/* 실제 경고 화면 */}
                {isLandscape && (
                    <div className="landscape-warning">
                        <div className="icon">📱</div>
                        <div className="title">화면을 조정해주세요</div>
                        <div className="subtitle">
                            더 나은 경험을 위해<br />
                            • 모바일: 세로 모드로 회전<br />
                            • PC/태블릿: 창 크기 확대
                        </div>
                    </div>
                )}
            </>
        )
    }

    // 프로덕션에서는 경고 화면만 표시
    if (!isLandscape) return null

    return (
        <div className="landscape-warning">
            <div className="icon">📱</div>
            <div className="title">화면을 조정해주세요</div>
            <div className="subtitle">
                더 나은 경험을 위해<br />
                • 모바일: 세로 모드로 회전<br />
                • PC/태블릿: 창 크기 확대
            </div>
        </div>
    )
}