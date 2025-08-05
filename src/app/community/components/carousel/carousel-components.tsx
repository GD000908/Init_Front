"use client"

import React, { useState, useEffect, memo, useCallback } from "react"
import { ChevronLeft, ChevronRight, Share2, Bookmark, Heart, MessageCircle, UserPlus, UserCheck } from "lucide-react"
import type { Post as FeedPagePostType, Category as FeedPageCategoryType } from "@/app/community/feed/page"
import Image from "next/image"
import { getFullImageUrl } from "@/utils/imageUtils"

const MAX_VISIBILITY = 3

const getCategoryLabel = (post: FeedPagePostType, allCategories: FeedPageCategoryType[]): string => {
  const jobCat = allCategories.find((c) => c.key === post.jobCategory && c.type === "job")
  const topicCat = allCategories.find((c) => c.key === post.topicCategory && c.type === "topic")
  return jobCat?.label || topicCat?.label || "일반"
}

// 🔥 와이파이 스타일 좋아요 효과 컴포넌트
const LikeWaveEffect = memo<{ show: boolean; onComplete: () => void }>(function LikeWaveEffect({ show, onComplete }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 1200);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {/* 와이파이 스타일 동심원 효과 */}
      <div className="relative">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute border-2 border-red-500/40 rounded-full animate-ping"
            style={{
              width: `${20 + i * 15}px`,
              height: `${20 + i * 15}px`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 200}ms`,
              animationDuration: '1s',
            }}
          />
        ))}
        {/* 중앙 하트 */}
        <Heart
          size={16}
          className="relative text-red-500 animate-pulse z-10"
          fill="currentColor"
        />
      </div>
    </div>
  );
});

export interface AdaptedPostCardProps {
  post: FeedPagePostType
  allCategories: FeedPageCategoryType[]
  onCardClick: (post: FeedPagePostType) => void
  onCommentClick?: (post: FeedPagePostType) => void
  onLike: (postId: number) => void
  onBookmark?: (postId: number) => void
  onFollowToggle: (authorName: string) => void
  isActive: boolean
}

export const AdaptedPostCard = memo<AdaptedPostCardProps>(function AdaptedPostCard({
  post,
  allCategories,
  onCardClick,
  onCommentClick,
  onLike,
  onBookmark,
  onFollowToggle,
  isActive,
}) {
  const displayCategoryLabel = getCategoryLabel(post, allCategories)
  const authorInitial = post.author.name ? post.author.name[0].toUpperCase() : "A"
  const [showLikeEffect, setShowLikeEffect] = useState(false)
  const [isLikeAnimating, setIsLikeAnimating] = useState(false)

  const handleCardClick = useCallback(() => {
    if (isActive) {
      onCardClick(post)
    }
  }, [isActive, onCardClick, post])

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    // 좋아요 애니메이션 시작 (하트 버튼에만)
    setIsLikeAnimating(true)
    
    onLike(post.id)
    
    // 애니메이션 리셋
    setTimeout(() => setIsLikeAnimating(false), 300)
  }, [onLike, post.id])

  const handleFollowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onFollowToggle(post.author.name)
  }, [onFollowToggle, post.author.name])

  const handleBookmarkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onBookmark) {
      onBookmark(post.id)
    }
  }, [onBookmark, post.id])

  const handleCommentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onCommentClick) {
      onCommentClick(post)
    }
  }, [onCommentClick, post])

  return (
    <div className={`card ${isActive ? "cursor-pointer" : ""} relative overflow-hidden`} onClick={handleCardClick}>
      {/* 와이파이 스타일 좋아요 효과 */}
      <LikeWaveEffect
        show={showLikeEffect}
        onComplete={() => setShowLikeEffect(false)}
      />

      <div className="post-header">
        <div className="avatar">
          <img 
            src={post.author.avatar || "/placeholder_person.svg"} 
            alt={post.author.name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              console.error('🖼️ [Carousel] 프로필 이미지 로딩 실패:', post.author.avatar);
              e.currentTarget.src = "/placeholder_person.svg";
            }}
          />
        </div>
        <div className="post-meta">
          <div className="author-name">{post.author.name}</div>
          <div className="post-time">{post.timeAgo}</div>
        </div>
        {/* Follow Button */}
        <button
          onClick={handleFollowClick}
          className={`ml-auto p-1.5 rounded-full text-xs flex items-center transition-colors ${
            post.author.isFollowing
              ? "bg-violet-500 text-white hover:bg-violet-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          title={post.author.isFollowing ? "팔로잉" : "팔로우"}
        >
          {post.author.isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
          <span className="ml-1 hidden sm:inline">{post.author.isFollowing ? "팔로잉" : "팔로우"}</span>
        </button>
      </div>
      <div className="post-category-container">
        <div className="post-category-badge">{displayCategoryLabel}</div>
      </div>
      {post.imageUrl?.trim() && post.imageUrl.trim() !== "/placeholder.svg" && (
          <div className="relative w-full h-[200px] rounded-md">
            <Image
                src={getFullImageUrl(post.imageUrl.trim()) || post.imageUrl.trim()}
                alt={"Post image"}
                fill
                style={{ objectFit: "contain" }}
                className="rounded-md"
                onError={(e) => {
                  console.error('🖼️ [Carousel] 이미지 로딩 실패:', post.imageUrl);
                  e.currentTarget.style.display = 'none';
                }}
            />
          </div>
      )}
      <p className="post-content" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
      {post.hashtags && post.hashtags.length > 0 && (
          <div className="post-hashtags flex flex-wrap gap-2 mt-2">
            {post.hashtags.map((tag, idx) => (
                <span
                    key={idx}
                    className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full"
                >
        {tag}
      </span>
            ))}
          </div>
      )}
      <div className="post-stats">
        <div className="flex items-center gap-3">
          <button
            className={`relative flex items-center gap-1 p-1 transition-all duration-300 transform ${
              post.likedByMe 
                ? "text-red-500 scale-105" 
                : "text-gray-500 hover:text-red-500 hover:scale-105"
            } ${isLikeAnimating ? 'animate-pulse' : ''}`}
            title="좋아요"
            onClick={handleLikeClick}
          >
            <Heart
              size={16}
              fill={post.likedByMe ? "currentColor" : "none"}
              className={`transition-all duration-300 ${
                post.likedByMe ? 'filter drop-shadow-sm' : ''
              }`}
            />
            <span className={`font-medium transition-all duration-300 ${
              post.likedByMe ? 'text-red-500' : ''
            }`}>{post.likes}</span>
          </button>
          <button
            className="flex items-center gap-1 p-1 text-gray-500 hover:text-violet-500 transition-colors hover:scale-105 transform duration-200"
            title="댓글"
            onClick={handleCommentClick}
          >
            <MessageCircle size={16} />
            <span>{post.comments}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/*<button
            className="p-1 text-gray-500 hover:text-green-500 transition-colors"
            title="공유하기"
            onClick={(e) => {
              e.stopPropagation()
              console.log("Share post:", post.id)
            }}
          >
            <Share2 size={16} />
          </button>*/}
          <button
            className={`p-1 transition-all duration-200 transform hover:scale-105 ${
              post.bookmarkedByMe 
                ? "text-orange-500" 
                : "text-gray-500 hover:text-orange-500"
            }`}
            title="저장하기"
            onClick={handleBookmarkClick}
          >
            <Bookmark 
              size={16} 
              fill={post.bookmarkedByMe ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>
    </div>
  )
});

export interface CarouselProps {
  children: React.ReactNode[]
  initialActiveIndex?: number
  onCardClick: (post: FeedPagePostType) => void
  onCommentClick?: (post: FeedPagePostType) => void
}

export const Carousel = memo<CarouselProps>(function Carousel({ children, initialActiveIndex = 0, onCardClick, onCommentClick }) {
  const [active, setActive] = useState(0)
  const count = React.Children.count(children)

  useEffect(() => {
    const newActive = Math.max(0, Math.min(initialActiveIndex, count > 0 ? count - 1 : 0))
    setActive(newActive)
  }, [initialActiveIndex, count])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (count === 0) return
      if (event.key === "ArrowLeft") {
        setActive((i) => (i - 1 + count) % count)
      } else if (event.key === "ArrowRight") {
        setActive((i) => (i + 1) % count)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [count, active])

  const handlePrev = useCallback(() => {
    setActive((i) => (i - 1 + count) % count)
  }, [count])

  const handleNext = useCallback(() => {
    setActive((i) => (i + 1) % count)
  }, [count])

  if (count === 0) {
    return (
      <div className="carousel-empty flex items-center justify-center h-[28rem] text-gray-500">
        표시할 게시글이 없습니다.
      </div>
    )
  }

  return (
    <div className="carousel">
      {count > 1 && (
        <button className="nav left" onClick={handlePrev}>
          <ChevronLeft size={24} />
        </button>
      )}
      {React.Children.map(children, (child, i) => {
        const childElement = child as React.ReactElement<AdaptedPostCardProps>
        let offset = active - i
        if (Math.abs(offset) > count / 2) {
          offset = offset > 0 ? offset - count : offset + count
        }

        return (
          <div
            key={childElement.key || i}
            className="card-container"
            style={
              {
                "--active": i === active ? 1 : 0,
                "--offset": offset / 3,
                "--direction": Math.sign(offset),
                "--abs-offset": Math.abs(offset) / 3,
                pointerEvents: i === active ? "auto" : "none",
                opacity: Math.abs(offset) >= MAX_VISIBILITY ? 0 : 1,
                display: Math.abs(offset) > MAX_VISIBILITY ? "none" : "block",
              } as React.CSSProperties
            }
          >
            {React.cloneElement(childElement, {
              onCardClick: onCardClick,
              onCommentClick: onCommentClick,
              isActive: i === active,
            })}
          </div>
        )
      })}
      {count > 1 && (
        <button className="nav right" onClick={handleNext}>
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  )
});
