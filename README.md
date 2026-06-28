# SafeGuardian App

Ứng dụng Android hỗ trợ an toàn cá nhân và cảnh báo tai nạn giao thông.

Stack: **React Native** (Expo) · **TypeScript** · kết nối **SafeGuardian Backend**

---

## Cài đặt

```bash
cd safeguardian-app
npm install
```

## Cấu hình

### 1. Backend URL

Mở `src/config/api.ts` và đổi `BASE_URL`:

```ts
// Android Emulator  → http://10.0.2.2:8080
// Điện thoại thật   → http://192.168.x.x:8080  (IP máy tính trong cùng mạng WiFi)
export const BASE_URL = 'http://10.0.2.2:8080';
```

### 2. Google Maps API Key

Mở `app.json` và thay `YOUR_GOOGLE_MAPS_API_KEY`:

```json
"config": {
  "googleMaps": {
    "apiKey": "AIza..."
  }
}
```

Lấy key tại: [Google Cloud Console](https://console.cloud.google.com/) → Maps SDK for Android

## Chạy ứng dụng

```bash
# Start Expo
npx expo start

# Chạy trên Android Emulator
npx expo start --android

# Chạy trên điện thoại thật (cần Expo Go app)
npx expo start → quét QR code
```

---

## Cấu trúc màn hình

```
App
├── OnboardingScreen     ← Lần đầu mở app: nhập thông tin
└── Main (Bottom Tabs)
    ├── DashboardScreen  ← Trang chủ, nút SOS, giả lập tai nạn
    │   └── MapScreen    ← Bản đồ full screen (nút map góc phải)
    ├── ContactsScreen   ← Danh sách người liên hệ khẩn cấp
    ├── MedicalScreen    ← Hồ sơ y tế (nhóm máu, bệnh lý)
    └── ProfileScreen    ← Thông tin cá nhân

[Emergency Overlays - hiển thị khi có sự cố]
├── CountdownScreen      ← Đếm ngược 30s, nút "Tôi ổn!"
└── AlertSentScreen      ← Đã gửi cảnh báo, hiển thị thông tin liên hệ + y tế
```

---

## Luồng hoạt động

```
Lắc mạnh điện thoại (acceleration > 25 m/s²)
  hoặc bấm "Giả lập tai nạn"
        ↓
CountdownScreen (30 giây)
        ↓
  [Bấm "Tôi ổn!"] → Hủy, quay về bình thường
        ↓
  [Hết giờ] → Gọi API /emergency-alerts/simulation
        ↓
AlertSentScreen (hiển thị thông tin liên hệ + y tế)
        ↓
  [Bấm "Tôi đã được trợ giúp"] → Quay về bình thường
```

---

## Kết nối Backend

Tất cả API calls đều qua `src/config/api.ts`.
Không cần token — app tự tạo `userId` và lưu vào `AsyncStorage`.
