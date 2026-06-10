"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { useSettings } from "@/store";

export default function SettingsClient() {
  const { data: session, status } = useSession();
  const { settings, setSetting } = useSettings();
  const [emailInput, setEmailInput] = useState("");

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    
    try {
      await signIn("nodemailer", { email: emailInput, redirect: false });
      toast.success("A sign-in link has been sent to your email address.");
    } catch (error) {
      toast.error("Failed to send sign-in link. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 w-full">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 bg-muted/50 w-full justify-start overflow-x-auto rounded-xl p-1">
          <TabsTrigger value="profile" className="rounded-lg">Profile</TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg">Preferences</TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-lg">Advanced Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Manage your account and authentication state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {status === "loading" ? (
                <p className="text-muted-foreground animate-pulse">Loading profile...</p>
              ) : session?.user ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
                    <div>
                      <p className="font-medium text-foreground">{session.user.name || "Anonymous User"}</p>
                      <p className="text-sm text-muted-foreground">{session.user.email}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => signOut()}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleMagicLinkSignIn} className="space-y-4 max-w-sm">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Magic Link
                  </Button>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => signIn("google")}
                  >
                    Google
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>
                Customize how the application looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Display more articles per page by reducing padding.
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => setSetting("compactMode", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Show Bias Badges</Label>
                  <p className="text-sm text-muted-foreground">
                    Display AI-detected perspective bias on articles.
                  </p>
                </div>
                <Switch
                  checked={settings.showBiasBadges}
                  onCheckedChange={(checked) => setSetting("showBiasBadges", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Show Sentiment</Label>
                  <p className="text-sm text-muted-foreground">
                    Show sentiment score (Positive/Negative) indicators.
                  </p>
                </div>
                <Switch
                  checked={settings.showSentiment}
                  onCheckedChange={(checked) => setSetting("showSentiment", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Personalize feed sources, API keys, and spatial aggregation logic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!session?.user ? (
                <div className="p-4 border border-border/50 rounded-lg bg-muted/20 text-center">
                  <p className="text-sm text-muted-foreground">You must be signed in to configure advanced settings.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Spatial Aggregation Setting */}
                  <div className="flex flex-col space-y-4 rounded-lg border border-border/50 p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Spatial Aggregation</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically group nearby regional events into broader geopolitical clusters.
                      </p>
                    </div>
                    <Switch
                      // This would hook up to the DB settings endpoint eventually
                      defaultChecked={true}
                    />
                  </div>

                  {/* Feed URLs */}
                  <div className="flex flex-col space-y-4 rounded-lg border border-border/50 p-4">
                    <div className="space-y-1.5">
                      <Label className="text-base">Custom RSS Feeds</Label>
                      <p className="text-sm text-muted-foreground">
                        Add specific RSS feeds to monitor within your account.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="https://example.com/rss" />
                      <Button variant="secondary">Add Feed</Button>
                    </div>
                    <div className="mt-4 border border-border/50 rounded-md p-3">
                      <p className="text-sm text-muted-foreground italic text-center py-4">No custom feeds configured yet.</p>
                    </div>
                  </div>

                  {/* API Keys */}
                  <div className="flex flex-col space-y-4 rounded-lg border border-border/50 p-4">
                    <div className="space-y-1.5">
                      <Label className="text-base">Custom API Keys</Label>
                      <p className="text-sm text-muted-foreground">
                        Provide your own API keys for integrations (e.g., Anthropic, Exa, Brave).
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="braveKey" className="text-right">Brave Search</Label>
                        <Input id="braveKey" type="password" placeholder="••••••••••••••••" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exaKey" className="text-right">Exa AI</Label>
                        <Input id="exaKey" type="password" placeholder="••••••••••••••••" className="col-span-3" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button>Save Keys</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
