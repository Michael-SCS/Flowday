import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from "react-native";

export default function TaskModal({ visible, onClose, onSave }) {
  const [taskName, setTaskName] = useState("");

  const handleSave = () => {
    if (!taskName.trim()) return;
    onSave(taskName.trim());
    setTaskName("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Nueva tarea</Text>

          <TextInput
            style={styles.input}
            placeholder="Escribe la tarea"
            value={taskName}
            onChangeText={setTaskName}
          />

          <View style={styles.row}>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.save]} onPress={handleSave}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  button: {
    padding: 12,
    borderRadius: 10,
    width: "45%",
    alignItems: "center"
  },
  cancel: {
    backgroundColor: "#999"
  },
  save: {
    backgroundColor: "#4A90E2"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  }
});
