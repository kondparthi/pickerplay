import Toolbar from '../components/Toolbar'
import Footer from '../components/Footer'

export default function SimpleLayout({ children, className = '' }) {
  return (
    <div className="app">
      <Toolbar minimal />
      <main className={`simple-main ${className}`}>{children}</main>
      <Footer />
    </div>
  )
}
