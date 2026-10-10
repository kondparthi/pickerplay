import { useApp } from '../store/AppStore'
import WinnerDialog from './dialogs/WinnerDialog'
import CustomizeDialog from './dialogs/CustomizeDialog'
import ShareDialog from './dialogs/ShareDialog'
import SaveDialog from './dialogs/SaveDialog'
import OpenDialog from './dialogs/OpenDialog'
import AuthDialog from './dialogs/AuthDialog'
import ImportSheetDialog from './dialogs/ImportSheetDialog'
import LanguageDialog from './dialogs/LanguageDialog'
import PreferencesDialog from './dialogs/PreferencesDialog'
import FeedbackDialog from './dialogs/FeedbackDialog'
import FairnessDialog from './dialogs/FairnessDialog'
import EditTitleDialog from './dialogs/EditTitleDialog'
import ImagePickerDialog from './dialogs/ImagePickerDialog'

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
  if (!dialog) return null
  const C = MAP[dialog.name]
  return C ? <C key={dialog.name + JSON.stringify(Object.keys(dialog.props || {}))} {...dialog.props} /> : null
}
