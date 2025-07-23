"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronLeft, ChevronRight, Home } from "lucide-react"
// [추가] Popover 컴포넌트를 import 합니다.
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    differenceInDays,
} from "date-fns"
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

interface SimpleCalendarProps {
    currentHoverCompany: Company | null
    bookmarkedCompanies: Company[]
    onEventClick?: (company: Company) => void
    currentDate?: Date
    onDateChange?: (date: Date) => void
}

export default function SimpleCalendar({
                                           currentHoverCompany,
                                           bookmarkedCompanies,
                                           onEventClick,
                                           currentDate: externalCurrentDate,
                                           onDateChange,
                                       }: SimpleCalendarProps) {
    const [internalCurrentDate, setInternalCurrentDate] = useState(new Date())
    const currentDate = externalCurrentDate || internalCurrentDate
    const [calendarDays, setCalendarDays] = useState<Date[]>([])

    // 캘린더 날짜 계산
    useEffect(() => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const startDate = new Date(monthStart)
        const endDate = new Date(monthEnd)

        // 첫 주의 시작일 계산 (이전 달의 날짜 포함)
        startDate.setDate(startDate.getDate() - startDate.getDay())
        // 마지막 주의 종료일 계산 (다음 달의 날짜 포함)
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

        const days = eachDayOfInterval({ start: startDate, end: endDate })
        setCalendarDays(days)
    }, [currentDate])

    const prevMonth = () => {
        const newDate = subMonths(currentDate, 1)
        if (onDateChange) {
            onDateChange(newDate)
        } else {
            setInternalCurrentDate(newDate)
        }
    }

    const nextMonth = () => {
        const newDate = addMonths(currentDate, 1)
        if (onDateChange) {
            onDateChange(newDate)
        } else {
            setInternalCurrentDate(newDate)
        }
    }

    const goToToday = () => {
        const today = new Date()
        if (onDateChange) {
            onDateChange(today)
        } else {
            setInternalCurrentDate(today)
        }
    }

    // 특정 날짜에 해당하는 이벤트 찾기
    const getEventsForDay = (day: Date) => {
        return bookmarkedCompanies.filter((company) =>
            isWithinInterval(day, {
                start: new Date(company.start.setHours(0, 0, 0, 0)),
                end: new Date(company.end.setHours(23, 59, 59, 999)),
            }),
        )
    }

    // 마감일인 이벤트들 찾기
    const getDeadlineEvents = (day: Date) => {
        return bookmarkedCompanies.filter((company) =>
            isSameDay(day, company.end)
        )
    }

    // 시작일인 이벤트들 찾기
    const getStartEvents = (day: Date) => {
        return bookmarkedCompanies.filter((company) =>
            isSameDay(day, company.start)
        )
    }

    // 요일 헤더
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"]

    return (
        <div className="space-y-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                        {format(currentDate, "yyyy년 MM월", { locale: ko })}
                    </h2>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={prevMonth}
                    >
                        <ChevronLeft className="h-3 w-3" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 rounded-lg text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs"
                        onClick={goToToday}
                    >
                        <Home className="h-3 w-3 mr-1" />
                        오늘
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={nextMonth}
                    >
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* 캘린더 컨테이너 */}
            <div className="calendar-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-[500px] sm:h-[600px] lg:h-[700px]">
                <div className="grid grid-cols-7 h-full">
                    {/* 요일 헤더 */}
                    {weekdays.map((day, index) => (
                        <div
                            key={`weekday-${index}`}
                            className={`text-center py-2 text-xs font-semibold border-b border-gray-200 dark:border-gray-700 ${
                                index === 0
                                    ? "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10"
                                    : index === 6
                                        ? "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10"
                                        : "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50"
                            }`}
                        >
                            {day}
                        </div>
                    ))}

                    {/* 날짜 그리드 */}
                    {calendarDays.map((day, index) => {
                        const isToday = isSameDay(day, new Date())
                        const isCurrentMonth = isSameMonth(day, currentDate)
                        const events = getEventsForDay(day)
                        const deadlineEvents = getDeadlineEvents(day)
                        const startEvents = getStartEvents(day)
                        const isHighlighted = currentHoverCompany && events.some((event) => event.id === currentHoverCompany.id)

                        return (
                            <div
                                key={`day-${index}`}
                                className={`relative min-h-[80px] sm:min-h-[90px] lg:min-h-[100px] p-1 sm:p-2 border-r border-b border-gray-100 dark:border-gray-800 transition-all ${
                                    isCurrentMonth
                                        ? isToday
                                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700"
                                            : isHighlighted
                                                ? "bg-indigo-25 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800"
                                                : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        : "bg-gray-50/50 dark:bg-gray-900/20"
                                }`}
                            >
                                {/* 날짜 숫자 */}
                                <div className="flex justify-between items-start mb-1">
                                    <div
                                        className={`text-xs font-medium ${
                                            isCurrentMonth
                                                ? isToday
                                                    ? "text-indigo-600 dark:text-indigo-400 font-bold"
                                                    : day.getDay() === 0
                                                        ? "text-red-500 dark:text-red-400"
                                                        : day.getDay() === 6
                                                            ? "text-blue-500 dark:text-blue-400"
                                                            : "text-gray-700 dark:text-gray-300"
                                                : "text-gray-400 dark:text-gray-600"
                                        }`}
                                    >
                                        {format(day, "d")}
                                    </div>

                                    {/* 마감일 표시 */}
                                    {deadlineEvents.length > 0 && (
                                        <div className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-1 py-0.5 rounded-full">
                                            {deadlineEvents.length}
                                        </div>
                                    )}
                                </div>

                                {/* [수정] 이벤트 표시 로직 변경 */}
                                <div className="space-y-0.5">
                                    {/* 최대 2개의 이벤트만 표시 */}
                                    {events.slice(0, 2).map((event) => {
                                        const isDeadline = isSameDay(day, event.end)
                                        const isStart = isSameDay(day, event.start)
                                        const daysUntilDeadline = differenceInDays(event.end, new Date())

                                        return (
                                            <div
                                                key={`${day.toISOString()}-${event.id}`}
                                                className={`text-xs px-1 py-0.5 rounded-sm truncate cursor-pointer transition-all duration-200 ${
                                                    currentHoverCompany && currentHoverCompany.id === event.id
                                                        ? "opacity-100 font-medium scale-[1.02] shadow-sm"
                                                        : "opacity-90 hover:opacity-100"
                                                } ${
                                                    isDeadline
                                                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-l-2 border-red-500 font-medium"
                                                        : isStart
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-l-2 border-green-500"
                                                            : "border-l-2"
                                                }`}
                                                style={{
                                                    backgroundColor: isDeadline || isStart ? undefined : `${event.color}1A`, // 투명도 조절
                                                    color: isDeadline || isStart ? undefined : event.color,
                                                    borderLeftColor: event.color,
                                                }}
                                                onClick={() => onEventClick && onEventClick(event)}
                                                title={`${event.title} - ${event.position || ''}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="truncate flex-1">
                                                        {isDeadline && "📍 "}
                                                        {isStart && "🎯 "}
                                                        {event.title}
                                                    </span>
                                                    {daysUntilDeadline <= 3 && daysUntilDeadline >= 0 && !isDeadline && (
                                                        <span className="ml-1 text-orange-600 dark:text-orange-400 font-bold">
                                                            {daysUntilDeadline}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* [추가] 2개 초과 이벤트는 Popover로 표시 */}
                                    {events.length > 2 && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="w-full text-xs text-indigo-600 dark:text-indigo-400 font-medium px-1 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-sm text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/30">
                                                    + {events.length - 2} more...
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-60 p-2 space-y-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                                                <h4 className="text-sm font-semibold px-2 py-1 text-gray-800 dark:text-gray-200">
                                                    {format(day, "M월 d일")} 공고
                                                </h4>
                                                {events.map((event) => (
                                                    <button
                                                        key={`popover-${event.id}`}
                                                        onClick={() => onEventClick && onEventClick(event)}
                                                        className="w-full text-left text-xs p-1.5 rounded-md flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        <span
                                                            className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                                                            style={{ backgroundColor: event.color }}
                                                        ></span>
                                                        <span className="truncate text-gray-700 dark:text-gray-300">{event.title}</span>
                                                    </button>
                                                ))}
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 범례 */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-100 dark:bg-green-900/30 border-l-2 border-green-500 rounded-sm"></div>
                    <span>🎯 시작</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-100 dark:bg-red-900/30 border-l-2 border-red-500 rounded-sm"></div>
                    <span>📍 마감</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-100 dark:bg-orange-900/30 border-l-2 border-orange-500 rounded-sm"></div>
                    <span>3일 이내</span>
                </div>
            </div>
        </div>
    )
}