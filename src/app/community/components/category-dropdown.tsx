"use client"

import type React from "react"
import { useState, useRef, useEffect, memo } from "react"
import { ChevronDown } from "lucide-react"
import type { Category } from "@/app/community/feed/page"

interface CategoryDropdownProps {
  label: string
  categories: Category[]
  selectedKey: string | null
  onSelect: (key: string) => void
  dropdownWidth?: number
  gridCols?: number
  align?: "left" | "center" | "right" // New prop for alignment
}

export const CategoryDropdown = memo<CategoryDropdownProps>(function CategoryDropdown({
  label,
  categories,
  selectedKey,
  onSelect,
  dropdownWidth = 600,
  gridCols = 5,
  align = "center", // Default to center
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPositionClass, setDropdownPositionClass] = useState("left-1/2 -translate-x-1/2") // Default to center
  const buttonRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedCategoryInGroup = categories.find((c) => c.key === selectedKey)
  const triggerLabel = selectedCategoryInGroup ? selectedCategoryInGroup.label : label

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      if (align === "left") {
        setDropdownPositionClass("left-0")
      } else if (align === "right") {
        setDropdownPositionClass("right-0")
      } else {
        // Center logic (default)
        const buttonRect = buttonRef.current.getBoundingClientRect()
        const windowWidth = window.innerWidth
        const buttonCenter = buttonRect.left + buttonRect.width / 2
        const dropdownLeft = buttonCenter - dropdownWidth / 2
        const dropdownRight = buttonCenter + dropdownWidth / 2

        if (dropdownLeft < 20) {
          setDropdownPositionClass("left-0") // Fallback to left if centering overflows left
        } else if (dropdownRight > windowWidth - 20) {
          setDropdownPositionClass("right-0") // Fallback to right if centering overflows right
        } else {
          setDropdownPositionClass("left-1/2 -translate-x-1/2")
        }
      }
    }
  }, [isOpen, dropdownWidth, align])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block">
      <div
        ref={buttonRef}
        className="flex items-center gap-1 px-5 py-2.5 cursor-pointer text-gray-700 hover:text-violet-600 transition-all duration-200 rounded-full hover:bg-violet-50 border border-gray-300 shadow-sm bg-white"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => {
          setTimeout(() => {
            if (dropdownRef.current && !dropdownRef.current.matches(":hover")) {
              setIsOpen(false)
            }
          }, 100)
        }}
      >
        {selectedCategoryInGroup && (
          <selectedCategoryInGroup.icon 
            className="h-4 w-4" 
            style={{ color: selectedCategoryInGroup.color }} 
          />
        )}
        <span className="font-medium text-sm">{triggerLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-all duration-300 ${isOpen ? "rotate-180 text-violet-600" : ""}`} />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute top-full mt-1 z-50 ${dropdownPositionClass}`} // Removed background box, using transparent backdrop for items
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          style={{ width: `${dropdownWidth}px` }}
        >
          <div
            className={`
              grid 
              ${gridCols === 1 ? "grid-cols-1" : ""}
              ${gridCols === 2 ? "grid-cols-2" : ""}
              ${gridCols === 3 ? "grid-cols-3" : ""}
              ${gridCols === 4 ? "grid-cols-4" : ""}
              ${gridCols === 5 ? "grid-cols-5" : ""}
              gap-1.5 p-1.5 rounded-xl backdrop-blur-md bg-white/30 shadow-lg
            `}
          >
            {categories.map((category, index) => (
              <button
                key={category.key}
                onClick={() => {
                  onSelect(category.key)
                  setIsOpen(false)
                }}
                data-selected={selectedKey === category.key}
                className={`
                  category-item
                  group
                  flex items-center justify-center px-3 py-2.5 text-xs font-medium rounded-lg cursor-pointer
                  transition-all duration-200 transform hover:scale-105
                  ${selectedKey === category.key ? "text-white" : "text-gray-800 hover:text-white"}
                `}
                style={{
                  backgroundColor: selectedKey === category.key ? category.color : "rgba(255,255,255,0.7)",
                  animationDelay: `${Math.floor(index / gridCols) * 50 + (index % gridCols) * 25}ms`,
                  animationFillMode: "both",
                  "--category-color": category.color,
                } as React.CSSProperties}
              >
                <category.icon
                  className={`h-3.5 w-3.5 mr-1.5 flex-shrink-0 transition-colors duration-200 category-icon`}
                />
                <span className="whitespace-nowrap text-ellipsis overflow-hidden">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-popIn {
          animation: popIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .category-item {
          position: relative;
        }
        .category-item .category-icon {
          color: var(--category-color);
        }
        .category-item[data-selected="true"] .category-icon {
          color: white !important;
        }
        .category-item:hover {
          background-color: var(--category-color) !important;
        }
        .category-item:hover span {
          color: white !important;
        }
        .category-item:hover .category-icon {
          color: white !important;
        }
      `}</style>
    </div>
  )
})
