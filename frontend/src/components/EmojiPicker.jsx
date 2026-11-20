import { Smile } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import Popover from "./ui/Popover.jsx";

const EMOJI = ["😂", "😭", "💀", "🔥", "✨", "🫡", "👍", "👏", "❤️", "🙏", "🤝", "💯", "🤔", "😎", "🥲", "🤯", "🫶", "👀", "😅", "🥹", "🎉", "✅", "📚", "🧠", "💡", "🚀", "☕", "🙌", "😤", "🥳", "🤓", "📝", "💻", "🐛", "⚡", "😮"];

export default function EmojiPicker({ onPick }) {
  const { t } = useI18n();
  return (
    <Popover align="start" className="w-64" trigger={(p) => (
      <button type="button" {...p} className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-ink" aria-label={t("comment.emoji")}><Smile className="size-5" /></button>
    )}>
      {(close) => (
        <div className="grid grid-cols-6 gap-1" role="menu">
          {EMOJI.map((e) => <button key={e} type="button" role="menuitem" onClick={() => { onPick(e); close(); }} className="rounded-lg p-1.5 text-xl transition hover:scale-110 hover:bg-surface">{e}</button>)}
        </div>
      )}
    </Popover>
  );
}
