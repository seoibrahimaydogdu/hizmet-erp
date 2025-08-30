/// <reference types="vite/client" />

// Web Speech API için global tip tanımları
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
