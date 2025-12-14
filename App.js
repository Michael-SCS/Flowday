import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CalendarScreen from "./screens/CalendarScreen";
import PomodoroScreen from "./screens/PomodoroScreen";
import JournalScreen from "./screens/JournalScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AuthScreen from "./screens/AuthScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Componente personalizado para el botón central
const CustomTabBarButton = ({ onPress }) => (
  <TouchableOpacity
    style={{
      top: -30,
      justifyContent: "center",
      alignItems: "center",
      ...styles.shadow,
    }}
    onPress={onPress}
  >
    <View
      style={{
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: "#4A90E2",
        borderWidth: 4,
        borderColor: "#fff",
        elevation: 5,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons name="add" size={40} color="#fff" style={{ marginLeft: 2, marginTop: 1 }} />
    </View>
  </TouchableOpacity>
);

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen 
        name="Auth" 
        component={AuthScreen} 
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const [currentRoute, setCurrentRoute] = useState("Calendario");
  
  return (
    <Tab.Navigator
      screenListeners={({ route }) => ({
        focus: () => {
          setCurrentRoute(route.name);
        },
      })}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#4A90E2",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          height: 60 + (insets.bottom > 0 ? insets.bottom : 10), // Altura dinámica
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5, // Padding dinámico
          paddingTop: 5
        },
      }}
    >
      <Tab.Screen 
        name="Calendario" 
        component={CalendarScreen} 
        options={{
          tabBarLabel: "Agenda",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen 
        name="Pomodoro" 
        component={PomodoroScreen} 
        options={{
          tabBarLabel: "Pomodoro",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "timer" : "timer-outline"} size={24} color={color} />
          ),
        }}
      />
      
      {/* Botón Central que abre el modal */}
      {currentRoute !== "Pomodoro" && (
        <Tab.Screen 
          name="Add" 
          component={CalendarScreen} 
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault();
              if (currentRoute === "Diario") {
                if (global.openJournalModal) {
                  global.openJournalModal();
                }
              } else {
                if (global.openTaskModal) {
                  global.openTaskModal();
                }
              }
            },
          })}
          options={{
            tabBarLabel: () => null,
            tabBarButton: (props) => <CustomTabBarButton {...props} />,
          }}
        />
      )}

      <Tab.Screen 
        name="Diario" 
        component={JournalScreen} 
        options={{
          tabBarLabel: "Diario",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "journal" : "journal-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen 
        name="Perfil" 
        component={ProfileStack} 
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#7F5DF0",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
});
