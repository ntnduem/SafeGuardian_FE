import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../config/theme';
import { UserStore } from '../store/userStore';
import { getContacts, createContact, deleteContact } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';

interface Contact {
  id: string; fullName: string; relationship: string;
  phone: string; email?: string; isPrimary?: boolean; priority?: number;
}

const RELATIONSHIPS = ['Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Friend', 'Other'];

export default function ContactsScreen() {
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail]       = useState<Contact | null>(null);
  const [userId, setUserId]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({
    fullName: '', relationship: 'Father', phone: '', email: '', isPrimary: false,
  });

  const set = (k: keyof typeof form) => (v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const load = useCallback(async () => {
    const uid = await UserStore.getUserId();
    if (!uid) return;
    setUserId(uid);
    setLoading(true);
    try {
      const res = await getContacts(uid);
      setContacts(res.data.data ?? []);
    } catch { setContacts([]); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAdd = async () => {
    if (!form.fullName.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập họ tên.');
    if (!form.phone.trim())    return Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
    setSaving(true);
    try {
      await createContact(userId, {
        fullName:     form.fullName.trim(),
        relationship: form.relationship,
        phone:        form.phone.trim(),
        email:        form.email.trim() || undefined,
        isPrimary:    form.isPrimary,
        priority:     form.isPrimary ? 1 : contacts.length + 1,
      });
      setShowModal(false);
      setForm({ fullName: '', relationship: 'Father', phone: '', email: '', isPrimary: false });
      load();
    } catch { Alert.alert('Lỗi', 'Không thể thêm người liên hệ.'); }
    finally { setSaving(false); }
  };

  const handleDelete = (c: Contact) => {
    Alert.alert('Xóa liên hệ', `Xóa "${c.fullName}" khỏi danh sách?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        await deleteContact(c.id); load();
      }},
    ]);
  };

  const relLabel = (r: string) => {
    const map: Record<string, string> = {
      Father: 'Cha', Mother: 'Mẹ', Brother: 'Anh/Em trai',
      Sister: 'Chị/Em gái', Spouse: 'Vợ/Chồng', Friend: 'Bạn bè', Other: 'Khác',
    };
    return map[r] ?? r;
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Người liên hệ</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : contacts.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
          <Text style={s.emptyText}>Chưa có người liên hệ</Text>
          <Text style={s.emptyHint}>Thêm người thân để nhận cảnh báo khi có sự cố</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => setDetail(item)} activeOpacity={0.8}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{item.fullName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.nameRow}>
                  <Text style={s.name}>{item.fullName}</Text>
                  {item.isPrimary && (
                    <View style={s.primaryBadge}>
                      <Text style={s.primaryBadgeText}>Chính</Text>
                    </View>
                  )}
                </View>
                <Text style={s.rel}>{relLabel(item.relationship)}</Text>
                <Text style={s.phone}>{item.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Contact Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Thêm người liên hệ</Text>

            <MField label="Họ và tên *" value={form.fullName} onChangeText={set('fullName')} />
            <MField label="Số điện thoại *" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            <MField label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" />

            <Text style={s.fieldLabel}>Quan hệ</Text>
            <View style={s.relRow}>
              {RELATIONSHIPS.map(r => (
                <TouchableOpacity key={r}
                  style={[s.relBtn, form.relationship === r && s.relBtnActive]}
                  onPress={() => set('relationship')(r)}
                >
                  <Text style={[s.relBtnText, form.relationship === r && s.relBtnTextActive]}>
                    {relLabel(r)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.primaryToggle} onPress={() => set('isPrimary')(!form.isPrimary)}>
              <Ionicons name={form.isPrimary ? 'checkbox' : 'square-outline'} size={20} color={Colors.primary} />
              <Text style={s.primaryToggleText}>Đặt làm người liên hệ chính</Text>
            </TouchableOpacity>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveBtnText}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail bottom sheet */}
      <Modal visible={!!detail} animationType="slide" transparent>
        <TouchableOpacity style={s.modalOverlay} onPress={() => setDetail(null)} activeOpacity={1}>
          <View style={s.detailSheet}>
            <View style={s.modalHandle} />
            <View style={s.detailAvatar}>
              <Text style={s.detailAvatarText}>{detail?.fullName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={s.detailName}>{detail?.fullName}</Text>
            <Text style={s.detailRel}>{relLabel(detail?.relationship ?? '')}</Text>
            <View style={s.detailRow}>
              <Ionicons name="call" size={16} color={Colors.success} />
              <Text style={s.detailRowText}>{detail?.phone}</Text>
            </View>
            {detail?.email && (
              <View style={s.detailRow}>
                <Ionicons name="mail" size={16} color={Colors.textSecondary} />
                <Text style={s.detailRowText}>{detail.email}</Text>
              </View>
            )}
            {detail?.isPrimary && (
              <View style={s.detailPrimary}>
                <Ionicons name="star" size={14} color="#d69e2e" />
                <Text style={s.detailPrimaryText}>Người liên hệ chính</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function MField({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor={Colors.textMuted} {...props} />
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  title:  { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  addBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  emptyHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: 14, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary + '33', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name:       { fontSize: 15, fontWeight: '600', color: Colors.text },
  primaryBadge: { backgroundColor: Colors.success + '33', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  primaryBadgeText: { fontSize: 10, color: Colors.success, fontWeight: '600' },
  rel:   { fontSize: 12, color: Colors.textSecondary },
  phone: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 16 },
  fieldLabel:  { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.inputBorder,
    color: Colors.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
  },
  relRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  relBtn:        { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.inputBorder, backgroundColor: Colors.inputBg },
  relBtnActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  relBtnText:    { color: Colors.textSecondary, fontSize: 12 },
  relBtnTextActive: { color: '#fff' },
  primaryToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  primaryToggleText: { color: Colors.textSecondary, fontSize: 14 },
  modalBtns:  { flexDirection: 'row', gap: 12 },
  cancelBtn:  { flex: 1, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 15 },
  saveBtn:    { flex: 2, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  // Detail sheet
  detailSheet: {
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, alignItems: 'center',
  },
  detailAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary + '33', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  detailAvatarText: { fontSize: 28, fontWeight: 'bold', color: Colors.primary },
  detailName: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  detailRel:  { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  detailRowText: { fontSize: 15, color: Colors.text },
  detailPrimary: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#d69e2e22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  detailPrimaryText: { color: '#d69e2e', fontSize: 13, fontWeight: '600' },
});
