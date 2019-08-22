import React from 'react';
const Chartjs = require('chart.js');

class Chart extends React.Component {

  constructor(props){
    super(props);
    this.createCharts = this.createCharts.bind(this);
  }

  async componentDidMount(){
    this.createCharts();
  }

  async componentDidUpdate() {
    this.createCharts();
  }

  async createCharts() {
    let tempData = await this.props.getAirChartData('temp', this.props.timeScale);
    let humData = await this.props.getAirChartData('hum', this.props.timeScale);
    let waterTempData = await this.props.getWaterChartData('temp', this.props.timeScale);
    let waterLevelData = await this.props.getWaterChartData('level', this.props.timeScale);

    // chart for air temperature readings
    var tempctx = document.getElementById('tempChart');
    var tempChart = new Chartjs(tempctx, {
      type: 'line',
      data: {
        // labels: ['time series data'],
        datasets: [{
          label: 'AIR TEMPERATURE',
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
          label: 'AIR HUMIDITY',
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
        events: ['click'],
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

    // chart for water temperature readings
    var tempcty = document.getElementById('waterTempChart');
    var waterChart = new Chartjs(tempcty, {
      type: 'line',
      data: {
        // labels: ['time series data'],
        datasets: [{
          label: 'WATER TEMPERATURE',
          data: waterTempData,
          backgroundColor: [
            'rgba(34, 139, 255, 0.3)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 2
        }
      ]
      },
      options: {
        events: ['click'],
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

    // chart for water level readings
    var tempctz = document.getElementById('waterLevelChart');
    var waterLevelChart = new Chartjs(tempctz, {
      type: 'line',
      data: {
        // labels: ['time series data'],
        datasets: [{
          label: 'WATER LEVEL',
          data: waterLevelData,
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
        events: ['click'],
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

  

  render() {
    return(
      <div>
        <div id="chart-wrapper">
          <div className="chart-container">
            <canvas id="tempChart"></canvas>
          </div>
          <div className="chart-container">
            <canvas id="waterTempChart"></canvas>
          </div>
          <div className="chart-container">
            <canvas id="waterLevelChart"></canvas>
          </div>
        </div>
      </div>
    );
  }
}

export default Chart;