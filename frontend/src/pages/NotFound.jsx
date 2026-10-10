import { Link } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import SimpleLayout from './SimpleLayout'

export default function NotFound({ message }) {
  const { t } = useApp()
  return (
    <SimpleLayout>
      <div className="card prose center pad-lg">
        <h1>404</h1>
        <p>{message || t('Sorry, that page could not be found.')}</p>
        <Link className="btn btn-primary" to="/">{t('Go to the wheel')}</Link>
      </div>
    </SimpleLayout>
  )
}
