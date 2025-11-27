import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

const RichEditor = ({ value, onChange, placeholder, className }: RichEditorProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const exec = (command: string, valueArg?: string) => {
    document.execCommand(command, false, valueArg);
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  };

  const applyLink = () => {
    if (!linkUrl.trim()) return;
    exec("createLink", linkUrl.trim());
    setLinkUrl("");
    setShowLinkInput(false);
  };

  const toolbar = useMemo(() => (
    <div className="flex flex-wrap gap-1 mb-2">
      <Button type="button" variant="outline" size="sm" onClick={() => exec("bold")}>Bold</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => exec("italic")}>Italic</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => exec("underline")}>Underline</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => exec("insertUnorderedList")}>• List</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => exec("insertOrderedList")}>1. List</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setShowLinkInput((s) => !s)}>Link</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => exec("removeFormat")}>Clear</Button>
    </div>
  ), []);

  return (
    <div className={className}>
      {toolbar}
      {showLinkInput && (
        <div className="flex items-center gap-2 mb-2">
          <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          <Button type="button" size="sm" onClick={applyLink}>Apply</Button>
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        className="min-h-[220px] border rounded-md p-3 bg-background prose prose-sm max-w-none"
        data-placeholder={placeholder || "Write your newsletter content..."}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        suppressContentEditableWarning
        style={{ outline: "none" }}
      />
    </div>
  );
};

export default RichEditor;


