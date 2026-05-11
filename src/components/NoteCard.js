import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Fonts, Shadow } from '../theme';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getSnippet(content) {
  if (!content) return 'No content';
  const clean = content.replace(/\n/g, ' ').trim();
  return clean.length > 100 ? clean.substring(0, 100) + '...' : clean;
}

// Cycle through retro pastel card accent colors
const ACCENT_COLORS = [
  { bg: '#FCECE8', dot: '#E07A5F' }, // Coral
  { bg: '#E8F2EC', dot: '#81B29A' }, // Sage
  { bg: '#FDF0D5', dot: '#F2CC8F' }, // Mustard
  { bg: '#E0E1E9', dot: '#3D405B' }, // Navy Slate
  { bg: '#FDECEE', dot: '#E63946' }, // Retro Red
];

export default function NoteCard({ note, onPress, onDelete, index = 0 }) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.accentBar, { backgroundColor: accent.dot }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>{note.title || 'Untitled'}</Text>
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={(e) => {
              if (e && e.stopPropagation) e.stopPropagation();
              onDelete();
            }} 
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.snippet} numberOfLines={2}>{getSnippet(note.content)}</Text>
        <View style={styles.footer}>
          <View style={[styles.dateBadge, { backgroundColor: accent.bg }]}>
            <View style={[styles.dateDot, { backgroundColor: accent.dot }]} />
            <Text style={[styles.date, { color: accent.dot }]}>{formatDate(note.updated_at)}</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    marginBottom: Spacing.md, flexDirection: 'row',
    overflow: 'hidden', ...Shadow.card,
  },
  accentBar: { width: 4, borderRadius: 2 },
  content: { flex: 1, padding: Spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  title: { flex: 1, fontSize: 16, color: Colors.text, ...Fonts.semiBold, marginRight: Spacing.sm },
  deleteBtn: { padding: Spacing.xs, zIndex: 10, elevation: 10 },
  deleteIcon: { fontSize: 18, color: Colors.subtext },
  snippet: { fontSize: 13, color: Colors.subtext, lineHeight: 20, marginBottom: Spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, gap: 4 },
  dateDot: { width: 6, height: 6, borderRadius: 3 },
  date: { fontSize: 11, ...Fonts.medium },
  arrow: { fontSize: 14, color: Colors.subtext },
});
