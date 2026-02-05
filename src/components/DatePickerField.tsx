import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, Dialog, Icon, Portal, Text, useTheme } from "react-native-paper";

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
}

export const DatePickerField = ({ value, onChange, label }: Props) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(value));

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(i18n.language || "pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const handleOpen = () => {
    setTempDate(new Date(value));
    setVisible(true);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setVisible(false);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const setToday = () => {
    const now = new Date();
    setTempDate(now);
    // If using inline picker, updating state updates the picker immediately
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleOpen}
        style={[
          styles.selector,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {label || t("common.date")}
        </Text>
        <View style={styles.selectorValue}>
          <Icon source="calendar" size={24} color={theme.colors.primary} />
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
            {formatDate(value)}
          </Text>
          <Icon source="chevron-down" size={24} color={theme.colors.onSurfaceVariant} />
        </View>
      </TouchableOpacity>

      <Portal>
        <Dialog visible={visible} onDismiss={handleCancel} style={{ backgroundColor: theme.colors.surface }}>
          {/* We remove title to save space for the inline calendar which has its own header usually, 
              but keeping a small title is fine if needed. Inline calendar is large. */}
          {Platform.OS === "ios" ? (
            <View style={{ padding: 0 }}>
              <View style={{ alignItems: "center", paddingVertical: 8 }}>
                <DateTimePicker
                  testID="dateTimePicker"
                  value={tempDate}
                  mode="date"
                  display="inline"
                  onChange={(event, selectedDate) => {
                    const currentDate = selectedDate || tempDate;
                    setTempDate(currentDate);
                  }}
                  style={{ width: 320, height: 320 }}
                  locale={i18n.language}
                  textColor={theme.colors.onSurface}
                  themeVariant={theme.dark ? "dark" : "light"}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: 16,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.colors.outlineVariant,
                }}
              >
                <Button onPress={setToday}>{t("common.today", "Hoje")}</Button>
                <View style={{ flexDirection: "row" }}>
                  <Button onPress={handleCancel}>{t("common.cancel")}</Button>
                  <Button mode="contained" onPress={handleConfirm}>
                    {t("common.confirm", "OK")}
                  </Button>
                </View>
              </View>
            </View>
          ) : (
            // Fallback for non-iOS if this component is ever used there
            <>
              <Dialog.Title>{t("common.selectDate", "Selecionar Data")}</Dialog.Title>
              <Dialog.Content>
                <Text>Use native picker on Android.</Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={handleCancel}>Close</Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  selectorValue: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
});
