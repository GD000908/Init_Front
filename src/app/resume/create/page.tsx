
import ResumeEditor from "@/components/resume/resume-editor"

// 컴포넌트 정의 수정 - resumeId를 undefined로 전달
export default function ResumeCreatePage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

            <main
                className="ml-0 md:ml-64 p-4 sm:p-6 lg:p-8 overflow-x-hidden transition-all duration-300"
            >
                <ResumeEditor resumeId={undefined} />
            </main>
        </div>
    )
}