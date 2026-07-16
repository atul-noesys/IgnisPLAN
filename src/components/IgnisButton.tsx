import { forwardRef, type ReactNode } from "react";
import { Button, type ButtonProps } from "@mantine/core";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconCheck,
  IconCircleCheck,
  IconDeviceFloppy,
  IconEdit,
  IconEye,
  IconFilterOff,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUserPlus,
  IconX,
  IconAlertTriangle,
  IconBed,
  IconPhoto,
  IconClipboardList,
  IconList,
  IconBuilding,
  IconUser,
} from "@tabler/icons-react";

export const IGNIS_GRADIENT = { from: "#FF6A00", to: "#FFB347" } as const;

const iconSize = 16;

export const IgnisIcons = {
  plus: <IconPlus size={iconSize} />,
  edit: <IconEdit size={iconSize} />,
  save: <IconDeviceFloppy size={iconSize} />,
  cancel: <IconX size={iconSize} />,
  check: <IconCheck size={iconSize} />,
  clear: <IconFilterOff size={iconSize} />,
  view: <IconEye size={iconSize} />,
  back: <IconArrowLeft size={iconSize} />,
  assign: <IconCalendarEvent size={iconSize} />,
  allocate: <IconCalendarEvent size={iconSize} />,
  confirm: <IconCircleCheck size={iconSize} />,
  start: <IconPlayerPlay size={iconSize} />,
  complete: <IconCircleCheck size={iconSize} />,
  noshow: <IconAlertTriangle size={iconSize} />,
  delete: <IconTrash size={iconSize} />,
  reset: <IconRefresh size={iconSize} />,
  userPlus: <IconUserPlus size={iconSize} />,
  bed: <IconBed size={iconSize} />,
  imaging: <IconPhoto size={iconSize} />,
  queue: <IconClipboardList size={iconSize} />,
  list: <IconList size={iconSize} />,
  building: <IconBuilding size={iconSize} />,
  user: <IconUser size={iconSize} />,
};

type IgnisButtonProps = ButtonProps &
  React.ComponentPropsWithoutRef<"button"> & {
    leftSection: ReactNode;
    to?: string;
    component?: any;
  };

/**
 * Shared IgnisPLAN primary button — orange gradient + required left icon.
 */
export const IgnisButton = forwardRef<HTMLButtonElement, IgnisButtonProps>(
  function IgnisButton({ leftSection, variant, gradient, ...props }, ref) {
    return (
      <Button
        ref={ref}
        leftSection={leftSection}
        variant={variant ?? "gradient"}
        gradient={gradient ?? IGNIS_GRADIENT}
        {...props}
      />
    );
  },
);
