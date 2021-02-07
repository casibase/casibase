import React from "react";
import BraftEditor from "braft-editor";
import "braft-editor/dist/index.css";
import { myUploadFn } from "./Tools";

export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: BraftEditor.createEditorState(null),
      contentStyle: {
        height: this.props.height ? this.props.height : "350px",
      },
    };
  }

  fetchEditorContent() {
    return new Promise((resolve, reject) => {
      const data = "this is a server";
      resolve(data);
    });
  }

  async componentDidMount() {
    // Assume here to get the editor content in html format from the server
    const htmlContent = await this.fetchEditorContent();
    // Use BraftEditor.createEditorState to convert html strings to editorState data needed by the editor
    this.setState({
      editorState: "",
    });
  }

  handleEditorValueSend(text) {
    //call father compoents function
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
    //file should be less than 6MB
    return file.size < 1024 * 1024 * 6;
  };

  render() {
    const { editorState, contentStyle } = this.state;
    const UploadFn = myUploadFn;
    return (
      <div className="my-component">
        <BraftEditor
          value={editorState}
          onChange={this.handleEditorChange}
          language={this.language}
          contentStyle={contentStyle}
          media={{
            uploadFn: UploadFn,
            validateFn: this.ValidateFn,
          }}
        />
      </div>
    );
  }
}
