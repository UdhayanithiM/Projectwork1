"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import Editor from "@monaco-editor/react"
import { Skeleton } from "./ui/skeleton"

interface CodeEditorProps {
  value: string
  // FIX: The prop now expects a function that only receives a string.
  onChange: (value: string) => void
  language?: string
  height?: string
}

export function CodeEditor({ 
  value, 
  onChange, 
  language = "javascript", 
  height = "100%" 
}: CodeEditorProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Skeleton className="w-full h-full" style={{ height }} />;
  }

  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

  // FIX: This handler ensures we always call the parent's onChange with a string.
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <div className="h-full w-full">
      <Editor
        height={height}
        language={language}
        theme={editorTheme}
        value={value}
        onChange={handleEditorChange}
        loading={<Skeleton className="w-full h-full" />}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}