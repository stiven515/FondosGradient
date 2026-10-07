import { describe, it, expect } from 'vitest'
import html from '../index.html?raw'
import license from '../LICENSE?raw'
import packageJson from '../package.json?raw'
import vercelJson from '../vercel.json?raw'

const publicFiles = Object.keys(import.meta.glob('../public/*', { query: '?url', eager: false }))

function meta(attr: 'name' | 'property', key: string): string | undefined {
  const tag = html.match(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*>`))?.[0]
  return tag?.match(/content="([^"]*)"/)?.[1]
}

describe('index.html', () => {
  it('points the favicon at a file that actually ships', () => {
    const href = html.match(/<link[^>]*rel="icon"[^>]*href="([^"]+)"/)?.[1]
    expect(href).toBeTruthy()
    expect(publicFiles).toContain(`../public${href}`)
  })

  it('has a descriptive title and meta description', () => {
    expect(html).toMatch(/<title>[^<]{3,}<\/title>/)
    expect(meta('name', 'description')?.length).toBeGreaterThan(40)
  })

  it('sets a theme color that matches the app background', () => {
    expect(meta('name', 'theme-color')).toBe('#080A0D')
  })

  it('has Open Graph and Twitter tags so shared links get a preview', () => {
    expect(meta('property', 'og:title')).toBeTruthy()
    expect(meta('property', 'og:description')).toBeTruthy()
    expect(meta('property', 'og:type')).toBe('website')
    expect(meta('name', 'twitter:card')).toBeTruthy()
  })
})

describe('repository metadata', () => {
  it('ships an MIT license', () => {
    expect(license).toMatch(/^MIT License/)
    expect(license).toMatch(/Permission is hereby granted, free of charge/)
  })

  it('declares the license and a description in package.json', () => {
    const pkg = JSON.parse(packageJson)
    expect(pkg.license).toBe('MIT')
    expect(pkg.description).toBeTruthy()
  })

  it('has a Vercel config with security headers', () => {
    const vercel = JSON.parse(vercelJson)
    const keys = vercel.headers.flatMap((h: { headers: { key: string }[] }) => h.headers.map(x => x.key))
    expect(keys).toEqual(expect.arrayContaining(['X-Content-Type-Options', 'Referrer-Policy']))
  })
})
