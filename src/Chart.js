import React from 'react';
const Chartjs = require('chart.js');

class Chart extends React.Component {

  constructor(props){
    super(props);
    this.changeTimeScale = this.changeTimeScale.bind(this);
    
  }

  async componentDidMount(){
    // console.log("props.data:", this.props.data);
    let tempData = await this.props.getChartData('temp', this.props.timeScale);
    let humData = await this.props.getChartData('hum', this.props.timeScale);

    this.setState({tempData: tempData})
    console.log({tempData});

    // chart for air temperature readings
    var tempctx = document.getElementById('tempChart');
    var tempChart = new Chartjs(tempctx, {
      type: 'line',
      data: {
        // labels: ['time series data'],
        datasets: [{
          label: 'TEMPERATURE',
          data: tempData,
          backgroundColor: [
            'rgba(34, 139, 255, 0.3)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 2
        },
        {
          label: 'HUMIDITY',
          data: humData,
          backgroundColor: [
            'rgba(234, 139, 0, 0.3)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 2
        }
      
      ]
      },
      options: {
        legend: {
          labels: {
            fontSize: 15,
          }
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: false
            }
          }],
          xAxes: [{
            type: 'time',
            time: {
              unit: 'day'
            }
          }]
        }
      }
    });

  }

  async componentDidUpdate() {
    let tempData = await this.props.getChartData('temp', this.props.timeScale);
    let humData = await this.props.getChartData('hum', this.props.timeScale);

    var tempctx = document.getElementById('tempChart');
    var tempChart = new Chartjs(tempctx, {
      type: 'line',
      data: {
        // labels: ['time series data'],
        datasets: [{
          label: 'TEMPERATURE',
          data: tempData,
          backgroundColor: [
            'rgba(34, 139, 255, 0.3)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 2
        },
        {
          label: 'HUMIDITY',
          data: humData,
          backgroundColor: [
            'rgba(234, 139, 0, 0.3)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 2
        }
      
      ]
      },
      options: {
        legend: {
          labels: {
            fontSize: 15,
          }
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: false
            }
          }],
          xAxes: [{
            type: 'time',
            time: {
              unit: 'day'
            }
          }]
        }
      }
    });

  }

  changeTimeScale(e) {
    console.log(e.target.value);
    e.preventDefault();
    console.log('changing time scale');
  }

  

  

  render() {
    console.log(this.state);
    return(
      <div>
        <div id="chart-wrapper">
          <div className="chart-container">
            <canvas id="tempChart"></canvas>
          </div>
          {/* <div className="chart-container">
          <canvas id="humChart"></canvas>
          </div> */}
        </div>
      </div>
    );
  }
}

export default Chart;