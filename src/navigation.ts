import type { Navigation } from './types'

interface NavigationOptions {
  portalUrl?: string
}

// Navigation component for Vibeverse
export const createNavigation = (options: NavigationOptions = {}): Navigation => {
  const navOptions = {
    portalUrl: 'https://portal.pieter.com',
    ...options,
  }

  const init = (): HTMLElement => {
    // Create navigation element
    const navElement = document.createElement('div')
    navElement.id = 'nav-group'
    navElement.style.cssText = `
      font-family: 'system-ui', sans-serif;
      position: fixed;
      bottom: -1px;
      left: -1px;
      padding: 7px;
      font-size: 14px;
      font-weight: bold;
      background: #fff;
      color: #000;
      text-decoration: none;
      z-index: 10000;
      border-top-right-radius: 12px;
      border: 1px solid #fff;
      display: flex;
      flex-direction: row;
      gap: 4px;
    `

    // Create To Vibeverse link
    const vibeverseLink = document.createElement('a')
    vibeverseLink.href = navOptions.portalUrl || ''
    vibeverseLink.textContent = '🪐 To Vibeverse'
    vibeverseLink.style.cssText = `
      font-family: 'system-ui', sans-serif;
      padding: 0;
      font-size: 14px;
      font-weight: bold;
      color: #000;
      text-decoration: none;
      border-radius: 12px;
    `

    // Create separator
    const separator = document.createElement('span')
    separator.textContent = '|'
    separator.style.color = '#000'

    // Create Go Back link
    const goBackLink = document.createElement('a')
    goBackLink.id = 'go-back'
    goBackLink.textContent = '← Go Back'
    goBackLink.style.cssText = `
      font-family: 'system-ui', sans-serif;
      padding: 0;
      font-size: 14px;
      font-weight: bold;
      color: #000;
      text-decoration: none;
      border-radius: 12px;
      display: none;
    `

    // Add elements to container
    navElement.appendChild(vibeverseLink)
    navElement.appendChild(separator)
    navElement.appendChild(goBackLink)

    // Add to document
    document.body.appendChild(navElement)

    // Handle URL parameters
    handleUrlParams(navElement, goBackLink, separator)
    return navElement
  }

  const handleUrlParams = (
    navElement: HTMLElement,
    goBackLink: HTMLAnchorElement,
    separator: HTMLSpanElement
  ): void => {
    const urlParams = new URLSearchParams(window.location.search)
    const ref = urlParams.get('ref')

    if (ref) {
      goBackLink.style.display = 'block'
      goBackLink.href = ref
      separator.style.display = 'block'
    } else {
      separator.style.display = 'none'
    }
  }

  const show = (navElement: HTMLElement): void => {
    navElement.style.display = 'flex'
  }

  const hide = (navElement: HTMLElement): void => {
    navElement.style.display = 'none'
  }

  const element = init()
  return {
    element,
    show: () => show(element),
    hide: () => hide(element),
  }
}
