import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { z } from 'zod';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';

const registerSchema = z
  .object({
    email: z.string().email('올바른 이메일 형식이 아닙니다.'),
    password: z.string().min(6, '비밀번호는 최소 6자 이상입니다.'),
    confirmPassword: z.string().min(6),
    displayName: z.string().min(1, '닉네임을 입력해 주세요.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { user, signUp } = useAuth();
  const { top, bottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [form, setForm] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [fieldLayouts, setFieldLayouts] = useState<
    Partial<Record<keyof RegisterForm, { y: number; height: number }>>
  >({});

  useEffect(() => {
    setErrors({});
  }, [form.email, form.password, form.confirmPassword, form.displayName]);

  const isValid = useMemo(() => registerSchema.safeParse(form).success, [form]);

  const registerFieldLayout = useCallback(
    (field: keyof RegisterForm) => (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      setFieldLayouts((prev) => ({ ...prev, [field]: { y, height } }));
    },
    [],
  );

  const focusField = useCallback(
    (field: keyof RegisterForm) => {
      const layout = fieldLayouts[field];
      if (!layout) {
        return;
      }
      const targetCenter = windowHeight / 4;
      const centeredOffset = Math.max(0, layout.y - (targetCenter - layout.height / 2));
      scrollRef.current?.scrollTo({ y: centeredOffset, animated: true });
    },
    [fieldLayouts, windowHeight],
  );

  const handleChange = (key: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const result = registerSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
        displayName: fieldErrors.displayName?.[0],
      });
      return;
    }

    setSubmitting(true);

    try {
      await signUp({
        email: result.data.email,
        password: result.data.password,
        displayName: result.data.displayName,
      });
      router.replace('/');
    } catch (error) {
      console.error(error);
      Alert.alert('회원가입 실패', '이미 가입된 이메일인지 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom: bottom }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 + top : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 16 }]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={[styles.card, styles.cardRaised]}>
          <Text style={styles.title}>커뮤니티에 오신 걸 환영해요 👋</Text>
          <Text style={styles.subtitle}>아래 정보를 입력하고 커뮤니티 활동을 시작하세요.</Text>

          <View style={styles.field} onLayout={registerFieldLayout('email')}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="email@example.com"
              style={[styles.input, errors.email && styles.inputError]}
              value={form.email}
              onChangeText={(value) => handleChange('email', value)}
              onFocus={() => focusField('email')}
              textContentType="emailAddress"
              inputMode="email"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.field} onLayout={registerFieldLayout('displayName')}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              placeholder="사용하실 닉네임을 입력하세요"
              style={[styles.input, errors.displayName && styles.inputError]}
              value={form.displayName}
              onChangeText={(value) => handleChange('displayName', value)}
              onFocus={() => focusField('displayName')}
              textContentType="nickname"
            />
            {errors.displayName ? <Text style={styles.errorText}>{errors.displayName}</Text> : null}
          </View>

          <View style={styles.field} onLayout={registerFieldLayout('password')}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              secureTextEntry
              placeholder="비밀번호를 입력하세요"
              style={[styles.input, errors.password && styles.inputError]}
              value={form.password}
              onChangeText={(value) => handleChange('password', value)}
              onFocus={() => focusField('password')}
              textContentType="newPassword"
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <View style={styles.field} onLayout={registerFieldLayout('confirmPassword')}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              secureTextEntry
              placeholder="비밀번호를 다시 입력하세요"
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              value={form.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              onFocus={() => focusField('confirmPassword')}
              textContentType="newPassword"
            />
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </View>

          <Pressable
            style={[styles.submitButton, (!isValid || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || submitting}
          >
            <Text style={styles.submitButtonText}>{submitting ? '가입 중...' : '회원가입'}</Text>
          </Pressable>

          <View style={styles.bottomRow}>
            <Text style={styles.footerText}>이미 계정이 있나요?</Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={styles.linkText}>로그인</Text>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    gap: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cardRaised: {
    marginTop: -12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: '#475569',
    fontSize: 14,
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
});

