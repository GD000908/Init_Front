// 파일 업로드 방식 이미지 업로드 유틸리티
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export interface UploadResult {
  success: boolean
  imageUrl?: string
  error?: string
}

// 이미지 파일 검증
const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '이미지 크기는 5MB 이하여야 합니다.' }
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: '지원되지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 지원)' }
  }

  return { valid: true }
}

// 🔥 메인 함수: 서버에 파일 업로드
export const uploadImageToServer = async (file: File): Promise<UploadResult> => {
  // 파일 검증
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const formData = new FormData()
  formData.append('image', file)

  try {
    console.log('🔄 서버에 이미지 업로드 시도...', file.name)

    const response = await fetch('http://localhost:8080/api/upload/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('accessToken')}`
      },
      body: formData // 🔥 JSON이 아닌 FormData 전송
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ 서버 업로드 성공:', result)

      // 서버에서 반환된 이미지 URL 처리
      const imageUrl = result.data?.imageUrl || result.imageUrl || result.url

      if (imageUrl) {
        // 절대 경로로 변환 (필요한 경우)
        const fullImageUrl = imageUrl.startsWith('http')
            ? imageUrl
            : `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`

        return { success: true, imageUrl: fullImageUrl }
      } else {
        return { success: false, error: '서버에서 이미지 URL을 반환하지 않았습니다.' }
      }
    } else {
      const errorText = await response.text()
      console.error('❌ 서버 업로드 실패:', errorText)
      return { success: false, error: `서버 업로드 실패: ${response.status}` }
    }
  } catch (error) {
    console.error('❌ 서버 업로드 에러:', error)
    return { success: false, error: '서버 연결에 실패했습니다.' }
  }
}

// 🔥 Base64 함수들은 모두 제거하고 파일 업로드만 사용
export const uploadImageSimple = uploadImageToServer // Base64 대신 서버 업로드 사용