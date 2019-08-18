import React from 'react';
const Chartjs = require('chart.js');

class Chart extends React.Component {

  constructor(props){
    super(props);
    
  }

  async componentDidMount(){
    // console.log("props.data:", this.props.data);
    let tempData = await this.props.getChartData('temp');
    let humData = await this.props.getChartData('hum');
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
    // var humctx = document.getElementById('humChart');
    // // chart for air humidity readings
    // var humChart = new Chartjs(humctx, {
    //   type: 'line',
    //   data: {
    //     // labels: ['time series data'],
    //     datasets: [{
    //       label: 'HUMIDITY',
    //       data: humData,
    //       backgroundColor: [
    //         'rgba(34, 139, 255, 0.3)',
    //       ],
    //       borderColor: [
    //         'rgba(255, 99, 132, 1)',
    //       ],
    //       borderWidth: 2
    //     }]
    //   },
    //   options: {
    //     legend: {
    //       labels: {
    //         fontSize: 15,
    //       }
    //     },
    //     scales: {
    //       yAxes: [{
    //         ticks: {
    //           beginAtZero: false
    //         }
    //       }],
    //       xAxes: [{
    //         type: 'time',
    //         time: {
    //           unit: 'day'
    //         }
    //       }]
    //     }
    //   }
    // });

  }

  

  render() {
    return(
      <div id="chart-wrapper">
        <div className="chart-container">
          <canvas id="tempChart"></canvas>
        </div>
        {/* <div className="chart-container">
        <canvas id="humChart"></canvas>
        </div> */}
      </div>
    );
  }
}

export default Chart;