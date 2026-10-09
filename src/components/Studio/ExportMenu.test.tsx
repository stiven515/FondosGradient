import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportMenu } from './ExportMenu'
import { useUiStore } from '../../store/uiStore'
import * as exportPng from '../../utils/exportPng'
import * as recordLoopModule from '../../utils/recordLoop'
import { useGradientStore } from '../../store/gradientStore'
import { toCss } from '../../utils/css'

beforeEach(() => {
  vi.restoreAllMocks()
  useUiStore.setState({ toasts: [] })
  exportPng.registerCanvas({ width: 1000, height: 500 } as HTMLCanvasElement)
})

describe('ExportMenu', () => {
  it('opens a menu with format and size choices and closes on Escape', async () => {
    const user = userEvent.setup()
    render(<ExportMenu />)
    const trigger = screen.getByRole('button', { name: /^export/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('radio', { name: 'PNG' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '2K' })).toBeChecked()
    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the output dimensions for the selected size', async () => {
    const user = userEvent.setup()
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    expect(screen.getByText('2560 × 1280 px')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Screen' }))
    expect(screen.getByText('1000 × 500 px')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'HD' }))
    expect(screen.getByText('1920 × 960 px')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '4K' }))
    expect(screen.getByText('3840 × 1920 px')).toBeInTheDocument()
  })

  it('exports with the chosen options and confirms with a toast', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(exportPng, 'exportImage').mockResolvedValue(true)
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('radio', { name: 'WebP' }))
    await user.click(screen.getByRole('radio', { name: 'HD' }))
    await user.click(screen.getByRole('button', { name: 'Download' }))
    expect(spy).toHaveBeenCalledWith('webp', { w: 1920, h: 960 }, 0.95)
    expect(useUiStore.getState().toasts.map(t => t.message)).toEqual(['Image exported'])
  })

  it('offers a quality control only for lossy formats and sends its value', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(exportPng, 'exportImage').mockResolvedValue(true)
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    expect(screen.queryByRole('slider', { name: 'Quality' })).toBeNull()
    await user.click(screen.getByRole('radio', { name: 'JPG' }))
    const quality = screen.getByRole('slider', { name: 'Quality' })
    fireEvent.change(quality, { target: { value: '80' } })
    expect(screen.getByText('80%')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Download' }))
    expect(spy).toHaveBeenCalledWith('jpg', { w: 2560, h: 1280 }, 0.8)
  })

  it('lets the person type a size, keeping the shape of the canvas by default', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(exportPng, 'exportImage').mockResolvedValue(true)
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('radio', { name: 'Custom' }))
    // Starts from the size that was selected.
    expect(screen.getByRole('spinbutton', { name: 'Width' })).toHaveValue(2560)
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: '1200' } })
    expect(screen.getByRole('spinbutton', { name: 'Height' })).toHaveValue(600)
    expect(screen.getByText('1200 × 600 px')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Download' }))
    expect(spy).toHaveBeenCalledWith('png', { w: 1200, h: 600 }, 0.95)
  })

  it('changes the shape freely when the ratio is unlocked, and says the artwork is recomposed', async () => {
    const user = userEvent.setup()
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('radio', { name: 'Custom' }))
    await user.click(screen.getByRole('checkbox', { name: 'Keep ratio' }))
    expect(screen.getByText(/recomposes the artwork/i)).toBeInTheDocument()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: '1080' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Height' }), { target: { value: '1920' } })
    expect(screen.getByText('1080 × 1920 px')).toBeInTheDocument()
  })

  it('caps a typed size at the maximum edge', async () => {
    const user = userEvent.setup()
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('radio', { name: 'Custom' }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: '99999' } })
    expect(screen.getByRole('spinbutton', { name: 'Width' })).toHaveValue(7680)
  })

  it('reports a failed export with an error toast', async () => {
    const user = userEvent.setup()
    vi.spyOn(exportPng, 'exportImage').mockResolvedValue(false)
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('button', { name: 'Download' }))
    const [t] = useUiStore.getState().toasts
    expect(t.tone).toBe('error')
    expect(t.message).toMatch(/export failed/i)
  })
})

