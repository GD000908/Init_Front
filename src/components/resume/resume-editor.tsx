"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Save,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  ArrowLeft,
  Globe,
  Languages,
  Plus,
  Trash2,
  BadgeIcon as Certificate,
  Heart,
  Mail,
  Phone,
  MapPin,
  FileText,
  Building,
  Rocket,
  Target,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  resumeApiClient,
  ResumeResponse,
  ResumeCreateRequest,
  ResumeUpdateRequest,
  SkillCreateRequest
} from "@/lib/api-resume"

interface ResumeEditorProps {
  resumeId?: string
}

export default function ResumeEditor({ resumeId }: ResumeEditorProps) {
  const router = useRouter()
  const [resumeTitle, setResumeTitle] = useState("새 이력서")
  const [isPublic, setIsPublic] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 이력서 데이터 상태
  const [resumeData, setResumeData] = useState<ResumeResponse>({
    id: 0,
    title: "새 이력서",
    isPrimary: false,
    isPublic: true,
    fullName: "",
    email: "",
    phone: "",
    address: "",
    birthDate: "",
    profileImageUrl: "",
    githubUrl: "",
    blogUrl: "",
    portfolioUrl: "",
    linkedinUrl: "",
    summary: "",
    workExperiences: [],
    educations: [],
    skills: [],
    certificates: [],
    languages: [],
    createdAt: "",
    updatedAt: ""
  })

  // 임시 상태 (백엔드 스키마에 없는 필드들)
  const [tempData, setTempData] = useState({
    jobPosition: "frontend",
    jobCategory: "IT개발·데이터",
    companyType: "회사내규에 따름",
    location: "서울 전체",
    techStackString: "", // 스킬을 문자열로 표시하기 위한 임시 필드
  })

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // 날짜 변환 유틸리티 함수 - 컴포넌트 내부로 이동
  const formatDateToString = (date: string | null | undefined): string => {
    if (!date) return ""; // undefined/null일 때 빈 문자열 반환

    // 이미 YYYY-MM-DD 형식인지 확인
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(date)) {
      return date;
    }

    // Date 객체로 변환 후 포맷
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }

    return ""; // 변환 실패 시 빈 문자열
  }

  // 이력서 데이터 불러오기
  useEffect(() => {
    if (resumeId) {
      loadResumeData()
    }
  }, [resumeId])

  const loadResumeData = async () => {
    try {
      setIsLoading(true)
      const resume = await resumeApiClient.getResume(parseInt(resumeId!))

      setResumeData(resume)
      setResumeTitle(resume.title)
      setIsPublic(resume.isPublic)

      // 백엔드에서 받은 데이터로 tempData도 업데이트
      setTempData(prev => ({
        ...prev,
        jobCategory: resume.jobCategory || "IT개발·데이터",
        companyType: resume.companyType || "회사내규에 따름",
        location: resume.preferredLocation || "서울 전체",
        jobPosition: resume.jobPosition || "frontend",
        techStackString: resume.skills?.map(skill => skill.name).join(", ") || ""
      }))

    } catch (error) {
      console.error('Failed to load resume:', error)
      alert('이력서를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    router.push("/resume")
  }

  // 이력서 저장 - 하나의 함수로 통합
  const handleSaveResume = async () => {
    try {
      setIsSaving(true)

      // 스킬 문자열을 스킬 배열로 변환
      const skillsArray: SkillCreateRequest[] = tempData.techStackString
          .split(',')
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0)
          .map((skill) => ({
            name: skill,
            category: "기술",
            proficiencyLevel: 3,
          }))

      const requestData: ResumeCreateRequest | ResumeUpdateRequest = {
        title: resumeTitle,
        summary: resumeData.summary,
        isPrimary: resumeData.isPrimary,
        isPublic: isPublic,
        fullName: resumeData.fullName,
        email: resumeData.email,
        phone: resumeData.phone,
        address: resumeData.address,
        birthDate: resumeData.birthDate,
        profileImageUrl: resumeData.profileImageUrl,
        githubUrl: resumeData.githubUrl,
        blogUrl: resumeData.blogUrl,
        portfolioUrl: resumeData.portfolioUrl,
        linkedinUrl: resumeData.linkedinUrl,
        jobPosition: tempData.jobPosition,
        jobCategory: tempData.jobCategory,
        companyType: tempData.companyType,
        preferredLocation: tempData.location,

        workExperiences: resumeData.workExperiences?.map(we => {
          const workExp: any = {
            company: we.company || "",
            position: we.position,
            department: we.department,
            startDate: formatDateToString(we.startDate),
            endDate: formatDateToString(we.endDate),
            isCurrent: we.isCurrent,
            description: we.description,
          }

          // 기존 데이터만 id 포함 (임시 ID 제외)
          if (we.id && we.id < 1000000000000) {
            workExp.id = we.id
          }

          return workExp
        }) || [],

        educations: resumeData.educations?.map(edu => {
          const education: any = {
            school: edu.school || "",
            major: edu.major,
            degree: edu.degree,
            startDate: formatDateToString(edu.startDate),
            endDate: formatDateToString(edu.endDate),
            isCurrent: edu.isCurrent,
            gpa: edu.gpa,
            maxGpa: edu.maxGpa,
            description: edu.description,
          }

          if (edu.id && edu.id < 1000000000000) {
            education.id = edu.id
          }

          return education
        }) || [],

        skills: skillsArray,

        certificates: resumeData.certificates?.map(cert => {
          const certificate: any = {
            name: cert.name || "",
            organization: cert.organization,
            acquisitionDate: formatDateToString(cert.acquisitionDate),
            expirationDate: formatDateToString(cert.expirationDate),
            certificateNumber: cert.certificateNumber,
            displayOrder: cert.displayOrder,
          }

          if (cert.id && cert.id < 1000000000000) {
            certificate.id = cert.id
          }

          return certificate
        }) || [],

        languages: resumeData.languages?.map(lang => {
          const language: any = {
            name: lang.name || "",
            proficiencyLevel: lang.proficiencyLevel || "basic",
            testName: lang.testName,
            testScore: lang.testScore,
          }

          if (lang.id && lang.id < 1000000000000) {
            language.id = lang.id
          }

          return language
        }) || [],
      }

      if (resumeId) {
        await resumeApiClient.updateResume(parseInt(resumeId), requestData as ResumeUpdateRequest)
        alert('이력서가 수정되었습니다.')
      } else {
        await resumeApiClient.createResume(requestData as ResumeCreateRequest)
        alert('이력서가 생성되었습니다.')
      }

      router.push("/resume")

    } catch (error) {
      console.error('Failed to save resume:', error)
      alert('이력서 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 경력 추가
  const addWorkExperience = () => {
    const newWork = {
      id: Date.now(), // 임시 ID (새로 생성되는 항목)
      company: "",
      position: "",
      department: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    }

    setResumeData(prev => ({
      ...prev,
      workExperiences: [...(prev.workExperiences || []), newWork]
    }))
  }

  // 학력 추가
  const addEducation = () => {
    const newEducation = {
      id: Date.now(), // 임시 ID (새로 생성되는 항목)
      school: "",
      major: "",
      degree: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      gpa: undefined,
      maxGpa: undefined,
      description: "",
    }

    setResumeData(prev => ({
      ...prev,
      educations: [...(prev.educations || []), newEducation]
    }))
  }

  // 자격증 추가
  const addCertificate = () => {
    const newCertificate = {
      id: Date.now(), // 임시 ID (새로 생성되는 항목)
      name: "",
      organization: "",
      acquisitionDate: "",
      expirationDate: "",
      certificateNumber: "",
      displayOrder: (resumeData.certificates?.length || 0) + 1,
    }

    setResumeData(prev => ({
      ...prev,
      certificates: [...(prev.certificates || []), newCertificate]
    }))
  }

  // 어학 추가
  const addLanguage = () => {
    const newLanguage = {
      id: Date.now(), // 임시 ID (새로 생성되는 항목)
      name: "",
      proficiencyLevel: "basic",
      testName: "",
      testScore: "",
    }

    setResumeData(prev => ({
      ...prev,
      languages: [...(prev.languages || []), newLanguage]
    }))
  }

  // 직무 카테고리 옵션
  const jobCategoryOptions = [
    "IT개발·데이터",
    "경영·사무",
    "마케팅·광고·홍보",
    "디자인",
    "영업·고객상담",
    "연구개발·설계",
    "생산·제조",
    "교육",
    "의료·보건·복지",
    "미디어·문화·스포츠",
    "금융·보험",
    "기타",
  ]

  // 회사 유형 옵션
  const companyTypeOptions = [
    "대기업 지원용",
    "중견기업 지원용",
    "스타트업 지원용",
    "외국계 지원용",
    "공기업 지원용",
    "회사내규에 따름",
    "기타",
  ]

  // 지역 옵션
  const locationOptions = [
    "서울 전체",
    "서울 강남구",
    "서울 서초구",
    "서울 송파구",
    "서울 마포구",
    "서울 영등포구",
    "경기 성남시",
    "경기 수원시",
    "경기 이천시",
    "인천 전체",
    "부산 전체",
    "대구 전체",
    "광주 전체",
    "대전 전체",
    "울산 전체",
    "세종 전체",
    "전국",
    "해외",
    "재택",
  ]

  return (

      <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto px-4 sm:px-0"
      >
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {resumeId ? "이력서 수정" : "이력서 작성"}
          </h1>
        </div>

        {/* 이력서 제목 및 상단 액션 */}
        <Card className="p-6 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 overflow-hidden relative rounded-2xl shadow-sm mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-full -mr-32 -mt-32 opacity-50"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between relative z-10">
            <div className="flex-1 mr-4">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-indigo-500 mr-2" />
                <Input
                    value={resumeTitle}
                    onChange={(e) => setResumeTitle(e.target.value)}
                    className="text-xl font-semibold border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl"
                    placeholder="이력서 제목을 입력하세요"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
                멋진 이력서의 시작은 눈에 띄는 제목부터!
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">


              <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200"
                  onClick={handleSaveResume}
                  disabled={isSaving}
              >
                <Save className="mr-1 h-4 w-4" />
                {isSaving ? "저장 중..." : "저장하기"}
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between relative z-10">

          </div>
        </Card>

        {/* 이력서 작성 탭 */}
        <Tabs defaultValue="basic" className="mb-6">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/20 dark:data-[state=active]:text-indigo-400 transition-all duration-200"
            >
              <User className="w-4 h-4 mr-2" />
              기본 정보
            </TabsTrigger>
            <TabsTrigger
                value="work"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/20 dark:data-[state=active]:text-indigo-400 transition-all duration-200"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              경력
            </TabsTrigger>
            <TabsTrigger
                value="education"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/20 dark:data-[state=active]:text-indigo-400 transition-all duration-200"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              학력
            </TabsTrigger>
            <TabsTrigger
                value="skills"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/20 dark:data-[state=active]:text-indigo-400 transition-all duration-200"
            >
              <Code className="w-4 h-4 mr-2" />
              스킬
            </TabsTrigger>
            <TabsTrigger
                value="additional"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/20 dark:data-[state=active]:text-indigo-400 transition-all duration-200"
            >
              <Award className="w-4 h-4 mr-2" />
              추가 정보
            </TabsTrigger>
          </TabsList>

          {/* 기본 정보 탭 */}
          <TabsContent value="basic" className="space-y-6">
            <Card className="p-6 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100/30 to-purple-100/30 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-full -mr-32 -mt-32 opacity-50"></div>

              <div className="flex items-center mb-4 relative z-10">
                <User className="w-5 h-5 text-indigo-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">기본 정보</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <User className="w-4 h-4 mr-2 text-indigo-500" />
                    이름
                  </label>
                  <Input
                      placeholder="이름을 입력하세요"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                      value={resumeData.fullName || ""}
                      onChange={(e) =>
                          setResumeData(prev => ({ ...prev, fullName: e.target.value }))
                      }
                  />
                </motion.div>

                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    생년월일
                  </label>
                  <Input
                      type="date"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                      value={resumeData.birthDate || ""}
                      onChange={(e) =>
                          setResumeData(prev => ({ ...prev, birthDate: e.target.value }))
                      }
                  />
                </motion.div>

                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-blue-500" />
                    이메일
                  </label>
                  <Input
                      type="email"
                      placeholder="이메일을 입력하세요"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                      value={resumeData.email || ""}
                      onChange={(e) =>
                          setResumeData(prev => ({ ...prev, email: e.target.value }))
                      }
                  />
                </motion.div>

                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-green-500" />
                    연락처
                  </label>
                  <Input
                      placeholder="연락처를 입력하세요"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                      value={resumeData.phone || ""}
                      onChange={(e) =>
                          setResumeData(prev => ({ ...prev, phone: e.target.value }))
                      }
                  />
                </motion.div>

                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-red-500" />
                    주소
                  </label>
                  <Input
                      placeholder="주소를 입력하세요"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                      value={resumeData.address || ""}
                      onChange={(e) =>
                          setResumeData(prev => ({ ...prev, address: e.target.value }))
                      }
                  />
                </motion.div>

                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    희망 직무
                  </label>
                  <Select
                      value={tempData.jobPosition}
                      onValueChange={(value) =>
                          setTempData(prev => ({ ...prev, jobPosition: value }))
                      }
                  >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl">
                      <SelectValue placeholder="희망 직무를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="frontend">프론트엔드 개발자</SelectItem>
                      <SelectItem value="backend">백엔드 개발자</SelectItem>
                      <SelectItem value="fullstack">풀스택 개발자</SelectItem>
                      <SelectItem value="mobile">모바일 개발자</SelectItem>
                      <SelectItem value="devops">DevOps 엔지니어</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>

              {/* 이력서 리스트에 표시되는 정보 설정 섹션 */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 relative z-10">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <Target className="w-5 h-5 text-indigo-500 mr-2" />
                  이력서 분류 설정
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  아래 설정한 정보는 이력서 목록에 표시되며, 이력서를 분류하는 데 사용됩니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                  >
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Building className="w-4 h-4 mr-2 text-indigo-500" />
                      직무 카테고리
                    </label>
                    <Select
                        value={tempData.jobCategory}
                        onValueChange={(value) =>
                            setTempData(prev => ({ ...prev, jobCategory: value }))
                        }
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl">
                        <SelectValue placeholder="직무 카테고리를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-[200px]">
                        {jobCategoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Rocket className="w-4 h-4 mr-2 text-purple-500" />
                      회사 유형
                    </label>
                    <Select
                        value={tempData.companyType}
                        onValueChange={(value) =>
                            setTempData(prev => ({ ...prev, companyType: value }))
                        }
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl">
                        <SelectValue placeholder="회사 유형을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-[200px]">
                        {companyTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-red-500" />
                      희망 지역
                    </label>
                    <Select
                        value={tempData.location}
                        onValueChange={(value) =>
                            setTempData(prev => ({ ...prev, location: value }))
                        }
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl">
                        <SelectValue placeholder="희망 지역을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-[200px]">
                        {locationOptions.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                </div>
              </div>

              <motion.div
                  className="mt-6 space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
              >
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Heart className="w-4 h-4 mr-2 text-pink-500" />
                  자기소개
                </label>
                <div className="p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                  <Textarea
                      placeholder="간단한 자기소개를 입력하세요"
                      className="min-h-[150px] resize-none bg-white/80 dark:bg-gray-800/80 border-indigo-200 dark:border-indigo-700/50 dark:text-gray-100 rounded-xl"
                      value={resumeData.summary || ""}
                      onChange={(e) =>
                          setResumeData(prev => ({ ...prev, summary: e.target.value }))
                      }
                  />
                  <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-2">
                    자기소개는 이력서의 첫인상을 결정합니다. 자신의 강점과 열정을 담아보세요!
                  </p>
                </div>
              </motion.div>
            </Card>
          </TabsContent>

          {/* 경력 탭 */}
          <TabsContent value="work" className="space-y-6">
            <Card className="p-6 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">경력 사항</h2>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl"
                    onClick={addWorkExperience}
                >
                  + 경력 추가
                </Button>
              </div>

              <div className="space-y-6">
                {resumeData.workExperiences?.map((work, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">회사명</label>
                          <Input
                              placeholder="회사명을 입력하세요"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={work.company || ""}
                              onChange={(e) => {
                                const updatedWork = [...(resumeData.workExperiences || [])]
                                updatedWork[index] = { ...work, company: e.target.value }
                                setResumeData(prev => ({ ...prev, workExperiences: updatedWork }))
                              }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">직책</label>
                          <Input
                              placeholder="직책을 입력하세요"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={work.position || ""}
                              onChange={(e) => {
                                const updatedWork = [...(resumeData.workExperiences || [])]
                                updatedWork[index] = { ...work, position: e.target.value }
                                setResumeData(prev => ({ ...prev, workExperiences: updatedWork }))
                              }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">부서</label>
                          <Input
                              placeholder="부서를 입력하세요"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={work.department || ""}
                              onChange={(e) => {
                                const updatedWork = [...(resumeData.workExperiences || [])]
                                updatedWork[index] = { ...work, department: e.target.value }
                                setResumeData(prev => ({ ...prev, workExperiences: updatedWork }))
                              }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">입사일</label>
                          <Input
                              type="date"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={work.startDate || ""}
                              onChange={(e) => {
                                const updatedWork = [...(resumeData.workExperiences || [])]
                                updatedWork[index] = { ...work, startDate: e.target.value }
                                setResumeData(prev => ({ ...prev, workExperiences: updatedWork }))
                              }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">퇴사일</label>
                          <Input
                              type="date"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={work.endDate || ""}
                              onChange={(e) => {
                                const updatedWork = [...(resumeData.workExperiences || [])]
                                updatedWork[index] = { ...work, endDate: e.target.value }
                                setResumeData(prev => ({ ...prev, workExperiences: updatedWork }))
                              }}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                              checked={work.isCurrent || false}
                              onCheckedChange={(checked) => {
                                const updatedWork = [...(resumeData.workExperiences || [])]
                                updatedWork[index] = { ...work, isCurrent: checked }
                                setResumeData(prev => ({ ...prev, workExperiences: updatedWork }))
                              }}
                          />
                          <label className="text-sm text-gray-700 dark:text-gray-300">현재 재직 중</label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">주요 업무</label>
                        <Textarea
                            placeholder="주요 업무를 입력하세요"
                            className="min-h-[100px] resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                            value={work.description || ""}
                            onChange={(e) => {
                              const updatedWork = [...(resumeData.workExperiences || [])]
                              updatedWork[index] = { ...work, description: e.target.value }
                              setResumeData(prev => ({ ...prev, workExperiences: updatedWork }))
                            }}
                        />
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => {
                              const updatedWork = resumeData.workExperiences?.filter((_, i) => i !== index) || []
                              setResumeData(prev => ({ ...prev, workExperiences: updatedWork }))
                            }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> 삭제
                        </Button>
                      </div>
                    </div>
                ))}

                {(!resumeData.workExperiences || resumeData.workExperiences.length === 0) && (
                    <div className="p-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center">
                      <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2">경력 사항이 없습니다</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">+ 경력 추가 버튼을 클릭해 경력을 추가해보세요</p>
                    </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* 학력 탭 */}
          <TabsContent value="education" className="space-y-6">
            <Card className="p-6 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">학력 사항</h2>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl"
                    onClick={addEducation}
                >
                  + 학력 추가
                </Button>
              </div>

              <div className="space-y-6">
                {resumeData.educations?.map((education, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">학교명</label>
                          <Input
                              placeholder="학교명을 입력하세요"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={education.school || ""}
                              onChange={(e) => {
                                const updatedEducation = [...(resumeData.educations || [])]
                                updatedEducation[index] = { ...education, school: e.target.value }
                                setResumeData(prev => ({ ...prev, educations: updatedEducation }))
                              }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">전공</label>
                          <Input
                              placeholder="전공을 입력하세요"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={education.major || ""}
                              onChange={(e) => {
                                const updatedEducation = [...(resumeData.educations || [])]
                                updatedEducation[index] = { ...education, major: e.target.value }
                                setResumeData(prev => ({ ...prev, educations: updatedEducation }))
                              }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">학위</label>
                          <Select
                              value={education.degree || ""}
                              onValueChange={(value) => {
                                const updatedEducation = [...(resumeData.educations || [])]
                                updatedEducation[index] = { ...education, degree: value }
                                setResumeData(prev => ({ ...prev, educations: updatedEducation }))
                              }}
                          >
                            <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl">
                              <SelectValue placeholder="학위를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high_school">고등학교 졸업</SelectItem>
                              <SelectItem value="associate">전문학사</SelectItem>
                              <SelectItem value="bachelor">학사</SelectItem>
                              <SelectItem value="master">석사</SelectItem>
                              <SelectItem value="doctor">박사</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">입학일</label>
                          <Input
                              type="date"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={education.startDate || ""}
                              onChange={(e) => {
                                const updatedEducation = [...(resumeData.educations || [])]
                                updatedEducation[index] = { ...education, startDate: e.target.value }
                                setResumeData(prev => ({ ...prev, educations: updatedEducation }))
                              }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">졸업일</label>
                          <Input
                              type="date"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={education.endDate || ""}
                              onChange={(e) => {
                                const updatedEducation = [...(resumeData.educations || [])]
                                updatedEducation[index] = { ...education, endDate: e.target.value }
                                setResumeData(prev => ({ ...prev, educations: updatedEducation }))
                              }}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                              checked={education.isCurrent || false}
                              onCheckedChange={(checked) => {
                                const updatedEducation = [...(resumeData.educations || [])]
                                updatedEducation[index] = { ...education, isCurrent: checked }
                                setResumeData(prev => ({ ...prev, educations: updatedEducation }))
                              }}
                          />
                          <label className="text-sm text-gray-700 dark:text-gray-300">재학 중</label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">학점 (GPA)</label>
                          <Input
                              type="number"
                              step="0.01"
                              max="4.5"
                              placeholder="학점을 입력하세요"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={education.gpa || ""}
                              onChange={(e) => {
                                const updatedEducation = [...(resumeData.educations || [])]
                                updatedEducation[index] = { ...education, gpa: parseFloat(e.target.value) || undefined }
                                setResumeData(prev => ({ ...prev, educations: updatedEducation }))
                              }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">만점</label>
                          <Input
                              type="number"
                              step="0.01"
                              placeholder="만점을 입력하세요"
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                              value={education.maxGpa || ""}
                              onChange={(e) => {
                                const updatedEducation = [...(resumeData.educations || [])]
                                updatedEducation[index] = { ...education, maxGpa: parseFloat(e.target.value) || undefined }
                                setResumeData(prev => ({ ...prev, educations: updatedEducation }))
                              }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">학력 관련 추가 정보</label>
                        <Textarea
                            placeholder="추가 정보를 입력하세요"
                            className="min-h-[100px] resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                            value={education.description || ""}
                            onChange={(e) => {
                              const updatedEducation = [...(resumeData.educations || [])]
                              updatedEducation[index] = { ...education, description: e.target.value }
                              setResumeData(prev => ({ ...prev, educations: updatedEducation }))
                            }}
                        />
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => {
                              const updatedEducation = resumeData.educations?.filter((_, i) => i !== index) || []
                              setResumeData(prev => ({ ...prev, educations: updatedEducation }))
                            }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> 삭제
                        </Button>
                      </div>
                    </div>
                ))}

                {(!resumeData.educations || resumeData.educations.length === 0) && (
                    <div className="p-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center">
                      <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2">학력 사항이 없습니다</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">+ 학력 추가 버튼을 클릭해 학력을 추가해보세요</p>
                    </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* 스킬 탭 */}
          <TabsContent value="skills" className="space-y-6">
            <Card className="p-6 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-2xl shadow-sm">
              <div className="flex items-center mb-4">
                <Code className="w-5 h-5 text-indigo-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">보유 스킬</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Code className="w-4 h-4 mr-2 text-indigo-500" />
                    기술 스택
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                    <Textarea
                        placeholder="보유한 기술 스택을 입력하세요 (쉼표로 구분)"
                        className="min-h-[100px] resize-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                        value={tempData.techStackString}
                        onChange={(e) =>
                            setTempData(prev => ({ ...prev, techStackString: e.target.value }))
                        }
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tempData.techStackString.split(",").map(
                          (skill) =>
                              skill.trim() && (
                                  <Badge
                                      key={skill}
                                      className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/40 px-2.5 py-1 rounded-full"
                                  >
                                    {skill.trim()}
                                  </Badge>
                              ),
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      쉼표(,)로 구분하여 입력하세요. 입력 후 자동으로 태그가 생성됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 자격증 섹션 */}
            <Card className="p-6 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Certificate className="w-5 h-5 text-emerald-500 mr-2" />
                  <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">자격증</h2>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl"
                    onClick={addCertificate}
                >
                  <Plus className="w-4 h-4 mr-1" /> 자격증 추가
                </Button>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {resumeData.certificates?.map((certificate, index) => (
                    <AccordionItem key={index} value={`certificate-${index}`} className="border-b border-gray-200 dark:border-gray-800">
                      <AccordionTrigger className="py-4 hover:no-underline">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-3">
                            <Certificate className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {certificate.name || "새 자격증"}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {certificate.acquisitionDate ? new Date(certificate.acquisitionDate).getFullYear() + "년 취득" : "날짜 미입력"}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-1">
                        <div className="space-y-4 pl-11">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">자격증명</label>
                              <Input
                                  placeholder="자격증명을 입력하세요"
                                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                                  value={certificate.name || ""}
                                  onChange={(e) => {
                                    const updatedCertificates = [...(resumeData.certificates || [])]
                                    updatedCertificates[index] = { ...certificate, name: e.target.value }
                                    setResumeData(prev => ({ ...prev, certificates: updatedCertificates }))
                                  }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">발급 기관</label>
                              <Input
                                  placeholder="발급 기관을 입력하세요"
                                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                                  value={certificate.organization || ""}
                                  onChange={(e) => {
                                    const updatedCertificates = [...(resumeData.certificates || [])]
                                    updatedCertificates[index] = { ...certificate, organization: e.target.value }
                                    setResumeData(prev => ({ ...prev, certificates: updatedCertificates }))
                                  }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">취득일</label>
                              <Input
                                  type="date"
                                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                                  value={certificate.acquisitionDate || ""}
                                  onChange={(e) => {
                                    const updatedCertificates = [...(resumeData.certificates || [])]
                                    updatedCertificates[index] = { ...certificate, acquisitionDate: e.target.value }
                                    setResumeData(prev => ({ ...prev, certificates: updatedCertificates }))
                                  }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">만료일</label>
                              <Input
                                  type="date"
                                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                                  value={certificate.expirationDate || ""}
                                  onChange={(e) => {
                                    const updatedCertificates = [...(resumeData.certificates || [])]
                                    updatedCertificates[index] = { ...certificate, expirationDate: e.target.value }
                                    setResumeData(prev => ({ ...prev, certificates: updatedCertificates }))
                                  }}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">자격증 번호</label>
                              <Input
                                  placeholder="자격증 번호를 입력하세요"
                                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                                  value={certificate.certificateNumber || ""}
                                  onChange={(e) => {
                                    const updatedCertificates = [...(resumeData.certificates || [])]
                                    updatedCertificates[index] = { ...certificate, certificateNumber: e.target.value }
                                    setResumeData(prev => ({ ...prev, certificates: updatedCertificates }))
                                  }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => {
                                  const updatedCertificates = resumeData.certificates?.filter((_, i) => i !== index) || []
                                  setResumeData(prev => ({ ...prev, certificates: updatedCertificates }))
                                }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> 삭제
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                ))}
              </Accordion>

              {(!resumeData.certificates || resumeData.certificates.length === 0) && (
                  <div className="mt-4 p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">자격증을 추가해보세요!</p>
                  </div>
              )}
            </Card>

            {/* 어학 및 외국어 능력 섹션 */}
            <Card className="p-6 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-blue-500 mr-2" />
                  <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">어학 및 외국어 능력</h2>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
                    onClick={addLanguage}
                >
                  <Plus className="w-4 h-4 mr-1" /> 어학 추가
                </Button>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {resumeData.languages?.map((language, index) => (
                    <AccordionItem key={index} value={`language-${index}`} className="border-b border-gray-200 dark:border-gray-800">
                      <AccordionTrigger className="py-4 hover:no-underline">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                            <Languages className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {language.testName || language.name || "새 어학"}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {language.testScore || language.proficiencyLevel || "레벨 미입력"}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-1">
                        <div className="space-y-4 pl-11">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">언어</label>
                              <Input
                                  placeholder="언어를 입력하세요"
                                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                                  value={language.name || ""}
                                  onChange={(e) => {
                                    const updatedLanguages = [...(resumeData.languages || [])]
                                    updatedLanguages[index] = { ...language, name: e.target.value }
                                    setResumeData(prev => ({ ...prev, languages: updatedLanguages }))
                                  }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">능숙도</label>
                              <Select
                                  value={language.proficiencyLevel || ""}
                                  onValueChange={(value) => {
                                    const updatedLanguages = [...(resumeData.languages || [])]
                                    updatedLanguages[index] = { ...language, proficiencyLevel: value }
                                    setResumeData(prev => ({ ...prev, languages: updatedLanguages }))
                                  }}
                              >
                                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl">
                                  <SelectValue placeholder="능숙도 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="native">원어민 수준</SelectItem>
                                  <SelectItem value="business">비즈니스 레벨</SelectItem>
                                  <SelectItem value="daily">일상 회화</SelectItem>
                                  <SelectItem value="basic">기초</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">시험명</label>
                              <Input
                                  placeholder="시험명을 입력하세요"
                                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                                  value={language.testName || ""}
                                  onChange={(e) => {
                                    const updatedLanguages = [...(resumeData.languages || [])]
                                    updatedLanguages[index] = { ...language, testName: e.target.value }
                                    setResumeData(prev => ({ ...prev, languages: updatedLanguages }))
                                  }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">점수/급수</label>
                              <Input
                                  placeholder="점수 또는 급수를 입력하세요"
                                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                                  value={language.testScore || ""}
                                  onChange={(e) => {
                                    const updatedLanguages = [...(resumeData.languages || [])]
                                    updatedLanguages[index] = { ...language, testScore: e.target.value }
                                    setResumeData(prev => ({ ...prev, languages: updatedLanguages }))
                                  }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => {
                                  const updatedLanguages = resumeData.languages?.filter((_, i) => i !== index) || []
                                  setResumeData(prev => ({ ...prev, languages: updatedLanguages }))
                                }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> 삭제
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                ))}
              </Accordion>

              {(!resumeData.languages || resumeData.languages.length === 0) && (
                  <div className="mt-6 p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">어학 능력을 추가해보세요!</p>
                  </div>
              )}
            </Card>
          </TabsContent>

          {/* 추가 정보 탭 */}
          <TabsContent value="additional" className="space-y-6">
            <Card className="p-6 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-2xl">
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">추가 정보</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">포트폴리오 링크</label>
                  <Input
                      placeholder="포트폴리오 링크를 입력하세요"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                      value={resumeData.portfolioUrl || ""}
                      onChange={(e) =>
                          setResumeData(prev => ({ ...prev, portfolioUrl: e.target.value }))
                      }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</label>
                  <Input
                      placeholder="GitHub 링크를 입력하세요"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                      value={resumeData.githubUrl || ""}
                      onChange={(e) =>
                          setResumeData(prev => ({ ...prev, githubUrl: e.target.value }))
                      }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">블로그</label>
                  <Input
                      placeholder="블로그 링크를 입력하세요"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                      value={resumeData.blogUrl || ""}
                      onChange={(e) =>
                          setResumeData(prev => ({ ...prev, blogUrl: e.target.value }))
                      }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</label>
                  <Input
                      placeholder="LinkedIn 링크를 입력하세요"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-xl"
                      value={resumeData.linkedinUrl || ""}
                      onChange={(e) =>
                          setResumeData(prev => ({ ...prev, linkedinUrl: e.target.value }))
                      }
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 하단 저장 버튼 */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
              variant="outline"
              className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-200"
              onClick={handleGoBack}
          >
            취소
          </Button>
          <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200"
              onClick={handleSaveResume}
              disabled={isSaving}
          >
            <Save className="mr-1 h-4 w-4" />
            {isSaving ? "저장 중..." : "저장하기"}
          </Button>
        </div>

        {/* 로딩 오버레이 */}
        {(isLoading || isSaving) && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {isLoading ? "이력서 불러오는 중..." : "이력서 저장 중..."}
                  </p>
                </div>
              </div>
            </div>
        )}
      </motion.div>
  )
}