// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export function bufferToWav(buffer, sampleRate) {
  // Validate inputs
  if (!buffer || !buffer.numberOfChannels || buffer.length === 0) {
    throw new Error("Invalid audio buffer");
  }

  // Resample if necessary
  let resampledBuffer = buffer;
  if (buffer.sampleRate !== sampleRate) {
    resampledBuffer = resampleBuffer(buffer, sampleRate);
  }

  const numChannels = resampledBuffer.numberOfChannels;
  const length = resampledBuffer.length * numChannels * 2; // 16-bit samples
  const dataBuffer = new ArrayBuffer(44 + length); // WAV header + audio data
  const data = new DataView(dataBuffer);

  // Write WAV header
  writeString(data, 0, "RIFF");
  data.setUint32(4, 36 + length, true);
  writeString(data, 8, "WAVE");
  writeString(data, 12, "fmt ");
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true); // PCM format
  data.setUint16(22, numChannels, true);
  data.setUint32(24, sampleRate, true);
  data.setUint32(28, sampleRate * numChannels * 2, true); // Byte rate
  data.setUint16(32, numChannels * 2, true); // Block align
  data.setUint16(34, 16, true); // Bits per sample
  writeString(data, 36, "data");
  data.setUint32(40, length, true);

  // Write audio data
  const offset = 44;
  const channelData = [];

  // Get channel data
  for (let i = 0; i < numChannels; i++) {
    channelData.push(resampledBuffer.getChannelData(i));
  }

  // Write interleaved audio data
  let index = 0;
  for (let i = 0; i < resampledBuffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      // Convert float32 to int16
      const sample = Math.max(-1, Math.min(1, channelData[c][i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      data.setInt16(offset + index, value, true);
      index += 2;
    }
  }

  return dataBuffer;
}

export function resampleBuffer(buffer, targetSampleRate) {
  const numChannels = buffer.numberOfChannels;
  const originalSampleRate = buffer.sampleRate;

  // Calculate ratio between original and target sample rates
  const ratio = targetSampleRate / originalSampleRate;
  const newLength = Math.round(buffer.length * ratio);

  // Create AudioContext with target sample rate
  const offlineCtx = new OfflineAudioContext(numChannels, newLength, targetSampleRate);

  // Create source from original buffer
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);

  // Start source and render
  source.start(0);

  // Use a simple linear resampling for performance
  const resampledBuffer = offlineCtx.createBuffer(numChannels, newLength, targetSampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const originalData = buffer.getChannelData(channel);
    const resampledData = resampledBuffer.getChannelData(channel);

    for (let i = 0; i < newLength; i++) {
      // Calculate the exact position in the original buffer
      const position = i / ratio;
      const index = Math.floor(position);
      const remainder = position - index;

      // Simple linear interpolation between adjacent samples
      const a = originalData[index] || 0;
      const b = originalData[index + 1] || a;
      resampledData[i] = a + remainder * (b - a);
    }
  }

  return resampledBuffer;
}

export function writeString(dataView, offset, string) {
  for (let i = 0; i < string.length; i++) {
    dataView.setUint8(offset + i, string.charCodeAt(i));
  }
}
