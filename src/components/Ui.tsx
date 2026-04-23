import { Ionicons } from "@expo/vector-icons";
import React from "react";
import type {
  TextInputProps as RNTextInputProps,
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import {
  Text as RNText,
  TextInput as RNTextInput,
  View as RNView,
  Keyboard,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";

export const Card: React.FC<{
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}> = ({ style, children }) => (
  <RNView style={[styles.card, style]}>{children}</RNView>
);

export const Button: React.FC<{
  label: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "secondary";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
}> = ({
  label,
  onPress,
  variant = "primary",
  disabled,
  style,
  labelStyle,
  leftIcon,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.btn,
      variant === "outline" && styles.btnOutline,
      variant === "secondary" && styles.btnSecondary,
      pressed && variant === "outline" && styles.btnOutlinePressed,
      pressed && variant === "secondary" && styles.btnSecondaryPressed,
      pressed && variant === "primary" && styles.btnPrimaryPressed,
      disabled && { opacity: 0.5 },
      style,
    ]}
  >
    <RNView style={[styles.btnContent, !label && styles.btnContentIconOnly]}>
      {leftIcon}
      {label ? (
        <RNText
          style={[
            styles.btnLabel,
            variant === "outline" && { color: colors.coral },
            variant === "secondary" && { color: colors.coral },
            labelStyle,
          ]}
        >
          {label}
        </RNText>
      ) : null}
    </RNView>
  </Pressable>
);

export const Text: React.FC<
  RNTextProps & {
    muted?: boolean;
    bold?: boolean;
  }
> = ({ style, muted, bold, ...props }) => (
  <RNText
    {...props}
    style={[
      {
        color: muted ? colors.muted : colors.text,
        fontWeight: bold ? "600" : "400",
        fontFamily: bold ? fonts.semiBold : fonts.regular,
      },
      style,
    ]}
  />
);

export const Screen: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}> = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <RNView
        style={[
          styles.screen,
          { paddingTop: insets.top + spacing.md },
          style,
        ]}
      >
        {children}
      </RNView>
    </TouchableWithoutFeedback>
  );
};

export const H1: React.FC<{
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}> = ({ children, style }) => (
  <Text
    style={[
      {
        fontSize: 28,
        fontWeight: "700",
        fontFamily: fonts.bold,
        color: colors.charcoal,
        marginBottom: spacing.sm,
      },
      ...(Array.isArray(style) ? style : style ? [style] : []),
    ]}
  >
    {children}
  </Text>
);

export const H2: React.FC<{
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}> = ({ children, style }) => (
  <Text
    style={[
      {
        fontSize: 20,
        fontWeight: "600",
        fontFamily: fonts.semiBold,
        color: colors.charcoal,
        marginBottom: spacing.sm,
      },
      ...(Array.isArray(style) ? style : style ? [style] : []),
    ]}
  >
    {children}
  </Text>
);

// ── Checkbox ──────────────────────────────────────────────────────────────────
export const NeuCheckbox: React.FC<{
  checked: boolean;
  onToggle: () => void;
  size?: number;
}> = ({ checked, onToggle, size = 28 }) => (
  <TouchableOpacity
    onPress={onToggle}
    activeOpacity={0.8}
    style={[
      styles.checkbox,
      { width: size, height: size, borderRadius: size * 0.22 },
      checked && styles.checkboxChecked,
    ]}
  >
    {checked && (
      <Ionicons name="checkmark" size={size * 0.6} color={colors.white} />
    )}
  </TouchableOpacity>
);

// ── Text Input ──────────────────────────────────────────────────────────────
export const NeuInput: React.FC<
  Pick<
    RNTextInputProps,
    | "placeholder"
    | "placeholderTextColor"
    | "value"
    | "onChangeText"
    | "multiline"
    | "secureTextEntry"
    | "keyboardType"
    | "autoCapitalize"
    | "autoCorrect"
    | "onFocus"
    | "onBlur"
    | "returnKeyType"
    | "onSubmitEditing"
    | "editable"
    | "testID"
    | "maxLength"
    | "autoFocus"
    | "textAlignVertical"
  > & { style?: StyleProp<TextStyle>; rightElement?: React.ReactNode }
> = ({ style, placeholderTextColor, rightElement, ...props }) => {
  if (rightElement) {
    return (
      <RNView style={[styles.input, { flexDirection: "row", alignItems: "center" }, style as any]}>
        <RNTextInput
          style={{ flex: 1, fontSize: 15, color: colors.text, fontFamily: fonts.regular }}
          placeholderTextColor={placeholderTextColor ?? colors.muted}
          {...props}
        />
        {rightElement}
      </RNView>
    );
  }
  return (
    <RNTextInput
      style={[styles.input, style]}
      placeholderTextColor={placeholderTextColor ?? colors.muted}
      {...props}
    />
  );
};

// ── Segmented Control (Tabs) ──────────────────────────────────────────────────
export const SegmentedControl: React.FC<{
  tabs: string[];
  selected: number;
  onSelect: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}> = ({ tabs, selected, onSelect, style }) => (
  <RNView style={[styles.segControl, style]}>
    {tabs.map((tab, i) => (
      <TouchableOpacity
        key={tab}
        style={[styles.segTab, i === selected && styles.segTabActive]}
        onPress={() => onSelect(i)}
        activeOpacity={0.8}
      >
        <RNText
          style={[styles.segTabText, i === selected && styles.segTabTextActive]}
        >
          {tab}
        </RNText>
      </TouchableOpacity>
    ))}
  </RNView>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
  },

  // ── Card ────────────────────────────────────────
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  } as any,

  // ── Buttons ─────────────────────────────────────
  btn: {
    backgroundColor: colors.coral,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    alignItems: "center",
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  btnContentIconOnly: {
    gap: 0,
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.coral,
    borderRadius: radius.full,
  },
  btnOutlinePressed: {
    backgroundColor: colors.peach,
    opacity: 0.85,
  },
  btnSecondary: {
    backgroundColor: colors.peach,
    borderRadius: radius.full,
  },
  btnSecondaryPressed: {
    opacity: 0.85,
  },
  btnPrimaryPressed: {
    backgroundColor: colors.coralDark,
  },
  btnTextOnly: {
    backgroundColor: "transparent",
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  btnLabel: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },

  // ── Checkbox ────────────────────────────────────
  checkbox: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadow.soft,
  },
  checkboxChecked: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },

  // ── Input ───────────────────────────────────────
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.regular,
    width: "100%",
  } as any,

  // ── SegmentedControl ────────────────────────────
  segControl: {
    flexDirection: "row",
    borderRadius: radius.md,
    padding: 3,
    backgroundColor: colors.white,
    ...shadow.soft,
  },
  segTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  segTabActive: {
    backgroundColor: colors.coral,
  },
  segTabText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
    fontFamily: fonts.medium,
  },
  segTabTextActive: {
    color: colors.white,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
});
