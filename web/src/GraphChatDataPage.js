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

import React from "react";
import ReactEcharts from "echarts-for-react";
import "echarts-wordcloud";

class GraphChatDataPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {wordCloud: []},
      errorText: "",
    };
  }

  componentDidMount() {
    this.loadGraphData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.graphText !== prevProps.graphText) {
      this.loadGraphData();
    }
  }

  loadGraphData() {
    const result = this.parseWordCloudData();
    this.setState({
      data: result.data,
      errorText: result.errorText,
    });
    if (this.props.onErrorChange) {
      this.props.onErrorChange(result.errorText);
    }
  }

  parseWordCloudData() {
    const defaultData = {wordCloud: []};
    const text = this.props.graphText || "";
    if (text.trim() === "") {
      return {data: defaultData, errorText: "Word cloud data is empty"};
    }
    try {
      const wordCloud = JSON.parse(text);
      if (Array.isArray(wordCloud)) {
        return {data: {wordCloud}, errorText: ""};
      } else {
        return {data: defaultData, errorText: "Invalid word cloud format: must be an array"};
      }
    } catch (e) {
      return {data: defaultData, errorText: `JSON parse error: ${e.message}`};
    }
  }

  getWordCloudOption() {
    const {wordCloud} = this.state.data;

    return {
      tooltip: {
        show: true,
        formatter: function(params) {
          return `${params.name}: ${params.value}`;
        },
      },
      series: [{
        type: "wordCloud",
        shape: "circle",
        left: "center",
        top: "center",
        width: "90%",
        height: "90%",
        sizeRange: [12, 60],
        rotationRange: [-45, 45],
        rotationStep: 15,
        gridSize: 8,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: "sans-serif",
          fontWeight: "bold",
          color: function() {
            const colors = [
              "#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de",
              "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc", "#5470c6",
            ];
            return colors[Math.floor(Math.random() * colors.length)];
          },
        },
        emphasis: {
          focus: "self",
          textStyle: {
            textShadowBlur: 10,
            textShadowColor: "#333",
          },
        },
        data: wordCloud,
      }],
    };
  }

  render() {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          border: this.props.showBorder ? "1px solid #d9d9d9" : "none",
        }}
      >
        {this.state.errorText && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(255, 77, 79, 0.9)",
              color: "white",
              padding: "20px",
              borderRadius: 8,
              fontSize: 14,
              maxWidth: "80%",
              textAlign: "center",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{fontWeight: "bold", marginBottom: "8px"}}>Graph Error</div>
            <div>{this.state.errorText}</div>
          </div>
        )}
        {!this.state.errorText && (
          <ReactEcharts
            option={this.getWordCloudOption()}
            style={{height: "100%", width: "100%", cursor: "default"}}
            notMerge={false}
            lazyUpdate={true}
          />
        )}
      </div>
    );
  }
}

export default GraphChatDataPage;
