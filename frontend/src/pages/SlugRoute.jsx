import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import { wheelFromConfig } from '../lib/defaults'
import Workspace from '../components/Workspace'
import InfoCards from '../components/InfoCards'
import ToolContent from '../components/ToolContent'
import NotFound from './NotFound'

const SHARE_RE = /^[a-z0-9]{3}-[a-z0-9]{3}$/i

/** "/abc-123" = shared wheel, "/yes-no-wheel" = picker tool landing page */
export default function SlugRoute() {
  const { slug } = useParams()
  const { site, boot, loadWheels, t } = useApp()
  const [state, setState] = useState({ status: 'loading', tool: null })
  const loadedFor = useRef(null)

  useEffect(() => {
    if (loadedFor.current === slug) return
    loadedFor.current = slug
    let alive = true
    setState({ status: 'loading', tool: null })

    if (SHARE_RE.test(slug)) {
      api.get(`/shares/${slug.toLowerCase()}`)
        .then((r) => {
          if (!alive) return
          const d = r.data
          const w = wheelFromConfig(d.config, site, {
            title: d.show_title ? d.title || d.config?.title || '' : '',
            description: d.show_title ? d.description || '' : '',
            shareCode: d.code,
            locked: !d.can_copy,
          })
          if (!d.show_title) w.settings.showTitle = false
          loadWheels([w], t('Loaded shared wheel'))
          document.title = `${d.title || t('Shared wheel')} | ${site.site_name}`
          setState({ status: 'ok', tool: null })
        })
        .catch(() => alive && setState({ status: 'missing', tool: null }))
    } else {
      const pre = boot.preload?.tool?.slug === slug ? Promise.resolve({ data: boot.preload.tool }) : api.get(`/tools/${slug}`)
      pre
        .then((r) => {
          if (!alive) return
          const tool = r.data
          loadWheels([wheelFromConfig({ ...tool.config, title: '' }, site)])
          document.title = tool.meta_title || `${tool.name} | ${site.site_name}`
          setState({ status: 'ok', tool })
        })
        .catch(() => alive && setState({ status: 'missing', tool: null }))
    }
    return () => {
      alive = false
    }
  }, [slug]) // eslint-disable-line

  if (state.status === 'missing') return <NotFound message={SHARE_RE.test(slug) ? t('This shared wheel does not exist or has expired.') : undefined} />
  if (state.status === 'loading') return <div className="page-loading">{t('Loading…')}</div>

  const tool = state.tool
  return (
    <Workspace heading={tool ? <h1 className="tool-heading">{tool.emoji} {tool.heading || tool.name}</h1> : null}>
      {tool ? <ToolContent html={tool.content} heading={tool.meta_title?.split('|')[0].trim() || tool.heading} currentSlug={tool.slug} /> : <InfoCards />}
    </Workspace>
  )
}
