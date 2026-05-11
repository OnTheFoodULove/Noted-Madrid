import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, Radius, Fonts, Shadow, Gradients } from '../theme';
import NoteCard from '../components/NoteCard';

export default function NotesListScreen({ navigation }) {
  const { session, signOut } = useAuth();
  const [notes, setNotes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setNotes(data || []);
      setFiltered(data || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load notes: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    // Subscribe to real-time changes
    const channel = supabase
      .channel('notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, fetchNotes)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchNotes]);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(notes);
    } else {
      const q = search.toLowerCase();
      setFiltered(notes.filter(n =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      ));
    }
  }, [search, notes]);

  const handleDelete = async (id) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this note?');
      if (confirmed) {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) window.alert('Error: ' + error.message);
        else fetchNotes();
      }
      return;
    }

    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('notes').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchNotes();
        },
      },
    ]);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) signOut();
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const userEmail = session?.user?.email || '';
  const greeting = `Hey, ${userEmail.split('@')[0]} 👋`;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={Gradients.primary} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.noteCount}>
              {notes.length === 0 ? 'No notes yet' : `${notes.length} note${notes.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Notes List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotes(); }}
            colors={[Colors.primary]} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'No results found' : 'No notes yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Try a different search' : 'Tap the + button to create your first note'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <NoteCard
            note={item}
            index={index}
            onPress={() => navigation.navigate('NoteEditor', { note: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NoteEditor', { note: null })}
        activeOpacity={0.85}
      >
        <LinearGradient colors={Gradients.primary} style={styles.fabGradient}>
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },

  header: {
    paddingTop: 60, paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  greeting: { fontSize: 22, color: Colors.white, ...Fonts.bold },
  noteCount: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  logoutIcon: { fontSize: 18 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 46,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: 15, color: Colors.white },
  clearIcon: { fontSize: 14, color: 'rgba(255,255,255,0.7)', paddingLeft: Spacing.sm },

  list: { padding: Spacing.md, paddingBottom: 100 },

  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyEmoji: { fontSize: 60, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 20, color: Colors.text, ...Fonts.semiBold, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: 14, color: Colors.subtext, textAlign: 'center', paddingHorizontal: Spacing.lg },

  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 60, height: 60, borderRadius: 30,
    overflow: 'hidden', ...Shadow.button,
  },
  fabGradient: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  fabIcon: { fontSize: 32, color: Colors.white, lineHeight: 36 },
});
