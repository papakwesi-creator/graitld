"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, Tick02Icon } from "@hugeicons/core-free-icons"

/**
 * Renders a CommandPrimitive configured as the root command container with default styling and `data-slot="command"`.
 *
 * @returns The CommandPrimitive element whose `className` combines the component's default command styles and the optional `className` prop.
 */
function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground rounded-xl! p-1 flex size-full flex-col overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

/**
 * Render a Dialog configured as a command palette host.
 *
 * Renders a visually hidden header (title and description for accessibility) and a content container that holds the provided children.
 *
 * @param title - Accessible title shown to screen readers (defaults to "Command Palette")
 * @param description - Accessible description shown to screen readers (defaults to "Search for a command to run...")
 * @param className - Additional classes applied to the DialogContent container
 * @param showCloseButton - Whether the DialogContent should render its close button
 * @param children - Content to render inside the dialog's content area
 * @returns A Dialog element containing the command palette content
 */
function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children: React.ReactNode
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "rounded-xl! top-1/3 translate-y-0 overflow-hidden p-0",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Renders a styled command-palette input with an integrated search icon.
 *
 * Accepts all props supported by `CommandPrimitive.Input` and forwards them to the underlying input element. The optional `className` is merged with the component's default input styles.
 *
 * @param className - Additional class names applied to the input element.
 * @returns The input wrapper containing the CommandPrimitive input and a search icon addon.
 */
function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="bg-input/30 border-input/30 h-8! rounded-lg! shadow-none! *:data-[slot=input-group-addon]:pl-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <InputGroupAddon>
          <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

/**
 * Renders a styled wrapper around the cmdk Command.List used by the command palette.
 *
 * @returns A CommandPrimitive.List element with scrolling and overflow styles, `data-slot="command-list"`, and a composed `className` that merges default styles with any provided classes.
 */
function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 outline-none overflow-x-hidden overflow-y-auto",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the command palette's empty-state element with default styling.
 *
 * @returns A `CommandPrimitive.Empty` element with palette-specific classes and the `data-slot="command-empty"` attribute.
 */
function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  )
}

/**
 * Renders a styled wrapper around cmdk's Group primitive for grouping command items.
 *
 * @returns A `CommandPrimitive.Group` element with `data-slot="command-group"` and a composed `className` that merges the component's default group styles with any provided `className`.
 */
function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn("text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium", className)}
      {...props}
    />
  )
}


/**
 * Renders a styled separator for the command palette.
 *
 * @returns A `CommandPrimitive.Separator` element configured as the command palette's horizontal divider
 */
function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  )
}

/**
 * Render a styled command palette item that supports selection state and an optional trailing checkmark.
 *
 * Renders a CommandPrimitive.Item with data-slot="command-item", applies composed styling (including selected/disabled states and layout), forwards all props, and shows a trailing Tick icon whose visibility reflects the item's selection/checked state.
 *
 * @param className - Additional CSS classes to merge with the component's default styling
 * @param children - Node(s) rendered inside the item
 * @returns The rendered command item element
 */
function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-selected:bg-muted data-selected:text-foreground data-selected:*:[svg]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! [&_svg:not([class*='size-'])]:size-4 group/command-item data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

/**
 * Renders a right-aligned span for displaying a command shortcut hint.
 *
 * The element uses the `data-slot="command-shortcut"` attribute and applies
 * styles for end alignment, muted/foreground color, compact typography, and
 * wide letter spacing. Additional props and `className` are forwarded to the span.
 *
 * @returns A span element used to display keyboard shortcut text in command items
 */
function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest", className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}