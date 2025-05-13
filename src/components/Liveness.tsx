/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import Human from '@vladmandic/human';

import imgNoMask from "../assets/1-no-mask.png";
import imgNoHat from "../assets/1-no-hat.png";
import imgNoSunglasses from "../assets/1-no-sunglasses.png";
import imgLight from "../assets/2-light.png";
import imgPhoneVibration from "../assets/2-phone-vibration.png";
import imgSelfie1 from "../assets/3-hand-selfie.png";
import imgSelfie2 from "../assets/3-selfie.png";
import imgFace from "../assets/4-face-id.png";
import imgNoFace from "../assets/4-no-face.png";


const props = {
	frame: 'circle',
	timeout: 2000
};

const human = new Human({
  modelBasePath: 'https://vladmandic.github.io/human/models',
  face: {
    enabled: true,
    detector: { rotation: true },
    mesh: {},
    antispoof: { enabled: true },
    description: {},
    emotion: {},
    iris: {},
  },
  body: { enabled: true },
  hand: { enabled: true },
  object: { enabled: true },
  gesture: { enabled: true },
  filter: { enabled: true },
});

enum LivenessStep {
  Center = '✅ Hadapkan wajah ke tengah',
  LookLeft = '👉 Silakan tengok ke kiri',
  LookRight = '👈 Silakan tengok ke kanan',
  OpenMouth = '👄 Buka mulut Anda',
  Blink = '👁️ Kedipkan mata',
  Done = '🎉 Verifikasi liveness selesai',
  NoFace = '🚫 Wajah tidak terdeteksi',
}

const instructions = [
	'MULAI',
  'Lepaskan masker/topi/kacamata hitam.',
  'Pastikan Anda berada di ruangan dengan cahaya terang dan smartphone tidak bergoyang.',
  'Pegang smartphone setinggi mata.',
  'Pastikan wajah sepenuhnya berada di dalam frame.',
];

