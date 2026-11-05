import { useEffect } from 'react'
import { useApp } from '../store/AppStore'
import Workspace from '../components/Workspace'
import InfoCards from '../components/InfoCards'
import '../content.css'

export default function Home() {
  const { site, showHomeWheel, t } = useApp()
  useEffect(() => { showHomeWheel() }, []) // eslint-disable-line
  useEffect(() => {
    document.title = site.meta_title || site.site_name
  }, [site])
  return (
    <Workspace>
      <section className="pc-intro home-intro">
        <h1>{t('Random Name Picker Wheel – Spin to Pick a Winner')}</h1>
        <p>{t('Type or paste your names, ideas or options, then spin the wheel to pick one at random. Use it to choose students in class, draw giveaway winners, decide who goes first or settle everyday decisions – free, with no sign-up.')}</p>
      </section>
      <InfoCards />
    </Workspace>
  )
}
