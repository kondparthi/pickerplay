import { lazy, Suspense, useEffect } from 'react'
import { useApp } from '../store/AppStore'
const WinnerDialog = lazy(() => import('./dialogs/WinnerDialog'))
const CustomizeDialog = lazy(() => import('./dialogs/CustomizeDialog'))
const ShareDialog = lazy(() => import('./dialogs/ShareDialog'))
const SaveDialog = lazy(() => import('./dialogs/SaveDialog'))
const OpenDialog = lazy(() => import('./dialogs/OpenDialog'))
const AuthDialog = lazy(() => import('./dialogs/AuthDialog'))
const ImportSheetDialog = lazy(() => import('./dialogs/ImportSheetDialog'))
const LanguageDialog = lazy(() => import('./dialogs/LanguageDialog'))
const PreferencesDialog = lazy(() => import('./dialogs/PreferencesDialog'))
const FeedbackDialog = lazy(() => import('./dialogs/FeedbackDialog'))
const FairnessDialog = lazy(() => import('./dialogs/FairnessDialog'))
const EditTitleDialog = lazy(() => import('./dialogs/EditTitleDialog'))
const ImagePickerDialog = lazy(() => import('./dialogs/ImagePickerDialog'))

const MAP = {
  winner: WinnerDialog,
  customize: CustomizeDialog,
  share: ShareDialog,
  save: SaveDialog,
  open: OpenDialog,
  auth: AuthDialog,
  importSheet: ImportSheetDialog,
  language: LanguageDialog,
  preferences: PreferencesDialog,
  feedback: FeedbackDialog,
  fairness: FairnessDialog,
  editTitle: EditTitleDialog,
  imagePicker: ImagePickerDialog,
}

export default function Dialogs() {
  const { dialog } = useApp()
  // fetch the winner popup in the background once the page is idle, so it opens instantly after the first spin
  useEffect(() => {
    const go = () => import('./dialogs/WinnerDialog')
    const id = 'requestIdleCallback' in window ? window.requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 3000)
    return () => ('cancelIdleCallback' in window ? window.cancelIdleCallback(id) : clearTimeout(id))
  }, [])
  if (!dialog) return null
  const C = MAP[dialog.name]
  return C ? <Suspense fallback={null}><C key={dialog.name + JSON.stringify(Object.keys(dialog.props || {}))} {...dialog.props} /></Suspense> : null
}
