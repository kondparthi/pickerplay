import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import Modal from '../Modal'

export default function EditTitleDialog() {
  const { activeWheel, ws, updateWheel, closeDialog, t } = useApp()
  const [title, setTitle] = useState(activeWheel.title || '')
  const [description, setDescription] = useState(activeWheel.description || '')
  const save = (e) => {
    e?.preventDefault()
    updateWheel(ws.active, { title: title.trim(), description: description.trim() })
    closeDialog()
  }
  return (
    <Modal title={t('Edit title')} onClose={closeDialog} footer={<><button className="btn btn-text" onClick={closeDialog}>{t('Cancel')}</button><button className="btn btn-primary" onClick={save}>{t('OK')}</button></>}>
      <form className="stack" onSubmit={save}>
        <input className="input" placeholder={t('Wheel title')} value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input" rows={3} placeholder={t('Description (optional)')} value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} />
      </form>
    </Modal>
  )
}
