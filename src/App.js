import React from 'react';
// import logo from './logo.svg';
import './App.css';

import logo from './imgs/CG_Logo_Horizontal_Color_a.png';
import Chart from './Chart';
import Dashboard from './Dashboard';

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
        level: null,
        temperature: null
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
    }
    this.openmoticsLogin = this.openmoticsLogin.bind(this);
    this.getOMSensorInfo = this.getOMSensorInfo.bind(this);
    this.cToF = this.cToF.bind(this);
    this.getChartData = this.getChartData.bind(this);
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

    // set interval to fetch data every 10s
    this.timer = setInterval(() => this.getInfluxInfo(), 30000);   

  } // end componentDidMount

  async componentWillUnmount () {
    clearInterval(this.timer);
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
                    FROM "openmotics"."autogen"."sensor" WHERE time > (now() - 1d)
                    AND ("id"='0' OR "id"='1' OR "id"='2')`)

    console.log(queryResults[0]);
    const { airAvgs } = this.state;
    airAvgs.temperature = this.cToF(queryResults[0].mean_temp).toFixed(1);
    airAvgs.humidity = queryResults[0].mean_hum.toFixed(1);
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
                      WHERE time > now() - 5d AND ("id"='2' OR "id"='1' OR "id"='0')
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
            <div id="date">{this.state.currentDate}</div>
          </div>
          
          <div id="nav">
            <p>Welcome Message</p>
            <label className="switch">
              <input type="checkbox" onClick={() => this.setState({page: "details"})}/>
              <span className="slider round"/>
            </label>
          </div>

          <Dashboard lightStatus={lightStatus} pumpStatus={pumpStatus} 
                      airAvgs={this.state.airAvgs} />
        </div >
      );
    } else if (this.state.page === "details") {
      return (
        <div className="detail-page">
          <div id="header">
            <img id="logo" src={logo} alt='' />
            <h2>basilDash</h2>
            <div id="date">{this.state.currentDate}</div>
          </div>
          <div id="nav">
            <p>Welcome Message</p>
            
            <label className="switch">
              <input type="checkbox" checked onClick={() => this.setState({page: "dashboard"})}/>
              <span className="slider round"/>
            </label>
          </div>

          <Chart getChartData={this.getChartData}/>
          
        </div>


      );
    }
  }
}

export default App;