export default function LivenessChecker() {
  const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<LivenessStep>(LivenessStep.NoFace);
  const [completedSteps, setCompletedSteps] = useState<Set<LivenessStep>>(new Set());
  const [age, setAge] = useState<number>(0);
  const [gender, setGender] = useState<string>('-');
  const [started, setStarted] = useState(false);
  const [instructionStep, setInstructionStep] = useState(0);
  const [imageCaptured, setImageCaptured] = useState<string | null>(null);
  const [response, setResponse] = useState<any>();

  const updateStep = (step: LivenessStep) => {
    if (!completedSteps.has(step)) {
      setCompletedSteps(new Set(completedSteps.add(step)));
    }
  };

  useEffect(() => {
    const setup = async () => {
      await human.load();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const loop = async () => {
        if (!videoRef.current) return;
        const result = await human.detect(videoRef.current);
        const face = result.face?.[0];
        const gesture = result.gesture;
				setResponse(result);
        if (face) {
          setStatus(LivenessStep.Center);
          if (face.age) setAge(Math.round(face.age));
          if (face.gender) setGender(face.gender);

          if (gesture) {
            const mouthOpen = gesture.find(k => /^mouth (\d+)% open$/.test(k.gesture) && parseInt(k.gesture.match(/\d+/)?.[0] || '0', 10) > 30);
            const lookLeft = gesture.find(k => k.gesture === 'facing left');
            const lookRight = gesture.find(k => k.gesture === 'facing right');
            const blinkLeft = gesture.find(k => k.gesture === 'blink left eye');
            const blinkRight = gesture.find(k => k.gesture === 'blink right eye');
            const center = gesture.find(k => k.gesture === 'facing center');

            if (center) updateStep(LivenessStep.Center);
            if (lookLeft) updateStep(LivenessStep.LookLeft);
            if (lookRight) updateStep(LivenessStep.LookRight);
            if (mouthOpen) updateStep(LivenessStep.OpenMouth);
            if (blinkLeft || blinkRight) updateStep(LivenessStep.Blink);
          }
        } else {
          setStatus(LivenessStep.NoFace);
        }
        if (completedSteps.size >= 5) {
					const allSameGesture = gesture.every(item => 
						item.gesture === "facing center" || item.gesture === "looking center"
					);
					if(allSameGesture) {
						setTimeout(() => {
							setStatus(LivenessStep.Done);
							captureImage();
						}, props.timeout);
					}
        }

        requestAnimationFrame(loop);
      };

      loop();
    };
		if(started) {
			setup();
		}
  }, [started, completedSteps]);

	const handleNextInstruction = () => {
    if (instructionStep < instructions.length - 1) {
      setInstructionStep((prev) => prev + 1);
    } else {
      setStarted(true);
    }
  };

	const handlePreviousInstruction = () => {
		setInstructionStep((prev) => Math.max(prev - 1, 0));
	};	

	const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');
        setImageCaptured(imageData);
				setTimeout(() => {
					stopCamera();
				}, props.timeout);
      }
    }
  };

	const stopCamera = () => {
		const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
			stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
			videoRef.current.srcObject = null;
    }
		setStarted(false);
		console.log(response);
  };

	const retake = () => {
		setInstructionStep(0);
		setImageCaptured(null);
		setCompletedSteps(new Set());
	}

	const renderInstruction = (step: number) => {
		const STEP_1 = step === 1 && (
			<>
				<img src={imgNoMask} alt="img" className="w-20 h-20" />
				<img src={imgNoHat} alt="img" className="w-20 h-20" />
				<img src={imgNoSunglasses} alt="img" className="w-20 h-20" />
			</>
		);
		const STEP_2 = step === 2 && (
			<>
				<img src={imgLight} alt="img" className="w-20 h-20" />
				<img src={imgPhoneVibration} alt="img" className="w-20 h-20" />
			</>
		);
		const STEP_3 = step === 3 && (
			<>
				<img src={imgSelfie1} alt="img" className="w-20 h-20" />
				<img src={imgSelfie2} alt="img" className="w-20 h-20" />
			</>
		);
		const STEP_4 = step === 4 && (
			<>
				<img src={imgNoFace} alt="img" className="w-20 h-20" />
				<img src={imgFace} alt="img" className="w-20 h-20" />
			</>
		);
		return (
			<>
				{STEP_1}
				{STEP_2}
				{STEP_3}
				{STEP_4}
			</>
		)
	}

	const speak = (text: string) => {
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'id-ID'; // Bahasa Indonesia
		utterance.rate = 1; // Kecepatan bicara (1 adalah normal)
		window.speechSynthesis.speak(utterance);
	};
	
	useEffect(() => {
		console.log('instructionStep', instructions[instructionStep]);
		speak(instructions[instructionStep]);
  }, [instructionStep]);


  return (
		<>
			{!started && imageCaptured === null ? (
				<>
					<div className="absolute">
						<button
							onClick={handlePreviousInstruction}
							className="absolute top-0 left-0 m-4 px-4 py-2 text-white rounded"
						>
							←
						</button>
					</div>
					<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4 text-center">
						<h1 className="text-2xl font-semibold my-6">Instruksi Liveness</h1>
						<h1 className="text-sm mb-6">Mohon perhatikan semua instruksi untuk mendapatkan hasil yang sukses.</h1>
						<div className="w-full max-w-lg space-y-6">
							{instructionStep > 0 && (
								<div className="p-4 bg-white rounded-lg shadow-md text-gray-800">
									<p className="text-sm">Langkah {instructionStep + 1} dari {instructions.length}</p>
									<div className="flex flex-col sm:flex-row md:space-x-4 space-y-4 md:space-y-0 justify-center items-center py-8">
										{renderInstruction(instructionStep)}
									</div>
									<p className="text-lg font-medium mt-2">{instructions[instructionStep]}</p>
								</div>
							)}
							<button
								onClick={handleNextInstruction}
								className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
							>
								{instructionStep < instructions.length - 1 ? 'Lanjut' : 'Mulai Verifikasi'}
							</button>
						</div>
					</div>
				</>
			) : (
			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4 text-center">
				{!imageCaptured ? (
					<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
					<h1 className="text-2xl font-bold mb-4">Liveness Detection</h1>
					
					{props.frame === 'square' && (
						<div className="relative w-full max-w-md aspect-video border-4 border-blue-500 rounded-lg overflow-hidden shadow-lg">
							<video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
							<div className="absolute inset-0 border-2 border-white border-dashed m-8 rounded-lg pointer-events-none" />
						</div>
					)}
					
					{props.frame === 'circle' && (
						<div className="w-64 h-64 bg-black rounded-full overflow-hidden shadow-md">
							<video
								ref={videoRef}
								className="w-full h-full object-cover"
								autoPlay
								muted
								playsInline
							/>
						</div>
					)}
					<p className="mt-4 text-lg font-medium">{status}</p>
	
					<div className="mt-4 space-y-1 text-sm text-left w-full max-w-md">
						{Object.values(LivenessStep).map((step) => (
							step !== LivenessStep.NoFace && (
								<div key={step} className={`flex items-center gap-2 ${completedSteps.has(step) ? 'text-green-400' : 'text-gray-400'}`}>
									<span>{completedSteps.has(step) ? '✅' : '⬜'}</span>
									<span>{step}</span>
								</div>
							)
						))}
					</div>
	
					<div className="mt-16 text-sm text-gray-300">
						<p>Age: {age}</p>
						<p>Gender: {gender}</p>
					</div>
				</div>
				) : (
					<>
						<div className="w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden shadow-md">
							<img src={imageCaptured} alt="Hasil verifikasi" className="w-full h-full object-cover" />
						</div>
						<p className="mt-4 text-lg">🎉 Verifikasi liveness selesai</p>
						<button
							onClick={retake}
							className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition mt-6"
						>
							Retake
						</button>
					</>
				)}
				<canvas ref={canvasRef} className="hidden" />
			</div>
			)}
		</>
  );
}
