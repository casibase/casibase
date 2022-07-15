import React from "react";
import BraftEditor from "braft-editor";
import "braft-editor/dist/index.css";
import {myUploadFn} from "./Tools";

const _ = require("lodash");

export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: BraftEditor.createEditorState(null),
      contentStyle: {
        minHeight: this.props.height ? this.props.height : "112px",
        height: "auto",
      },
      language: this.props.language ? this.props.language : "en",
    };
    this.handleEditorChangeDebounce = _.debounce(this.handleEditorChange, 200);
  }

  fetchEditorContent() {
    return new Promise((resolve, reject) => {
      const data = "this is a server";
      resolve(data);
    });
  }

  async componentDidMount() {
    // Assume here to get the editor content in html format from the server
    // const htmlContent = await this.fetchEditorContent();
    // Use BraftEditor.createEditorState to convert html strings to editorState data needed by the editor
    const rawDefaultVal = this.props.defaultValue;
    const defaultVal = rawDefaultVal ? BraftEditor.createEditorState(rawDefaultVal) : "";
    this.setState({
      editorState: defaultVal,
    });
  }

  handleEditorValueSend(text) {
    // call father compoents function
    this.props.onBeforeChange(text);
  }

  handleEditorChange = (editorState) => {
    this.setState({
      editorState,
    });
    const htmlContent = editorState.toHTML();
    this.handleEditorValueSend(htmlContent);
  };

  ValidateFn = (file) => {
    // file should be less than 6MB
    return file.size < 1024 * 1024 * 6;
  };

  render() {
    const {editorState, contentStyle, language} = this.state;
    const UploadFn = myUploadFn;
    // add debounce function && decrease call fucntion times.
    return (
      <div className="">
        <BraftEditor
          value={editorState}
          onChange={this.handleEditorChangeDebounce}
          contentStyle={contentStyle}
          media={{
            uploadFn: UploadFn,
            validateFn: this.ValidateFn,
          }}
          language={language}
        />
      </div>
    );
  }
}
