import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { z } from 'zod';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상입니다.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const { top, bottom } = useSafeAreaInsets();
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setErrors({});
  }, [form.email, form.password]);

  const isValid = useMemo(() => loginSchema.safeParse(form).success, [form]);

  const handleChange = (key: keyof LoginForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const result = loginSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setSubmitting(true);

    try {
      await signIn(result.data.email, result.data.password);
      router.replace('/');
    } catch (error) {
      console.error(error);
      Alert.alert('로그인 실패', '이메일과 비밀번호를 다시 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: top, paddingBottom: bottom }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.card, styles.cardRaised]}>
        <Text style={styles.title}>만나서 반가워요!</Text>
        <Text style={styles.subtitle}>가입한 계정으로 로그인해 주세요.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="email@example.com"
            style={[styles.input, errors.email && styles.inputError]}
            value={form.email}
            onChangeText={(value) => handleChange('email', value)}
            textContentType="emailAddress"
            inputMode="email"
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            secureTextEntry
            placeholder="비밀번호를 입력하세요"
            style={[styles.input, errors.password && styles.inputError]}
            value={form.password}
            onChangeText={(value) => handleChange('password', value)}
            textContentType="password"
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        <Pressable
          style={[styles.submitButton, (!isValid || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? '로그인 중...' : '로그인'}</Text>
        </Pressable>

        <View style={styles.bottomRow}>
          <Text style={styles.footerText}>아직 계정이 없나요?</Text>
          <Pressable onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>회원가입</Text>
          </Pressable>
        </View>
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#f8fafc',
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
    marginTop: -20,
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

