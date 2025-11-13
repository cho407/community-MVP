import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarStyle = useMemo(() => {
    const base = {
      height: 34 + insets.bottom,
      paddingBottom: Math.max(insets.bottom, 4),
      paddingTop: 2,
      backgroundColor: '#ffffff',
      borderTopWidth: 0,
      shadowColor: '#0f172a',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 16,
    };
    if (Platform.OS === 'ios') {
      return {
        ...base,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
      };
    }
    if (Platform.OS === 'android') {
      return { ...base, height: 40 + insets.bottom };
    }
    return base;
  }, [insets.bottom]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '게시판',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '내 정보',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});

