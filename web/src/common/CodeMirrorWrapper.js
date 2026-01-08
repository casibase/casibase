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

import React, {useCallback, useEffect, useRef} from "react";
import CodeMirror from "@uiw/react-codemirror";
import {materialDark} from "@uiw/codemirror-theme-material";
import {javascript} from "@codemirror/lang-javascript";
import {json} from "@codemirror/lang-json";
import {html} from "@codemirror/lang-html";
import {xml} from "@codemirror/lang-xml";
import {yaml} from "@codemirror/lang-yaml";
import {markdown} from "@codemirror/lang-markdown";

/**
 * Get the language extension based on mode string
 */
const getLanguageExtension = (mode) => {
  if (!mode) {return [];}

  const modeStr = typeof mode === "string" ? mode : mode.name || "";

  switch (modeStr) {
  case "javascript":
  case "text/javascript":
    return [javascript()];
  case "application/json":
  case "json":
    return [json()];
  case "yaml":
    return [yaml()];
  case "xml":
  case "text/xml":
    return [xml()];
  case "htmlmixed":
  case "text/html":
    return [html()];
  case "markdown":
  case "text/markdown":
    return [markdown()];
  default:
    return [];
  }
};

/**
 * Wrapper component that provides API compatibility with react-codemirror2's Controlled component
 * Maps old props to new @uiw/react-codemirror props
 */
export const Controlled = ({
  value = "",
  options = {},
  onBeforeChange,
  editorDidMount,
  editable = true,
  ...otherProps
}) => {
  const editorRef = useRef(null);

  // Map old options to new props
  const {
    mode,
    theme = "material-darker",
    readOnly = false,
    lineNumbers = true,
  } = options;

  // Get language extensions based on mode
  const extensions = getLanguageExtension(mode);

  // Handle value changes
  const handleChange = useCallback((newValue, viewUpdate) => {
    if (onBeforeChange && !readOnly && editable) {
      // Create a mock editor and data object for compatibility
      const mockEditor = viewUpdate?.view;
      const mockData = {
        from: viewUpdate?.changes?.desc?.from || 0,
        to: viewUpdate?.changes?.desc?.to || 0,
      };
      onBeforeChange(mockEditor, mockData, newValue);
    }
  }, [onBeforeChange, readOnly, editable]);

  // Call editorDidMount when component mounts
  useEffect(() => {
    if (editorDidMount && editorRef.current) {
      // Create a mock editor object with common methods
      const mockEditor = {
        refresh: () => {
          // The new CodeMirror handles this automatically
        },
        getWrapperElement: () => {
          return editorRef.current;
        },
      };
      editorDidMount(mockEditor);
    }
  }, [editorDidMount]);

  return (
    <div ref={editorRef} style={{height: "100%"}}>
      <CodeMirror
        value={value}
        height="100%"
        theme={theme === "material-darker" ? materialDark : undefined}
        extensions={extensions}
        onChange={handleChange}
        editable={!readOnly && editable}
        basicSetup={{
          lineNumbers: lineNumbers,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          searchKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        {...otherProps}
      />
    </div>
  );
};