describe('ExportMenu code export', () => {
  it('copies the palette as linear and mesh CSS', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    const hexes = useGradientStore.getState().colors.map(c => c.hex)

    await user.click(screen.getByRole('button', { name: 'Copy CSS (linear)' }))
    expect(writeText).toHaveBeenLastCalledWith(toCss(hexes, 'linear'))
    await user.click(screen.getByRole('button', { name: 'Copy CSS (mesh)' }))
    expect(writeText).toHaveBeenLastCalledWith(toCss(hexes, 'mesh'))
    expect(useUiStore.getState().toasts.map(t => t.message)).toContain('CSS copied')
  })

  it('reports when the clipboard is unavailable', async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }, configurable: true,
    })
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('button', { name: 'Copy CSS (linear)' }))
    expect(useUiStore.getState().toasts.some(t => t.tone === 'error')).toBe(true)
  })
})

describe('ExportMenu video', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('hides recording when the browser cannot record video', async () => {
    const user = userEvent.setup()
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    expect(screen.queryByRole('button', { name: /record loop/i })).toBeNull()
  })

  it('records one loop, shows progress, and confirms with a toast', async () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: () => true })
    useGradientStore.setState({ duration: 10 })
    const user = userEvent.setup()
    let report: (p: number) => void = () => {}
    let finish: (r: 'saved') => void = () => {}
    const spy = vi.spyOn(recordLoopModule, 'recordLoop').mockImplementation((onProgress) => {
      report = onProgress!
      return new Promise(resolve => { finish = resolve })
    })
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('button', { name: 'Record loop (10s)' }))
    expect(spy).toHaveBeenCalledTimes(1)

    report(0.4)
    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40'))
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled()

    finish('saved')
    await waitFor(() => expect(useUiStore.getState().toasts.map(t => t.message)).toContain('Video saved'))
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('records with the chosen size, frame rate, container and quality', async () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: () => true })
    const user = userEvent.setup()
    const spy = vi.spyOn(recordLoopModule, 'recordLoop').mockResolvedValue('saved')
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(within(screen.getByRole('radiogroup', { name: 'Video size' })).getByRole('radio', { name: '2K' }))
    await user.click(screen.getByRole('radio', { name: '30 fps' }))
    await user.click(screen.getByRole('radio', { name: 'WEBM' }))
    await user.click(within(screen.getByRole('radiogroup', { name: 'Video quality' })).getByRole('radio', { name: 'Max' }))
    await user.click(screen.getByRole('button', { name: /record loop/i }))
    expect(spy).toHaveBeenCalledWith(expect.any(Function), expect.any(AbortSignal), {
      size: { w: 2560, h: 1280 }, fps: 30, format: 'webm', quality: 'max',
    })
  })

  it('warns that 4K video is recorded in real time', async () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: () => true })
    const user = userEvent.setup()
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    expect(screen.queryByText(/may drop frames/i)).toBeNull()
    await user.click(within(screen.getByRole('radiogroup', { name: 'Video size' })).getByRole('radio', { name: '4K' }))
    expect(screen.getByText(/may drop frames/i)).toBeInTheDocument()
  })

  it('only offers the containers the browser can record', async () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: (m: string) => m.includes('webm') })
    const user = userEvent.setup()
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    expect(screen.queryByRole('radiogroup', { name: 'Container' })).toBeNull()
    expect(screen.getByRole('button', { name: /record loop/i })).toBeInTheDocument()
  })

  it('cancels a recording in progress', async () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: () => true })
    const user = userEvent.setup()
    let signal: AbortSignal | undefined
    vi.spyOn(recordLoopModule, 'recordLoop').mockImplementation((_p, s) => {
      signal = s
      return new Promise(resolve => s!.addEventListener('abort', () => resolve('cancelled')))
    })
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('button', { name: /record loop/i }))
    await user.click(screen.getByRole('button', { name: 'Cancel recording' }))
    expect(signal?.aborted).toBe(true)
    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull())
    expect(useUiStore.getState().toasts.map(t => t.message)).not.toContain('Video saved')
  })

  it('shows an error toast when recording fails', async () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: () => true })
    const user = userEvent.setup()
    vi.spyOn(recordLoopModule, 'recordLoop').mockResolvedValue('failed')
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('button', { name: /record loop/i }))
    await waitFor(() => expect(useUiStore.getState().toasts.some(t => t.tone === 'error')).toBe(true))
  })
})
