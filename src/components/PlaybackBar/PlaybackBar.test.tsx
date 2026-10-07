import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlaybackBar } from './index'
import { useGradientStore } from '../../store/gradientStore'
import { clock } from '../../utils/timeline'

beforeEach(() => {
  useGradientStore.setState({ duration: 10, isPlaying: true, isLooping: true })
  clock.elapsed = 0
  clock.seekTo = null
})

describe('PlaybackBar', () => {
  it('cycles the duration through 5, 10, 20, 30 and back', async () => {
    const user = userEvent.setup()
    render(<PlaybackBar />)
    const seen: number[] = []
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: /cycle duration/i }))
      seen.push(useGradientStore.getState().duration)
    }
    expect(seen).toEqual([20, 30, 5, 10])
  })

  it('keeps the playhead inside the new duration when it shrinks', async () => {
    const user = userEvent.setup()
    useGradientStore.setState({ duration: 30 })
    clock.elapsed = 25000
    render(<PlaybackBar />)
    await user.click(screen.getByRole('button', { name: /cycle duration/i }))
    expect(useGradientStore.getState().duration).toBe(5)
    expect(clock.seekTo).toBe(5000)
  })

  it('restarts from zero when pressing play after the clip ended', async () => {
    const user = userEvent.setup()
    useGradientStore.setState({ isPlaying: false })
    clock.elapsed = 10000
    render(<PlaybackBar />)
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(clock.seekTo).toBe(0)
    expect(useGradientStore.getState().isPlaying).toBe(true)
  })

  it('seeks with the arrow keys', async () => {
    const user = userEvent.setup()
    clock.elapsed = 2000
    render(<PlaybackBar />)
    screen.getByRole('slider', { name: /playback position/i }).focus()
    await user.keyboard('{ArrowRight}')
    expect(clock.seekTo).toBe(2500)
  })
})
