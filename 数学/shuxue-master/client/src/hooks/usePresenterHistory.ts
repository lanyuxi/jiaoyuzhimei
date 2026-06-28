import { useCallback, useState } from 'react'

type PresenterNarration = {
  startNarration: () => void
  setPresenterMode: (enabled: boolean) => void
} | null

export function usePresenterHistory(narration: PresenterNarration) {
  const [showPresenter, setShowPresenter] = useState(false)

  const openPresenter = useCallback(() => {
    if (!narration) return

    narration.startNarration()
    narration.setPresenterMode(true)
    setShowPresenter(true)
  }, [narration])

  const handleExit = useCallback(() => {
    narration?.setPresenterMode(false)
    setShowPresenter(false)
  }, [narration])

  return { showPresenter, openPresenter, handleExit }
}
