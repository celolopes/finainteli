import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Avatar, Button, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassAppbar } from "../../../../src/components/ui/GlassAppbar";
import { FinancialService } from "../../../../src/services/financial";

const ICONS = [
  "food",
  "cart",
  "car",
  "home",
  "train-car",
  "airplane",
  "medical-bag",
  "school",
  "controller-classic",
  "shopping",
  "gift",
  "cash",
  "bank",
  "chart-line",
  "briefcase",
  "paw",
  "baby-carriage",
  "tshirt-crew",
  "tools",
  "book",
  "movie",
  "music",
  "phone",
  "lightning-bolt",
  "water",
  "wifi",
  "shield",
  "lock",
  "help",
  "star",
  "heart",
];

const COLORS = [
  "#F44336",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722",
  "#795548",
  "#9E9E9E",
  "#607D8B",
  "#000000",
];

export default function CategoryFormScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isEditing = id !== "new";

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense" | "both">("expense");
  const [icon, setIcon] = useState("help");
  const [color, setColor] = useState("#999999");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadCategory();
    }
  }, [id]);

  const loadCategory = async () => {
    const categories = await FinancialService.getCategories();
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setName(cat.name);
      setType(cat.type);
      setIcon(cat.icon || "help");
      setColor(cat.color || "#999999");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Nome é obrigatório");
      return;
    }

    setLoading(true);
    try {
      let newId = id;
      if (isEditing) {
        await FinancialService.updateCategory(id as string, { name, type, icon, color });
      } else {
        const created = await FinancialService.createCategory({ name, type, icon, color });
        newId = created.id;
      }

      const params = useLocalSearchParams();
      if (params.returnTo) {
        // Navigate back to the source screen with the new ID
        router.navigate({ pathname: params.returnTo as any, params: { createdCategoryId: newId } });
      } else {
        router.back();
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Falha ao salvar categoria.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GlassAppbar elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={isEditing ? "Editar Categoria" : "Nova Categoria"} />
      </GlassAppbar>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <TextInput label="Nome" value={name} onChangeText={setName} mode="outlined" style={styles.input} />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Tipo
          </Text>
          <SegmentedButtons
            value={type}
            onValueChange={(val) => setType(val as "income" | "expense" | "both")}
            buttons={[
              { value: "expense", label: "Despesa", icon: "arrow-down-circle" },
              { value: "income", label: "Receita", icon: "arrow-up-circle" },
              { value: "both", label: "Ambos", icon: "swap-vertical" },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Cor
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScroll}>
            {COLORS.map((c) => (
              <TouchableOpacity key={c} style={[styles.colorItem, { backgroundColor: c }, color === c && styles.selectedColor]} onPress={() => setColor(c)}>
                {color === c && <Avatar.Icon size={24} icon="check" color="white" style={{ backgroundColor: "transparent" }} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Ícone
          </Text>
          <View style={styles.iconGrid}>
            {ICONS.map((i) => (
              <TouchableOpacity key={i} style={[styles.iconItem, icon === i && { backgroundColor: theme.colors.primaryContainer }]} onPress={() => setIcon(i)}>
                <Avatar.Icon
                  size={40}
                  icon={i}
                  style={{ backgroundColor: icon === i ? theme.colors.primary : theme.colors.surfaceVariant }}
                  color={icon === i ? "white" : theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button}>
          Salvar
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  input: { marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 16, fontWeight: "bold" },
  row: { flexDirection: "row", gap: 16 },
  radioItem: { flexDirection: "row", alignItems: "center" },
  colorScroll: { gap: 12, paddingVertical: 4 },
  colorItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "white",
    elevation: 4,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
  },
  iconItem: {
    borderRadius: 12,
    padding: 4,
  },
  button: { marginTop: 16, borderRadius: 8, height: 50, justifyContent: "center" },
});
