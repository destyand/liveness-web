import { useEffect, useRef, useState } from 'react';
import Human from '@vladmandic/human';

const human = new Human({
  modelBasePath: 'https://vladmandic.github.io/human/models',
  face: {
    enabled: true,
    detector: { rotation: true }, // untuk yaw (tengok kanan/kiri)
    mesh: {},                  // aktifkan mesh agar keypoints tersedia
    antispoof: { enabled: true },
    description: {},           // deskripsi wajah (termasuk 'real' / anti-spoof)
		emotion: {},
		iris: {},
  },
	body: { enabled: true },
  hand: { enabled: true },
  object: { enabled: true },
  gesture: { enabled: true },
	// keypoints: { enabled: true },
	// real: { enabled: true },
  filter: { enabled: true },
});

export default function LivenessChecker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('🔍 Mendeteksi wajah...');
  const [isMouthOpen, setIsMouthOpen] = useState(false);
  const [isLookingLeft, setIsLookingLeft] = useState(false);
  const [isLookingRight, setIsLookingRight] = useState(false);
  const [isLookingCenter, setIsLookingCenter] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isAge, setAge] = useState(0);
  const [isGender, setGender] = useState('-');

  useEffect(() => {
    const setup = async () => {
      await human.load();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const loop = async () => {
        if (videoRef.current) {
          const result = await human.detect(videoRef.current);
          const face = result.face?.[0];
          const gesture = result.gesture;
					console.log('result', result);
          if (face) {
						if (face.age) { setAge(face.age); }
						if (face.gender) { setGender(face.gender); }
						if (gesture) {
							// '"facing left" | "facing center" | "facing right" | "blink left eye" | "blink right eye" | `mouth ${number}% open` | "head up" | "head down" | "looking left" | "looking right" | "looking up" | ... 18 more ... | "thumbs up"' and '"mouthLeft"'

							const facingLeft = gesture?.find(k => k.gesture === 'facing left');
							const facingRight = gesture?.find(k => k.gesture === 'facing right');
							const facingCenter = gesture?.find(k => k.gesture === 'facing center');
							const facingBlinkLeftEye = gesture?.find(k => k.gesture === 'blink left eye');
							const facingBlinkRightEye = gesture?.find(k => k.gesture === 'blink right eye');
							const facingMouthOpen = gesture?.find(k => {
								const match = k.gesture.match(/^mouth (\d+)% open$/);
								if (!match) return false;
								
								const percentage = parseInt(match[1], 10);
								return percentage >= 30; // contoh: deteksi jika buka mulut minimal 30%
							});
							console.log('BLINK', facingBlinkLeftEye !== undefined || facingBlinkRightEye !== undefined);
							console.log('MOUTH', facingMouthOpen)
							console.log('CENTER', facingCenter)
							if (facingMouthOpen) {
								setIsMouthOpen(true);
								setStatus('👄 Mulut terbuka');
							} else if (facingBlinkLeftEye !== undefined || facingBlinkRightEye !== undefined) {
								setIsBlinking(true);
								setStatus('👁️ Berkedip terdeteksi');
							} else if (facingRight) {
								setIsLookingRight(true);
								setStatus('👈 Kepala menoleh ke kanan');
							} else if (facingLeft) {
								setIsLookingLeft(true);
								setStatus('👉 Kepala menoleh ke kiri');
							} else if (facingCenter) { 
								setIsLookingCenter(true);
								setStatus('✅ Kepala berada di tengah');
							} else {
								setStatus('👍 Pastikan kamera setinggi mata');
							}
						} else {
							setStatus('✅ Wajah terdeteksi, lakukan aksi...');
						}

            // const yaw = face.rotation?.angle?.yaw || 0;
						const annotations = face.annotations;

						// console.log('yaw', yaw);
						if (annotations) {
							const upperLip = annotations.lipsUpperOuter;
							const lowerLip = annotations.lipsLowerOuter;
							// const nose = annotations.noseTip;
							const leftEye = annotations.leftEyeUpper0;
							const rightEye = annotations.rightEyeUpper0;
							// const leftCheek = annotations.leftCheek;
							// const rightCheek = annotations.rightCheek;
						
							// Contoh deteksi buka mulut
							if (upperLip && lowerLip) {
								const y1 = upperLip[5][1];
								const y2 = lowerLip[5][1];
								const mulutTerbuka = Math.abs(y1 - y2) > 6;
								console.log('mulutTerbuka', mulutTerbuka);
							}
						
							// Deteksi mata tertutup (blink manual)
							if ((leftEye && leftEye.length > 3) || (rightEye && rightEye.length > 3)) {
								const eyeHeight = Math.abs(leftEye[1][1] - leftEye[3][1]);
								if (eyeHeight < 2) {
									console.log('👁️ Mata kiri mungkin tertutup');
								}
							}
						}
						
          } else {
            setStatus('🚫 Tidak ada wajah');
          }
        }
        requestAnimationFrame(loop);
      };

      loop();

			// const detect = async () => {
			// 	if (!videoRef.current) return requestAnimationFrame(detect);
	
			// 	const result = await human.detect(videoRef.current);
			// 	const face = result.face?.[0];
			// 	console.log('result', result);
				
			// 	if (!face) {
			// 		setStatus('🚫 Wajah tidak terdeteksi');
			// 		return requestAnimationFrame(detect);
			// 	}
	
			// 	// Anti-spoofing
			// 	if (face.real?.score !== undefined && face.real.score < 0.8) {
			// 		setStatus('🛑 Deteksi spoofing (foto/video)');
			// 		return requestAnimationFrame(detect);
			// 	}
	
			// 	// Blink
			// 	if (face.blink?.left || face.blink?.right) {
			// 		setStatus('👁️ Berkedip terdeteksi');
			// 	}
	
			// 	// Mouth Open
			// 	if (face.keypoints) {
			// 		const upperLip = face.keypoints.find(k => k.part === 'lipsUpperOuter');
			// 		const lowerLip = face.keypoints.find(k => k.part === 'lipsLowerOuter');
			// 		if (upperLip && lowerLip) {
			// 			const mouthGap = Math.abs(upperLip.position.y - lowerLip.position.y);
			// 			if (mouthGap > 8) {
			// 				setStatus('👄 Buka mulut terdeteksi');
			// 			}
			// 		}
			// 	}
	
			// 	// Head rotation (yaw)
			// 	const yaw = face.rotation?.yaw ?? 0;
			// 	if (yaw > 0.4) {
			// 		setStatus('👈 Tengok kanan');
			// 	} else if (yaw < -0.4) {
			// 		setStatus('👉 Tengok kiri');
			// 	}
	
			// 	requestAnimationFrame(detect);
			// };
	
			// detect();
    };

    setup();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-semibold mb-4">Liveness Detection</h1>
      <video ref={videoRef} className="rounded-lg shadow-lg w-full max-w-md" autoPlay muted />
			<p className="mt-4 text-lg">{status}</p>
			<div className="mt-4 text-lg">
        <p>Looking Center: {isLookingCenter ? 'Yes' : 'No'}</p>
        <p>Mouth Open: {isMouthOpen ? 'Yes' : 'No'}</p>
        <p>Looking Left: {isLookingLeft ? 'Yes' : 'No'}</p>
        <p>Looking Right: {isLookingRight ? 'Yes' : 'No'}</p>
        <p>Blinking: {isBlinking ? 'Yes' : 'No'}</p>
        <p>Age: {isAge}</p>
        <p>Gender: {isGender}</p>
      </div>
    </div>
  );
}

