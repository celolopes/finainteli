import React from "react";
import { Switch as RNSwitch, SwitchProps } from "react-native";
import { Switch as PaperSwitch } from "react-native-paper";
import { useAppTheme } from "../../context/ThemeContext";

type Props = SwitchProps & {
  color?: string;
  "aria-label"?: string;
};

export function PlatformSwitch(props: Props) {
  const { isLiquidGlass } = useAppTheme();
  const { color, ...rest } = props;

  if (isLiquidGlass) {
    return <RNSwitch {...rest} />;
  }

  return <PaperSwitch {...(props as any)} />;
}
