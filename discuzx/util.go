// Copyright 2021 The casbin Authors. All Rights Reserved.
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

package discuzx

import (
	"fmt"
	"hash/fnv"
	"io"
	"io/ioutil"
	"net/http"
	"regexp"
	"strings"
	"time"
)

var (
	reBold  *regexp.Regexp
	reAlign *regexp.Regexp
	reFont  *regexp.Regexp
	reUrl   *regexp.Regexp
	reSize  *regexp.Regexp
	reSize2 *regexp.Regexp
	reSize3 *regexp.Regexp
	reVideo *regexp.Regexp
)

func init() {
	reBold, _ = regexp.Compile("\\[b](.*?)\\[/b]")
	reAlign, _ = regexp.Compile("\\[align=([a-z]+)](.*?)\\[/align]")
	reFont, _ = regexp.Compile("\\[font=([^]]+)](.*?)\\[/font]")
	reUrl, _ = regexp.Compile("\\[url=([^]]+)](.*?)\\[/url]")
	reSize, _ = regexp.Compile("\\[[a-z]+(=[^]]+)?]")
	reSize2, _ = regexp.Compile("\\[/align]")
	reSize3, _ = regexp.Compile("\\[/[a-z]+]")
	// reSize, _ = regexp.Compile("\\[size=\\d+\\].*\\[/size\\]")
	reVideo, _ = regexp.Compile("\\[media=x,(\\d+),(\\d+)\\].*/id_(.*)\\.html\\[/media\\]")
}

func getTimeFromUnixSeconds(t int) string {
	tm := time.Unix(int64(t), 0)
	return tm.Format(time.RFC3339)
}

func getYearFromUnixSeconds(t int) int {
	tm := time.Unix(int64(t), 0)
	return tm.Year()
}

func escapeVideo(text string) string {
	// [media=x,500,375]https://v.youku.com/v_show/id_XNDU0NjEyODg0MA==.html[/media]
	// <iframe height=498 width=510 src='https://player.youku.com/embed/XNDU0NjEyODg0MA==' frameborder=0 'allowfullscreen'></iframe>
	text = reVideo.ReplaceAllString(text, "\n<iframe width=$1 height=$2 src='https://player.youku.com/embed/$3' frameborder=0 'allowfullscreen'></iframe>\n")
	return text
}

func escapeContent(text string) string {
	text = strings.ReplaceAll(text, "[quote]", "```\n")
	text = strings.ReplaceAll(text, "[/quote]", "\n```")
	text = reBold.ReplaceAllString(text, "<b>$1</b>")
	text = reAlign.ReplaceAllString(text, "<p align=\"$1\">$2</p>")
	text = reFont.ReplaceAllString(text, "<font face=\"$1\">$2</font>")
	text = reUrl.ReplaceAllString(text, "[$2]($1)")
	text = reSize.ReplaceAllString(text, "")
	text = reSize2.ReplaceAllString(text, "\n")
	text = reSize3.ReplaceAllString(text, "")
	text = escapeVideo(text)
	text = strings.ReplaceAll(text, "\n", "\n\n")
	text = strings.ReplaceAll(text, "\r", "")
	text = strings.ReplaceAll(text, "\n\n\n", "\n\n<br />\n\n")
	return text
}

func getRedirectUrl(url string) string {
	client := &http.Client{}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		panic(err)
	}

	newUrl := ""
	client.CheckRedirect = func(req *http.Request, via []*http.Request) error {
		newUrl = req.URL.String()
		return http.ErrUseLastResponse
	}

	times := 0
	for {
		_, err = client.Do(req)
		if err != nil {
			times += 1
			time.Sleep(3 * time.Second)
			if times >= 10 {
				panic(err)
			}
		} else {
			break
		}
	}

	if newUrl == "" {
		newUrl = url
	}

	return newUrl
}

func downloadFile(url string) ([]byte, string, error) {
	client := &http.Client{}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, "", err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, "", err
	}

	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			return
		}
	}(resp.Body)

	bs, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	newUrl := resp.Request.URL.String()
	return bs, newUrl, nil
}

func downloadFileSafe(url string) ([]byte, string, error) {
	var bs []byte
	var newUrl string
	var err error
	times := 0
	for {
		bs, newUrl, err = downloadFile(url)
		if err != nil {
			times += 1
			time.Sleep(3 * time.Second)
			if times >= 10 {
				return nil, "", err
			}
		} else {
			break
		}
	}
	return bs, newUrl, nil
}

func getStringHash(s string) int {
	h := fnv.New32a()
	h.Write([]byte(s))
	return int(h.Sum32())
}

func getRandomAvatarUrl(s string) string {
	i := getStringHash(s)
	i = i%244 + 1
	avatarUrl := fmt.Sprintf("%s%d.png", avatarPoolBaseUrl, i)
	return avatarUrl
}
