import React from "react";
import ReactEcharts from "echarts-for-react";

class DataChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      data: null,
    };
  }

  componentWillMount() {
    fetch(this.props.url, {
      method: "GET",
    }).then(res => res.text())
      .then((text) => {
        if (this.props.filename.startsWith("Impedance_")) {
          this.processImpedanceFile(text);
        }
      });
  }

  getY(y) {
    // return y * 36 / 4096;
    const ra = 50;
    const rb = 86.6;
    return rb * (11 * 1024 * ra + 3 * (rb + ra) * y) / (11 * 1024 * rb - 3 * (rb + ra) * y);
  }

  processImpedanceFile(text) {
    let lines = text.split("\n");
    lines = lines.filter(line => line !== "" && line !== "\r");
    lines = lines.filter((line, index) => index % 20 === 0);

    let data = lines.map(line => {
      const res = [];
      const tokens = line.split("  ");
      tokens.forEach((token, index) => {
        if (index !== 0) {
          res.push([tokens[0], this.getY(token)]);
        }
      });
      return res;
    }).flat();

    const startTime = new Date("0000-01-01 " + data[0][0]).getTime();
    data = data.map(element => {
      element[0] = (new Date("0000-01-01 " + element[0]).getTime() - startTime) / 1000 / 60;
      return element;
    });

    this.setState({
      data: data,
    });
  }

  render() {
    if (this.state.data === null) {
      return null;
    }

    const option = {
      title: {
        text: "Impedance",
      },
      tooltip: {
        trigger: "axis",
        formatter: function(params) {
          return JSON.stringify(params.value);
        },
        axisPointer: {
          animation: false,
        },
      },
      xAxis: {
        type: "value",
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        boundaryGap: [0, "100%"],
        splitLine: {
          show: false,
        },
      },
      series: [
        {
          name: "Fake Data",
          type: "line",
          showSymbol: false,
          data: this.state.data,
        },
      ],
    };

    return (
      <ReactEcharts style={{width: "100%", height: this.props.height, backgroundColor: "white"}} option={option} notMerge={true} />
    );
  }
}

export default DataChart;
