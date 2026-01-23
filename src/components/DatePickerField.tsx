import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, Dialog, Icon, Portal, Text, useTheme } from "react-native-paper";

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
}

const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const DatePickerField = ({ value, onChange, label }: Props) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const months = i18n.language.startsWith("pt") ? MONTHS_PT : MONTHS_EN;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(i18n.language || "pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const handleOpen = () => {
    setTempDate(value);
    setVisible(true);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setVisible(false);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const changeDay = (delta: number) => {
    const newDate = new Date(tempDate);
    newDate.setDate(newDate.getDate() + delta);
    setTempDate(newDate);
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setTempDate(newDate);
  };

  const changeYear = (delta: number) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(newDate.getFullYear() + delta);
    setTempDate(newDate);
  };

  const setToday = () => {
    setTempDate(new Date());
  };

  return (
    <>
      <TouchableOpacity onPress={handleOpen} style={[styles.selector, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
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
          <Dialog.Title>{t("common.selectDate", "Selecionar Data")}</Dialog.Title>
          <Dialog.Content>
            {/* Day Picker */}
            <View style={styles.pickerRow}>
              <Text variant="bodyMedium" style={styles.pickerLabel}>
                {t("common.day", "Dia")}
              </Text>
              <View style={styles.pickerControls}>
                <TouchableOpacity onPress={() => changeDay(-1)} style={[styles.pickerButton, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Icon source="minus" size={20} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <Text variant="headlineSmall" style={[styles.pickerValue, { color: theme.colors.primary }]}>
                  {tempDate.getDate().toString().padStart(2, "0")}
                </Text>
                <TouchableOpacity onPress={() => changeDay(1)} style={[styles.pickerButton, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Icon source="plus" size={20} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Month Picker */}
            <View style={styles.pickerRow}>
              <Text variant="bodyMedium" style={styles.pickerLabel}>
                {t("common.month", "Mês")}
              </Text>
              <View style={styles.pickerControls}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={[styles.pickerButton, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Icon source="minus" size={20} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <Text variant="titleMedium" style={[styles.pickerMonthValue, { color: theme.colors.primary }]}>
                  {months[tempDate.getMonth()]}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={[styles.pickerButton, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Icon source="plus" size={20} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Year Picker */}
            <View style={styles.pickerRow}>
              <Text variant="bodyMedium" style={styles.pickerLabel}>
                {t("common.year", "Ano")}
              </Text>
              <View style={styles.pickerControls}>
                <TouchableOpacity onPress={() => changeYear(-1)} style={[styles.pickerButton, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Icon source="minus" size={20} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <Text variant="headlineSmall" style={[styles.pickerValue, { color: theme.colors.primary }]}>
                  {tempDate.getFullYear()}
                </Text>
                <TouchableOpacity onPress={() => changeYear(1)} style={[styles.pickerButton, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Icon source="plus" size={20} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Today Button */}
            <Button mode="text" onPress={setToday} style={{ marginTop: 8 }}>
              {t("common.today", "Hoje")}
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancel}>{t("common.cancel")}</Button>
            <Button mode="contained" onPress={handleConfirm}>
              {t("common.confirm", "Confirmar")}
            </Button>
          </Dialog.Actions>
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
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pickerLabel: {
    width: 50,
  },
  pickerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pickerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerValue: {
    width: 60,
    textAlign: "center",
    fontWeight: "bold",
  },
  pickerMonthValue: {
    width: 100,
    textAlign: "center",
    fontWeight: "bold",
  },
});
