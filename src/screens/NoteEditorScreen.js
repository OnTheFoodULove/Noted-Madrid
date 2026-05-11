import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { transcribeAudio } from '../config/groq';
import { Colors, Spacing, Radius, Fonts, Shadow, Gradients } from '../theme';

export default function NoteEditorScreen({ navigation, route }) {
  const { note } = route.params;
  const { session } = useAuth();

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const contentInputRef = useRef(null);

  const showAlert = (title, msg, onOk) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${msg}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, msg, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      showAlert('Empty Note', 'Please add a title or some content.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim() || 'Untitled',
        content: content.trim(),
        user_id: session.user.id,
        updated_at: new Date().toISOString(),
      };
      if (note?.id) {
        const { error } = await supabase.from('notes').update(payload).eq('id', note.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('notes').insert(payload);
        if (error) throw error;
      }
      navigation.goBack();
    } catch (error) {
      showAlert('Save Failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      showAlert('Not Supported', 'Voice dictation is not available on web. Please type your note manually.');
      return;
    }
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        showAlert('Permission Denied', 'Microphone access is required.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      showAlert('Recording Error', error.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    setTranscribing(true);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);

      // Detect MIME type from the file extension (Android uses mp4/3gp, iOS uses m4a)
      const ext = uri.split('.').pop()?.toLowerCase() || 'm4a';
      const mimeMap = { m4a: 'audio/m4a', mp4: 'audio/mp4', '3gp': 'audio/3gpp', wav: 'audio/wav', mp3: 'audio/mpeg' };
      const mimeType = mimeMap[ext] || 'audio/m4a';

      const transcribed = await transcribeAudio(uri, mimeType);
      setContent(prev => prev ? `${prev} ${transcribed}` : transcribed);
    } catch (error) {
      showAlert('Transcription Failed', error.message || 'Could not transcribe. Try again.');
    } finally {
      setTranscribing(false);
    }
  };

  const handleGenerateQuiz = () => {
    if (!content.trim()) {
      showAlert('No Content', 'Add some content to your note first before generating a quiz.');
      return;
    }
    navigation.navigate('Quiz', { noteTitle: title || 'Untitled', noteContent: content });
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={Gradients.primary} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{note?.id ? 'Edit Note' : 'New Note'}</Text>
          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={Colors.primary} /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TextInput style={styles.titleInput} placeholder="Note title..." placeholderTextColor={Colors.subtext}
          value={title} onChangeText={setTitle} returnKeyType="next"
          onSubmitEditing={() => contentInputRef.current?.focus()} maxLength={100} />
        <View style={styles.divider} />
        <TextInput ref={contentInputRef} style={styles.contentInput}
          placeholder="Start writing... tap 🎤 to dictate!" placeholderTextColor={Colors.subtext}
          value={content} onChangeText={setContent} multiline textAlignVertical="top" />
        <Text style={styles.wordCount}>{wordCount} word{wordCount !== 1 ? 's' : ''}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.micBtn, isRecording && styles.micBtnActive]}
            onPress={isRecording ? stopRecording : startRecording} disabled={transcribing} activeOpacity={0.8}>
            {transcribing ? <ActivityIndicator color={Colors.primary} /> : (
              <>
                <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
                <Text style={styles.micLabel}>{isRecording ? 'Stop' : 'Dictate'}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.quizBtn} onPress={handleGenerateQuiz} activeOpacity={0.85}>
            <LinearGradient colors={Gradients.primary} style={styles.quizGradient}>
              <Text style={styles.quizIcon}>🧠</Text>
              <Text style={styles.quizLabel}>Generate Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {isRecording && (
          <View style={styles.recordingBanner}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording... tap Stop when done</Text>
          </View>
        )}
        {transcribing && (
          <View style={styles.transcribingBanner}>
            <Text style={styles.transcribingText}>✨ Transcribing your audio...</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingBottom: Spacing.md, paddingHorizontal: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: Colors.white, lineHeight: 24 },
  headerTitle: { fontSize: 18, color: Colors.white, ...Fonts.semiBold },
  saveBtn: { backgroundColor: Colors.white, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minWidth: 60, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.primary, fontSize: 14, ...Fonts.semiBold },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 60 },
  titleInput: { fontSize: 24, color: Colors.text, ...Fonts.bold, paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  contentInput: { fontSize: 16, color: Colors.text, lineHeight: 26, minHeight: 250, paddingBottom: Spacing.md },
  wordCount: { fontSize: 12, color: Colors.subtext, textAlign: 'right', marginBottom: Spacing.lg },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  micBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, paddingVertical: Spacing.md, gap: Spacing.xs, borderWidth: 1.5, borderColor: Colors.border, ...Shadow.card },
  micBtnActive: { backgroundColor: Colors.dangerLight, borderColor: Colors.danger },
  micIcon: { fontSize: 20 },
  micLabel: { fontSize: 14, color: Colors.text, ...Fonts.medium },
  quizBtn: { flex: 2, borderRadius: Radius.md, overflow: 'hidden', ...Shadow.button },
  quizGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.xs },
  quizIcon: { fontSize: 18 },
  quizLabel: { fontSize: 14, color: Colors.white, ...Fonts.semiBold },
  recordingBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerLight, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.danger },
  recordingText: { fontSize: 13, color: Colors.danger, ...Fonts.medium },
  transcribingBanner: { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  transcribingText: { fontSize: 13, color: Colors.primary, ...Fonts.medium },
});
