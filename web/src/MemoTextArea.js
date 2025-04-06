// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

import React, {useEffect, useState} from "react";
import {Input} from "antd";

const {TextArea} = Input;

const MemoTextArea = React.memo(({value, onChange}) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        const event = {target: {value: inputValue}};
        onChange(event);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputValue, onChange, value]);

  return (
    <div>
      <TextArea
        // status={inputValue === value ? "" : "error"}
        autoSize={{minRows: 1}}
        showCount
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value;
});

export default MemoTextArea;
