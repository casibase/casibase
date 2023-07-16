// Copyright 2023 The casbin Authors. All Rights Reserved.
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
import ReactEcharts from "echarts-for-react";

class VideoDataChart extends Component {
  drawPic(data, currentTime, height) {
    const xAxisData = data.map(item => item.time);
    const seriesData = data.map(item => ({
      value: item.data,
      error: item.confidence,
    }));

    let dataMax = -Infinity;
    let dataMin = Infinity;
    for (let i = 0; i < seriesData.length; i++) {
      const value = seriesData[i].value;

      if (value > dataMax) {
        dataMax = value;
      }
      if (value < dataMin) {
        dataMin = value;
      }
    }

    const option = {
      grid: {
        top: "5%",
        left: "3%",
        right: "4%",
        bottom: "8%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: xAxisData,
      },
      yAxis: {
        type: "value",
        min: dataMin,
        max: dataMax,
      },
      series: [
        {
          name: "Data",
          type: "line",
          data: seriesData,
          markLine: {
            data: [
              [
                {
                  symbol: "none",
                  x: `${currentTime / 0.65 + 40}`,
                  y: "80%",
                  lineStyle: {
                    color: "red",
                  },
                  // label: {
                  //   position: 'start',
                  //   formatter: 'Max'
                  // },
                },
                {
                  symbol: "none",
                  x: `${currentTime / 0.65 + 40}`,
                  y: "0%",
                  // label: {
                  //   position: 'start',
                  //   formatter: 'Max'
                  // },
                },
              ],
            ],
          },
        },
      ],
    };

    return (
      <ReactEcharts
        option={option}
        style={{height: height}}
      />
    );
  }

  render() {
    let data = this.props.data;
    const currentTime = this.props.currentTime;
    const interval = this.props.interval;
    let height = this.props.height;

    if (interval !== undefined && interval !== null) {
      data = data.filter(item => currentTime - interval < item.time && item.time < currentTime + interval);
    }

    if (height === undefined || height === null) {
      height = "200px";
    }

    return (
      <div>
        {this.drawPic(data, currentTime, height)}
      </div>
    );
  }
}

export default VideoDataChart;
