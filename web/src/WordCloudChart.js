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

import React, {Component} from "react";
import * as echarts from "echarts";
import "echarts-wordcloud";

class WordCloudChart extends Component {
  constructor(props) {
    super(props);
    this.chartRef = React.createRef();
  }

  componentDidMount() {
    this.initChart();
  }

  initChart() {
    const {wordCountMap} = this.props;

    const data = Object.keys(wordCountMap).map(key => ({
      name: key,
      value: wordCountMap[key],
    }));

    const myChart = echarts.init(this.chartRef.current);

    const option = {
      tooltip: {
        show: true,
        formatter: function(params) {
          return `词频: ${params.value}`;
        },
      },
      series: [{
        type: "wordCloud",
        shape: "cardioid",
        left: "center",
        top: "0%",
        width: "100%",
        height: "80%",
        sizeRange: [20, 100],
        rotationRange: [-45, 45],
        rotationStep: 5,
        gridSize: 20,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: "sans-serif",
          fontWeight: "bold",
          color: function() {
            return "rgb(" + [
              Math.round(Math.random() * 200),
              Math.round(Math.random() * 200),
              Math.round(Math.random() * 200),
            ].join(",") + ")";
          },
        },
        emphasis: {
          focus: "self",
          textStyle: {
            textShadowBlur: 10,
            textShadowColor: "#333",
          },
        },
        data: data,
      }],
    };

    myChart.setOption(option);
  }

  render() {
    return (
      <div ref={this.chartRef} style={{width: "100%", height: "calc(100vh - 200px)"}}></div>
    );
  }
}

export default WordCloudChart;
