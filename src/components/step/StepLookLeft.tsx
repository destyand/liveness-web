// components/Liveness/StepLookLeft.tsx
import { useEffect } from 'react';
import { Human } from '@vladmandic/human';

type Props = {
  video: HTMLVideoElement;
  human: Human;
  onDetected: () => void;
  setStatus: (msg: string) => void;
};

export default function StepLookLeft({ video, human, onDetected, setStatus }: Props) {
  useEffect(() => {
    let animationId: number;

    const detect = async () => {
      const result = await human.detect(video);
      const gesture = result.gesture;
      const lookLeft = gesture?.some((g) => g.gesture === 'facing left');

      if (lookLeft) {
        setStatus('👈 Menghadap kiri');
        onDetected();
      } else {
        setStatus('🚫 Arahkan wajah ke kiri');
        animationId = requestAnimationFrame(detect);
      }
    };

    detect();

    return () => cancelAnimationFrame(animationId);
  }, [video]);

  return null;
}
