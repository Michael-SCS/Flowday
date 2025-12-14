import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Image,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({
    streak: 0,
    daysRegistered: 1,
    completedTasks: 0,
    totalTasks: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      // 1. Load User Info
      const storedName = await AsyncStorage.getItem('user_name');
      const storedRegDate = await AsyncStorage.getItem('registration_date');
      const loggedInStatus = await AsyncStorage.getItem('is_logged_in');
      
      if (storedName) setUserName(storedName);
      setIsLoggedIn(loggedInStatus === 'true');
      
      let regDate = new Date();
      if (storedRegDate) {
        regDate = new Date(storedRegDate);
      } else {
        // First time? Save registration date
        await AsyncStorage.setItem('registration_date', regDate.toISOString());
      }

      // Calculate Days Registered
      const today = new Date();
      const diffTime = Math.abs(today - regDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      // 2. Load Tasks for Stats
      const storedTasks = await AsyncStorage.getItem('tasks');
      let allTasks = {};
      if (storedTasks) {
        allTasks = JSON.parse(storedTasks);
      }

      // Calculate Stats
      let completedCount = 0;
      let totalCount = 0;
      let activeDays = new Set();

      Object.keys(allTasks).forEach(date => {
        const dayTasks = allTasks[date];
        if (Array.isArray(dayTasks)) {
          dayTasks.forEach(task => {
            totalCount++;
            if (task.completed) {
              completedCount++;
              activeDays.add(date);
            }
          });
        }
      });

      // Calculate Streak (Consecutive days ending today or yesterday)
      let currentStreak = 0;
      let checkDate = new Date();
      // Check today
      let dateStr = checkDate.toISOString().split('T')[0];
      if (activeDays.has(dateStr)) {
        currentStreak++;
      } else {
        // If not today, check yesterday (maybe user hasn't done tasks today yet)
        // But strict streak usually requires today. Let's be lenient: 
        // If today is empty, check yesterday. If yesterday has tasks, streak continues from yesterday.
        // If yesterday is empty, streak is 0.
      }

      // Simple loop backwards
      // Actually, let's just count backwards from yesterday to find the chain
      // If today has tasks, start from today. If not, start from yesterday.
      
      let streakStartDate = new Date();
      let todayStr = streakStartDate.toISOString().split('T')[0];
      
      if (!activeDays.has(todayStr)) {
        streakStartDate.setDate(streakStartDate.getDate() - 1);
      }
      
      // Now count backwards
      let tempDate = new Date(streakStartDate);
      let tempStreak = 0;
      
      // Safety break
      while (true) {
        const dStr = tempDate.toISOString().split('T')[0];
        if (activeDays.has(dStr)) {
          tempStreak++;
          tempDate.setDate(tempDate.getDate() - 1);
        } else {
          break;
        }
        if (tempStreak > 3650) break; // 10 years max loop
      }

      setStats({
        streak: tempStreak,
        daysRegistered: diffDays || 1,
        completedTasks: completedCount,
        totalTasks: totalCount
      });

    } catch (e) {
      console.error("Error loading profile", e);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfileData().then(() => setRefreshing(false));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Banner Registro - Solo si NO está logueado */}
        {!isLoggedIn && (
          <TouchableOpacity 
            style={styles.bannerContainer} 
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Auth')}
          >
            <View style={styles.bannerContent}>
              <View>
                <Text style={styles.bannerTitle}>CREA TU CUENTA</Text>
                <Text style={styles.bannerSubtitle}>Guarda tu progreso en la nube</Text>
              </View>
              <Ionicons name="cloud-upload-outline" size={32} color="#fff" />
            </View>
            <View style={styles.bannerBackground} />
          </TouchableOpacity>
        )}

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>¡Hola!</Text>
          {userName ? (
            <Text style={styles.nameText}>{userName}</Text>
          ) : (
            <TouchableOpacity onPress={() => {/* TODO: Edit Name */}}>
              <Text style={styles.placeholderName}>Configura tu nombre</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
        
        <View style={styles.statsGrid}>
          {/* Streak Card */}
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="flame" size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Días de Racha</Text>
          </View>

          {/* Days Registered Card */}
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.daysRegistered}</Text>
            <Text style={styles.statLabel}>Días en Flowday</Text>
          </View>

          {/* Completed Tasks Card */}
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.completedTasks}</Text>
            <Text style={styles.statLabel}>Tareas Completadas</Text>
          </View>

          {/* Completion Rate Card */}
          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#9C27B0' }]}>
              <Ionicons name="pie-chart" size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Tasa de Éxito</Text>
          </View>
        </View>

        {/* Additional Info / Placeholder */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Sigue completando tareas para aumentar tu racha y mejorar tu productividad.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  bannerContainer: {
    height: 80,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    backgroundColor: '#333', // Fallback
  },
  bannerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#4A90E2', // Primary Blue
    opacity: 0.9,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.9,
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greetingContainer: {
    marginBottom: 30,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  nameText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#666',
  },
  placeholderName: {
    fontSize: 18,
    color: '#4A90E2',
    marginTop: 5,
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  statCard: {
    width: (width - 55) / 2, // 2 columns with padding/gap
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  infoText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
