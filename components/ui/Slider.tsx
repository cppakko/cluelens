import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/utils/tailwindUtils";

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  trackBackground?: string;
}

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, trackBackground, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track
      className="relative h-6 w-full grow overflow-hidden rounded-full"
      style={trackBackground ? { background: trackBackground } : undefined}
    >
      <SliderPrimitive.Range className="absolute h-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block size-7 rounded-full bg-white border-3 border-black/25 shadow-[0_1px_4px_rgba(0,0,0,0.2)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--m3-primary)/40" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
