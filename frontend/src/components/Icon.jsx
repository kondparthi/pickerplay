// Central icon map (lucide-react) so the admin can pick icon names for CMS pages.
import {
  Palette, FilePlus2, FolderOpen, Save, Share2, Search, Maximize, Minimize, ChevronDown, Globe, MessageSquare,
  HelpCircle, FileSpreadsheet, User, Settings, Shuffle, ArrowDownAZ, ImagePlus, Plus, ChevronRight, ChevronLeft, X,
  Scale, Code2, Video, Lock, Megaphone, List, Flag, Pencil, Trash2, Copy, ExternalLink, Check, Play, Square,
  LayoutGrid, LogOut, Shield, Menu, Upload, Link2, Eye, RefreshCw, ArrowLeft, Download, Sun, Moon, Image as ImageIcon,
  Trophy, Dices, BookOpen, EyeOff, Mail, PanelLeft, ArrowRight, TrendingUp, Sparkles, BarChart3, KeyRound, Users, FileText, Wrench, LayoutDashboard, Inbox, History, Star, StarOff, Ban,
} from 'lucide-react'

const MAP = {
  palette: Palette, new: FilePlus2, open: FolderOpen, save: Save, share: Share2, search: Search,
  maximize: Maximize, minimize: Minimize, down: ChevronDown, globe: Globe, feedback: MessageSquare,
  help: HelpCircle, sheet: FileSpreadsheet, user: User, settings: Settings, shuffle: Shuffle, sort: ArrowDownAZ,
  imageplus: ImagePlus, plus: Plus, right: ChevronRight, left: ChevronLeft, x: X, scale: Scale, code: Code2,
  video: Video, lock: Lock, megaphone: Megaphone, list: List, flag: Flag, pencil: Pencil, trash: Trash2,
  copy: Copy, external: ExternalLink, check: Check, play: Play, stop: Square, grid: LayoutGrid, logout: LogOut,
  shield: Shield, menu: Menu, upload: Upload, link: Link2, eye: Eye, refresh: RefreshCw, back: ArrowLeft,
  download: Download, sun: Sun, moon: Moon, image: ImageIcon, trophy: Trophy, dice: Dices, chart: BarChart3,
  key: KeyRound, users: Users, file: FileText, wrench: Wrench, dashboard: LayoutDashboard, inbox: Inbox,
  history: History, book: BookOpen, eyeoff: EyeOff, mail: Mail, panel: PanelLeft, arrowright: ArrowRight, trend: TrendingUp, sparkles: Sparkles, star: Star, staroff: StarOff, ban: Ban,
}

export const ICON_NAMES = Object.keys(MAP)

export default function Icon({ name, size = 18, ...rest }) {
  const C = MAP[name] || HelpCircle
  return <C size={size} strokeWidth={2.1} aria-hidden="true" {...rest} />
}
