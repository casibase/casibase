// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

package audio

import (
	"bytes"
	"io"
	"os"
	"os/exec"
	"strings"
)

func extractAudioExample() {
	inputPath := "C:\\Users\\yangluo\\AppData\\Local\\Temp\\casibase-input-2968149305.mp4"
	outputPath := "C:\\Users\\yangluo\\AppData\\Local\\Temp\\casibase-output-469162762.mp3"

	// https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl-shared.zip
	cmd := exec.Command("ffmpeg", "-i", inputPath, "-q:a", "0", "-map", "a", outputPath)
	err := cmd.Run()
	if err != nil {
		panic(err)
	}
}

func GetAudioFromVideo(inputBuffer *bytes.Buffer) (*bytes.Buffer, error) {
	tmpInputFile, err := os.CreateTemp("", "casibase-audio-*.mp4")
	if err != nil {
		return nil, err
	}
	defer os.Remove(tmpInputFile.Name())

	_, err = io.Copy(tmpInputFile, inputBuffer)
	if err != nil {
		return nil, err
	}
	tmpInputFile.Close()

	tmpOutputFileName := strings.Replace(tmpInputFile.Name(), ".mp4", ".mp3", 1)
	cmd := exec.Command("ffmpeg", "-i", tmpInputFile.Name(), "-q:a", "0", "-map", "a", tmpOutputFileName)
	err = cmd.Run()
	if err != nil {
		return nil, err
	}

	tmpOutputFile, err := os.Open(tmpOutputFileName)
	if err != nil {
		return nil, err
	}

	outputBuffer := bytes.NewBuffer(nil)
	_, err = io.Copy(outputBuffer, tmpOutputFile)
	if err != nil {
		return nil, err
	}

	defer tmpOutputFile.Close()
	defer os.Remove(tmpOutputFileName)

	return outputBuffer, nil
}
