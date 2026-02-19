"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

/**
 * Renders a Dialog root element with a standardized `data-slot="dialog"` attribute for styling and composition.
 *
 * @returns A Dialog root element with the provided props and `data-slot="dialog"`
 */
function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

/**
 * Renders a dialog trigger element bound to the underlying Dialog primitive.
 *
 * @returns A Dialog trigger element with `data-slot="dialog-trigger"` that forwards all received props.
 */
function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/**
 * Renders a portal container for dialog content.
 *
 * @param props - Props passed through to the underlying portal element and spread onto it.
 * @returns A portal element with `data-slot="dialog-portal"` and the provided props applied.
 */
function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

/**
 * Renders a dialog close control with data-slot="dialog-close".
 *
 * @returns A React element that acts as the dialog close trigger.
 */
function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/**
 * Render a backdrop-styled dialog overlay with preset animation, blur, and positioning classes.
 *
 * @param className - Additional CSS classes appended to the overlay's default classes
 * @param props - Remaining Backdrop props forwarded to the underlying primitive
 * @returns A Backdrop element configured as the dialog overlay (includes `data-slot="dialog-overlay"`)
 */
function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50", className)}
      {...props}
    />
  )
}

/**
 * Renders dialog content inside a portal with an overlay and an optional close button.
 *
 * @param showCloseButton - If `true`, renders a close button inside the dialog; defaults to `true`.
 * @returns The dialog content element.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-xl p-4 text-sm ring-1 duration-100 sm:max-w-sm fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

/**
 * Renders the dialog's header container with preset vertical layout and spacing.
 *
 * @returns A `div` element with `data-slot="dialog-header"`, default `gap-2 flex flex-col` classes, and any provided props forwarded to the element.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("gap-2 flex flex-col", className)}
      {...props}
    />
  )
}

/**
 * Renders the dialog footer section and optional Close action.
 *
 * @param className - Additional CSS class names applied to the footer container
 * @param children - Elements to render inside the footer
 * @param showCloseButton - If `true`, include a Close button in the footer
 * @returns The footer element for a dialog, with layout and optional close control
 */
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

/**
 * Renders the dialog's title element with preset typography and a data-slot for styling/hooks.
 *
 * @param className - Additional class names to merge with the component's default title classes
 * @param props - Additional props forwarded to the underlying dialog title primitive
 * @returns The rendered dialog title element (`DialogPrimitive.Title`) with default styles and `data-slot="dialog-title"`
 */
function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

/**
 * Renders a dialog description element with preset muted typography and link styling.
 *
 * @returns A DialogPrimitive.Description element with `data-slot="dialog-description"` and the component's default classes merged with the provided `className`.
 */
function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}