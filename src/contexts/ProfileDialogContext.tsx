"use client"
import { createContext, useContext, useState } from "react"
import ProfileDialog from "../components/profile"

const ProfileDialogContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({ isOpen: false, setIsOpen: () => {} })

export function ProfileDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
      <ProfileDialogContext.Provider value={{ isOpen, setIsOpen }}>
        {children}
        <ProfileDialog />
      </ProfileDialogContext.Provider>
  )
}

export const useProfileDialog = () => useContext(ProfileDialogContext)
