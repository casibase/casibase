// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//go:build !skipCi
// +build !skipCi

package split

import (
	"fmt"
	"reflect"
	"testing"
)

func TestSplit(t *testing.T) {
	p, err := GetSplitProvider("Markdown")
	if err != nil {
		panic(err)
	}

	text := `# Section 1

Here is a standard Markdown table:

| Header1 | Header2 | Header3 |
|---------|---------|---------|
| A1      | B1      | C1      |
| A2      | B2      | C2      |

# Section 2

This is the content of the second section.

1. **The first point**

   This is the first sentence of the content below the first point.

2. **The second point**

   This is the first sentence of the content below the second point.

A borderless Markdown table:
Some text before

Data1 | Data2
:-----|:-----
More data1 | More data2

There is also an HTML table:
<table>
    <tr>
        <td>Cell 1</td>
        <td>Cell 2</td>
    </tr>
</table>
`

	textSections, err := p.SplitText(text)
	if err != nil {
		panic(err)
	}
	targetSections := []string{
		"# Section 1\n\nHere is a standard Markdown table:",
		"# Section 2\n\nThis is the content of the second section.",
		"1. **The first point**\n\nThis is the first sentence of the content below the first point.",
		"2. **The second point**\n\nThis is the first sentence of the content below the second point.\nA borderless Markdown table:\nSome text before\nThere is also an HTML table:",
		"| Header1 | Header2 | Header3 |\n|---------|---------|---------|\n| A1      | B1      | C1      |\n| A2      | B2      | C2      |",
		"Data1 | Data2\n:-----|:-----\nMore data1 | More data2",
		"<table>\n    <tr>\n        <td>Cell 1</td>\n        <td>Cell 2</td>\n    </tr>\n</table>",
	}

	if !reflect.DeepEqual(textSections, targetSections) {
		panic(fmt.Errorf("markdown test failed: did not get the expected result"))
	}
}
