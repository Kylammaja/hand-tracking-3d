
import {
  HandLandmarker,
  FilesetResolver
} from '@mediapipe/tasks-vision';

let handLandmarker;
let video;

export async function startHandTracking(onHandDetected) {
  // Menyiapkan MediaPipe
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  handLandmarker = await HandLandmarker.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 2
    }
  );

  // Meminta akses webcam

video = document.querySelector('#webcam');

video.autoplay = true;
video.playsInline = true;
video.muted = true;

const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'user',
    width: 640,
    height: 480
  }
});

video.srcObject = stream;
await video.play();
console.log('Video:', video.videoWidth, video.videoHeight);
console.log('Stream:', video.srcObject?.active);
console.log('Track:', video.srcObject?.getVideoTracks()[0]?.readyState);

video.style.display = 'block';
console.log('Video siap:', video.videoWidth, video.videoHeight);
console.log('Stream aktif:', stream.active);


  // Mendeteksi tangan berulang kali
  function detect() {
    if (video.readyState >= 2) {
      const result = handLandmarker.detectForVideo(
        video,
        performance.now()
      );

      onHandDetected(result);
    }

    requestAnimationFrame(detect);
  }

  detect();

  return video;
}
