import type { Route } from "next";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

const sidebarItems: { title: string; href: string }[] = [
  {
    title: "Overview",
    href: "/",
  },
  {
    title: "Influencers",
    href: "/influencers",
  },
  {
    title: "Analytics",
    href: "/analytics",
  },
  {
    title: "Reports",
    href: "/reports",
  },
  {
    title: "Channel Lookup",
    href: "/channel-lookup",
  },
  {
    title: "Settings",
    href: "/settings",
  },
];

export const AppSidebar = () => {
  return (
    <Sidebar>
      {/*<SidebarHeader>

      </SidebarHeader>*/}

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarItems.map(({ href, title }) => (
              <SidebarMenuItem key={title}>
                <SidebarMenuButton>
                  <Link href={href as Route}>{title}</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Sign Out</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
