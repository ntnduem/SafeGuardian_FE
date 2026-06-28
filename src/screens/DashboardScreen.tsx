import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Radius } from '../config/theme';
import { UserStore } from '../store/userStore';
import { useEmergency } from '../context/EmergencyContext';
import { useLocation } from '../hooks/useLocation';
import { useAccelerometer } from '../hooks/useAccelerometer';
import { sendSosAlert } from '../config/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const nav             = useNavigation<Nav>();
  const { triggerAccident } = useEmergency();
  const { location }    = useLocation();
  const { acceleration } = useAccelerometer();
  const [userName, setUserName] = useState('');
  const [userId, setUserId]     = useState('');
  const [sosLoading, setSosLoading] = useState(false);

  // Pulse animation for SOS button
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    UserStore.getUser().then(u => {
      if (u) { setUserName(u.fullName.split(' ').pop() ?? u.fullName); setUserId(u.id); }
    });
  }, []);

  // Accelerometer auto-trigger
  useEffect(() => {
    if (acceleration > 25) {
      triggerAccident(acceleration);
    }
  }, [acceleration]);

  const handleSOS = async () => {
    if (!userId) return;
    setSosLoading(true);
    try {
      const lat = location?.coords.latitude  ?? 10.762622;
      const lng = location?.coords.longitude ?? 106.660172;
      await sendSosAlert(userId, lat, lng);
      Alert.alert('✅ SOS đã gửi', 'Đã thông báo đến người thân của bạn.');
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi SOS. Kiểm tra kết nối mạng.');
    } finally {
      setSosLoading(false);
    }
  };

  const handleSimulate = () => {
    Alert.alert(
      'Giả lập tai nạn',
      'Hệ thống sẽ đếm ngược 30 giây. Nếu không bấm "Tôi ổn!", cảnh báo sẽ được gửi đến người thân.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Bắt đầu', style: 'destructive', onPress: () => triggerAccident(0) },
      ]
    );
  };

  const locText = location
    ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
    : 'Đang xác định vị trí...';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={s.topBar}>
          <View>
            <Text style={s.greeting}>Xin chào,</Text>
            <Text style={s.name}>{userName || '...'}</Text>
          </View>
          <TouchableOpacity style={s.mapBtn} onPress={() => nav.navigate('Map')}>
            <Ionicons name="map-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Quick action cards */}
        <View style={s.cards}>
          <QuickCard icon="location" label="GPS" value={locText} color="#3182ce" />
          <QuickCard icon="people"   label="Người liên hệ" value="Xem danh sách" color="#38a169"
            onPress={() => {}} />
          <QuickCard icon="medkit"   label="Hồ sơ y tế"    value="Thông tin y tế" color="#d69e2e"
            onPress={() => {}} />
        </View>

        {/* Accelerometer indicator */}
        <View style={s.accelCard}>
          <Ionicons name="pulse-outline" size={18} color={Colors.textSecondary} />
          <Text style={s.accelText}>
            Cảm biến: {acceleration.toFixed(1)} m/s²
          </Text>
          <View style={[s.accelDot, { backgroundColor: acceleration > 25 ? Colors.primary : Colors.success }]} />
        </View>

        {/* SOS Button */}
        <View style={s.sosWrap}>
          <Text style={s.sosLabel}>WE ARE ALWAYS HERE IN CASE OF EMERGENCIES!</Text>
          <Text style={s.sosHint}>Tap to initiate emergency protocol!</Text>

          <TouchableOpacity onPress={handleSOS} disabled={sosLoading} activeOpacity={0.85}>
            <Animated.View style={[s.sosOuter, { transform: [{ scale: pulse }] }]}>
              <View style={s.sosInner}>
                <Ionicons name="radio-button-on" size={36} color="#fff" />
              </View>
            </Animated.View>
          </TouchableOpacity>

          <Text style={s.sosText}>SOS</Text>
        </View>

        {/* Simulate button */}
        <TouchableOpacity style={s.simBtn} onPress={handleSimulate}>
          <Ionicons name="warning-outline" size={18} color={Colors.primary} />
          <Text style={s.simBtnText}>Giả lập tai nạn (Demo)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickCard({ icon, label, value, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: string; color: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={s.quickCard} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[s.quickIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.quickLabel}>{label}</Text>
        <Text style={s.quickValue} numberOfLines={1}>{value}</Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  name:     { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  mapBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  cards: { gap: 10, marginBottom: 16 },
  quickCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: 14, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  quickIcon:  { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 12, color: Colors.textSecondary },
  quickValue: { fontSize: 13, color: Colors.text, fontWeight: '500', marginTop: 2 },
  accelCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radius.sm,
    padding: 10, marginBottom: 24, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  accelText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  accelDot:  { width: 8, height: 8, borderRadius: 4 },
  sosWrap:   { alignItems: 'center', marginBottom: 24 },
  sosLabel:  { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', letterSpacing: 0.5 },
  sosHint:   { fontSize: 12, color: Colors.textMuted, marginBottom: 28, marginTop: 4 },
  sosOuter: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.primaryDark + '33',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.primary + '55',
  },
  sosInner: {
    width: 128, height: 128, borderRadius: 64,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.6,
    shadowRadius: 20, elevation: 10,
  },
  sosText: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginTop: 16 },
  simBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.primary + '55',
    borderRadius: Radius.md, paddingVertical: 12,
    backgroundColor: Colors.primary + '11',
  },
  simBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
