"use client"

import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { uploadProfileImage } from "@/lib/profile-api"
import { getFullImageUrl } from "@/utils/imageUtils"

interface ProfileImageUploadProps {
  userId: number
  currentImageUrl?: string
  onImageUpload: (imageUrl: string) => void
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeConfig = {
  sm: { avatar: "h-16 w-16", button: "h-4 w-4", text: "text-xs" },
  md: { avatar: "h-20 w-20", button: "h-5 w-5", text: "text-sm" },
  lg: { avatar: "h-24 w-24", button: "h-6 w-6", text: "text-base" },
  xl: { avatar: "h-32 w-32", button: "h-8 w-8", text: "text-lg" }
}

export default function ProfileImageUpload({
  userId,
  currentImageUrl,
  onImageUpload,
  className = "",
  size = "lg"
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = sizeConfig[size]

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      setError('파일 크기는 2MB 이하여야 합니다.')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      console.log('🖼️ 프로필 이미지 업로드 시작:', {
        userId,
        fileName: file.name,
        fileSize: file.size
      })

      // 미리보기 생성
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // 이미지 업로드
      const imageUrl = await uploadProfileImage(userId, file)
      console.log('✅ 프로필 이미지 업로드 완료:', imageUrl)

      // 부모 컴포넌트에 알림
      onImageUpload(imageUrl)

      // 미리보기 정리
      URL.revokeObjectURL(preview)
      setPreviewUrl(null)

    } catch (error) {
      console.error('❌ 프로필 이미지 업로드 실패:', error)
      setError(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.')
      
      // 미리보기 정리
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } finally {
      setIsUploading(false)
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemovePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setError(null)
  }

  // 표시할 이미지 URL 결정
  const displayImageUrl = previewUrl || currentImageUrl

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative group">
        <Avatar className={`${config.avatar} border-2 border-gray-200`}>
          <AvatarImage 
            src={getFullImageUrl(displayImageUrl)} 
            alt="프로필 이미지"
            className="object-cover"
          />
          <AvatarFallback className="bg-gray-100 text-gray-500">
            <Camera className={config.button} />
          </AvatarFallback>
        </Avatar>

        {/* 업로드 버튼 오버레이 */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Button
            onClick={handleUploadClick}
            disabled={isUploading}
            size="sm"
            variant="secondary"
            className="rounded-full"
          >
            {isUploading ? (
              <Loader2 className={`${config.button} animate-spin`} />
            ) : (
              <Camera className={config.button} />
            )}
          </Button>
        </div>

        {/* 미리보기 제거 버튼 */}
        {previewUrl && !isUploading && (
          <Button
            onClick={handleRemovePreview}
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* 업로드 버튼 */}
      <div className="flex flex-col items-center space-y-2">
        <Button
          onClick={handleUploadClick}
          disabled={isUploading}
          variant="outline"
          size="sm"
          className={config.text}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              업로드 중...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              이미지 업로드
            </>
          )}
        </Button>

        <p className={`text-gray-500 text-center ${config.text}`}>
          JPG, PNG, GIF 형식<br />
          최대 2MB
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className={`text-red-500 text-center ${config.text}`}>
          {error}
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
