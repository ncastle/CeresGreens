import React from 'react';
// import logo from './logo.svg';
import './App.css';
import waterpump from './imgs/water-pump.svg';
import waterpumpon from './imgs/water-pump-on.svg';
import altwaterpump from './imgs/alt-water-pump.svg';
import altwaterpumpoff from './imgs/alt-water-pump-off.svg';
import wind from './imgs/wind.svg';
import drop from './imgs/drop.svg';
import dropborder from './imgs/drop_border.svg';
import bulbOn from './imgs/bulb_on.svg';
import bulbOff from './imgs/bulb_off.svg';

const config = require('./config.js');
// const fs = require('fs');
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
    }
    this.openmoticsLogin = this.openmoticsLogin.bind(this);
    this.getOMSensorInfo = this.getOMSensorInfo.bind(this);
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

    /*** InfluxDB ***/

    // url to database: https://gigawatt-dbd9c7a7.influxcloud.net:8086

    // testing querying the influx database
    const influxdb = new Influx.InfluxDB(`https://${config.dbusername}:${config.dbpassword}@gigawatt-dbd9c7a7.influxcloud.net:8086/openmotics`);

    console.log('connected to database?');
    influxdb.getDatabaseNames()
      .then(names => console.log(names));

    // query influx database for current mean temperature and humidity of air
    let queryResults = await influxdb.query(`SELECT mean("temp") AS "mean_temp", mean("hum") as "mean_hum" 
                    FROM "openmotics"."autogen"."sensor" WHERE time > (now() - 30s)
                    AND ("id"='0' OR "id"='1' OR "id"='2')`)

    console.log(queryResults[0]);
    const { airAvgs } = this.state;
    airAvgs.temperature = queryResults[0].mean_temp.toFixed(2);
    airAvgs.humidity = queryResults[0].mean_hum.toFixed(2);
    this.setState({airAvgs});

    // query influxdb for status of lights
    queryResults = await influxdb.query(`SELECT last("value") AS "last_value" 
                    FROM "openmotics"."autogen"."output" 
                    WHERE ("id"='14' OR "id"='15')`)
    console.log(queryResults);
    let status = true;
    if (queryResults[0].last_value === 0) status = false;
    this.setState({lights: status});


    // query influxdb for status of pumps
    queryResults = await influxdb.query(`SELECT last("value") AS "last_value" 
                    FROM "openmotics"."autogen"."output" 
                    WHERE ("id"='5' OR "id"='6' OR "id"='7')`)
    console.log(queryResults[0]);
    status = true;
    if (queryResults[0].last_value === 0) status = false;
    const { outputs } = this.state;
    if (status) {
      outputs.forEach(output => output.on = true);
    } else {
      outputs.forEach(output => output.on = false);
    }
    this.setState({outputs});
    this.setState({waterPumps: status});
    console.log(this.state);
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
      airAvgs.humidity = json.data.status.humidity
      airAvgs.temperature = json.data.status.temperature
      this.setState({ airAvgs });
      console.log('state set: ', this.state);
    });
  }

  render() {
    console.log(this.state.waterPumps)
    console.log(this.state.lights)
    let pumpStatus = "OFF";
    if (this.state.waterPumps) pumpStatus = "ON";
    let lightStatus = "OFF";
    if (this.state.lights) lightStatus = "ON";
    return (
      <div className="App">
        <div id="header">
          <h1>Ceres Greens</h1>
          <h2>Basildash</h2>
        </div>

        <div id="dash">
          {/* <div id="topNav">
            <ul id="navItems">
              <li>Air</li>
              <li>Water</li>
              <li>Light</li>
            </ul>
          </div> */}

          <div id="air-content">
            {/* <div className="label">Air:</div>  */}
            <div id="air-img-box">
              <img src={wind} width="120px" height="120px" alt="" />
            </div>
            <div id="air-container">
              <div className="info-text">{this.state.airAvgs.temperature}&#176;C
              <div className="label1">Temperature</div>
              </div>
              <div className="info-text hum">{this.state.airAvgs.humidity}%
              <div className="label2">Humidity</div>
              </div>
            </div>
          </div>
          
          <div id="water-content">
            <div id="water-img-box">
                <img src={drop} width="120px" height="120px" alt=""/>
            </div>
            <div id="water-container">
              <div className="info-text">15&#176;C
              <div className="label1">Temperature</div>
              </div>
              <div className="info-text hum"> -1
              <div className="label2">Level</div>
              </div>
            </div>
          </div>

          <div id="light-content">
            <div id="light-img-box">
              { (lightStatus === "ON") &&
                <img src={bulbOn} width="120px" height="120px" alt=""/>
              }
              { (lightStatus === "OFF") &&
                <img src={bulbOff} width="120px" height="120px" alt=""/>
              }
            </div>
            <div id="light-text">
              <strong>Lights</strong>
              <br/>
              {lightStatus}
            </div>
          </div>

          <div id="control-content">Control</div>

          <div id="pump-content">
            <div id="pump-img-box">
              {/* <img src={waterpump} width="100px" height="100px" alt="water pump svg"/> */}
              { (pumpStatus === "ON") &&
                <img id="pumpon" src={altwaterpump} width="100px" height="100px" alt=""/>
              }
              { (pumpStatus === "OFF") &&
                <img src={altwaterpumpoff} width="100px" height="100px" alt=""/>
              }
            </div>
            <div id="pump-text">
              <strong>Water</strong>
              <br/>
              <strong>Pumps</strong>
              <br/>
              {pumpStatus}
            </div>
          </div>

          <div id="alert-content">
            Alert Log:
            <div id="alert-box"></div>
          </div>

        </div>
      </div >
    );
  }
}

export default App;
