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
import { useApiClient } from "@/api/use-api-client";
import { unwrapApiResponse } from "@/api/client";
import {
  analyzeContentChanges,
  updateContent,
  type AnalyzeContentChangesInput,
  type UpdateContentInput,
} from "@/api/requests/content";
import { createThumbnailUpload } from "@/api/requests/upload";

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

export function EditContentModal({
  content,
  isOpen,
  onClose,
  onSave,
}: EditContentModalProps) {
  const api = useApiClient();
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
  const [saveError, setSaveError] = useState<string | null>(null);
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
    setSaveError(null);
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

  const buildChangedFields = (): AnalyzeContentChangesInput => {
    const changes: AnalyzeContentChangesInput = {};
    if (formData.title !== content.title) changes.title = formData.title;
    if (formData.synopsis !== content.synopsis) changes.synopsis = formData.synopsis;
    if (formData.region !== content.region) changes.region = formData.region;
    if (formData.category !== content.category) changes.category = formData.category;
    return changes;
  };

  const buildUpdatePayload = (thumbnailUrl?: string): UpdateContentInput => {
    const payload: UpdateContentInput = {};
    if (formData.title !== content.title) payload.title = formData.title;
    if (formData.synopsis !== content.synopsis) payload.synopsis = formData.synopsis;
    if (formData.region !== content.region) payload.region = formData.region;
    if (formData.category !== content.category) payload.category = formData.category;
    if (thumbnailUrl && thumbnailUrl !== content.thumbnail) {
      payload.thumbnailUrl = thumbnailUrl;
    }
    return payload;
  };

  const handleAnalyzeAndSave = async () => {
    if (!hasChanges()) {
      onClose();
      return;
    }

    setIsAnalyzing(true);
    setSaveError(null);
    try {
      const changes = buildChangedFields();
      const shouldAnalyze = Object.keys(changes).length > 0;
      const changeWarnings = shouldAnalyze
        ? unwrapApiResponse(await analyzeContentChanges(api, content.id, changes)).data
            .warnings
        : [];

      setWarnings(changeWarnings);

      if (changeWarnings.length > 0) {
        setShowWarnings(true);
        return;
      }

      // No significant warnings, proceed with save
      await performSave();
    } catch {
      setSaveError("We could not analyze your changes. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      let thumbnailUrl = content.thumbnail;

      if (thumbnailFile) {
        const uploadResponse = await createThumbnailUpload(api, {
          filename: thumbnailFile.name,
          contentType: thumbnailFile.type,
        });
        const { uploadUrl, publicUrl } = unwrapApiResponse(uploadResponse).data;

        const putResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": thumbnailFile.type,
          },
          body: thumbnailFile,
        });

        if (!putResponse.ok) {
          throw new Error("Thumbnail upload failed");
        }

        thumbnailUrl = publicUrl;
      }

      const updatePayload = buildUpdatePayload(thumbnailUrl);
      if (Object.keys(updatePayload).length > 0) {
        await unwrapApiResponse(await updateContent(api, content.id, updatePayload));
      }

      const updatedContent: VideoContent = {
        ...content,
        ...formData,
        thumbnail: thumbnailUrl,
      };
      await onSave(updatedContent);
      onClose();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save changes."
      );
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
            {saveError && (
              <span className="text-sm text-destructive-foreground">
                {saveError}
              </span>
            )}
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
