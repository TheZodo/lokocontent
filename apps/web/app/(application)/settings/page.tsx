"use client";

import { Settings, User, Bell, Shield, CreditCard, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="px-4 lg:px-6 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-muted">
            <Settings className="w-6 h-6 text-foreground" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Settings
          </h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Settings */}
        <section className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-loko-gold" />
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Display Name</p>
                <p className="text-sm text-muted-foreground">
                  How others see you on Lokocontent
                </p>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Profile Picture</p>
                <p className="text-sm text-muted-foreground">
                  Your avatar image
                </p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Bio</p>
                <p className="text-sm text-muted-foreground">
                  Tell viewers about yourself
                </p>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-loko-teal" />
            <h2 className="text-lg font-semibold text-foreground">
              Notifications
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">New Followers</p>
                <p className="text-sm text-muted-foreground">
                  When someone follows you
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Content Updates</p>
                <p className="text-sm text-muted-foreground">
                  New releases from creators you follow
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Earnings Updates</p>
                <p className="text-sm text-muted-foreground">
                  When you receive payments
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-loko-purple" />
            <h2 className="text-lg font-semibold text-foreground">
              Privacy & Security
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Watch History</p>
                <p className="text-sm text-muted-foreground">
                  Save your viewing history
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Public Profile</p>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your profile
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </section>

        {/* Payment Settings */}
        <section className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-loko-gold" />
            <h2 className="text-lg font-semibold text-foreground">
              Payment & Payouts
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Payment Methods</p>
                <p className="text-sm text-muted-foreground">
                  Manage your payment options
                </p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Payout Account</p>
                <p className="text-sm text-muted-foreground">
                  Where your earnings are sent
                </p>
              </div>
              <Button variant="outline" size="sm">
                Setup
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Transaction History</p>
                <p className="text-sm text-muted-foreground">
                  View your payment history
                </p>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </div>
        </section>

        {/* Language & Region */}
        <section className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-loko-teal" />
            <h2 className="text-lg font-semibold text-foreground">
              Language & Region
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Language</p>
                <p className="text-sm text-muted-foreground">English (US)</p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Content Region</p>
                <p className="text-sm text-muted-foreground">
                  Prioritize content from your region
                </p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
          <h2 className="text-lg font-semibold text-destructive mb-4">
            Danger Zone
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
