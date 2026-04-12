/**
 * useVoiceRecorder.js
 * Custom hook that uses the Web Speech API (SpeechRecognition) to transcribe
 * microphone input in real-time and append it to a text field.
 *
 * Supported in: Chrome, Edge, Safari 14.1+
 * Not supported in: Firefox (falls back gracefully)
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

export function useVoiceRecorder({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported] = useState(!!SpeechRecognition);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setError('');
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;        // keep recording until stopped
    recognition.interimResults = true;    // show partial results as user speaks
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      // Pass both final + interim so the textarea shows live feedback
      onTranscript(finalTranscript + interim, finalTranscript);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access was denied. Please allow microphone permissions and try again.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try speaking again.');
      } else {
        setError(`Recording error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
  }, [onTranscript]);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  return { isRecording, isSupported, error, toggle, stop };
}
