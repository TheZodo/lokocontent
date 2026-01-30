"use client";

import { HelpCircle, MessageCircle, FileText, Video, Mail, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqItems = [
  {
    question: "How do I upload content?",
    answer: "Navigate to the Upload page from the sidebar and follow the step-by-step process to upload your video, thumbnail, and details.",
  },
  {
    question: "How do I get paid for my content?",
    answer: "Set up your payout account in Settings. Earnings from premium content are processed monthly and sent to your configured payment method.",
  },
  {
    question: "What video formats are supported?",
    answer: "We support MP4, MOV, AVI, and MKV formats. Videos should be at least 720p resolution for the best viewing experience.",
  },
  {
    question: "How do I set pricing for my content?",
    answer: "When uploading, toggle the Premium option and set your desired price. The platform takes a 15% commission on sales.",
  },
  {
    question: "Can I edit my content after uploading?",
    answer: "Yes! Visit your Library and click the edit button on any content to update titles, descriptions, thumbnails, and more.",
  },
  {
    question: "How long does processing take?",
    answer: "Most videos are processed within 30 minutes to 2 hours depending on length and quality. You'll be notified when complete.",
  },
];

const helpCategories = [
  {
    icon: Video,
    title: "Content Creation",
    description: "Learn how to create and upload engaging content",
    articles: 12,
  },
  {
    icon: FileText,
    title: "Account & Billing",
    description: "Manage your account, payments, and subscriptions",
    articles: 8,
  },
  {
    icon: MessageCircle,
    title: "Community Guidelines",
    description: "Understand our content policies and standards",
    articles: 5,
  },
];

export default function HelpPage() {
  return (
    <div className="px-4 lg:px-6 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-loko-teal/10">
            <HelpCircle className="w-6 h-6 text-loko-teal" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Help & Support
          </h1>
        </div>
        <p className="text-muted-foreground">
          Find answers to common questions or get in touch with our team
        </p>
      </div>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {helpCategories.map((category) => (
          <button
            key={category.title}
            type="button"
            className="p-6 rounded-xl bg-card border border-border hover:border-loko-gold/50 transition-colors text-left group"
          >
            <category.icon className="w-8 h-8 text-loko-gold mb-3" />
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-loko-gold transition-colors">
              {category.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {category.description}
            </p>
            <span className="text-xs text-muted-foreground">
              {category.articles} articles
            </span>
          </button>
        ))}
      </div>

      {/* FAQ Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <details
              key={index}
              className="group p-4 rounded-xl bg-card border border-border"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-medium text-foreground pr-4">
                  {item.question}
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="p-6 rounded-xl bg-gradient-to-br from-loko-gold/10 to-loko-teal/10 border border-loko-gold/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Still need help?
            </h2>
            <p className="text-sm text-muted-foreground">
              Our support team is available 24/7 to assist you
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-loko-gold/30 hover:border-loko-gold/50 bg-transparent">
              <MessageCircle className="w-4 h-4 mr-2" />
              Live Chat
            </Button>
            <Button className="bg-loko-gold hover:bg-loko-gold/90 text-background">
              <Mail className="w-4 h-4 mr-2" />
              Email Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
