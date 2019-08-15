import React from 'react';
// import logo from './logo.svg';
import './App.css';

const config = require('./config.js');
const fs = require('fs');
// require influx for use in app
const Influx = require('influx');


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      installationId: config.installationId,
      airAvgs: {
        humidity: null,
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
      light: null, // boolean -- "on" or "off"
      waterTemp: null,
      waterPump: null, // boolean -- "on" or "off"
    }
    this.openmoticsLogin = this.openmoticsLogin.bind(this);
    this.getOMSensorInfo = this.getOMSensorInfo.bind(this);
  }

  async componentDidMount() {
    console.log({config});
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

    /*** InfluxDB ***/

    // url to database: https://gigawatt-dbd9c7a7.influxcloud.net:8086

    // testing querying the influx database
    const influxdb =  new Influx.InfluxDB(`https://${config.dbusername}:${config.dbpassword}@gigawatt-dbd9c7a7.influxcloud.net:8086/openmotics`);
    
    console.log('connected to database?');
    influxdb.getDatabaseNames()
    .then(names => console.log(names));

    // query influx database for current mean temperature
    influxdb.query(`SELECT mean("temp") AS "mean_temp", mean("hum") as "mean_hum" 
                    FROM "openmotics"."autogen"."sensor" WHERE time > (now() - 30s)
                    AND ("id"='0' OR "id"='1' OR "id"='2')`)
    .then(results => {
      console.log(results[0]);
      const { airAvgs } = this.state;
      airAvgs.temperature = results[0].mean_temp.toFixed(2);
      airAvgs.humidity = results[0].mean_hum.toFixed(2);
      this.setState({airAvgs});
    })

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
      console.log({'sensor humidity': json.data.status.humidity}, {'sensor temperature': json.data.status.temperature});
      console.log(this.state);
      const { airAvgs } = this.state
      // airAvgs.humidity = json.data.status.humidity
      // airAvgs.temperature = json.data.status.temperature
      // this.setState({ airAvgs });
      console.log('state set: ', this.state);
    });
  }

  render() {
    return (
      <div className="App">
        <div id="header">
          <h1>Ceres Greens</h1>
          <h2>Basildash</h2>
        </div>
        <div id="dash">
          <div id="topNav">
            <ul id="navItems">
              <li>Air</li>
              <li>Water</li>
              <li>Light</li>
            </ul>
          </div>
          <div id="air-content">
            {/* <div className="label">Air:</div>  */}
            <div id="humidty-img-box">
              <img src="/wi-day-windy.svg" width="100" height="100" alt=""/>
            </div>
            <div>
              <div className="info-text">T: {this.state.airAvgs.temperature}&#176;C</div>
              <div className="info-text hum">H: {this.state.airAvgs.humidity}%</div>
            </div>
          </div>
          <div id="water-content">Water Temp and Level:
          <div id="water-img-box">
              <img src="/wi-humidity.svg" width="150" height="150" alt="">
              </img></div></div>
          <div id="light-content">Light:</div>
          <div id="control-content">Control</div>
          <div id="alert-content">Alert Items</div>
          <div id="p">Box p</div>
        </div>
      </div >
    );
  }
}

export default App;
