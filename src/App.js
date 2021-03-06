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
var moment = require('moment');
//let config;   // safety config var



class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: "dashboard",
      installationId: process.env.installationId || config.installationId,
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
      timeSeriesData: [],
      timeScale: 1,   // days
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
            highTemp: 'Warning: Air temperature is 72 or higher',
            lowTemp: 'Warning: Air temperature is 64 or lower',
            highHum: 'Warning: Air humidity is 60% or higher',
            lowHum: 'Warning: Air humidity is 45% or lower'
          },
          water: {
            highTemp: 'Warning: Water temperature is 68 or higher',
            lowTemp: 'Warning: Water temperature is 64 or lower',
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
            highLevel: '!!! ALERT: Water level is +2 or higher !!!',
            lowLevel: '!!! ALERT: Water level is -2 or lower !!!'
          }
        },
        currentMessages: ['Loading Messages'],
      },
      welcomeMessage: "Good Morning",
    }
    this.openmoticsLogin = this.openmoticsLogin.bind(this);
    this.getOMSensorInfo = this.getOMSensorInfo.bind(this);
    this.cToF = this.cToF.bind(this);
    this.getAirChartData = this.getAirChartData.bind(this);
    this.getWaterChartData = this.getWaterChartData.bind(this);
    this.updateMessages = this.updateMessages.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.setWelcomeMessage = this.setWelcomeMessage.bind(this);
  }

  async componentDidMount() {
    console.log({ config });
    console.log(config.password);
    let token = null;
    /*** OpenMotics ***/

    // token = await this.openmoticsLogin(config.username, config.password);

    // console.log('this is the token: ', token);

    // await this.getOMSensorInfo(token, 0);
    // await this.getOMSensorInfo(token, 1);
    // await this.getOMSensorInfo(token, 2);

    // fetch outputs 
    // await fetch('/proxy/api/v1/base/installations/215/outputs', {
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json',
    //     'Authorization': `Bearer ${token}`
    //   }
    // })
    //   .then(response => response.json())
    //   .then(json => {
    //     console.log(json);
    //   });


    // let date = new Date().getDate();
    // let month = new Date().getMonth() + 1;
    // let year = new Date().getFullYear();
    this.setState({ currentDate: moment().format("ddd, MMM D") })

    // this.setWelcomeMessage();


    // fetches required info for dashboard
    await this.getInfluxInfo();
    await this.updateMessages();

    // set interval to fetch data every 10s
    this.timer = setInterval(() => {
      let temprange = 75 - 55 + 1;
      let tempnum = 55 + Math.floor(Math.random() * temprange);
      let levelrange = 3 - (-3) + 1;
      let levelnum = -3 + Math.floor(Math.random() * levelrange);
      const { waterAvgs } = this.state;
      waterAvgs.temperature = tempnum;
      waterAvgs.level = levelnum;
      this.setState({waterAvgs})
      this.getInfluxInfo();
      this.updateMessages();
    }, 30000);

    // this.timer2 = setInterval(() => {
    //   let range = 72 - 60 + 1;
    //   let num = 60 + Math.floor(Math.random() * range);
    //   const { waterAvgs } = this.state;
    //   waterAvgs.temperature = num;
    //   this.setState({waterAvgs})
    // }, 5000);

  } // end componentDidMount

  async componentWillUnmount () {
    clearInterval(this.timer);
    // clearInterval(this.timer2);
  }

  // function reads the state of the app and pushes a set of messages to display
  // based on the current values for air, water, lights, and water pumps
  updateMessages() {
    let currentMessages = [];

    // push message to array for air temperature
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

    // push message to array for air humidity
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

    // push message to array for water temperature
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
    
    // push message to array for water level
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
      currentMessages.push("All systems good!")
    }

    this.setState({currentMessages});
  }

  // function that sets the welcome message based on the current time
  setWelcomeMessage(time) {
    console.log('moment:', time.split(":")[0])
    // time = "7:00:00 PM"
    if(time.includes('AM')) {
      this.setState({welcomeMessage: "Hi there, Good Morning"});
    } else if(time.includes('PM') && (time.split(":")[0] > 6) && (time.split(":")[0] != 12)) {
      this.setState({welcomeMessage: "Hi there, Good Evening"});
    } else {
      this.setState({welcomeMessage: "Hi there, Good Afternoon"});
    }
  }

  // function that makes all queries for sensor data
  async getInfluxInfo() {
    /*** InfluxDB ***/

    // url to database: https://gigawatt-dbd9c7a7.influxcloud.net:8086

    // connect to influx database
    const influxdb = new Influx.InfluxDB(`https://${process.env.dbusername || config.dbusername}:${process.env.dbpassword || config.dbpassword}@gigawatt-dbd9c7a7.influxcloud.net:8086/openmotics`);

    // this.setState({influxdb});
    // console.log('connected to database?');
    // influxdb.getDatabaseNames()
    //   .then(names => console.log(names));

    // query influx database for current mean temperature and humidity of air
    let queryResults = await influxdb.query(`SELECT mean("temp") AS "mean_temp", mean("hum") as "mean_hum" 
                    FROM "openmotics"."autogen"."sensor" WHERE time > (now() - 30s)
                    AND ("id"='0' OR "id"='1' OR "id"='2')`)

    console.log(queryResults[0]);
    const { airAvgs } = this.state;
    airAvgs.temperature = this.cToF(queryResults[0].mean_temp).toFixed(3);
    airAvgs.humidity = queryResults[0].mean_hum.toFixed(3);


    // query influxdb for status of lights
    queryResults = await influxdb.query(`SELECT last("value") AS "last_value" 
                    FROM "openmotics"."autogen"."output" 
                    WHERE ("id"='3')`)

    console.log(queryResults);
    let lightStatus = true;
    // circuts are backwards, so a reading of 100 means lights are off
    if (queryResults[0].last_value === 100) lightStatus = false;


    // query influxdb for status of water pumps
    queryResults = await influxdb.query(`SELECT last("value") AS "last_value" 
                    FROM "openmotics"."autogen"."output" 
                    WHERE ("id"='5' OR "id"='6' OR "id"='7')`);

    console.log(queryResults[0]);
    let pumpStatus = true;
    if (queryResults[0].last_value === 0) pumpStatus = false;
    const { outputs } = this.state;
    if (pumpStatus) {
      outputs.forEach(output => output.on = true);
    } else {
      outputs.forEach(output => output.on = false);
    }

    this.setState({
      airAvgs: airAvgs,
      lights: lightStatus,
      outputs: outputs,
      waterPumps: pumpStatus
    })
    console.log(this.state);
  }

  async getAirChartData(property, days) {

    // connect to influx database
    const influxdb = new Influx.InfluxDB(`https://${process.env.dbusername || config.dbusername}:${process.env.dbpassword || config.dbpassword}@gigawatt-dbd9c7a7.influxcloud.net:8086/openmotics`);

    // fetch time series data from influxdb
    let queryResults = await influxdb.query(`SELECT mean("${property}") AS "mean_${property}"
                      FROM "openmotics"."autogen"."sensor"
                      WHERE time > now() - ${days}d AND ("id"='2' OR "id"='1' OR "id"='0')
                      GROUP BY time(30m)`);
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

  async getWaterChartData(property, days) {
    // fakedata autogen sensor

    // connect to influx database
    const influxdb = new Influx.InfluxDB(`https://${process.env.dbusername || config.dbusername}:${process.env.dbpassword || config.dbpassword}@gigawatt-dbd9c7a7.influxcloud.net:8086/openmotics`);

    // fetch time series data from influxdb
    let queryResults = await influxdb.query(`SELECT mean("${property}") AS "mean_${property}"
                      FROM "fakedata"."autogen"."sensor"
                      WHERE time > now() - ${days}d AND ("name"='Water Level #1')
                      GROUP BY time(30m) FILL(previous)`);

    let seriesData = [];
    if(property === 'temp') {
      queryResults.forEach(result => {
        seriesData.push({t: result.time,
                          y: this.cToF(result.mean_temp)});
      });
    }
    if (property === 'level') {
      queryResults.forEach(result => {
        seriesData.push({t: result.time,
                          y: result.mean_level});
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

  // query OpenMotics for sensor information
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

  handleChange(e) {
    // console.log("val:", e.target.value)
    this.setState({timeScale: e.target.value});    
  }

  render() {
    console.log(this.state.waterPumps)
    console.log(this.state.lights)
    let pumpStatus = "OFF";
    if (this.state.waterPumps) pumpStatus = "ON";
    let lightStatus = "OFF";
    if (this.state.lights) lightStatus = "ON";
    
    // render the dashboard
    if(this.state.page === "dashboard") {
      return (
        <div className="App">
          <div id="header">
            <img id="logo" src={logo} alt='' />
            <h2>basilDash</h2>

            <div id="date">
              <Clock currentDate={this.state.currentDate} setWelcomeMessage={this.setWelcomeMessage}/>
            </div>
          </div>
          
          <div id="nav">
            <p>{this.state.welcomeMessage}</p>
            <div>
              dashboard
              <label className="switch">
              <input type="checkbox" checked={false} onChange={() => this.setState({page: "details"})}/>
              <span className="slider round"/>
              </label>
              chart
            </div>
          </div>

          <Dashboard lightStatus={lightStatus} pumpStatus={pumpStatus} airAvgs={this.state.airAvgs}
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
              <Clock currentDate={this.state.currentDate} setWelcomeMessage={this.setWelcomeMessage} />
            </div>
          </div>

          <div id="nav">
            <p>{this.state.welcomeMessage}</p>
            <div>
              dashboard
              <label className="switch">
              <input type="checkbox" checked={true} onChange={() => this.setState({page: "dashboard"})}/>
              <span className="slider round"/>
              </label>
              chart
            </div>
          </div>

          <form>
            <select id="scale-dropdown" name="scale" 
                  onChange={this.handleChange} value={this.state.timeScale}>
              <option value={1}> Day </option>
              <option value={7}> Week </option>
              <option value={30}> Month </option>
            </select>
          </form>

          <Chart timeScale={this.state.timeScale} getAirChartData={this.getAirChartData} getWaterChartData={this.getWaterChartData}/>
          
        </div>


      );
    }
  }
}

export default App;
