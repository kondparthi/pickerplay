import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import SimpleLayout from './SimpleLayout'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const { t, openDialog } = useApp()
  const [f, setF] = useState({ password: '', password_confirmation: '' })
  const [state, setState] = useState({ busy: false, error: '', done: '' })
  const submit = async (e) => {
    e.preventDefault()
    setState({ busy: true, error: '', done: '' })
    try {
      const r = await api.post('/auth/reset-password', { token: params.get('token'), email: params.get('email'), ...f })
      setState({ busy: false, error: '', done: r.message })
    } catch (err) {
      setState({ busy: false, error: err.message, done: '' })
    }
  }
  return (
    <SimpleLayout>
      <form className="card stack narrow" onSubmit={submit}>
        <h1>{t('Reset password')}</h1>
        {state.error && <div className="alert error">{state.error}</div>}
        {state.done ? (
          <>
            <div className="alert success">{state.done}</div>
            <button type="button" className="btn btn-primary" onClick={() => openDialog('auth')}>{t('Sign in')}</button>
          </>
        ) : (
          <>
            <p className="muted">{params.get('email')}</p>
            <input className="input" type="password" placeholder={t('New password')} minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <input className="input" type="password" placeholder={t('Confirm password')} minLength={8} required value={f.password_confirmation} onChange={(e) => setF({ ...f, password_confirmation: e.target.value })} />
            <button className="btn btn-primary" disabled={state.busy}>{t('Set new password')}</button>
          </>
        )}
      </form>
    </SimpleLayout>
  )
}
