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

package util

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

var licenseText = `// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

`

func updateAllHeaders() {
	err := filepath.Walk("../", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && (strings.HasSuffix(path, ".go") || strings.HasSuffix(path, ".js") && !strings.Contains(path, "node_modules")) {
			data, err := os.ReadFile(path)
			if err != nil {
				return err
			}

			if !strings.Contains(string(data), "Licensed under the Apache License") {
				newData := licenseText + string(data)
				err = os.WriteFile(path, []byte(newData), info.Mode())
				if err != nil {
					return err
				}

				fmt.Printf("Handled path: [%s]\n", path)
			}
		}
		return nil
	})
	if err != nil {
		panic(err)
	}
}
