"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  X,
  ImageIcon,
  FileText,
  Globe,
  Tag,
  Check,
  Loader2,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { regions, categories, type VideoContent } from "@/lib/lokocontent-data";

interface EditContentModalProps {
  content: VideoContent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedContent: VideoContent) => Promise<void>;
}

interface ChangeWarning {
  field: string;
  severity: "low" | "medium" | "high";
  message: string;
}

// Stub: LLM would analyze changes and return warnings
async function analyzeChanges(
  original: VideoContent,
  updated: Partial<VideoContent>
): Promise<ChangeWarning[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const warnings: ChangeWarning[] = [];

  // Check title change
  if (updated.title && updated.title !== original.title) {
    const titleSimilarity = calculateSimilarity(original.title, updated.title);
    if (titleSimilarity < 0.5) {
      warnings.push({
        field: "title",
        severity: "high",
        message:
          "Major title change detected. This may confuse viewers who saved this content.",
      });
    } else if (titleSimilarity < 0.8) {
      warnings.push({
        field: "title",
        severity: "medium",
        message: "Significant title change. Consider if this affects discoverability.",
      });
    }
  }

  // Check synopsis change
  if (updated.synopsis && updated.synopsis !== original.synopsis) {
    const synopsisSimilarity = calculateSimilarity(
      original.synopsis,
      updated.synopsis
    );
    if (synopsisSimilarity < 0.3) {
      warnings.push({
        field: "synopsis",
        severity: "high",
        message:
          "Synopsis has changed dramatically. Ensure it still accurately represents your content.",
      });
    }
  }

  // Check category change
  if (updated.category && updated.category !== original.category) {
    warnings.push({
      field: "category",
      severity: "medium",
      message:
        "Changing category will affect how viewers discover your content.",
    });
  }

  // Check region change
  if (updated.region && updated.region !== original.region) {
    warnings.push({
      field: "region",
      severity: "medium",
      message:
        "Changing region may affect regional rankings and recommendations.",
    });
  }

  return warnings;
}

// Simple similarity check (stub - real implementation would use LLM)
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter((word) => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

export function EditContentModal({
  content,
  isOpen,
  onClose,
  onSave,
}: EditContentModalProps) {
  const [formData, setFormData] = useState({
    title: content.title,
    synopsis: content.synopsis,
    region: content.region,
    category: content.category,
  });
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [warnings, setWarnings] = useState<ChangeWarning[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Reset form when content changes
  useEffect(() => {
    setFormData({
      title: content.title,
      synopsis: content.synopsis,
      region: content.region,
      category: content.category,
    });
    setThumbnailPreview(null);
    setThumbnailFile(null);
    setWarnings([]);
    setShowWarnings(false);
  }, [content]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const hasChanges = () => {
    return (
      formData.title !== content.title ||
      formData.synopsis !== content.synopsis ||
      formData.region !== content.region ||
      formData.category !== content.category ||
      thumbnailFile !== null
    );
  };

  const handleAnalyzeAndSave = async () => {
    if (!hasChanges()) {
      onClose();
      return;
    }

    setIsAnalyzing(true);
    try {
      const changeWarnings = await analyzeChanges(content, formData);
      setWarnings(changeWarnings);

      if (changeWarnings.some((w) => w.severity === "high" || w.severity === "medium")) {
        setShowWarnings(true);
        setIsAnalyzing(false);
        return;
      }

      // No significant warnings, proceed with save
      await performSave();
    } catch {
      setIsAnalyzing(false);
    }
  };

  const performSave = async () => {
    setIsSaving(true);
    try {
      const updatedContent: VideoContent = {
        ...content,
        ...formData,
        thumbnail: thumbnailPreview || content.thumbnail,
      };
      await onSave(updatedContent);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    setShowWarnings(false);
    await performSave();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/90 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-popover rounded-2xl border border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h2 className="text-xl font-semibold text-foreground">Edit Content</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thumbnail Section */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <ImageIcon className="inline w-4 h-4 mr-2" />
              Thumbnail
            </label>
            <div className="flex gap-4">
              {/* Current/New Thumbnail Preview */}
              <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-loko-surface border border-border">
                <img
                  src={thumbnailPreview || content.thumbnail}
                  alt="Content thumbnail"
                  className="w-full h-full object-cover"
                />
                {thumbnailPreview && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-loko-gold/90 text-background text-xs font-medium rounded">
                    New
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 flex flex-col justify-center">
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="mb-2"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {thumbnailPreview ? "Change Image" : "Upload New Thumbnail"}
                </Button>
                {thumbnailPreview && (
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Revert to original
                  </button>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG, WebP. 16:9 ratio recommended.
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <FileText className="inline w-4 h-4 mr-2" />
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50"
            />
            {formData.title !== content.title && (
              <p className="text-xs text-loko-gold mt-1">
                Original: {content.title}
              </p>
            )}
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Synopsis
            </label>
            <textarea
              value={formData.synopsis}
              onChange={(e) =>
                setFormData({ ...formData, synopsis: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.synopsis.length} characters
            </p>
          </div>

          {/* Region & Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Globe className="inline w-4 h-4 mr-2" />
                Region
              </label>
              <select
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50 appearance-none cursor-pointer"
              >
                {regions
                  .filter((r) => r.id !== "all")
                  .map((region) => (
                    <option key={region.id} value={region.id} className="bg-popover">
                      {region.flag} {region.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Tag className="inline w-4 h-4 mr-2" />
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-loko-gold/50 appearance-none cursor-pointer"
              >
                {categories
                  .filter((c) => c.id !== "all")
                  .map((category) => (
                    <option key={category.id} value={category.id} className="bg-popover">
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Warning Panel */}
          {showWarnings && warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-loko-gold/10 border border-loko-gold/30">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-loko-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">
                    Review Changes
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    We detected significant changes that may affect your content.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 ml-8">
                {warnings.map((warning, index) => (
                  <li
                    key={index}
                    className={cn(
                      "text-sm flex items-start gap-2",
                      warning.severity === "high"
                        ? "text-destructive-foreground"
                        : warning.severity === "medium"
                          ? "text-loko-gold"
                          : "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        warning.severity === "high"
                          ? "bg-destructive"
                          : warning.severity === "medium"
                            ? "bg-loko-gold"
                            : "bg-muted-foreground"
                      )}
                    />
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border shrink-0 bg-popover">
          <Button variant="ghost" onClick={onClose} disabled={isSaving || isAnalyzing}>
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            {showWarnings ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowWarnings(false)}
                  disabled={isSaving}
                >
                  Go Back
                </Button>
                <Button
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="bg-loko-gold hover:bg-loko-gold/90 text-background"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Anyway
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAnalyzeAndSave}
                disabled={!hasChanges() || isAnalyzing || isSaving}
                className="bg-gradient-to-r from-loko-gold to-loko-deep-red hover:from-loko-gold/90 hover:to-loko-deep-red/90 text-foreground"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
