import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { generateQuiz } from '../config/groq';
import { Colors, Spacing, Radius, Fonts, Shadow, Gradients } from '../theme';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function showAlert(title, msg, onOk) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${msg}`);
    if (onOk) onOk();
  } else {
    Alert.alert(title, msg, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
  }
}

export default function QuizScreen({ navigation, route }) {
  const { noteTitle, noteContent } = route.params;

  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    setLoading(true);
    setSelected({});
    setSubmitted(false);
    setError(null);
    try {
      const quiz = await generateQuiz(noteTitle, noteContent);
      setQuestions(quiz);
    } catch (err) {
      const msg = err.message || 'Could not generate quiz. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qIndex, optIndex) => {
    if (submitted) return;
    setSelected(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = () => {
    if (Object.keys(selected).length < questions.length) {
      showAlert('Not Done', 'Please answer all questions before submitting.');
      return;
    }
    let correct = 0;
    questions.forEach((q, i) => {
      if (selected[i] === q.correctIndex) correct++;
    });
    setScore(correct);
    setSubmitted(true);
  };

  const getOptionStyle = (qIndex, optIndex, correctIndex) => {
    if (!submitted) {
      return selected[qIndex] === optIndex ? styles.optionSelected : styles.option;
    }
    if (optIndex === correctIndex) return styles.optionCorrect;
    if (selected[qIndex] === optIndex && optIndex !== correctIndex) return styles.optionWrong;
    return styles.option;
  };

  const getOptionTextStyle = (qIndex, optIndex, correctIndex) => {
    if (!submitted && selected[qIndex] === optIndex) return styles.optionTextSelected;
    if (submitted && optIndex === correctIndex) return styles.optionTextCorrect;
    if (submitted && selected[qIndex] === optIndex && optIndex !== correctIndex) return styles.optionTextWrong;
    return styles.optionText;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <LinearGradient colors={Gradients.background} style={StyleSheet.absoluteFill} />
        <Text style={styles.loadingEmoji}>🧠</Text>
        <Text style={styles.loadingText}>Generating your quiz...</Text>
        <Text style={styles.loadingSubtext}>Analyzing: "{noteTitle}"</Text>
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: Spacing.md }} />
      </View>
    );
  }

  // Error state — shown inline so the user can retry or go back
  if (error) {
    return (
      <View style={styles.centered}>
        <LinearGradient colors={Gradients.background} style={StyleSheet.absoluteFill} />
        <Text style={styles.loadingEmoji}>⚠️</Text>
        <Text style={styles.loadingText}>Quiz Generation Failed</Text>
        <Text style={[styles.loadingSubtext, { textAlign: 'center', marginBottom: Spacing.lg }]}>{error}</Text>
        <TouchableOpacity style={styles.retryBtnFull} onPress={loadQuiz}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.retryBtnFull, { marginTop: Spacing.sm, backgroundColor: Colors.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.retryBtnText, { color: Colors.text }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.primary} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Quiz</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{noteTitle}</Text>
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={loadQuiz}>
            <Text style={styles.retryIcon}>🔄</Text>
          </TouchableOpacity>
        </View>

        {submitted && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>
              {score}/{questions.length} correct — {Math.round((score / questions.length) * 100)}%
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {questions.map((q, qIndex) => (
          <View key={qIndex} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>{qIndex + 1}</Text>
              </View>
              <Text style={styles.questionText}>{q.question}</Text>
            </View>
            {q.options.map((opt, optIndex) => (
              <TouchableOpacity
                key={optIndex}
                style={getOptionStyle(qIndex, optIndex, q.correctIndex)}
                onPress={() => handleSelect(qIndex, optIndex)}
                activeOpacity={0.75}
              >
                <View style={styles.optionLabelBox}>
                  <Text style={styles.optionLabel}>{OPTION_LABELS[optIndex]}</Text>
                </View>
                <Text style={getOptionTextStyle(qIndex, optIndex, q.correctIndex)}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {!submitted ? (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <LinearGradient colors={Gradients.primary} style={styles.submitGradient}>
              <Text style={styles.submitText}>Submit Answers</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>
              {score === questions.length ? '🏆' : score >= questions.length / 2 ? '👍' : '📖'}
            </Text>
            <Text style={styles.resultTitle}>
              {score === questions.length ? 'Perfect Score!' : score >= questions.length / 2 ? 'Good Job!' : 'Keep Studying!'}
            </Text>
            <Text style={styles.resultSub}>You got {score} out of {questions.length} correct</Text>
            <TouchableOpacity style={styles.retryBtnFull} onPress={loadQuiz} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>Try Again with New Questions</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  loadingEmoji: { fontSize: 60, marginBottom: Spacing.md },
  loadingText: { fontSize: 20, color: Colors.text, ...Fonts.bold, marginBottom: Spacing.sm },
  loadingSubtext: { fontSize: 14, color: Colors.subtext },

  header: { paddingTop: 60, paddingBottom: Spacing.md, paddingHorizontal: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: Colors.white, lineHeight: 24 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, color: Colors.white, ...Fonts.semiBold },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  retryBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  retryIcon: { fontSize: 18 },
  scoreBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center' },
  scoreText: { color: Colors.white, ...Fonts.semiBold, fontSize: 15 },

  scroll: { padding: Spacing.md, paddingBottom: 60 },

  questionCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.card },
  questionHeader: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm },
  questionBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  questionBadgeText: { fontSize: 13, color: Colors.primary, ...Fonts.bold },
  questionText: { flex: 1, fontSize: 15, color: Colors.text, ...Fonts.semiBold, lineHeight: 22 },

  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, marginBottom: Spacing.xs, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  optionSelected: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, marginBottom: Spacing.xs, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionCorrect: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, marginBottom: Spacing.xs, borderWidth: 1.5, borderColor: Colors.success, backgroundColor: Colors.successLight },
  optionWrong: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, marginBottom: Spacing.xs, borderWidth: 1.5, borderColor: Colors.danger, backgroundColor: Colors.dangerLight },

  optionLabelBox: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontSize: 12, color: Colors.text, ...Fonts.bold },
  optionText: { flex: 1, fontSize: 14, color: Colors.text },
  optionTextSelected: { flex: 1, fontSize: 14, color: Colors.primary, ...Fonts.medium },
  optionTextCorrect: { flex: 1, fontSize: 14, color: Colors.success, ...Fonts.medium },
  optionTextWrong: { flex: 1, fontSize: 14, color: Colors.danger, ...Fonts.medium },

  submitBtn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.sm, ...Shadow.button },
  submitGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: Colors.white, fontSize: 16, ...Fonts.semiBold },

  resultCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', ...Shadow.card },
  resultEmoji: { fontSize: 60, marginBottom: Spacing.md },
  resultTitle: { fontSize: 22, color: Colors.text, ...Fonts.bold, marginBottom: Spacing.sm },
  resultSub: { fontSize: 14, color: Colors.subtext, marginBottom: Spacing.lg },
  retryBtnFull: { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  retryBtnText: { color: Colors.primary, fontSize: 14, ...Fonts.semiBold },
});
