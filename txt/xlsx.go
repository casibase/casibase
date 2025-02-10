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

package txt

import (
	"github.com/tealeg/xlsx"
)

func getTextFromXlsx(path string) (string, error) {
	xlFile, err := xlsx.OpenFile(path)
	if err != nil {
		return "", err
	}
	var result string
	for _, sheet := range xlFile.Sheets {
		for _, row := range sheet.Rows {
			for _, cell := range row.Cells {
				text, err := cell.FormattedValue()
				if err != nil {
					return "", err
				}
				result += text + " "
			}
			result += "\n"
		}
	}
	return result, nil
}
