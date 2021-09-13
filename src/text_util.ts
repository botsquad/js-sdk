import * as marked from 'marked'
import * as URL from 'url-parse'
import { Renderer } from 'marked'
import { SpeechMarkdown } from 'speechmarkdown-js'

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

export function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, s => HTML_ENTITIES[s] || '')
}

let markdownOpts: marked.MarkedOptions | null = null

type HtmlObject = { __html: string }
type Template = string | HtmlObject

export function processTemplate(template: Template, parameters: Record<string, string>) {
  let str
  let isInnerHtml

  if (typeof template === 'object') {
    isInnerHtml = true
    str = template.__html
  } else {
    isInnerHtml = false
    str = template
  }

  str = Object.keys(parameters).reduce((str, k) => str.replace(`{{${k}}}`, parameters[k]), str)
  str = str.replace(/\{\{.*?\}\}/g, '')

  return isInnerHtml ? { __html: str } : str
}

export function processText(value: string): HtmlObject {
  if (!markdownOpts) {
    const renderer = new Renderer()
    const linkRenderer = renderer.link

    renderer.link = (href: string, title: string, text: string) => {
      const html = linkRenderer.call(renderer as any, href, title, text)
      const url = new URL(href, document.location.href)
      if (url.host === document.location.host) {
        return html.replace(/^<a /, '<a target="_top" ')
      }
      return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ')
    }
    markdownOpts = { renderer, breaks: true, gfm: true }
  }
  return { __html: marked(escapeHtml(stripSpeechmarkdown(value)), markdownOpts) }
}

const SMD = new SpeechMarkdown()

export function stripSpeechmarkdown(value: string): string {
  try {
    return SMD.toText(value)
  } catch (e) {
    console.error(e)
    return value
  }
}
