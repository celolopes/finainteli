import React from "react";
import { Text as PaperText, TextProps } from "react-native-paper";

interface Props extends TextProps<string> {
  // Add custom typography variants if needed
}

export function ThemedText({ style, variant, ...props }: Props) {
  // We can inject specific fonts here based on OS
  // iOS: SF Pro (default)
  // Android: Roboto (default) or Product Sans if loaded

  return (
    <PaperText
      variant={variant}
      style={[
        // Custom letter spacing for expressive feel
        styles.text,
        style,
      ]}
      {...props}
    />
  );
}

const styles = {
  text: {
    // Global text tweaks
  },
};
