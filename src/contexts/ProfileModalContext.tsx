"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface ProfileModalContextType {
  isOpen: boolean
  userId: number | null
  openModal: (userId: number) => void
  closeModal: () => void
}

const ProfileModalContext = createContext<ProfileModalContextType | null>(null)

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)

  const openModal = (targetUserId: number) => {
    setUserId(targetUserId)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setUserId(null)
  }

  return (
    <ProfileModalContext.Provider value={{
      isOpen,
      userId,
      openModal,
      closeModal
    }}>
      {children}
    </ProfileModalContext.Provider>
  )
}

export function useProfileModal() {
  const context = useContext(ProfileModalContext)
  if (!context) {
    throw new Error('useProfileModal must be used within a ProfileModalProvider')
  }
  return context
}
