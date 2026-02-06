'use client'

import { Upload, Info, CheckCircle2 } from 'lucide-react'
import { UploadForm } from '@/components/lokocontent/upload-form'

export default function UploadPage() {
  return (
    <div className="px-4 lg:px-6 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-loko-gold/10">
            <Upload className="w-6 h-6 text-loko-gold" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Upload Content
          </h1>
        </div>
        <p className="text-muted-foreground">
          Share your stories with audiences across Africa and beyond
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="xl:col-span-2">
          <UploadForm />
        </div>

        {/* Guidelines Sidebar */}
        <div className="space-y-6">
          {/* Content Guidelines */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-loko-teal" />
              <h3 className="font-semibold text-foreground">
                Content Guidelines
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-loko-teal shrink-0 mt-0.5" />
                <span>
                  Videos must be original content you own the rights to
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-loko-teal shrink-0 mt-0.5" />
                <span>Minimum resolution: 720p (1280x720)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-loko-teal shrink-0 mt-0.5" />
                <span>Supported formats: MP4, MOV, AVI, MKV</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-loko-teal shrink-0 mt-0.5" />
                <span>Maximum file size: 10GB per video</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-loko-teal shrink-0 mt-0.5" />
                <span>No explicit or harmful content</span>
              </li>
            </ul>
          </div>

          {/* Pricing Tips */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-loko-gold" />
              <h3 className="font-semibold text-foreground">Pricing Tips</h3>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-loko-gold shrink-0 mt-0.5" />
                <span>Short films typically price between $1-5</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-loko-gold shrink-0 mt-0.5" />
                <span>Feature films can range from $3-15</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-loko-gold shrink-0 mt-0.5" />
                <span>Consider free content to build your audience</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-loko-gold shrink-0 mt-0.5" />
                <span>Platform takes 15% of premium content sales</span>
              </li>
            </ul>
          </div>

          {/* Upload Status */}
          <div className="p-6 rounded-xl bg-linear-to-br from-loko-gold/10 to-loko-deep-red/10 border border-loko-gold/20">
            <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our team is here to help you succeed on Lokocontent.
            </p>
            <a
              href="/help"
              className="text-sm text-loko-gold hover:text-loko-gold/80 transition-colors"
            >
              Visit Help Center
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
