import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStore, UserData } from '../../store/userStore';
import { getEmergencyProfile } from '../../config/api';

interface Props {
  alertId:   string | null;
  latitude:  number;
  longitude: number;
  onDismiss: () => void;
}

interface Profile {
  fullName:     string;
  bloodType:    string;
  medicalNote:  string;
  primaryContact?: { fullName: string; relationship: string; phone: string; email?: string };
}

export default function AlertSentScreen({ alertId, latitude, longitude, onDismiss }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user,    setUser]    = useState<UserData | null>(null);

  // Fade in animation
  const opacity = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Vibration.vibrate([300, 100, 300, 100, 300]);
    Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    const load = async () => {
      const u = await UserStore.getUser();
      setUser(u);
      if (u) {
        try {
          const res = await getEmergencyProfile(u.id);
          setProfile(res.data.data);
        } catch {
          setProfile({
            fullName:    u.fullName,
            bloodType:   u.bloodType  ?? 'Chưa cập nhật',
            medicalNote: u.medicalNote ?? 'Không có',
          });
        }
      }
    };
    load();
    return () => Vibration.cancel();
  }, []);

  const relLabel = (r?: string) => {
    const map: Record<string, string> = {
      Father: 'Cha', Mother: 'Mẹ', Brother: 'Anh/Em trai',
      Sister: 'Chị/Em gái', Spouse: 'Vợ/Chồng', Friend: 'Bạn bè',
    };
    return r ? (map[r] ?? r) : '';
  };

  const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

  return (
    <View style={s.container}>
      {/* Background grid */}
      <View style={s.grid} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={s.gridRow} />
        ))}
      </View>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerLabel}>Cảnh báo khẩn cấp</Text>
      </View>

      <Animated.View style={[{ flex: 1 }, { opacity }]}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Status */}
          <View style={s.statusWrap}>
            <View style={s.statusIcon}>
              <Ionicons name="alert-circle" size={36} color="#e53e3e" />
            </View>
            <Text style={s.statusTitle}>Không nhận được phản hồi</Text>
            <Text style={s.statusSub}>Đang chuẩn bị gửi cảnh báo</Text>

            {/* Sending indicator */}
            <View style={s.sendingRow}>
              <Ionicons name="mail" size={14} color="#38a169" />
              <Text style={s.sendingText}>Email đã được gửi đến người thân</Text>
            </View>
          </View>

          {/* Location */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="location" size={18} color="#3182ce" />
              <Text style={s.cardTitle}>Vị trí của bạn</Text>
            </View>
            <Text style={s.coordText}>{latitude.toFixed(6)}, {longitude.toFixed(6)}</Text>
            <Text style={s.mapUrl} numberOfLines={1}>{mapUrl}</Text>
          </View>

          {/* Primary contact */}
          {profile?.primaryContact && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="call" size={18} color="#38a169" />
                <Text style={s.cardTitle}>Thông tin liên hệ</Text>
              </View>
              <Text style={s.contactRel}>{relLabel(profile.primaryContact.relationship)}</Text>
              <Text style={s.contactName}>{profile.primaryContact.fullName}</Text>
              <Text style={s.contactPhone}>Sđt: {profile.primaryContact.phone}</Text>
              {profile.primaryContact.email && (
                <Text style={s.contactEmail}>{profile.primaryContact.email}</Text>
              )}
            </View>
          )}

          {/* Medical info */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="medkit" size={18} color="#e53e3e" />
              <Text style={s.cardTitle}>Hồ sơ y tế</Text>
            </View>
            <View style={s.medRow}>
              <Text style={s.medLabel}>Nhóm máu:</Text>
              <Text style={s.medValue}>{profile?.bloodType || user?.bloodType || 'Chưa cập nhật'}</Text>
            </View>
            <View style={s.medRow}>
              <Text style={s.medLabel}>Bệnh nền:</Text>
              <Text style={s.medValue}>{profile?.medicalNote || user?.medicalNote || 'Không có'}</Text>
            </View>
          </View>

          {/* Alert ID */}
          {alertId && (
            <Text style={s.alertId}>Mã cảnh báo: {alertId}</Text>
          )}

          {/* Dismiss button */}
          <TouchableOpacity style={s.dismissBtn} onPress={onDismiss}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={s.dismissBtnText}>Tôi đã được trợ giúp</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c10' },
  grid: { ...StyleSheet.absoluteFillObject, opacity: 0.12 },
  gridRow: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#3a1a1a' },
  header: {
    paddingTop: 56, paddingHorizontal: 20, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#2a1a1a', paddingBottom: 12,
  },
  headerLabel: { fontSize: 12, color: '#904a4a', letterSpacing: 2, textTransform: 'uppercase' },
  scroll: { padding: 20, paddingBottom: 40 },
  statusWrap: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  statusIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#e53e3e22', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, borderWidth: 2, borderColor: '#e53e3e44',
  },
  statusTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  statusSub:   { fontSize: 14, color: '#a07070', marginTop: 6, marginBottom: 14 },
  sendingRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f2a1f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  sendingText: { fontSize: 13, color: '#38a169' },
  card: {
    backgroundColor: '#111820', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#1a2a3a',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle:  { fontSize: 14, fontWeight: '600', color: '#c0d0e0' },
  coordText:  { fontSize: 15, color: '#fff', fontWeight: '500' },
  mapUrl:     { fontSize: 12, color: '#4a8ab0', marginTop: 4 },
  contactRel:  { fontSize: 12, color: '#6080a0', marginBottom: 2 },
  contactName: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  contactPhone: { fontSize: 15, color: '#90c0a0' },
  contactEmail: { fontSize: 13, color: '#6080a0', marginTop: 2 },
  medRow:   { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  medLabel: { fontSize: 13, color: '#7090a0', width: 80 },
  medValue: { flex: 1, fontSize: 13, color: '#c0d0e0', fontWeight: '500' },
  alertId:  { fontSize: 11, color: '#405060', textAlign: 'center', marginBottom: 16 },
  dismissBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#276749', borderRadius: 14, paddingVertical: 16,
    borderWidth: 1, borderColor: '#38a169',
  },
  dismissBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
