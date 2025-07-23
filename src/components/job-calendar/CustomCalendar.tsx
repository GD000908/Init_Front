"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CustomCalendarProps {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    disabled?: (date: Date) => boolean
    className?: string
}

export function CustomCalendar({ selected, onSelect, disabled, className }: CustomCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

    const today = new Date()
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // 월의 첫날과 마지막날
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // 첫 주의 시작일 (일요일부터)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    // 마지막 주의 끝날
    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

    // 모든 날짜 생성
    const dates: Date[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }

    // 요일 헤더
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']

    const goToPrevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1))
    }

    const handleDateClick = (date: Date) => {
        if (disabled && disabled(date)) return
        onSelect?.(date)
    }

    const isToday = (date: Date) => {
        return date.toDateString() === today.toDateString()
    }

    const isSelected = (date: Date) => {
        return selected && date.toDateString() === selected.toDateString()
    }

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === month
    }

    return (
        <div className={`p-2 sm:p-4 w-72 sm:w-80 ${className}`}>
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevMonth}
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>

                <h2 className="text-xs sm:text-sm font-medium">
                    {year}년 {month + 1}월
                </h2>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                {weekdays.map((day, index) => (
                    <div
                        key={day}
                        className={`h-8 w-10 sm:h-10 sm:w-12 flex items-center justify-center text-xs sm:text-sm font-medium ${
                            index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-500'
                        }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {dates.map((date, index) => {
                    const isDisabled = disabled && disabled(date)
                    const currentMonthDate = isCurrentMonth(date)

                    return (
                        <button
                            key={index}
                            onClick={() => handleDateClick(date)}
                            disabled={isDisabled}
                            className={`
               h-8 w-10 sm:h-10 sm:w-12 flex items-center justify-center text-xs sm:text-sm transition-colors
               ${currentMonthDate
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-400 dark:text-gray-600'
                            }
               ${isSelected(date)
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'hover:bg-accent hover:text-accent-foreground'
                            }
               ${isToday(date) && !isSelected(date)
                                ? 'bg-accent text-accent-foreground font-medium'
                                : ''
                            }
               ${isDisabled
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer'
                            }
               rounded-sm
             `}
                        >
                            {date.getDate()}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}