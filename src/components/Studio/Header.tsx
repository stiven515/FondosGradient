import { Undo2, Redo2, Share2, Maximize2, CircleHelp } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import { encodeStateToUrl } from '../../utils/urlState'
import { toast, useUiStore } from '../../store/uiStore'
import { goTo } from '../../store/viewStore'
import { t as translate, useT } from '../../i18n'
import { Notch } from '../../ui/Frame'
import { Brand } from '../../ui/Brand'
import { IconButton } from '../../ui/Button'
import { LangToggle } from '../../ui/LangToggle'
import { ExportMenu } from './ExportMenu'

async function shareLink() {
  const s = useGradientStore.getState()
  const query = encodeStateToUrl({
    shader:       s.shader,
    colors:       s.colors,
    parameters:   s.parameters,
    effect:       s.effect,
    effectAmount: s.effectAmount,
    duration:     s.duration,
    aspectRatio:  s.aspectRatio,
  })
  const url = `${window.location.origin}${window.location.pathname}?${query}`
  window.history.replaceState(null, '', `?${query}`)
  try {
    await navigator.clipboard.writeText(url)
    toast(translate('toast.linkCopied'))
  } catch {
    toast(translate('toast.copyFailed'), 'error')
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
  else document.exitFullscreen().catch(() => {})
}

const Divider = () => <span aria-hidden="true" className="mx-1.5 h-4 w-px bg-line-2" />

export function Header() {
  const t = useT()
  const undo = useGradientStore(s => s.undo)
  const redo = useGradientStore(s => s.redo)
  const canUndo = useGradientStore(s => s.historyIndex >= 0)
  const canRedo = useGradientStore(s => s.historyIndex < s.history.length - 1)

  return (
    <header className="relative h-16 flex-shrink-0">
      <button
        type="button"
        onClick={() => goTo('landing')}
        aria-label={t('cta.back')}
        title={t('cta.back')}
        className="absolute left-5 top-[18px] rounded-ctl"
      >
        <Brand />
      </button>

      <Notch label={t('studio.label')}>
        <IconButton label={t('tool.undo')} onClick={undo} disabled={!canUndo}>
          <Undo2 size={16} strokeWidth={1.8} aria-hidden="true" />
        </IconButton>
        <IconButton label={t('tool.redo')} onClick={redo} disabled={!canRedo}>
          <Redo2 size={16} strokeWidth={1.8} aria-hidden="true" />
        </IconButton>
        <Divider />
        <IconButton label={t('tool.share')} onClick={shareLink}>
          <Share2 size={16} strokeWidth={1.8} aria-hidden="true" />
        </IconButton>
        <IconButton label={t('tool.fullscreen')} onClick={toggleFullscreen} className="hidden sm:inline-flex">
          <Maximize2 size={16} strokeWidth={1.8} aria-hidden="true" />
        </IconButton>
        <IconButton label={t('tool.help')} onClick={() => useUiStore.getState().toggleHelp(true)} className="hidden sm:inline-flex">
          <CircleHelp size={16} strokeWidth={1.8} aria-hidden="true" />
        </IconButton>
        <Divider />
        <LangToggle />
      </Notch>

      <div className="absolute right-4 top-3.5">
        <ExportMenu />
      </div>
    </header>
  )
}
