// components/Liveness/StepLookRight.tsx
import { useEffect } from 'react';
import { Human } from '@vladmandic/human';

type Props = {
  video: HTMLVideoElement;
  human: Human;
  onDetected: () => void;
  setStatus: (msg: string) => void;
};

export default function StepLookRight({ video, human, onDetected, setStatus }: Props) {
  useEffect(() => {
    let animationId: number;

    const detect = async () => {
      const result = await human.detect(video);
      const gesture = result.gesture;
      const lookRight = gesture?.some((g) => g.gesture === 'facing right');

      if (lookRight) {
        setStatus('👉 Menghadap kanan');
        onDetected();
      } else {
        setStatus('🚫 Arahkan wajah ke kanan');
        animationId = requestAnimationFrame(detect);
      }
    };

    detect();

    return () => cancelAnimationFrame(animationId);
  }, [video]);

  return null;
}
