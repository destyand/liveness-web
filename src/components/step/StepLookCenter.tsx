// components/Liveness/StepLookCenter.tsx
import { useEffect } from 'react';
import { Human } from '@vladmandic/human';

type Props = {
  video: HTMLVideoElement;
  human: Human;
  onDetected: () => void;
  setStatus: (msg: string) => void;
};

export default function StepLookCenter({ video, human, onDetected, setStatus }: Props) {
  useEffect(() => {
    let animationId: number;

    const detect = async () => {
      const result = await human.detect(video);
      const gesture = result.gesture;
      const lookCenter = gesture?.some((g) => g.gesture === 'facing center');

      if (lookCenter) {
        setStatus('🧍 Menghadap lurus');
        onDetected();
      } else {
        setStatus('🚫 Arahkan wajah ke depan/lurus');
        animationId = requestAnimationFrame(detect);
      }
    };

    detect();

    return () => cancelAnimationFrame(animationId);
  }, [video]);

  return null;
}
