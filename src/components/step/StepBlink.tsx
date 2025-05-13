// components/Liveness/StepBlink.tsx
import { useEffect } from 'react';
import { Human } from '@vladmandic/human';

type Props = {
  video: HTMLVideoElement;
  human: Human;
  onDetected: () => void;
  setStatus: (msg: string) => void;
};

export default function StepBlink({ video, human, onDetected, setStatus }: Props) {
  useEffect(() => {
    let animationId: number;

    const detect = async () => {
      const result = await human.detect(video);
      const gesture = result.gesture;
      const blink = gesture?.some((g) =>
        g.gesture === 'blink left eye' || g.gesture === 'blink right eye'
      );

      if (blink) {
        setStatus('😉 Berkedip terdeteksi');
        onDetected();
      } else {
        setStatus('🚫 Harap berkedip');
        animationId = requestAnimationFrame(detect);
      }
    };

    detect();

    return () => cancelAnimationFrame(animationId);
  }, [video]);

  return null;
}
