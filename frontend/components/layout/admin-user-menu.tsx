"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, LogOut } from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"

type AdminUserMenuProps = {
  name: string
}

export function AdminUserMenu({ name }: AdminUserMenuProps) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-[#212121] hover:bg-[#F5F5F4]"
      >
        <span className="max-w-[120px] truncate">{name}</span>
        <ChevronDown className="h-4 w-4 text-[#6A6A6A]" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[170px] rounded-lg border border-[#E7E5E4] bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-[#B91C1C] hover:bg-[#FEF2F2]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}
