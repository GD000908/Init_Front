"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, X, MapPin, Briefcase, DollarSign } from "lucide-react"
import { format, isAfter, differenceInDays } from "date-fns"
import { ko } from "date-fns/locale"

interface Company {
    id: string
    title: string
    start: Date
    end: Date
    color?: string
    status?: 'active' | 'expired' | 'upcoming'
    location?: string
    position?: string
    salary?: string
}

interface BookmarkListProps {
    companies: Company[]
    onDelete: (id: string) => void
    onCompanyMouseEnter: (company: Company) => void
    onCompanyMouseLeave: () => void
    onCompanyClick?: (company: Company) => void
}

export default function BookmarkList({
                                         companies,
                                         onDelete,
                                         onCompanyMouseEnter,
                                         onCompanyMouseLeave,
                                         onCompanyClick,
                                     }: BookmarkListProps) {
    const isExpired = (endDate: Date) => !isAfter(endDate, new Date())

    const getDaysRemaining = (endDate: Date) => {
        const today = new Date()
        const days = differenceInDays(endDate, today)
        return days
    }

    // 활성 공고와 만료된 공고 분리
    const activeCompanies = companies.filter(company => !isExpired(company.end))
    const expiredCompanies = companies.filter(company => isExpired(company.end))

    const CompanyItem = ({ company, isExpired: expired }: { company: Company; isExpired: boolean }) => {
        const daysRemaining = getDaysRemaining(company.end)

        return (
            <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.2 }}
                className={`relative p-2 rounded-lg border cursor-pointer group ${
                    expired
                        ? "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-75"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                }`}
                onClick={() => onCompanyClick && onCompanyClick(company)}
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                        <div
                            className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: company.color || "#4f46e5" }}
                        ></div>
                        <div>
                            <h3 className={`font-semibold text-xs ${
                                expired ? "text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"
                            }`}>
                                {company.title}
                            </h3>
                            {company.position && (
                                <p className={`text-xs mt-0.5 flex items-center ${
                                    expired ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"
                                }`}>
                                    <Briefcase className="w-2 h-2 mr-1" />
                                    {company.position}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {expired ? (
                            <Badge variant="outline" className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-1 py-0.5">
                                마감
                            </Badge>
                        ) : daysRemaining <= 3 ? (
                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-1 py-0.5">
                                {daysRemaining === 0 ? "오늘" : `${daysRemaining}일`}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-1 py-0.5">
                                {daysRemaining}일
                            </Badge>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(company.id)
                            }}
                        >
                            <X className="h-2 w-2" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className={`flex items-center text-xs ${
                        expired ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
                    }`}>
                        <Clock className="w-2 h-2 mr-1" />
                        <span>
              {format(company.start, "MM.dd", { locale: ko })} ~ {format(company.end, "MM.dd", { locale: ko })}
            </span>
                    </div>

                    {company.location && (
                        <div className={`flex items-center text-xs ${
                            expired ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
                        }`}>
                            <MapPin className="w-2 h-2 mr-1" />
                            <span>{company.location}</span>
                        </div>
                    )}

                    {company.salary && (
                        <div className={`flex items-center text-xs ${
                            expired ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
                        }`}>
                            <DollarSign className="w-2 h-2 mr-1" />
                            <span>{company.salary}</span>
                        </div>
                    )}
                </div>
            </motion.div>
        )
    }

    return (
        <div className="space-y-2 max-h-[400px] sm:max-h-[500px] lg:max-h-[550px] overflow-y-auto pr-1">
            <AnimatePresence>
                {companies.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-6 text-gray-500 dark:text-gray-400"
                    >
                        <div className="text-lg mb-1">📌</div>
                        <p className="text-xs">북마크한 공고가 없습니다</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">관심있는 공고를 추가해보세요</p>
                    </motion.div>
                ) : (
                    <>
                        {/* 진행중인 공고 */}
                        {activeCompanies.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                    🟢 진행중인 공고 ({activeCompanies.length})
                                </h4>
                                <div className="space-y-1">
                                    {activeCompanies
                                        .sort((a, b) => getDaysRemaining(a.end) - getDaysRemaining(b.end)) // 마감일 가까운 순으로 정렬
                                        .map((company) => (
                                            <CompanyItem key={company.id} company={company} isExpired={false} />
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* 마감된 공고 */}
                        {expiredCompanies.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                                    🔴 마감된 공고 ({expiredCompanies.length})
                                </h4>
                                <div className="space-y-1">
                                    {expiredCompanies
                                        .sort((a, b) => b.end.getTime() - a.end.getTime()) // 최근 마감 순으로 정렬
                                        .map((company) => (
                                            <CompanyItem key={company.id} company={company} isExpired={true} />
                                        ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}