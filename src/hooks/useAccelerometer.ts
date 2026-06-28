import { useEffect, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

const THRESHOLD = 25.0; // m/s² — khớp với backend default threshold

export function useAccelerometer() {
  const [acceleration, setAcceleration] = useState(0);
  const [exceeded,     setExceeded]     = useState(false);

  useEffect(() => {
    Accelerometer.setUpdateInterval(200); // 5 lần/giây

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      // Tính magnitude của vector gia tốc (loại bỏ trọng lực ~9.8)
      const magnitude = Math.sqrt(x * x + y * y + z * z) * 9.81;
      setAcceleration(magnitude);

      if (magnitude > THRESHOLD) {
        setExceeded(true);
        // Reset sau 2 giây để tránh trigger liên tục
        setTimeout(() => setExceeded(false), 2000);
      }
    });

    return () => sub.remove();
  }, []);

  return { acceleration, exceeded, threshold: THRESHOLD };
}
