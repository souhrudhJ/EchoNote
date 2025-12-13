import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Sparkles } from "lucide-react"

type ModelSelectDropdownProps = {
  onModelSelect: (model: string) => void
  isProcessing: boolean
}

export function ModelSelectDropdown({ onModelSelect, isProcessing }: ModelSelectDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2 gradient-primary hover:opacity-90" disabled={isProcessing}>
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Transcribing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Transcribe
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onModelSelect("tiny")}>
          <div className="flex flex-col">
            <span className="font-medium">Fast Mode</span>
            <span className="text-xs text-muted-foreground">Whisper tiny - Less accurate but faster</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onModelSelect("base")}>
          <div className="flex flex-col">
            <span className="font-medium">Standard Mode</span>
            <span className="text-xs text-muted-foreground">Whisper base - Recommended accuracy</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}