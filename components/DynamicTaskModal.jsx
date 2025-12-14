// DynamicTaskModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

export const TYPE_CONFIG = {
  // --- Cuida de ti ---
  shower: { label: "Tomar una ducha", icon: "water", color: "#4FC3F7" },
  skincare: { label: "Cuidado de piel", icon: "sparkles", color: "#F06292" },
  haircare: { label: "Cuidado capilar", icon: "cut", color: "#BA68C8" },
  mask: { label: "Mascarilla", icon: "happy", color: "#AED581" },
  
  // --- Actividad física ---
  run: { label: "Correr", icon: "walk", color: "#FF8A65" },
  walk: { label: "Caminar", icon: "footsteps", color: "#FFD54F" },
  gym: { label: "Ir al Gym", icon: "barbell", color: "#90A4AE" },
  yoga: { label: "Yoga", icon: "body", color: "#9575CD" },

  // --- Saludable ---
  water: { label: "Beber agua", icon: "water-outline", color: "#29B6F6" },
  fruit: { label: "Comer frutas", icon: "nutrition", color: "#66BB6A" },
  early: { label: "Despertar temprano", icon: "alarm", color: "#FFCA28" },
  sun: { label: "Tomar sol", icon: "sunny", color: "#FFA726" },

  // --- Aprende ---
  read: { label: "Leer", icon: "book", color: "#8D6E63" },
  course: { label: "Tomar curso", icon: "school", color: "#5C6BC0" },
  instrument: { label: "Practicar instrumento", icon: "musical-notes", color: "#EC407A" },

  // --- Otros ---
  birthday: { label: "Cumpleaños", icon: "gift", color: "#FF6B6B" },
  study: { label: "Estudio", icon: "book", color: "#4ECDC4" }, // Legacy
  exercise: { label: "Ejercicio", icon: "fitness", color: "#45B7D1" }, // Legacy
  house: { label: "Casa", icon: "home", color: "#FFA07A" },
  shopping: { label: "Compras", icon: "cart", color: "#F4D03F" },
  custom: { label: "Personalizada", icon: "create", color: "#96CEB4" },
};

const DEFAULT_PRODUCTS = ["Arroz", "Arepa", "Leche", "Huevos", "Pan", "Carne", "Pollo", "Fruta"];

