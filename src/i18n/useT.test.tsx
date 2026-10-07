import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useT, useLang } from './index'
import { en } from './en'
import { es } from './es'

function Probe() {
  const t = useT()
  return <p>{t('lang.name')}</p>
}

beforeEach(() => { localStorage.clear(); useLang.setState({ lang: 'en' }) })

describe('useT', () => {
  it('renders in the current language and re-renders when it changes', () => {
    render(<Probe />)
    expect(screen.getByText(en['lang.name'])).toBeInTheDocument()
    act(() => useLang.getState().setLang('es'))
    expect(screen.getByText(es['lang.name'])).toBeInTheDocument()
  })
})
