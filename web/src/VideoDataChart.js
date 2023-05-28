import React, { Component } from "react";
import ReactEcharts from 'echarts-for-react';

class VideoDataChart extends Component {
  drawPic(data, currentTime) {
    const xAxisData = data.map(item => Number(item.time));
    const seriesData = data.map(item => ({
      value: Number(item.data),
      error: Number(item.confidence)
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
        top: '5%',
        left: '3%',
        right: '4%',
        bottom: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData
      },
      yAxis: {
        type: 'value',
        min: dataMin,
        max: dataMax
      },
      series: [
        {
          name: 'Data',
          type: 'line',
          data: seriesData,
          markLine: {
            data: [
              [
                {
                  symbol: 'none',
                  x: `${currentTime / 0.65 + 40}`,
                  y: '80%',
                  lineStyle: {
                    color: 'red'
                  },
                  // label: {
                  //   position: 'start',
                  //   formatter: 'Max'
                  // },
                },
                {
                  symbol: 'none',
                  x: `${currentTime / 0.65 + 40}`,
                  y: '0%',
                  // label: {
                  //   position: 'start',
                  //   formatter: 'Max'
                  // },
                  // type: 'max',
                  // name: 'Max Point',
                }
              ],
            ]
          }
        }
      ]
    };

    return (
      <ReactEcharts
        option={option}
        style={{ height: '200px' }}
      />
    );
  }

  render() {
    const currentTime = this.props.currentTime;

    return (
      <div>
        {this.drawPic(this.props.data.filter(item => item.time !== ""), currentTime)}
      </div>
    );
  }
}

export default VideoDataChart;
