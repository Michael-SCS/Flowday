import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  TextInput, 
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const COLORS = [
  "#FFEB3B", // Yellow (Classic Post-it)
  "#FF8A80", // Red/Pink
  "#80D8FF", // Blue
  "#CCFF90", // Green
  "#CFD8DC", // Grey
  "#FFD180", // Orange
];

const COVER_COLORS = [
  "#5D4037", // Brown
  "#1A237E", // Dark Blue
  "#B71C1C", // Dark Red
  "#1B5E20", // Dark Green
  "#263238", // Dark Grey
  "#4A148C", // Purple
];

export default function JournalScreen() {
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [journalTitle, setJournalTitle] = useState("Mi Diario");
  const [notes, setNotes] = useState([]);
  
  // Modal States
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null); // For viewing/editing
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteColor, setNewNoteColor] = useState(COLORS[0]);

  // Load Data
  useEffect(() => {
    loadJournalData();
    
    // Expose modal opener to global scope for the Tab Bar button
    global.openJournalModal = openNewNoteModal;
    
    return () => {
      global.openJournalModal = null;
    };
  }, []);

  const loadJournalData = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('journal_notes');
      const savedCover = await AsyncStorage.getItem('journal_cover');
      const savedTitle = await AsyncStorage.getItem('journal_title');
      
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      if (savedCover) setCoverColor(savedCover);
      if (savedTitle) setJournalTitle(savedTitle);
    } catch (e) {
      console.error("Error loading journal", e);
    }
  };

  const saveData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error("Error saving", e);
    }
  };

  const handleSaveNote = () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) {
      setIsNoteModalVisible(false);
      return;
    }

    const date = new Date().toLocaleDateString('es-ES', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let updatedNotes;
    if (selectedNote) {
      // Edit existing
      updatedNotes = notes.map(n => n.id === selectedNote.id ? {
        ...n,
        title: newNoteTitle,
        content: newNoteContent,
        color: newNoteColor,
        date: date // Update date on edit? Or keep original? Let's update.
      } : n);
    } else {
      // Create new
      const newNote = {
        id: Date.now().toString(),
        title: newNoteTitle || "Sin título",
        content: newNoteContent,
        color: newNoteColor,
        date: date
      };
      updatedNotes = [newNote, ...notes];
    }

    setNotes(updatedNotes);
    saveData('journal_notes', JSON.stringify(updatedNotes));
    closeModal();
  };

  const deleteNote = (id) => {
    Alert.alert(
      "Eliminar nota",
      "¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            const updated = notes.filter(n => n.id !== id);
            setNotes(updated);
            saveData('journal_notes', JSON.stringify(updated));
            closeModal();
          }
        }
      ]
    );
  };

  const openNote = (note) => {
    setSelectedNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setNewNoteColor(note.color);
    setIsNoteModalVisible(true);
  };

  const openNewNoteModal = () => {
    setSelectedNote(null);
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteColor(COLORS[0]);
    setIsNoteModalVisible(true);
  };

  const closeModal = () => {
    setIsNoteModalVisible(false);
    setSelectedNote(null);
  };

  const updateCoverColor = (color) => {
    setCoverColor(color);
    saveData('journal_cover', color);
  };

  const updateTitle = (text) => {
    setJournalTitle(text);
    saveData('journal_title', text);
  };

  // --- RENDER: COVER VIEW ---
  if (!isBookOpen) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.coverContainer}>
          <TouchableOpacity 
            style={[styles.bookCover, { backgroundColor: coverColor }]}
            onPress={() => setIsBookOpen(true)}
            activeOpacity={0.9}
          >
            {/* Spine Effect */}
            <View style={styles.spine} />
            
            {/* Title Input */}
            <View style={styles.coverContent}>
              <TextInput
                style={styles.coverTitle}
                value={journalTitle}
                onChangeText={updateTitle}
                placeholder="Mi Diario"
                placeholderTextColor="rgba(255,255,255,0.6)"
                multiline
              />
              <Text style={styles.tapToOpen}>Toca para abrir</Text>
            </View>

            {/* Decorative Lines */}
            <View style={styles.decorativeLine} />
            <View style={[styles.decorativeLine, { marginTop: 5 }]} />
          </TouchableOpacity>

          {/* Color Picker for Cover */}
          <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerTitle}>Personaliza tu portada</Text>
            <View style={styles.colorRow}>
              {COVER_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorCircle, { backgroundColor: c }, coverColor === c && styles.selectedColor]}
                  onPress={() => updateCoverColor(c)}
                />
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDER: INSIDE VIEW (POST-ITS) ---
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsBookOpen(false)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{journalTitle}</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.board} contentContainerStyle={styles.boardContent}>
        <View style={styles.notesGrid}>
          {notes.map((note) => (
            <TouchableOpacity 
              key={note.id} 
              style={[styles.postIt, { backgroundColor: note.color }]}
              onPress={() => openNote(note)}
            >
              <View style={styles.pin} />
              <Text style={styles.postItDate}>{note.date}</Text>
              <Text style={styles.postItTitle} numberOfLines={3}>{note.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {notes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Tu diario está vacío.</Text>
            <Text style={styles.emptySubText}>Agrega una nota para empezar.</Text>
          </View>
        )}
      </ScrollView>

      {/* NOTE MODAL */}
      <Modal visible={isNoteModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.noteModal, { backgroundColor: newNoteColor }]}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.modalActions}>
                  {selectedNote && (
                    <TouchableOpacity onPress={() => deleteNote(selectedNote.id)} style={{marginRight: 15}}>
                      <Ionicons name="trash-outline" size={24} color="#D32F2F" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleSaveNote}>
                    <Ionicons name="checkmark" size={28} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Content */}
              <TextInput
                style={styles.modalTitleInput}
                placeholder="Título..."
                value={newNoteTitle}
                onChangeText={setNewNoteTitle}
                placeholderTextColor="rgba(0,0,0,0.4)"
              />
              <TextInput
                style={styles.modalContentInput}
                placeholder="Escribe aquí..."
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                multiline
                placeholderTextColor="rgba(0,0,0,0.4)"
              />

              {/* Color Picker for Note */}
              <View style={styles.noteColorPicker}>
                {COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.smallColorCircle, { backgroundColor: c }, newNoteColor === c && styles.selectedSmallColor]}
                    onPress={() => setNewNoteColor(c)}
                  />
                ))}
              </View>

            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // Cover Styles
  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bookCover: {
    width: width * 0.75,
    height: width * 1.1,
    borderRadius: 20,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
    borderLeftWidth: 15,
    borderLeftColor: 'rgba(0,0,0,0.2)', // Spine shadow
  },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  coverContent: {
    alignItems: 'center',
    width: '100%',
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff', // Gold-ish
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 20,
    width: '100%',
  },
  tapToOpen: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 40,
  },
  decorativeLine: {
    position: 'absolute',
    top: 40,
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(255,215,0, 0.5)', // Gold lines
  },
  colorPickerContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  colorPickerTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 15,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
  },
  selectedColor: {
    transform: [{ scale: 1.2 }],
    borderColor: '#333',
  },

  // Inside Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  board: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Cork board color? Or just grey
  },
  boardContent: {
    padding: 15,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  postIt: {
    width: '48%', // 2 columns
    aspectRatio: 1,
    padding: 15,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    transform: [{ rotate: '-1deg' }], // Slight rotation for realism
  },
  pin: {
    position: 'absolute',
    top: -5,
    alignSelf: 'center',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  postItDate: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 5,
    textAlign: 'right',
  },
  postItTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'sans-serif-medium',
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 14,
    color: '#aaa',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noteModal: {
    width: '100%',
    height: '60%',
    borderRadius: 5, // Post-it shape
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'sans-serif-medium',
  },
  modalContentInput: {
    fontSize: 18,
    color: '#333',
    flex: 1,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  noteColorPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  smallColorCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedSmallColor: {
    borderWidth: 2,
    borderColor: '#333',
    transform: [{ scale: 1.2 }],
  },
});
