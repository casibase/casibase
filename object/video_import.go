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

package object

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func getImportedVideos(path string) ([]*Video, error) {
	files, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	videos := []*Video{}
	for _, file := range files {
		if filepath.Ext(file.Name()) != ".txt" {
			continue
		}

		filePath := filepath.Join(path, file.Name())
		video, err := parseVideoFile(filePath)
		if err != nil {
			return nil, err
		}

		videos = append(videos, video)
	}

	return videos, nil
}

func getParentFolderName(filePath string) string {
	// 获取父目录的完整路径
	parentDir := filepath.Dir(filePath)

	// 获取父目录的基本名称
	parentFolderName := filepath.Base(parentDir)

	return parentFolderName
}

func parseVideoFile(filePath string) (*Video, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	fileId := strings.TrimSuffix(filepath.Base(filePath), filepath.Ext(filePath))
	tag := getParentFolderName(filePath)
	video := &Video{
		Owner:        "tsing",
		Name:         fileId,
		DisplayName:  fileId,
		Tag:          tag,
		Type:         ".mp4",
		EditMode:     "Text Recognition",
		Labels:       []*Label{},
		Segments:     []*Label{},
		WordCountMap: map[string]int{},
		Remarks:      []*Remark{},
		Remarks2:     []*Remark{},
		DataUrls:     []string{},
		Keywords:     []string{},
	}

	scanner := bufio.NewScanner(file)

	// 读取并解析第一行（时间信息）
	if scanner.Scan() {
		timestamp := scanner.Text()
		createdTime, videoLength, err := parseTimeString(timestamp)
		if err != nil {
			return nil, err
		}
		video.CreatedTime = createdTime
		video.VideoLength = videoLength
	} else {
		return nil, fmt.Errorf("file is empty")
	}

	for scanner.Scan() {
		line := scanner.Text()
		if line == "关键词:" {
			scanner.Scan()
			line = scanner.Text()
			video.Keywords = parseKeywords(line)
			break
		}
	}

	// 解析文字记录
	var recordBuilder strings.Builder
	for scanner.Scan() {
		line := scanner.Text()
		if line != "" {
			recordBuilder.WriteString(line + "\n")
		} else {
			// 处理当前记录块
			err = parseTextRecord(recordBuilder.String(), video)
			if err != nil {
				return nil, err
			}
			recordBuilder.Reset()
		}
	}
	// 处理最后一个记录块
	err = parseTextRecord(recordBuilder.String(), video)
	if err != nil {
		return nil, err
	}

	for i := 0; i < len(video.Segments); i++ {
		if i != len(video.Segments)-1 {
			video.Segments[i].EndTime = video.Segments[i+1].StartTime
		} else {
			endTime, err := timeToSeconds(video.VideoLength)
			if err != nil {
				return nil, err
			}

			video.Segments[i].EndTime = endTime
		}
	}

	return video, nil
}

func parseTextRecord(record string, video *Video) error {
	tokens := strings.Split(record, "\n")
	if len(tokens) < 2 {
		return nil // 忽略空记录
	}

	lines := []string{}
	for _, token := range tokens {
		if token != "" && token != "文字记录:" {
			token = strings.Trim(token, " ")
			lines = append(lines, token)
		}
	}

	// 第一行是角色和时间
	parts := SplitLastN(lines[0], " ", 2)
	if len(parts) != 2 {
		return fmt.Errorf("invalid record format")
	}

	speaker, timeStr := parts[0], parts[1]

	speaker = mapSpeaker(speaker)

	timeStr = strings.Trim(timeStr, " ")
	startTime, err := timeToSeconds(timeStr)
	if err != nil {
		return err
	}

	// 其余行是内容
	text := strings.Join(lines[1:], " ")

	label := &Label{
		Id:        strconv.Itoa(len(video.Segments)),
		StartTime: startTime,
		Text:      text,
		Speaker:   speaker,
	}

	video.Segments = append(video.Segments, label)
	return nil
}

func importVideos(path string) error {
	videos, err := getImportedVideos(path)
	if err != nil {
		return err
	}

	for i, video := range videos {
		fmt.Printf("[%d] Add video: %v\n", i, video)
		_, err = AddVideo(video)
		if err != nil {
			return err
		}
	}

	return nil
}
