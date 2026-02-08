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
import { DashboardSquare01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const sidebarItems: {
  title: string;
  href: string;
  icon?: typeof DashboardSquare01Icon;
}[] = [
  {
    title: "Overview",
    href: "/",
    icon: DashboardSquare01Icon,
  },
  {
    title: "Influencers",
    href: "/influencers",
    icon: UserGroupIcon
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
            {sidebarItems.map(({ icon, href, title }) => (
              <SidebarMenuItem key={title}>
                <SidebarMenuButton>
                  <Link href={href as Route} className='flex gap-2 items-center'>
                    {icon && <HugeiconsIcon icon={icon} />}
                    <span>{title}</span>
                  </Link>
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
