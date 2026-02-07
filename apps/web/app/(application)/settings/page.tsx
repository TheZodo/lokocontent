"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Loader2,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useApiQuery, useApiMutation } from "@/api/query";
import {
  getCurrentUser,
  updateProfile,
  updateSettings,
  updatePayout,
} from "@/api/requests/users";
import { PayoutMethod } from "@lokocontent/db";

export default function SettingsPage() {
  const userQuery = useApiQuery(["users", "me"], (api) => getCurrentUser(api));
  const [hasInitialized, setHasInitialized] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    profilePicture: "",
  });
  const [settingsForm, setSettingsForm] = useState({
    emailNotifications: true,
    newFollowerNotifications: true,
    contentUpdateNotifications: true,
    earningsNotifications: true,
    watchHistoryEnabled: true,
  });
  const [payoutForm, setPayoutForm] = useState({
    payoutMethod: PayoutMethod.BANK,
    payoutDetails: "",
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const profileMutation = useApiMutation((api, input: typeof profileForm) =>
    updateProfile(api, {
      displayName: input.displayName || undefined,
      bio: input.bio || undefined,
      profilePicture: input.profilePicture || undefined,
    })
  );

  const settingsMutation = useApiMutation(
    (api, input: typeof settingsForm) => updateSettings(api, input)
  );

  const payoutMutation = useApiMutation(
    (api, input: { payoutMethod: PayoutMethod; payoutDetails: unknown }) =>
      updatePayout(api, {
        payoutMethod: input.payoutMethod,
        payoutDetails: input.payoutDetails,
      })
  );

  useEffect(() => {
    if (!userQuery.data || hasInitialized) return;
    const user = userQuery.data;
    setProfileForm({
      displayName: user.displayName ?? "",
      bio: user.bio ?? "",
      profilePicture: user.profilePicture ?? "",
    });
    setSettingsForm({
      emailNotifications: user.emailNotifications ?? true,
      newFollowerNotifications: user.newFollowerNotifications ?? true,
      contentUpdateNotifications: user.contentUpdateNotifications ?? true,
      earningsNotifications: user.earningsNotifications ?? true,
      watchHistoryEnabled: user.watchHistoryEnabled ?? true,
    });
    if (user.payoutMethod) {
      setPayoutForm({
        payoutMethod: user.payoutMethod,
        payoutDetails: user.payoutDetails
          ? JSON.stringify(user.payoutDetails, null, 2)
          : "",
      });
    }
    setHasInitialized(true);
  }, [userQuery.data, hasInitialized]);

  const payoutDetailsPayload = useMemo(() => {
    if (!payoutForm.payoutDetails.trim()) return null;
    try {
      return JSON.parse(payoutForm.payoutDetails);
    } catch {
      return undefined;
    }
  }, [payoutForm.payoutDetails]);

  const handleSaveProfile = async () => {
    setProfileError(null);
    try {
      await profileMutation.mutateAsync(profileForm);
    } catch {
      setProfileError("Unable to update profile.");
    }
  };

  const handleSaveSettings = async () => {
    setSettingsError(null);
    try {
      await settingsMutation.mutateAsync(settingsForm);
    } catch {
      setSettingsError("Unable to update settings.");
    }
  };

  const handleSavePayout = async () => {
    setPayoutError(null);
    if (payoutForm.payoutDetails && payoutDetailsPayload === undefined) {
      setPayoutError("Payout details must be valid JSON.");
      return;
    }
    try {
      await payoutMutation.mutateAsync({
        payoutMethod: payoutForm.payoutMethod,
        payoutDetails: payoutDetailsPayload ?? {},
      });
    } catch {
      setPayoutError("Unable to update payout settings.");
    }
  };

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
            <div>
              <label className="text-sm font-medium text-foreground">
                Display Name
              </label>
              <input
                type="text"
                value={profileForm.displayName}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    displayName: event.target.value,
                  }))
                }
                placeholder="Your name"
                className="mt-2 w-full rounded-lg bg-secondary px-4 py-3 text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Profile Picture URL
              </label>
              <input
                type="url"
                value={profileForm.profilePicture}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    profilePicture: event.target.value,
                  }))
                }
                placeholder="https://..."
                className="mt-2 w-full rounded-lg bg-secondary px-4 py-3 text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    bio: event.target.value,
                  }))
                }
                rows={4}
                className="mt-2 w-full rounded-lg bg-secondary px-4 py-3 text-foreground"
                placeholder="Tell viewers about yourself"
              />
            </div>
            <div className="flex items-center justify-between">
              {profileError && (
                <span className="text-sm text-destructive-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {profileError}
                </span>
              )}
              <Button
                onClick={handleSaveProfile}
                disabled={profileMutation.isPending || userQuery.isLoading}
              >
                {profileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
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
              <Switch
                checked={settingsForm.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    emailNotifications: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">New Followers</p>
                <p className="text-sm text-muted-foreground">
                  When someone follows you
                </p>
              </div>
              <Switch
                checked={settingsForm.newFollowerNotifications}
                onCheckedChange={(checked) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    newFollowerNotifications: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Content Updates</p>
                <p className="text-sm text-muted-foreground">
                  New releases from creators you follow
                </p>
              </div>
              <Switch
                checked={settingsForm.contentUpdateNotifications}
                onCheckedChange={(checked) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    contentUpdateNotifications: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Earnings Updates</p>
                <p className="text-sm text-muted-foreground">
                  When you receive payments
                </p>
              </div>
              <Switch
                checked={settingsForm.earningsNotifications}
                onCheckedChange={(checked) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    earningsNotifications: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              {settingsError && (
                <span className="text-sm text-destructive-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {settingsError}
                </span>
              )}
              <Button
                onClick={handleSaveSettings}
                disabled={settingsMutation.isPending || userQuery.isLoading}
              >
                {settingsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Notifications
                  </>
                )}
              </Button>
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
                <p className="font-medium text-foreground">Watch History</p>
                <p className="text-sm text-muted-foreground">
                  Save your viewing history
                </p>
              </div>
              <Switch
                checked={settingsForm.watchHistoryEnabled}
                onCheckedChange={(checked) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    watchHistoryEnabled: checked,
                  }))
                }
              />
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
            <div>
              <label className="text-sm font-medium text-foreground">
                Payout Method
              </label>
              <select
                value={payoutForm.payoutMethod}
                onChange={(event) =>
                  setPayoutForm((prev) => ({
                    ...prev,
                    payoutMethod: event.target.value as PayoutMethod,
                  }))
                }
                className="mt-2 w-full rounded-lg bg-secondary px-4 py-3 text-foreground"
              >
                {Object.values(PayoutMethod).map((method) => (
                  <option key={method} value={method}>
                    {method.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Payout Details (JSON)
              </label>
              <textarea
                value={payoutForm.payoutDetails}
                onChange={(event) =>
                  setPayoutForm((prev) => ({
                    ...prev,
                    payoutDetails: event.target.value,
                  }))
                }
                rows={4}
                className="mt-2 w-full rounded-lg bg-secondary px-4 py-3 text-foreground"
                placeholder='{"accountNumber":"...","bankName":"..."}'
              />
            </div>
            <div className="flex items-center justify-between">
              {payoutError && (
                <span className="text-sm text-destructive-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {payoutError}
                </span>
              )}
              <Button
                onClick={handleSavePayout}
                disabled={payoutMutation.isPending || userQuery.isLoading}
              >
                {payoutMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Payout
                  </>
                )}
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