export default function DynamicTaskModal({
  visible,
  type,
  initialData,
  initialDate,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({});
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date()); // Nuevo estado para hora
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false); // Nuevo estado para picker de hora
  const [subtasks, setSubtasks] = useState([]); // Nuevo estado para subtareas
  const [newSubtask, setNewSubtask] = useState("");
  const [taskColor, setTaskColor] = useState(""); // Nuevo estado para color
  const [showFreqDropdown, setShowFreqDropdown] = useState(false); // Dropdown frecuencia
  const [specificDays, setSpecificDays] = useState([]); // Días específicos de la semana
  
  // Estado para lista de compras
  const [shoppingList, setShoppingList] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", qty: "", price: "" });

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.custom;

  // Cargar datos al abrir
  useEffect(() => {
    if (visible) {
      setForm(initialData || {});      // ... (rest of logic)
      // I need to be careful not to delete code I can't see.
      // I'll just insert the color setting logic.
      
      setTaskColor(initialData?.color || config.color);
      if (initialData && initialData.shoppingList) {
        setShoppingList(initialData.shoppingList);
      } else {
        setShoppingList([]);
      }
      if (initialData && initialData.subtasks) {
        setSubtasks(initialData.subtasks);
      } else {
        setSubtasks([]);
      }

      if (initialData && initialData.daysOfWeek) {
        setSpecificDays(initialData.daysOfWeek);
      } else {
        setSpecificDays([]);
      }
      
      if (initialDate) {
        // initialDate viene como string YYYY-MM-DD
        const [y, m, d] = initialDate.split('-').map(Number);
        setDate(new Date(y, m - 1, d));
      } else {
        setDate(new Date());
      }

      if (initialData && initialData.time) {
        const [h, m] = initialData.time.split(':').map(Number);
        const t = new Date();
        t.setHours(h);
        t.setMinutes(m);
        setTime(t);
      } else {
        setTime(new Date());
      }

      setNewItem({ name: "", qty: "", price: "" });
      setNewSubtask("");
    }
  }, [visible, initialData, initialDate]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // --- Lógica de Subtareas ---
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { id: Date.now().toString(), text: newSubtask, done: false }]);
    setNewSubtask("");
  };

  const removeSubtask = (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };
  // ---------------------------

  // --- Lógica de Compras ---
  const addShoppingItem = () => {
    if (!newItem.name) return;
    const item = {
      id: Date.now().toString(),
      name: newItem.name,
      qty: parseFloat(newItem.qty) || 1,
      price: parseFloat(newItem.price) || 0,
    };
    setShoppingList([...shoppingList, item]);
    setNewItem({ name: "", qty: "", price: "" });
  };

  const addDefaultItem = (name) => {
    setNewItem({ ...newItem, name: name });
  };

  const removeShoppingItem = (id) => {
    setShoppingList(shoppingList.filter(i => i.id !== id));
  };

  const calculateTotal = () => {
    return shoppingList.reduce((acc, item) => acc + (item.qty * item.price), 0);
  };
  // -------------------------

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const renderInput = (label, placeholder, key, keyboardType = "default", multiline = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={form[key] || ""}
        onChangeText={(v) => setField(key, v)}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );

  const renderFields = () => {
    switch (type) {
      case "shower":
        return (
          <>
            {renderInput("Nota", "Ej. Baño relajante con sales...", "note")}
          </>
        );
      case "skincare":
        return (
          <>
            {renderInput("Productos", "¿Qué productos usarás hoy?", "products")}
            {renderInput("Rutina", "Ej. Mañana, Noche, Mascarilla...", "routine")}
          </>
        );
      case "run":
        return (
          <>
            {renderInput("Distancia (km)", "¿Cuántos km correrás?", "distance", "numeric")}
            {renderInput("Ruta", "¿Dónde correrás?", "route")}
          </>
        );
      case "gym":
        return (
          <>
            {renderInput("Grupo Muscular", "¿Qué entrenarás hoy? (Ej. Pierna, Pecho)", "muscleGroup")}
            {renderInput("Duración (min)", "Tiempo estimado", "duration", "numeric")}
          </>
        );
      case "water":
        return (
          <>
            {renderInput("Meta (Litros)", "¿Cuántos litros beberás?", "liters", "numeric")}
          </>
        );
      case "read":
        return (
          <>
            {renderInput("Libro", "¿Qué libro leerás?", "book")}
            {renderInput("Páginas", "¿Cuántas páginas planeas leer?", "pages", "numeric")}
          </>
        );
      case "meditate":
        return (
          <>
            {renderInput("Duración (min)", "¿Cuántos minutos?", "duration", "numeric")}
            {renderInput("Enfoque", "Ej. Respiración, Gratitud...", "focus")}
          </>
        );
      case "journal":
        return (
          <>
            {renderInput("Tema", "¿Sobre qué escribirás hoy?", "topic")}
          </>
        );
      case "work":
        return (
          <>
            {renderInput("Proyecto", "¿En qué proyecto avanzarás?", "project")}
            {renderInput("Objetivo principal", "¿Qué debes lograr hoy?", "goal")}
          </>
        );
      case "clean":
        return (
          <>
            {renderInput("Zona", "¿Qué habitación limpiarás?", "zone")}
            {renderInput("Tareas específicas", "Ej. Barrer, Trapear, Polvo...", "tasks")}
          </>
        );
      case "cook":
        return (
          <>
            {renderInput("Receta", "¿Qué prepararás?", "recipe")}
            {renderInput("Tipo de comida", "Ej. Desayuno, Almuerzo, Cena...", "mealType")}
          </>
        );
      case "pet":
        return (
          <>
            {renderInput("Mascota", "¿A quién cuidarás?", "petName")}
            {renderInput("Actividad", "Ej. Paseo, Veterinario, Baño...", "activity")}
          </>
        );
      case "plant":
        return (
          <>
            {renderInput("Planta", "¿Qué planta cuidarás?", "plantName")}
            {renderInput("Acción", "Ej. Regar, Podar, Fertilizar...", "action")}
          </>
        );
      case "walk":
        return (
          <>
            {renderInput("Lugar", "¿A dónde irás a caminar?", "place")}
            {renderInput("Duración (min)", "Tiempo estimado", "duration", "numeric")}
          </>
        );
      case "sleep":
        return (
          <>
            {renderInput("Nota", "Ej. Sin pantallas 1h antes...", "note")}
          </>
        );

      case "birthday":
        return (
          <>
            {renderInput("Nombre del cumpleañero", "¿De quién es el cumpleaños?", "name")}
            {renderInput("Edad a cumplir", "¿Cuántos años cumple?", "age", "numeric")}
          </>
        );

      case "study":
        return (
          <>
            {renderInput("Materia / Asignatura", "Ej. Matemáticas, Historia...", "subject")}
            {renderInput("Tema específico", "Ej. Álgebra, Revolución Francesa...", "topic")}
          </>
        );

      case "exercise":
        return (
          <>
            {renderInput("Tipo de ejercicio", "Ej. Correr, Gym, Yoga...", "exerciseType")}
            {renderInput("Duración estimada (min)", "Ej. 45", "duration", "numeric")}
          </>
        );

      case "house":
        return (
          <>
            {renderInput("Tarea del hogar", "Ej. Lavar platos, Barrer...", "task")}
            {renderInput("Detalles adicionales", "Ej. Usar el jabón especial...", "details", "default", true)}
          </>
        );

      case "shopping":
        return (
          <View>
            <Text style={styles.sectionTitle}>Lista de Compras</Text>
            
            {/* Productos por defecto */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {DEFAULT_PRODUCTS.map((p) => (
                <TouchableOpacity key={p} style={styles.chip} onPress={() => addDefaultItem(p)}>
                  <Text style={styles.chipText}>+ {p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Formulario nuevo producto */}
            <View style={styles.addItemRow}>
              <TextInput 
                style={[styles.input, { flex: 2, marginRight: 5 }]} 
                placeholder="Producto" 
                placeholderTextColor="#999"
                value={newItem.name}
                onChangeText={(v) => setNewItem({...newItem, name: v})}
              />
              <TextInput 
                style={[styles.input, { flex: 1, marginRight: 5 }]} 
                placeholder="Cant." 
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={newItem.qty}
                onChangeText={(v) => setNewItem({...newItem, qty: v})}
              />
              <TextInput 
                style={[styles.input, { flex: 1.5, marginRight: 5 }]} 
                placeholder="Precio Un." 
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={newItem.price}
                onChangeText={(v) => setNewItem({...newItem, price: v})}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addShoppingItem}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Lista de items */}
            {shoppingList.map((item) => (
              <View key={item.id} style={styles.shoppingItem}>
                <View style={{flex: 1}}>
                  <Text style={styles.itemText}>{item.name} (x{item.qty})</Text>
                  <Text style={styles.itemSubText}>${item.price * item.qty}</Text>
                </View>
                <TouchableOpacity onPress={() => removeShoppingItem(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total Estimado:</Text>
              <Text style={styles.totalAmount}>${calculateTotal()}</Text>
            </View>
          </View>
        );

      case "custom":
      default:
        return (
          <>
            {renderInput("Título de la tarea", "¿Qué vas a hacer?", "title")}
            {renderInput("Descripción", "Detalles adicionales...", "description", "default", true)}
          </>
        );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.box}>
              
              {/* Header con color dinámico */}
              <View style={[styles.header, { backgroundColor: taskColor || config.color }]}>
                <View style={styles.headerContent}>
                  <Ionicons name={config.icon} size={24} color="#fff" />
                  <Text style={styles.headerTitle}>{config.label}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Selector de Fecha y Hora */}
                <View style={styles.rowContainer}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Fecha</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                      <Text style={styles.dateText}>
                        {date.toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.label}>Hora</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={20} color="#666" />
                      <Text style={styles.dateText}>
                        {time.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(false);
                      if (selectedTime) setTime(selectedTime);
                    }}
                  />
                )}

                {renderFields()}

                {/* Subtareas (excepto para Shopping) */}
                {type !== "shopping" && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Subtareas</Text>
                    <View style={styles.addItemRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginRight: 10 }]}
                        placeholder="Agregar paso..."
                        placeholderTextColor="#999"
                        value={newSubtask}
                        onChangeText={setNewSubtask}
                      />
                      <TouchableOpacity style={[styles.addBtn, { backgroundColor: taskColor || config.color }]} onPress={addSubtask}>
                        <Ionicons name="add" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    {subtasks.map((sub) => (
                      <View key={sub.id} style={styles.subtaskItem}>
                        <Text style={styles.subtaskText}>• {sub.text}</Text>
                        <TouchableOpacity onPress={() => removeSubtask(sub.id)}>
                          <Ionicons name="close-circle" size={20} color="#ccc" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Selector de Color */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Color de la tarjeta</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 60 }}>
                    {[
                      "#4FC3F7", "#F06292", "#BA68C8", "#AED581", "#FF8A65", 
                      "#FFD54F", "#90A4AE", "#9575CD", "#29B6F6", "#66BB6A", 
                      "#FFCA28", "#FFA726", "#8D6E63", "#5C6BC0", "#EC407A", 
                      "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#F4D03F", "#96CEB4"
                    ].map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c },
                          taskColor === c && styles.selectedColor
                        ]}
                        onPress={() => setTaskColor(c)}
                      />
                    ))}
                  </ScrollView>
                </View>

                {/* Selector de Frecuencia (Dropdown) */}
                <View style={[styles.inputContainer, { zIndex: 100 }]}>
                  <Text style={styles.label}>Frecuencia</Text>
                  <TouchableOpacity 
                    style={styles.dropdownBtn} 
                    onPress={() => setShowFreqDropdown(!showFreqDropdown)}
                  >
                    <Text style={styles.dropdownBtnText}>
                      {(() => {
                        const freq = form.frequency || "once";
                        const labels = {
                          once: "Una vez",
                          daily: "Diario",
                          weekly: type === "shopping" ? "Cada 8 días" : "Semanal",
                          biweekly: "Cada 15 días",
                          specificDays: "Días específicos de la semana",
                          monthly: "Mensual",
                          yearly: "Anual"
                        };
                        return labels[freq] || "Seleccionar";
                      })()}
                    </Text>
                    <Ionicons name={showFreqDropdown ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                  </TouchableOpacity>
                  
                  {showFreqDropdown && (
                    <View style={styles.dropdownList}>
                      {(type === "shopping" 
                        ? ["once", "weekly", "biweekly", "monthly"] 
                        : ["once", "daily", "weekly", "specificDays", "monthly", "yearly"]
                      ).map((freq) => {
                        const labels = {
                          once: "Una vez",
                          daily: "Diario",
                          weekly: type === "shopping" ? "Cada 8 días" : "Semanal",
                          biweekly: "Cada 15 días",
                          specificDays: "Días específicos de la semana",
                          monthly: "Mensual",
                          yearly: "Anual"
                        };
                        return (
                          <TouchableOpacity
                            key={freq}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setField("frequency", freq);
                              if (freq !== "specificDays") {
                                setSpecificDays([]);
                              } else if (freq === "specificDays" && specificDays.length === 0) {
                                // Por defecto L-V si no hay selección previa
                                setSpecificDays([1, 2, 3, 4, 5]);
                              }
                              setShowFreqDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{labels[freq]}</Text>
                            {(form.frequency || "once") === freq && (
                              <Ionicons name="checkmark" size={20} color={taskColor || config.color} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Días específicos de la semana */}
                {form.frequency === "specificDays" && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Días de la semana</Text>
                    <View style={styles.weekDaysRow}>
                      {[
                        { value: 1, label: "L" }, // Lunes
                        { value: 2, label: "M" }, // Martes
                        { value: 3, label: "X" }, // Miércoles
                        { value: 4, label: "J" }, // Jueves
                        { value: 5, label: "V" }, // Viernes
                        { value: 6, label: "S" }, // Sábado
                        { value: 0, label: "D" }, // Domingo
                      ].map((day) => {
                        const isSelected = specificDays.includes(day.value);
                        return (
                          <TouchableOpacity
                            key={day.value}
                            style={[
                              styles.weekDayChip,
                              isSelected && styles.weekDayChipSelected,
                            ]}
                            onPress={() => {
                              setSpecificDays((prev) =>
                                prev.includes(day.value)
                                  ? prev.filter((d) => d !== day.value)
                                  : [...prev, day.value]
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.weekDayChipText,
                                isSelected && styles.weekDayChipTextSelected,
                              ]}
                            >
                              {day.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={styles.weekDaysHint}>
                      Elige en qué días de la semana se repetirá esta rutina.
                    </Text>
                  </View>
                )}

                <View style={{height: 80}} /> 
              </ScrollView>

              {/* Footer Fixed */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: taskColor || config.color }]}
                  onPress={() => {
                    // Formatear fecha a YYYY-MM-DD para devolverla
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    const dateString = `${y}-${m}-${d}`;
                    
                    // Formatear hora HH:MM
                    const h = String(time.getHours()).padStart(2, '0');
                    const min = String(time.getMinutes()).padStart(2, '0');
                    const timeString = `${h}:${min}`;

                    const finalData = { 
                      type, 
                      ...form,
                      time: timeString,
                      subtasks: subtasks,
                      color: taskColor
                    };

                    if (form.frequency === "specificDays") {
                      finalData.daysOfWeek = specificDays;
                    }
                    
                    if (type === "shopping") {
                      finalData.shoppingList = shoppingList;
                      finalData.total = calculateTotal();
                    }

                    onSave(finalData, dateString);
                  }}
                >
                  <Text style={styles.saveText}>Guardar</Text>
                </TouchableOpacity>
              </View>

            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  box: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: "90%", 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 25,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  closeBtn: {
    padding: 5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: "#E1E8ED",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: "#333",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: "#E1E8ED",
    padding: 15,
    borderRadius: 12,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
    textTransform: "capitalize",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  // Dropdown Styles
  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: "#E1E8ED",
    padding: 15,
    borderRadius: 12,
  },
  dropdownBtnText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownList: {
    marginTop: 5,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderRadius: 12,
    padding: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  // Color Picker
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 3,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: "#333",
    transform: [{ scale: 1.1 }],
  },
  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  cancelBtn: {
    padding: 16,
    borderRadius: 15,
    width: "45%",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
  },
  cancelText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveBtn: {
    padding: 16,
    borderRadius: 15,
    width: "45%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Shopping Styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  chipScroll: {
    marginBottom: 15,
    maxHeight: 50,
  },
  chip: {
    backgroundColor: "#FFF9C4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#FBC02D",
  },
  chipText: {
    color: "#F57F17",
    fontWeight: "600",
  },
  addItemRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  addBtn: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    borderRadius: 12,
  },
  shoppingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  itemSubText: {
    fontSize: 14,
    color: "#666",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginBottom: 20,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F4D03F",
  },
  subtaskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    marginBottom: 5,
  },
  subtaskText: {
    fontSize: 14,
    color: "#333",
  },
  // Días específicos de la semana
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  weekDayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: "#E1E8ED",
    marginHorizontal: 3,
  },
  weekDayChipSelected: {
    backgroundColor: "#4C8DFF15",
    borderColor: "#4C8DFF",
  },
  weekDayChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#718096",
  },
  weekDayChipTextSelected: {
    color: "#1A202C",
  },
  weekDaysHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#A0AEC0",
  },
});
