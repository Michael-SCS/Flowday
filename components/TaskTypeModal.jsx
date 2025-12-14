// TaskTypeModal.jsx
import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, SectionList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SECTIONS = [
  {
    title: "Cuida de ti 💆‍♀️",
    data: [
      { id: "shower", label: "Tomar una ducha", icon: "water", color: "#4FC3F7" },
      { id: "skincare", label: "Cuidado de piel", icon: "sparkles", color: "#F06292" },
      { id: "haircare", label: "Cuidado capilar", icon: "cut", color: "#BA68C8" },
      { id: "mask", label: "Mascarilla", icon: "happy", color: "#AED581" },
    ]
  },
  {
    title: "Actividad física 🏃‍♂️",
    data: [
      { id: "run", label: "Correr", icon: "walk", color: "#FF8A65" },
      { id: "walk", label: "Caminar", icon: "footsteps", color: "#FFD54F" },
      { id: "gym", label: "Ir al Gym", icon: "barbell", color: "#90A4AE" },
      { id: "yoga", label: "Yoga", icon: "body", color: "#9575CD" },
    ]
  },
  {
    title: "Sé más saludable 🥗",
    data: [
      { id: "water", label: "Beber agua", icon: "water-outline", color: "#29B6F6" },
      { id: "fruit", label: "Comer frutas", icon: "nutrition", color: "#66BB6A" },
      { id: "early", label: "Despertar temprano", icon: "alarm", color: "#FFCA28" },
      { id: "sun", label: "Tomar sol", icon: "sunny", color: "#FFA726" },
    ]
  },
  {
    title: "Aprende 📚",
    data: [
      { id: "read", label: "Leer", icon: "book", color: "#8D6E63" },
      { id: "course", label: "Tomar curso", icon: "school", color: "#5C6BC0" },
      { id: "instrument", label: "Practicar instrumento", icon: "musical-notes", color: "#EC407A" },
    ]
  },
  {
    title: "Otros",
    data: [
      { id: "shopping", label: "Compras", icon: "cart", color: "#F4D03F" },
      { id: "house", label: "Casa", icon: "home", color: "#FFA07A" },
      { id: "custom", label: "Personalizada", icon: "create", color: "#96CEB4" },
    ]
  }
];

export default function TaskTypeModal({ visible, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>¿Qué hábito quieres crear?</Text>

          <SectionList
            sections={SECTIONS}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, { borderLeftColor: item.color }]}
                onPress={() => onSelect(item.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={20} color="#fff" />
                </View>
                <Text style={styles.optionText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  box: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: "85%", // Más alto para ver la lista
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  closeBtn: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    alignItems: "center",
  },
  closeText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 16,
  },
});
