import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Alert,
  Animated,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CalendarProvider, LocaleConfig } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import TaskTypeModal from "../components/TaskTypeModal";
import DynamicTaskModal, { TYPE_CONFIG } from "../components/DynamicTaskModal";

// ---- CONFIGURAR CALENDARIO EN ESPAÑOL ----
LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ],
  monthNamesShort: [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ],
  dayNames: [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy"
};
LocaleConfig.defaultLocale = "es";
// -----------------------------------------

export default function CalendarScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [tasks, setTasks] = useState({});

  // Modales
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [dynamicModalVisible, setDynamicModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [editingTask, setEditingTask] = useState(null); // { task, index, date }

  // Referencia para el listener del botón central
  useEffect(() => {
    // Hack para conectar con el TabBarButton si es necesario:
    global.openTaskModal = () => setTypeModalVisible(true);

    return () => {
      global.openTaskModal = null;
    };
  }, []);

  // Cargar tareas al iniciar
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem("tasks");
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Error cargando tareas:", error);
    }
  };

  const saveTasks = async (newTasks) => {
    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(newTasks));
    } catch (error) {
      console.error("Error guardando tareas:", error);
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setEditingTask(null);
    setTypeModalVisible(false);
    setTimeout(() => setDynamicModalVisible(true), 300);
  };

  const handleEditTask = (task, index) => {
    setSelectedType(task.type);
    setEditingTask({ task, index, date: selectedDate });
    setDynamicModalVisible(true);
  };

  const handleDeleteTask = (task, index) => {
    const isSameTask = (a, b) => {
      return (
        a.type === b.type &&
        (a.title || "") === (b.title || "") &&
        (a.time || "") === (b.time || "") &&
        (a.description || "") === (b.description || "")
      );
    };

    Alert.alert(
      "Eliminar rutina",
      "¿Qué deseas eliminar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Solo este día",
          onPress: () => {
            const newTasks = { ...tasks };
            if (newTasks[selectedDate]) {
              newTasks[selectedDate].splice(index, 1);
              if (newTasks[selectedDate].length === 0) {
                delete newTasks[selectedDate];
              }
              setTasks(newTasks);
              saveTasks(newTasks);
            }
          }
        },
        {
          text: "Todas las repeticiones",
          style: "destructive",
          onPress: () => {
            const newTasks = { ...tasks };

            Object.keys(newTasks).forEach((dateKey) => {
              newTasks[dateKey] = newTasks[dateKey].filter((t) => !isSameTask(t, task));
              if (newTasks[dateKey].length === 0) {
                delete newTasks[dateKey];
              }
            });

            setTasks(newTasks);
            saveTasks(newTasks);
          }
        }
      ]
    );
  };

  const toggleTaskDone = (index) => {
    const newTasks = { ...tasks };
    if (newTasks[selectedDate]) {
      const wasDone = newTasks[selectedDate][index].done;
      newTasks[selectedDate][index].done = !wasDone;
      setTasks(newTasks);
      saveTasks(newTasks);

      if (!wasDone) {
        const allDone = newTasks[selectedDate].length > 0 &&
          newTasks[selectedDate].every(t => t.done);

        if (allDone) {
          Alert.alert(
            "¡Felicidades!",
            "Has completado todas tus actividades de hoy. ¡Gracias por tu compromiso contigo mismo!"
          );
        }
      }
    }
  };

  const addTask = (taskObj, dateString) => {
    const targetDate = dateString || selectedDate;
    if (!targetDate) return;

    const newTasks = { ...tasks };

    // Si estamos editando, eliminar la tarea anterior primero
    if (editingTask) {
      const { date: oldDate, index } = editingTask;
      if (newTasks[oldDate]) {
        newTasks[oldDate].splice(index, 1);
        if (newTasks[oldDate].length === 0) {
          delete newTasks[oldDate];
        }
      }
    }

    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const [year, month, day] = targetDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);

    const frequency = taskObj.frequency || "once";

    const isSameTask = (a, b) => {
      return (
        a.type === b.type &&
        (a.title || "") === (b.title || "") &&
        (a.time || "") === (b.time || "") &&
        (a.description || "") === (b.description || "")
      );
    };

    // Frecuencia en días específicos de la semana
    if (frequency === "specificDays" && Array.isArray(taskObj.daysOfWeek) && taskObj.daysOfWeek.length > 0) {
      const weeksToGenerate = 26; // ~6 meses

      for (let w = 0; w < weeksToGenerate; w++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (w * 7));

        taskObj.daysOfWeek.forEach((dow) => {
          const baseDow = weekStart.getDay(); // 0 (Dom) - 6 (Sáb)
          const diff = ((dow - baseDow) + 7) % 7;

          const currentDate = new Date(weekStart);
          currentDate.setDate(weekStart.getDate() + diff);

          const currentString = formatDate(currentDate);

          if (!newTasks[currentString]) {
            newTasks[currentString] = [];
          }

          const currentTask = { ...taskObj };

          const exists = newTasks[currentString].some((t) => isSameTask(t, currentTask));
          if (!exists) {
            newTasks[currentString].push(currentTask);
          }
        });
      }

      setTasks(newTasks);
      saveTasks(newTasks);
      setDynamicModalVisible(false);
      setEditingTask(null);
      return;
    }

    let occurrences = 1;
    if (frequency === "daily") occurrences = 365;
    if (frequency === "weekly") occurrences = 52;
    if (frequency === "biweekly") occurrences = 26;
    if (frequency === "monthly") occurrences = 24;
    if (frequency === "yearly") occurrences = 10;

    for (let i = 0; i < occurrences; i++) {
      const currentDate = new Date(startDate);

      if (frequency === "daily") {
        currentDate.setDate(startDate.getDate() + i);
      } else if (frequency === "weekly") {
        const days = taskObj.type === "shopping" ? 8 : 7;
        currentDate.setDate(startDate.getDate() + (i * days));
      } else if (frequency === "biweekly") {
        currentDate.setDate(startDate.getDate() + (i * 15));
      } else if (frequency === "monthly") {
        currentDate.setMonth(startDate.getMonth() + i);
      } else if (frequency === "yearly") {
        currentDate.setFullYear(startDate.getFullYear() + i);
      }

      const currentString = formatDate(currentDate);

      if (!newTasks[currentString]) {
        newTasks[currentString] = [];
      }

      let currentTask = { ...taskObj };
      if (taskObj.type === "birthday" && frequency === "yearly" && taskObj.age) {
        const baseAge = parseInt(taskObj.age, 10);
        if (!isNaN(baseAge)) {
          currentTask.age = (baseAge + i).toString();
        }
      }

      const exists = newTasks[currentString].some((t) => isSameTask(t, currentTask));
      if (!exists) {
        newTasks[currentString].push(currentTask);
      }
    }

    setTasks(newTasks);
    saveTasks(newTasks);
    setDynamicModalVisible(false);
    setEditingTask(null);
  };

  const renderTaskItem = ({ item, index }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.custom;
    const isDone = item.done || false;
    const cardColor = item.color || config.color;

    return (
      <Swipeable
        renderRightActions={() => null}
        onSwipeableOpen={(direction) => {
          // Deslizar hacia la izquierda (mostrando acciones a la derecha) borra la tarea
          if (direction === 'right') {
            handleDeleteTask(item, index);
          }
        }}
      >
        <View style={[styles.taskCard, { borderLeftColor: cardColor, opacity: isDone ? 0.7 : 1 }]}>
          <TouchableOpacity
            style={styles.taskMain}
            activeOpacity={0.9}
            onPress={() => handleEditTask(item, index)}
          >
            <View style={[styles.iconContainer, { backgroundColor: cardColor + '15' }]}>
              <Ionicons name={config.icon} size={26} color={cardColor} />
            </View>

            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                {item.title || config.label}
              </Text>

              {/* Detalles específicos según el tipo */}
              {item.time && (
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={14} color="#7A8A99" style={styles.detailIcon} />
                  <Text style={styles.taskDetail}>{item.time}</Text>
                </View>
              )}
              {item.distance && (
                <View style={styles.detailRow}>
                  <Ionicons name="footsteps-outline" size={14} color="#7A8A99" style={styles.detailIcon} />
                  <Text style={styles.taskDetail}>{item.distance} km</Text>
                </View>
              )}
              {item.liters && (
                <View style={styles.detailRow}>
                  <Ionicons name="water-outline" size={14} color="#7A8A99" style={styles.detailIcon} />
                  <Text style={styles.taskDetail}>{item.liters} L</Text>
                </View>
              )}
              {item.book && (
                <View style={styles.detailRow}>
                  <Ionicons name="book-outline" size={14} color="#7A8A99" style={styles.detailIcon} />
                  <Text style={styles.taskDetail}>{item.book}</Text>
                </View>
              )}
              {item.shoppingList && (
                <View style={styles.detailRow}>
                  <Ionicons name="cart-outline" size={14} color="#7A8A99" style={styles.detailIcon} />
                  <Text style={styles.taskDetail}>{item.shoppingList.length} items</Text>
                </View>
              )}
              {item.description && (
                <Text style={styles.taskDesc} numberOfLines={1}>{item.description}</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => toggleTaskDone(index)} style={styles.checkBtn}>
            <Ionicons
              name={isDone ? "checkmark-circle" : "ellipse-outline"}
              size={32}
              color={isDone ? cardColor : "#D1D9E2"}
            />
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  const getFormattedDateHeader = () => {
    const today = new Date();
    const selected = new Date(selectedDate + 'T00:00:00');

    // Resetear horas para comparar solo fechas
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (selected.getTime() === today.getTime()) {
      return "Hoy";
    } else if (selected.getTime() === tomorrow.getTime()) {
      return "Mañana";
    } else {
      return selected.toLocaleDateString("es-ES", {
        weekday: 'long',
        day: 'numeric'
      });
    }
  };

  const getLongDateLabel = () => {
    const selected = new Date(selectedDate + 'T00:00:00');
    return selected.toLocaleDateString("es-ES", {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const tasksToday = tasks[selectedDate] || [];
  const totalToday = tasksToday.length;
  const completedToday = tasksToday.filter(t => t.done).length;

  const getWeekDatesAroundSelected = () => {
    const base = new Date(selectedDate + 'T00:00:00');
    const dates = [];

    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      dates.push({
        key: dateString,
        dateString,
        date: d,
        isToday: dateString === today,
        isSelected: dateString === selectedDate,
        dayNumber: d.getDate(),
        weekdayShort: d.toLocaleDateString('es-ES', { weekday: 'short' })
      });
    }

    return dates;
  };

  const weekDates = getWeekDatesAroundSelected();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />

        {/* Encabezado superior con título y resumen del día */}
        <View style={styles.screenHeader}>
          <View>
            <Text style={styles.screenTitle}>Tu agenda</Text>
            <Text style={styles.screenSubtitle}>{getLongDateLabel()}</Text>
          </View>

          <View style={styles.summaryPill}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#4C8DFF" style={{ marginRight: 6 }} />
            <Text style={styles.summaryText}>
              {totalToday === 0 ? 'Sin tareas' : `${completedToday}/${totalToday} listas`}
            </Text>
          </View>
        </View>

        <CalendarProvider
          date={selectedDate}
          onDateChanged={setSelectedDate}
          showTodayButton
          theme={{
            todayButtonTextColor: '#5B9FED',
          }}
        >
          <View style={styles.calendarCard}>
            <View style={styles.customWeekContainer}>
              {weekDates.map((d) => {
                const isSelected = d.isSelected;
                const isToday = d.isToday;

                return (
                  <TouchableOpacity
                    key={d.key}
                    style={[styles.weekDayItem, isSelected && styles.weekDayItemSelected]}
                    onPress={() => setSelectedDate(d.dateString)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.weekDayName,
                        isSelected && styles.weekDayNameSelected,
                      ]}
                    >
                      {d.weekdayShort.charAt(0).toUpperCase() + d.weekdayShort.slice(1, 3)}
                    </Text>
                    <View
                      style={[
                        styles.weekDayCircle,
                        isToday && styles.weekDayToday,
                        isSelected && styles.weekDayCircleSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekDayNumber,
                          isSelected && styles.weekDayNumberSelected,
                        ]}
                      >
                        {d.dayNumber}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.taskListContainer}>
            <View style={styles.dateHeaderContainer}>
              <Text style={styles.dateHeader}>
                {getFormattedDateHeader()}
              </Text>
              <View style={styles.dateUnderline} />
            </View>

            <FlatList
              data={tasks[selectedDate] || []}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderTaskItem}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.illustrationContainer}>
                    <View style={styles.sparkleContainer}>
                      <Ionicons name="sparkles" size={28} color="#FFD54F" style={styles.sparkle1} />
                      <Ionicons name="sparkles" size={20} color="#FFE57F" style={styles.sparkle2} />
                    </View>
                    <View style={styles.clipboardCircle}>
                      <Ionicons name="checkmark-done-outline" size={70} color="#E8EEF4" />
                    </View>
                  </View>

                  <Text style={styles.emptyTitle}>¡Todo despejado!</Text>
                  <Text style={styles.emptyText}>
                    No hay tareas para este día.{'\n'}
                    Empieza a crearlas ya.
                  </Text>

                  <View style={styles.arrowContainer}>
                    <View style={styles.arrowPill}>
                      <Text style={styles.arrowText}>Toca aquí abajo</Text>
                      <Ionicons name="arrow-down" size={18} color="#5B9FED" />
                    </View>
                  </View>
                </View>
              }
            />
          </View>
        </CalendarProvider>

        <TaskTypeModal
          visible={typeModalVisible}
          onClose={() => setTypeModalVisible(false)}
          onSelect={handleTypeSelect}
        />

        <DynamicTaskModal
          visible={dynamicModalVisible}
          type={selectedType}
          initialData={editingTask ? editingTask.task : null}
          initialDate={selectedDate}
          onClose={() => {
            setDynamicModalVisible(false);
            setEditingTask(null);
          }}
          onSave={addTask}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#718096',
    textTransform: 'capitalize',
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3EEFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A365D',
  },
  calendarCard: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  weekCalendar: {
    borderRadius: 18,
  },
  customWeekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  weekDayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  weekDayItemSelected: {
    transform: [{ translateY: -2 }],
  },
  weekDayName: {
    fontSize: 11,
    color: '#A0AEC0',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  weekDayNameSelected: {
    color: '#2D3748',
    fontWeight: '700',
  },
  weekDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayToday: {
    borderWidth: 1.5,
    borderColor: '#4C8DFF',
  },
  weekDayCircleSelected: {
    backgroundColor: '#4C8DFF',
  },
  weekDayNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3748',
  },
  weekDayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  taskListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  dateHeaderContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A202C",
    textTransform: "capitalize",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
  },
  dateUnderline: {
    width: 40,
    height: 4,
    backgroundColor: "#5B9FED",
    borderRadius: 2,
    marginTop: 8,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    shadowColor: "#1A202C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  taskMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkBtn: {
    padding: 4,
    marginLeft: 8,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#A0AEC0',
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  detailIcon: {
    marginRight: 6,
  },
  taskDetail: {
    fontSize: 14,
    color: "#7A8A99",
    fontWeight: "500",
  },
  taskDesc: {
    fontSize: 13,
    color: "#A0AEC0",
    marginTop: 6,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    position: 'relative',
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
    zIndex: 2,
  },
  sparkle1: {
    position: 'absolute',
    top: 10,
    right: 15,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 20,
    left: 10,
  },
  clipboardCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E8EEF4',
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2D3748",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    color: "#7A8A99",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "400",
  },
  arrowContainer: {
    marginTop: 50,
    alignItems: "center",
  },
  arrowPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  arrowText: {
    fontSize: 15,
    color: "#5B9FED",
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});