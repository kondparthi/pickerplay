import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import SimpleLayout from './SimpleLayout'
import NotFound from './NotFound'

export default function PageView() {
  const { slug } = useParams()
  const { site, t } = useApp()
  const [page, setPage] = useState(undefined)
  useEffect(() => {
    setPage(undefined)
    api.get(`/pages/${slug}`).then((r) => {
      setPage(r.data)
      document.title = `${r.data.title} | ${site.site_name}`
      window.scrollTo(0, 0)
    }).catch(() => setPage(null))
  }, [slug, site.site_name])
  if (page === null) return <NotFound />
  return (
    <SimpleLayout>
      {page === undefined ? <div className="page-loading">{t('Loading…')}</div> : (
        <article className="card prose page-article">
          <h1>{t(page.title)}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />
        </article>
      )}
    </SimpleLayout>
  )
}
