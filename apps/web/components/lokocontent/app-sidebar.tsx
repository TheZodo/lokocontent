"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  Library,
  History,
  Upload,
  Globe,
  Settings,
  HelpCircle,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { icon: Home, label: "Browse", href: "/browse" },
  { icon: TrendingUp, label: "Trending", href: "/trending" },
  { icon: Library, label: "My Library", href: "/library" },
  { icon: History, label: "Watch History", href: "/history" },
];

const secondaryNavItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help & Support", href: "/help" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-sidebar-border">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/browse" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-loko-gold to-loko-deep-red flex items-center justify-center">
            <Globe className="w-6 h-6 text-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground tracking-tight">
              Lokocontent
            </span>
            <span className="text-xs text-muted-foreground">
              African Stories, Global Reach
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="tribal-pattern">
        <SidebarGroup>
          <SidebarGroupLabel>Discover</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Upload CTA */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          asChild
          className="w-full bg-gradient-to-r from-loko-gold to-loko-deep-red hover:from-loko-gold/90 hover:to-loko-deep-red/90 text-foreground font-semibold py-6 glow-gold-hover transition-all duration-300"
        >
          <Link href="/upload">
            <Upload className="w-5 h-5 mr-2" />
            Upload Content
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Share your stories with Africa
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
