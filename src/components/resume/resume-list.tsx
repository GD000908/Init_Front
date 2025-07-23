"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowDownUp,
  ArrowUpDown,
  Edit,
  Copy,
  Trash2,
  Star,
  Building,
  MapPin,
  Plus,
  FileText,
  Rocket,
} from "lucide-react"
import { resumeApiClient } from "@/lib/api-resume"

interface Resume {
  id: string
  title: string
  isPrimary: boolean
  lastUpdated: string
  createdAt: string
  jobCategory: string
  location: string
  company: string
  isPublic: boolean
}

// 확장된 타입 정의
interface ExtendedResumeListResponse {
  id: number;
  title: string;
  summary?: string;
  isPrimary: boolean;
  isPublic: boolean;
  jobCategory?: string;
  companyType?: string;
  preferredLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ResumeList() {
  const router = useRouter()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<string>("lastUpdated")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // 이력서 목록 불러오기
  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setIsLoading(true);

      // userId 파라미터 제거 - API 클라이언트에서 자동으로 처리
      const resumeList = await resumeApiClient.getResumes();

      // 백엔드 응답을 프론트엔드 인터페이스에 맞게 변환
      const transformedResumes: Resume[] = resumeList.map((resume: ExtendedResumeListResponse) => ({
        id: resume.id.toString(),
        title: resume.title,
        isPrimary: resume.isPrimary,
        lastUpdated: new Date(resume.updatedAt).toLocaleDateString('ko-KR') + ' 수정',
        createdAt: new Date(resume.createdAt).toLocaleDateString('ko-KR'),
        jobCategory: resume.jobCategory || "직무 미설정",
        location: resume.preferredLocation || "위치 미설정",
        company: resume.companyType || "회사 유형 미설정",
        isPublic: resume.isPublic,
      }));

      setResumes(transformedResumes);
    } catch (error) {
      console.error('Failed to load resumes:', error);
      alert('이력서 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateResume = () => {
    router.push("/resume/create")
  }

  // 수정하기 버튼 핸들러
  const handleEditResume = (id: string) => {
    router.push(`/resume/edit/${id}`)
  }

  const handleSetPrimary = async (id: string) => {
    try {
      await resumeApiClient.setPrimaryResume(parseInt(id)); // userId 제거
      await loadResumes();
      alert('대표 이력서로 설정되었습니다.');
    } catch (error) {
      console.error('Failed to set primary resume:', error);
      alert('대표 이력서 설정에 실패했습니다.');
    }
  }

  const handleCopyResume = async (id: string) => {
    try {
      await resumeApiClient.copyResume(parseInt(id)); // userId 제거
      await loadResumes();
      alert('이력서가 복사되었습니다.');
    } catch (error) {
      console.error('Failed to copy resume:', error);
      alert('이력서 복사에 실패했습니다.');
    }
  }

  const handleDeleteResume = async (id: string) => {
    try {
      if (confirm('정말 삭제하시겠습니까?')) {
        await resumeApiClient.deleteResume(parseInt(id)); // userId 제거
        await loadResumes();
        alert('이력서가 삭제되었습니다.');
      }
    } catch (error) {
      console.error('Failed to delete resume:', error);
      alert('이력서 삭제에 실패했습니다.');
    }
  }
  const handleSortChange = (value: string) => {
    setSortBy(value)
  }

  const handleSortOrderToggle = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  const getSortedResumes = () => {
    // 대표 이력서는 항상 최상단에 표시
    const primaryResume = resumes.find((resume) => resume.isPrimary)
    const otherResumes = resumes.filter((resume) => !resume.isPrimary)

    // 정렬 로직
    const sortedResumes = [...otherResumes].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "lastUpdated":
          // 날짜 문자열에서 날짜 부분만 추출하여 비교
          const dateA = a.lastUpdated.split(" ")[0]
          const dateB = b.lastUpdated.split(" ")[0]
          comparison = dateA.localeCompare(dateB)
          break
        case "createdAt":
          comparison = a.createdAt.localeCompare(b.createdAt)
          break
        case "jobCategory":
          comparison = a.jobCategory.localeCompare(b.jobCategory)
          break
        default:
          comparison = 0
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return { primaryResume, otherResumes: sortedResumes }
  }

  const { primaryResume, otherResumes } = getSortedResumes()

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">이력서 목록을 불러오는 중...</p>
          </div>
        </div>
    );
  }

  return (
      <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto px-4 sm:px-0"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-indigo-500" />
            이력서 관리
          </h1>
          <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200"
              onClick={handleCreateResume}
          >
            <Plus className="mr-2 h-4 w-4" />
            이력서 작성
          </Button>
        </div>

        {/* 대표 이력서 */}
        {primaryResume && (
            <div className="mb-8">
              <div className="flex items-center mb-2">
                <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 mr-2"
                >
                  <Star className="w-3 h-3 mr-1 fill-blue-500" /> 대표 이력서
                </Badge>

              </div>

              <Card className="p-6 border border-indigo-200 dark:border-indigo-800 dark:bg-gray-900/95 overflow-hidden relative rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100/70 to-purple-100/70 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full -mr-32 -mt-32 opacity-50"></div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between relative z-10">
                  <div>
                    <div className="flex items-center mb-2">
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mr-2 flex items-center">
                        {primaryResume.title}
                      </h2>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{primaryResume.lastUpdated}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-1 text-indigo-500 dark:text-indigo-400" />
                        <span>{primaryResume.jobCategory}</span>
                      </div>
                      <div className="flex items-center">
                        <Rocket className="w-4 h-4 mr-1 text-purple-500 dark:text-purple-400" />
                        <span>{primaryResume.company}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-red-500 dark:text-red-400" />
                        <span>{primaryResume.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center mt-4">


                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all duration-200"
                        onClick={() => handleEditResume(primaryResume.id)}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      수정하기
                    </Button>


                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-indigo-200/50 dark:border-indigo-800/50 flex justify-end relative z-10">
                  <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors duration-200"
                        onClick={() => handleCopyResume(primaryResume.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200"
                        onClick={() => handleDeleteResume(primaryResume.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
        )}

        {/* 구분선 추가 */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
          </div>
          <div className="relative flex justify-center">
         <span className="bg-gray-50 dark:bg-gray-950 px-4 text-sm text-gray-500 dark:text-gray-400">
           다른 이력서 목록
         </span>
          </div>
        </div>

        {/* 정렬 컨트롤 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-indigo-500" />총 {resumes.length}건
          </h2>

          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">정렬:</span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] h-9 rounded-xl">
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastUpdated" className="flex items-center">
                    최신 수정순
                  </SelectItem>
                  <SelectItem value="createdAt" className="flex items-center">
                    생성일순
                  </SelectItem>
                  <SelectItem value="title" className="flex items-center">
                    제목순
                  </SelectItem>
                  <SelectItem value="jobCategory" className="flex items-center">
                    직무 카테고리
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 rounded-xl"
                onClick={handleSortOrderToggle}
                title={sortOrder === "asc" ? "오름차순" : "내림차순"}
            >
              {sortOrder === "asc" ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* 이력서 목록 */}
        <div className="mb-4">
          <div className="space-y-4">
            {otherResumes.map((resume, index) => (
                <motion.div
                    key={resume.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                >
                  <Card className="p-5 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors duration-200 hover:shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center mb-2">
                          <h3 className="text-base font-medium text-gray-800 dark:text-gray-100 mr-2 flex items-center">
                            {resume.title}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{resume.lastUpdated}</span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <Building className="w-3.5 h-3.5 mr-1 text-indigo-500 dark:text-indigo-400" />
                            <span>{resume.jobCategory}</span>
                          </div>
                          <div className="flex items-center">
                            <Rocket className="w-3.5 h-3.5 mr-1 text-purple-500 dark:text-purple-400" />
                            <span>{resume.company}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-red-500 dark:text-red-400" />
                            <span>{resume.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl h-8 transition-all duration-200"
                            onClick={() => handleSetPrimary(resume.id)}
                        >
                          <Star className="w-3.5 h-3.5 mr-1" /> 대표 설정
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 rounded-xl h-8 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-200"
                            onClick={() => handleEditResume(resume.id)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 rounded-xl h-8 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-200"
                            onClick={() => handleCopyResume(resume.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 rounded-xl h-8 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-200"
                            onClick={() => handleDeleteResume(resume.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
  )
}