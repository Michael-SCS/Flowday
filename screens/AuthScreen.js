import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseConfig';

export default function AuthScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Sign Up
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Only for Sign Up
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa el correo y la contraseña.");
      return;
    }

    if (isSignUp && (!fullName || !lastName || !age || !gender)) {
      Alert.alert("Error", "Por favor completa todos los campos de registro.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // --- REGISTRO ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: `${fullName} ${lastName}`,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Crear perfil en la tabla 'profiles'
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: email,
                nombre: fullName,
                apellido: lastName,
                edad: parseInt(age) || null,
                genero: gender
              }
            ]);
            
          if (profileError) {
             console.log("Error creando perfil:", profileError);
             // No bloqueamos el flujo si falla el perfil, pero es bueno saberlo
          }

          Alert.alert(
            "Registro Exitoso", 
            "Por favor verifica tu correo electrónico para confirmar tu cuenta antes de iniciar sesión."
          );
          setIsSignUp(false); // Switch to login mode
        }
      } else {
        // --- INICIO DE SESIÓN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await handleUserSession(data.session);
        }
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSession = async (session) => {
    const user = session.user;
    
    // Guardar datos localmente
    await AsyncStorage.setItem('user_name', user.user_metadata.full_name || user.email);
    await AsyncStorage.setItem('user_email', user.email);
    await AsyncStorage.setItem('is_logged_in', 'true');

    Alert.alert("¡Bienvenido!", `Hola ${user.user_metadata.full_name || 'Usuario'}`);
    navigation.goBack();
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // Reset fields slightly but keep email if typed
  };

  // Si estamos mostrando el formulario de email
  if (showEmailForm) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowEmailForm(false)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>{isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}</Text>
              <Text style={styles.formSubtitle}>
                {isSignUp 
                  ? "Ingresa tus datos para registrarte" 
                  : "Bienvenido de nuevo"}
              </Text>

              {isSignUp && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej. Juan"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Apellido</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej. Pérez"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 15 }}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Edad</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej. 25"
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        maxLength={3}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Género</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej. M/F"
                        value={gender}
                        onChangeText={setGender}
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleEmailAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isSignUp ? "Registrarse" : "Entrar"}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {isSignUp ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
                </Text>
                <TouchableOpacity onPress={toggleMode}>
                  <Text style={styles.linkText}>
                    {isSignUp ? " Inicia Sesión" : " Regístrate"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Vista Principal con opciones (Botones grandes)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Únete a Flowday</Text>
          <Text style={styles.subtitle}>
            Sincroniza tus tareas, guarda tu progreso y accede a estadísticas detalladas.
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          {/* Email - AHORA ES LA OPCIÓN PRINCIPAL */}
          <TouchableOpacity 
            style={[styles.authButton, styles.emailButtonMain]} 
            onPress={() => {
              setIsSignUp(true); // Default to Sign Up flow
              setShowEmailForm(true);
            }}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="mail" size={22} color="#fff" />
            </View>
            <Text style={[styles.buttonText, { color: '#fff' }]}>Registrarse con Email</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.authButton} 
            onPress={() => {
              setIsSignUp(false); // Login flow
              setShowEmailForm(true);
            }}
          >
            <Text style={styles.buttonText}>Ya tengo una cuenta</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.line} />
          </View>

          {/* Placeholders para futuras integraciones */}
          <TouchableOpacity style={styles.authButton} onPress={() => Alert.alert("Próximamente")}>
            <View style={styles.iconWrapper}>
              <Ionicons name="logo-google" size={22} color="#DB4437" />
            </View>
            <Text style={styles.buttonText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.authButton} onPress={() => Alert.alert("Próximamente")}>
            <View style={styles.iconWrapper}>
              <Ionicons name="logo-facebook" size={22} color="#4267B2" />
            </View>
            <Text style={styles.buttonText}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    gap: 15,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    justifyContent: 'center',
  },
  emailButtonMain: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  iconWrapper: {
    position: 'absolute',
    left: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12,
  },
  
  // Form Styles
  formContainer: {
    padding: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#666',
  },
  linkText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});
