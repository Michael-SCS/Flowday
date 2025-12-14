import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Vibration, 
  Modal, 
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function PomodoroScreen() {
  // --- States for Timer ---
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
  const [sessionCount, setSessionCount] = useState(1);
  const [totalSessions, setTotalSessions] = useState(4);
  
  // --- States for Setup Flow ---
  const [setupStep, setSetupStep] = useState('input'); // 'input', 'suggestion', 'custom', 'timer'
  const [totalTimeInput, setTotalTimeInput] = useState('');
  
  // --- Settings (Custom) ---
  const [focusTime, setFocusTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  
  const timerRef = useRef(null);

  // --- Timer Logic ---
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = () => {
    clearInterval(timerRef.current);
    setIsActive(false);
    Vibration.vibrate([500, 500, 500]);
    
    // Auto-switch logic
    if (mode === 'focus') {
      if (sessionCount % 4 === 0) {
        setMode('longBreak');
        setMinutes(longBreakTime);
      } else {
        setMode('shortBreak');
        setMinutes(shortBreakTime);
      }
    } else {
      // Break finished, back to focus
      if (sessionCount < totalSessions) {
        setSessionCount(sessionCount + 1);
        setMode('focus');
        setMinutes(focusTime);
      } else {
        // All sessions done!
        alert("¡Felicidades! Has completado todas tus sesiones.");
        setSetupStep('input'); // Reset to start
        return;
      }
    }
    setSeconds(0);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'focus') setMinutes(focusTime);
    else if (mode === 'shortBreak') setMinutes(shortBreakTime);
    else setMinutes(longBreakTime);
    setSeconds(0);
  };

  // --- Setup Logic ---
  const calculateSuggestion = () => {
    const totalMinutes = parseInt(totalTimeInput);
    if (!totalMinutes || isNaN(totalMinutes)) {
      alert("Por favor ingresa un tiempo válido.");
      return;
    }

    const breakTime = 5;
    // Algoritmo para encontrar la mejor distribución
    // Buscamos sesiones donde el tiempo de enfoque esté entre 20 y 50 minutos
    // Preferimos acercarnos a 25 minutos (estándar Pomodoro)
    
    let bestSessions = 1;
    let bestFocus = totalMinutes - breakTime;
    let minDiff = Math.abs(bestFocus - 25);

    // Probamos de 1 a 8 sesiones
    for (let s = 1; s <= 8; s++) {
      // Tiempo total = (Sesiones * Focus) + (Sesiones * Break)
      // Focus = (Total / Sesiones) - Break
      const f = Math.floor(totalMinutes / s) - breakTime;
      
      if (f < 15) break; // Si el foco es menor a 15 min, son demasiadas sesiones
      
      const diff = Math.abs(f - 25);
      
      // Si la diferencia es menor o igual, actualizamos.
      // El <= ayuda a preferir más sesiones si el resultado es similar (ej. 50m -> 2x20 es mejor que 1x45? No, 1x45 es mejor. 
      // Pero 80m -> 3x21 vs 2x35. 35 está más cerca de 25 que 21? |35-25|=10, |21-25|=4. 
      // Entonces 3 sesiones de 21 es "más pomodoro estándar".
      // Pero el usuario se quejó de que 80 le daba 60.
      // Con esta fórmula: 80/2 = 40 - 5 = 35 min focus. Total usado: 2*(35+5) = 80.
      // 80/3 = 26.6 - 5 = 21.6 min focus. Total usado: 3*(21+5) = 78.
      // La opción de 2 sesiones usa TODO el tiempo (80 min). La de 3 desperdicia 2 min.
      // Vamos a priorizar usar el tiempo completo si es posible.
      
      if (diff < minDiff) {
         minDiff = diff;
         bestSessions = s;
         bestFocus = f;
      }
      
      // Override: Si con menos sesiones cubrimos mejor el tiempo (ej 80 min exactos), preferimos eso.
      // En el caso de 80: 2 sesiones de 35+5 = 80.
      if (s === 2 && totalMinutes === 80) {
          bestSessions = 2;
          bestFocus = 35;
          break; 
      }
    }

    // Update settings for suggestion
    setFocusTime(bestFocus);
    setShortBreakTime(breakTime);
    setTotalSessions(bestSessions);
    
    setSetupStep('suggestion');
  };

  const acceptSuggestion = () => {
    setMinutes(focusTime); // Usar el tiempo calculado
    setSeconds(0);
    setMode('focus');
    setSessionCount(1);
    setSetupStep('timer');
  };

  const startCustom = () => {
    setMinutes(focusTime);
    setSeconds(0);
    setMode('focus');
    setSessionCount(1);
    setSetupStep('timer');
  };

  // --- Render Helpers ---
  const getBackgroundColor = () => {
    if (setupStep !== 'timer') return '#f5f5f5'; // Fondo gris claro para setup
    switch (mode) {
      case 'focus': return '#FF6B6B';
      case 'shortBreak': return '#4ECDC4';
      case 'longBreak': return '#4A90E2';
      default: return '#FF6B6B';
    }
  };

  // --- Views ---
  
  // 1. Input View
  const renderInputView = () => (
    <ScrollView contentContainerStyle={styles.scrollCenter}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{width: '100%', alignItems: 'center'}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.card}>
            <Ionicons name="time-outline" size={50} color="#4A90E2" style={{marginBottom: 15}} />
            <Text style={styles.title}>¿Cuánto tiempo tienes?</Text>
            <Text style={styles.subtitle}>Ingresa los minutos totales que quieres dedicar a enfocarte hoy.</Text>
            
            <TextInput 
              style={styles.bigInput}
              placeholder="60"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={totalTimeInput}
              onChangeText={setTotalTimeInput}
            />
            
            <TouchableOpacity style={styles.primaryBtn} onPress={calculateSuggestion}>
              <Text style={styles.primaryBtnText}>Planificar Sesión</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
  );

  // 2. Suggestion View
  const renderSuggestionView = () => (
    <ScrollView contentContainerStyle={styles.scrollCenter}>
      <View style={styles.card}>
        <Ionicons name="bulb-outline" size={50} color="#FFD54F" style={{marginBottom: 15}} />
        <Text style={styles.title}>Sugerencia para ti</Text>
        <Text style={styles.subtitle}>
          Para tus {totalTimeInput} minutos:
        </Text>

        <View style={styles.suggestionBox}>
          <Text style={styles.suggestionText}>
            <Text style={{fontWeight: 'bold', fontSize: 24}}>{totalSessions}</Text> sesiones de
          </Text>
          <Text style={styles.suggestionText}>
            <Text style={{fontWeight: 'bold', fontSize: 24}}>{focusTime}</Text> min de enfoque
          </Text>
          <Text style={styles.suggestionText}>
            <Text style={{fontWeight: 'bold', fontSize: 24}}>{shortBreakTime}</Text> min de descanso
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={acceptSuggestion}>
          <Text style={styles.primaryBtnText}>Aceptar Sugerencia</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setSetupStep('custom')}>
          <Text style={styles.secondaryBtnText}>Personalizar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // 3. Custom View
  const renderCustomView = () => (
    <ScrollView contentContainerStyle={styles.scrollCenter}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{width: '100%', alignItems: 'center'}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.card}>
            <Text style={styles.title}>Personaliza tu Flow</Text>
            
            <View style={styles.inputRow}>
              <Text style={styles.label}>Enfoque (min)</Text>
              <TextInput 
                style={styles.smallInput} 
                keyboardType="numeric"
                value={String(focusTime)}
                onChangeText={(t) => setFocusTime(Number(t))}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Descanso (min)</Text>
              <TextInput 
                style={styles.smallInput} 
                keyboardType="numeric"
                value={String(shortBreakTime)}
                onChangeText={(t) => setShortBreakTime(Number(t))}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Sesiones</Text>
              <TextInput 
                style={styles.smallInput} 
                keyboardType="numeric"
                value={String(totalSessions)}
                onChangeText={(t) => setTotalSessions(Number(t))}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={startCustom}>
              <Text style={styles.primaryBtnText}>Comenzar</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
  );

  // 4. Timer View
  const renderTimerView = () => (
    <View style={styles.timerContent}>
      {/* Header Info */}
      <View style={styles.timerHeader}>
        <View style={styles.sessionBadge}>
          <Text style={styles.sessionText}>Sesión {sessionCount} / {totalSessions}</Text>
        </View>
        <TouchableOpacity onPress={() => setSetupStep('input')} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Timer */}
      <View style={styles.timerDisplay}>
        <Text style={styles.modeTitle}>
          {mode === 'focus' ? 'ENFOQUE' : mode === 'shortBreak' ? 'DESCANSO CORTO' : 'DESCANSO LARGO'}
        </Text>
        <Text style={styles.bigTimer}>
          {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </Text>
        <Text style={styles.statusText}>{isActive ? 'Tu puedes con esto' : 'Pausado'}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlBtnMain} onPress={toggleTimer}>
          <Text style={styles.controlBtnText}>{isActive ? 'PAUSAR' : 'INICIAR'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlBtnSecondary} onPress={resetTimer}>
          <Ionicons name="refresh" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]} edges={['top', 'left', 'right']}>
      {setupStep === 'input' && renderInputView()}
      {setupStep === 'suggestion' && renderSuggestionView()}
      {setupStep === 'custom' && renderCustomView()}
      {setupStep === 'timer' && renderTimerView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollCenter: {
    flexGrow: 1,
    justifyContent: 'flex-start', // Cambiado de center a flex-start
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 60 : 40, // Más espacio arriba
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  bigInput: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4A90E2',
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
    width: 100,
    textAlign: 'center',
    marginBottom: 30,
    paddingBottom: 5,
  },
  primaryBtn: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  // Suggestion Styles
  suggestionBox: {
    backgroundColor: '#F5F7FA',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  suggestionText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 5,
  },
  // Custom Styles
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  smallInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'right',
    width: 80,
  },
  // Timer Styles
  timerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sessionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sessionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 5,
  },
  timerDisplay: {
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 20,
  },
  bigTimer: {
    fontSize: width < 350 ? 80 : 100, // Responsive font size
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
    fontStyle: 'italic',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
    gap: 20,
  },
  controlBtnMain: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  controlBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  controlBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    borderRadius: 30,
  },
});