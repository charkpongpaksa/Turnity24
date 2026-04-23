import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Badge } from "./badge";
import {
  Paperclip,
  Link as LinkIcon,
  X,
  Upload,
  File,
  Plus,
  AlertCircle,
} from "lucide-react";
import { cn } from "./utils";

export interface AttachmentItem {
  id: string;
  name: string;
  type: "file" | "url";
  url?: string;
  file?: File;
  size?: number;
}

export interface AssignmentFormData {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  points: number;
  type: "file" | "text" | "quiz";
  latePolicy: string;
  attachments: AttachmentItem[];
}

interface AssignmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AssignmentFormData) => void;
  initialData?: Partial<AssignmentFormData>;
  mode?: "create" | "edit";
  courseId?: string;
}

const defaultForm: AssignmentFormData = {
  title: "",
  description: "",
  dueDate: "",
  dueTime: "23:59",
  points: 100,
  type: "file",
  latePolicy: "10% deduction per day late",
  attachments: [],
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssignmentFormModal({
  open,
  onClose,
  onSave,
  initialData,
  mode = "create",
}: AssignmentFormModalProps) {
  const [form, setForm] = useState<AssignmentFormData>(() => ({
    ...defaultForm,
    ...initialData,
    attachments: initialData?.attachments ?? [],
  }));
  const [urlInput, setUrlInput] = useState("");
  const [urlName, setUrlName] = useState("");
  const [urlError, setUrlError] = useState("");
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof AssignmentFormData>(
    key: K,
    value: AssignmentFormData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // ─── File Upload ────────────────────────────────────────────────
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newItems: AttachmentItem[] = Array.from(files).map((file) => ({
      id: generateId(),
      name: file.name,
      type: "file",
      file,
      size: file.size,
    }));
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...newItems],
    }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // ─── URL Attachment ─────────────────────────────────────────────
  const handleAddUrl = () => {
    setUrlError("");
    if (!urlInput.trim()) {
      setUrlError("Please enter a URL");
      return;
    }
    try {
      new URL(urlInput);
    } catch {
      setUrlError("Please enter a valid URL (include https://)");
      return;
    }
    const item: AttachmentItem = {
      id: generateId(),
      name: urlName.trim() || urlInput,
      type: "url",
      url: urlInput.trim(),
    };
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, item],
    }));
    setUrlInput("");
    setUrlName("");
    setShowUrlForm(false);
  };

  const removeAttachment = (id: string) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== id),
    }));
  };

  // ─── Submit ─────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.title.trim() || !form.dueDate) return;
    onSave(form);
    onClose();
  };

  const isValid = form.title.trim().length > 0 && form.dueDate.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Assignment" : "Edit Assignment"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="af-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="af-title"
              placeholder="e.g. React Component Architecture"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="af-desc">Description</Label>
            <Textarea
              id="af-desc"
              placeholder="Describe the assignment requirements..."
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          {/* Row: Due Date + Time + Points */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="af-date">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="af-date"
                type="date"
                value={form.dueDate}
                onChange={(e) => updateField("dueDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-time">Due Time</Label>
              <Input
                id="af-time"
                type="time"
                value={form.dueTime}
                onChange={(e) => updateField("dueTime", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-points">Points</Label>
              <Input
                id="af-points"
                type="number"
                min={0}
                value={form.points}
                onChange={(e) => updateField("points", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Row: Type + Late Policy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Submission Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => updateField("type", v as AssignmentFormData["type"])}
              >
                <SelectTrigger id="af-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="text">Text Entry</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-late">Late Policy</Label>
              <Input
                id="af-late"
                placeholder="e.g. 10% deduction per day"
                value={form.latePolicy}
                onChange={(e) => updateField("latePolicy", e.target.value)}
              />
            </div>
          </div>

          {/* ─── Attachments Section ─── */}
          <div className="space-y-3">
            <Label>Attachments</Label>

            {/* Drag & Drop / Click Zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                dragOver
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Drop files here or <span className="text-blue-600 underline">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOCX, ZIP, images, code files — any format
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* URL Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowUrlForm((v) => !v)}
            >
              <LinkIcon className="h-4 w-4" />
              Add Link / URL
            </Button>

            {/* URL Form */}
            {showUrlForm && (
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="space-y-1.5">
                  <Label htmlFor="af-url-label">Link Label (optional)</Label>
                  <Input
                    id="af-url-label"
                    placeholder="e.g. Starter Code on GitHub"
                    value={urlName}
                    onChange={(e) => setUrlName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="af-url">URL</Label>
                  <Input
                    id="af-url"
                    placeholder="https://..."
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                  />
                  {urlError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {urlError}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleAddUrl} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setShowUrlForm(false); setUrlError(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Attachment List */}
            {form.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Added Attachments ({form.attachments.length})
                </p>
                {form.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {att.type === "url" ? (
                        <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <LinkIcon className="h-4 w-4 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <File className="h-4 w-4 text-orange-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{att.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {att.type === "url" ? "URL" : "File"}
                          </Badge>
                          {att.type === "file" && att.size !== undefined && (
                            <span className="text-xs text-gray-400">{formatFileSize(att.size)}</span>
                          )}
                          {att.type === "url" && (
                            <span className="text-xs text-gray-400 truncate max-w-[200px]">{att.url}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-500 flex-shrink-0"
                      onClick={() => removeAttachment(att.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {mode === "create" ? "Create Assignment" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
