import * as React from "react"

export function Alert({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {children}
        </div>
    )
}

export function AlertTitle({ children }: { children: React.ReactNode }) {
    return <div className="font-semibold mb-1">{children}</div>
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
    return <div className="text-sm">{children}</div>
}