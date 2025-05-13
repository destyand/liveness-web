// components/Liveness/StepMouthOpen.tsx
import { useEffect } from 'react';
import { Human } from '@vladmandic/human';

type Props = {
  video: HTMLVideoElement;
  human: Human;
  onDetected: () => void;
  setStatus: (msg: string) => void;
};

export default function StepMouthOpen({ video, human, onDetected, setStatus }: Props) {
  useEffect(() => {
    const detect = async () => {
      const result = await human.detect(video);
      const gesture = result.gesture;
			console.log('gesture', gesture);
      const mouthOpen = gesture?.find((g) => {
        const match = g.gesture.match(/^mouth (\d+)% open$/);
        return match && parseInt(match[1]) >= 30;
      });

      if (mouthOpen) {
        setStatus('👄 Mulut terbuka');
        onDetected();
      } else {
        setStatus('🚫 Arahkan wajah & buka mulut minimal 30%');
      }
    };

    const id = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(id);
  }, [video]);

  return null;
}
