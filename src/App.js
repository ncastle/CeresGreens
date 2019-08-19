import React from 'react';
// import logo from './logo.svg';
import './App.css';

import logo from './imgs/CG_Logo_Horizontal_Color_a.png';
import Chart from './Chart';
import Dashboard from './Dashboard';
import Clock from './Clock';

const config = require('./config.js');
// const fs = require('fs');
// require influx for use in app
const Influx = require('influx');



class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: "dashboard",
      influxdb: null,
      installationId: config.installationId,
      airAvgs: {
        humidity: null,
        temperature: null
      },
      waterAvgs: {
        level: -1,    // placeholder value
        temperature: 65,  //placeholder value
      },
      sensors: [
        {
          id: 0,
          name: "T/H Sensor 1",
          humidity: null,
          temperature: null
        },
        {
          id: 1,
          name: "T/H Sensor 2",
          humidity: null,
          temperature: null
        },
        {
          id: 2,
          name: "T/H Sensor 3",
          humidity: null,
          temperature: null
        },
      ],
      outputs: [
        {
          id: 5,
          name: "A1 Pump",
          on: undefined
        },
        {
          id: 6,
          name: "A2 Pump",
          on: undefined
        },
        {
          id: 7,
          name: "A3 Pump",
          on: undefined
        },
      ],
      lights: undefined, // boolean -- "on" or "off"
      waterPumps: undefined, // boolean -- "on" or "off"
      currentDate: undefined,
      time: new Date(),
      timeSeriesData: [],
      messages: {
        okay: {
          air: {
            temp: 'Air temperature okay!',
            hum: 'Ait humidity okay!'
          },
          water: {
            temp: 'Water temperature okay!',
            level: 'Water level okay!'
          }
        },
        warnings: {
          air: {
            highTemp: 'Warning: Air temperature is 72 or higher, consider turning cooling coil on',
            lowTemp: 'Warning: Air temperature is 64 or lower, consider turning heating coil on',
            highHum: 'Warning: Air humidity is 60% or higher, consider turning the dehumidifier on',
            lowHum: 'Warning: Air humidity is 45% or lower, consider turning the dehumidifier off'
          },
          water: {
            highTemp: 'Warning: Water temperature is 68 or higher, consider turning chiller on',
            lowTemp: 'Warning: Water temperature is 64 or lower, consider turning chiller off',
            highLevel: 'Warning: Water level is +1',
            lowLevel: 'Warning: Water level is -1',
          }
        },
        alerts: {
          air: {
            highTemp: '!!! ALERT: Air temperature is 80 or higher !!!',
            lowTemp: '!!! ALERT: Air temperature is 60 or lower !!!',
            highHum: '!!! ALERT: Air humidity is 65% or higher !!!',
            lowHum: '!!! ALERT: Air humidity is 40% or lower !!!'
          },
          water: {
            highTemp: '!!! ALERT: Water temperature is 68 or higher !!!',
            lowTemp: '!!! ALERT: Water temperature is 60 or lower !!!',
            highLevel: '!!! ALERT: Water level is +2 !!!',
            lowLevel: '!!! ALERT: Water level is -2 !!!'
          }
        },
        currentMessages: ['Loading Messages'],

      }
    }
    this.openmoticsLogin = this.openmoticsLogin.bind(this);
    this.getOMSensorInfo = this.getOMSensorInfo.bind(this);
    this.cToF = this.cToF.bind(this);
    this.getChartData = this.getChartData.bind(this);
    this.updateMessages = this.updateMessages.bind(this);
    this.timeTick = this.timeTick.bind(this);
  }

  timeTick() {
    this.setState({
      time: new Date()
    });
  }

  async componentDidMount() {
    console.log({ config });
    console.log(config.password);
    let token = null;
    /*** OpenMotics ***/

    token = await this.openmoticsLogin(config.username, config.password);

    console.log('this is the token: ', token);

    // await this.getOMSensorInfo(token, 0);
    // await this.getOMSensorInfo(token, 1);
    // await this.getOMSensorInfo(token, 2);

    // fetch outputs 
    await fetch('/proxy/api/v1/base/installations/215/outputs', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(json => {
        console.log(json);
      });


    let date = new Date().getDate();
    let month = new Date().getMonth() + 1;
    let year = new Date().getFullYear();
    this.setState({ currentDate: month + "/" + date + "/" + year })


    // fetches required info for dashboard
    await this.getInfluxInfo();
    await this.updateMessages();

    // set interval to fetch data every 10s
    this.timer = setInterval(() => {
      this.getInfluxInfo();
      this.updateMessages();
    }, 10000);   

  } // end componentDidMount

  async componentWillUnmount () {
    clearInterval(this.timer);
  }

  updateMessages() {
    let currentMessages = [];

    if(this.state.airAvgs.temperature <= 60) {
      currentMessages.push(this.state.messages.alerts.air.lowTemp);
    } else if (this.state.airAvgs.temperature <= 64) {
      currentMessages.push(this.state.messages.warnings.air.lowTemp);
    } else if (this.state.airAvgs.temperature >= 80) {
      currentMessages.push(this.state.messages.alerts.air.highTemp);
    } else if (this.state.airAvgs.temperature >= 72) {
      currentMessages.push(this.state.messages.warnings.air.highTemp);
    } else {
      currentMessages.push(this.state.messages.okay.air.temp);
    }

    if(this.state.airAvgs.humidity <= 40) {
      currentMessages.push(this.state.messages.alerts.air.lowHum);
    } else if (this.state.airAvgs.humidity <= 45) {
      currentMessages.push(this.state.messages.warnings.air.lowHum);
    } else if (this.state.airAvgs.humidity >= 65) {
      currentMessages.push(this.state.messages.alerts.air.highHum);
    } else if (this.state.airAvgs.humidity >= 60) {
      currentMessages.push(this.state.messages.warnings.air.highHum);
    } else {
      currentMessages.push(this.state.messages.okay.air.hum);
    }

    if(this.state.waterAvgs.temperature <= 60) {
      currentMessages.push(this.state.messages.alerts.water.lowTemp);
    } else if (this.state.waterAvgs.temperature <= 64) {
      currentMessages.push(this.state.messages.warnings.water.lowTemp);
    } else if (this.state.waterAvgs.temperature >= 72) {
      currentMessages.push(this.state.messages.warnings.water.highTemp);
    } else if (this.state.waterAvgs.temperature >= 68) {
      currentMessages.push(this.state.messages.alerts.water.highTemp);
    } else {
      currentMessages.push(this.state.messages.okay.water.temp);
    }
    
    if(this.state.waterAvgs.level <= -2) {
      currentMessages.push(this.state.messages.alerts.water.lowLevel);
    } else if (this.state.waterAvgs.level <= -1) {
      currentMessages.push(this.state.messages.warnings.water.lowLevel);
    } else if (this.state.waterAvgs.level >= 2) {
      currentMessages.push(this.state.messages.alerts.water.highLevel);
    } else if (this.state.waterAvgs.level >= 1) {
      currentMessages.push(this.state.messages.warnings.water.highLevel);
    } else {
      currentMessages.push(this.state.messages.okay.water.level);
    }
    
    if (currentMessages.length === 0) {
      currentMessages.push("All systems go!")
    }

    this.setState({currentMessages});
  }


  async getInfluxInfo() {
    /*** InfluxDB ***/

    // url to database: https://gigawatt-dbd9c7a7.influxcloud.net:8086

    // testing querying the influx database
    const influxdb = new Influx.InfluxDB(`https://${config.dbusername}:${config.dbpassword}@gigawatt-dbd9c7a7.influxcloud.net:8086/openmotics`);

    this.setState({influxdb});

    console.log('connected to database?');
    influxdb.getDatabaseNames()
      .then(names => console.log(names));

    // query influx database for current mean temperature and humidity of air
    let queryResults = await influxdb.query(`SELECT mean("temp") AS "mean_temp", mean("hum") as "mean_hum" 
                    FROM "openmotics"."autogen"."sensor" WHERE time > (now() - 30s)
                    AND ("id"='0' OR "id"='1' OR "id"='2')`)

    console.log(queryResults[0]);
    const { airAvgs } = this.state;
    airAvgs.temperature = this.cToF(queryResults[0].mean_temp).toFixed(5);
    airAvgs.humidity = queryResults[0].mean_hum.toFixed(5);
    this.setState({ airAvgs });

    // query influxdb for status of lights
    queryResults = await influxdb.query(`SELECT last("value") AS "last_value" 
                    FROM "openmotics"."autogen"."output" 
                    WHERE ("id"='14' OR "id"='15')`)
    console.log(queryResults);
    let status = true;
    if (queryResults[0].last_value === 0) status = false;
    this.setState({ lights: status });


    // query influxdb for status of pumps
    queryResults = await influxdb.query(`SELECT last("value") AS "last_value" 
                    FROM "openmotics"."autogen"."output" 
                    WHERE ("id"='5' OR "id"='6' OR "id"='7')`);
    console.log(queryResults[0]);
    status = true;
    if (queryResults[0].last_value === 0) status = false;
    const { outputs } = this.state;
    if (status) {
      outputs.forEach(output => output.on = true);
    } else {
      outputs.forEach(output => output.on = false);
    }
    this.setState({ outputs });
    this.setState({ waterPumps: status });
    console.log(this.state);
  }

  async getChartData(property) {

    const influxdb = new Influx.InfluxDB(`https://${config.dbusername}:${config.dbpassword}@gigawatt-dbd9c7a7.influxcloud.net:8086/openmotics`);

    // fetch time series data from influxdb
    let queryResults = await influxdb.query(`SELECT mean("${property}") AS "mean_${property}"
                      FROM "openmotics"."autogen"."sensor"
                      WHERE time > now() - 3d AND ("id"='2' OR "id"='1' OR "id"='0')
                      GROUP BY time(30m) FILL(null)`);
    console.log({"time series query": queryResults});
    let seriesData = [];
    if(property === 'temp') {
      queryResults.forEach(result => {
        seriesData.push({t: result.time,
                          y: this.cToF(result.mean_temp)});
      });
    }
    if (property === 'hum') {
      queryResults.forEach(result => {
        seriesData.push({t: result.time,
                          y: result.mean_hum});
      });
    }
    console.log(seriesData);
    return seriesData;
  }

  // function takes a username and password for openmotics, logs in,
  // and returns a token that can be used to make other requests to openmotics
  async openmoticsLogin(username, password) {
    // login to openmotics using proxy, username and pass
    return await fetch('/proxy/api/v1/authentication/basic/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        'username': username,
        'password': password
      })
    })
      .then(response => response.json())
      .then(json => {
        console.log(json);
        console.log(json.data.token);
        return json.data.token;      // assign token to token variable
      });
  }

  // get OpenMotics sensor information
  async getOMSensorInfo(token, sensorId) {
    // fetch data using a get path
    // installation-id -> 215, sensor-id -> 0
    await fetch(`/proxy/api/v1/base/installations/${this.state.installationId}/sensors/${sensorId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(json => {
        console.log(json)
        console.log({ 'sensor humidity': json.data.status.humidity }, { 'sensor temperature': json.data.status.temperature });
        console.log(this.state);
        const { airAvgs } = this.state
        airAvgs.humidity = json.data.status.humidity
        airAvgs.temperature = json.data.status.temperature
        this.setState({ airAvgs });
        console.log('state set: ', this.state);
      });
  }

  // helper function to convert temperature 
  // readings from celsius to fahrenheit
  cToF(celsius) { 
    return celsius * 9 / 5 + 32;
  }

  render() {
    console.log(this.state.waterPumps)
    console.log(this.state.lights)
    let pumpStatus = "OFF";
    if (this.state.waterPumps) pumpStatus = "ON";
    let lightStatus = "OFF";
    if (this.state.lights) lightStatus = "ON";
    
    if(this.state.page === "dashboard") {
      return (
        <div className="App">
          <div id="header">
            <img id="logo" src={logo} alt='' />
            <h2>basilDash</h2>

            <div id="date">
              <Clock time={this.state.time} currentDate={this.state.currentDate}
                      tick={this.timeTick}/>
            </div>
          </div>
          
          <div id="nav">
            <p>Welcome Message</p>
              
            <div>
            dashboard
              <label className="switch">
            <input type="checkbox" onClick={() => this.setState({page: "details"})}/>
            <span className="slider round"/>
            </label>
            details
            </div>
          </div>

          <Dashboard lightStatus={lightStatus} pumpStatus={pumpStatus} 
                      airAvgs={this.state.airAvgs}
                      waterAvgs={this.state.waterAvgs} messages={this.state.currentMessages} updateMessages={this.updateMessages}/>
        </div >
      );
    } else if (this.state.page === "details") {
      return (
        <div className="detail-page">
          <div id="header">
            <img id="logo" src={logo} alt='' />
            <h2>basilDash</h2>
            <div id="date">
              <Clock time={this.state.time} currentDate={this.state.currentDate}
                      tick={this.timeTick}/>
            </div>
          </div>
          <div id="nav">
            <p>Welcome Message</p>
            
            <div>
              dashboard
              <label className="switch">
            <input type="checkbox" checked onClick={() => this.setState({page: "dashboard"})}/>
            <span className="slider round"/>
            </label>
            details
            </div>
          </div>

          <Chart getChartData={this.getChartData}/>
          
        </div>


      );
    }
  }
}

export default App;
