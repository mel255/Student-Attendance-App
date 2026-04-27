import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* This ensures 'index' (the gateway) loads first */}
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="lecturer/index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}