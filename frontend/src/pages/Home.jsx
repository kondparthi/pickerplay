import { useEffect } from 'react'
import { useApp } from '../store/AppStore'
import Workspace from '../components/Workspace'
import InfoCards from '../components/InfoCards'

export default function Home() {
  const { site } = useApp()
  useEffect(() => {
    document.title = site.meta_title || site.site_name
  }, [site])
  return (
    <Workspace>
      <InfoCards />
    </Workspace>
  )
}
