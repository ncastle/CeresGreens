import React from 'react';
import logo from './logo.svg';
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
      ]
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

    await this.getOMSensorInfo(token, 0);

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
    influxdb.query(`SELECT mean("temp") AS "mean_temp" FROM "openmotics"."autogen"."sensor" WHERE ("id"='0' OR "id"='1' OR "id"='2')`)
    .then(results => {
      console.log(results[0]);
      const { airAvgs } = this.state;
      airAvgs.temperature = results[0].mean_temp;
      this.setState({airAvgs});
    })

    //query for current mean humidity
    influxdb.query(`SELECT mean("hum") AS "mean_hum" FROM "openmotics"."autogen"."sensor" WHERE ("id"='0' OR "id"='1' OR "id"='2')`)
    .then(results => {
      console.log(results[0]);
      const { airAvgs } = this.state;
      airAvgs.humidity = results[0].mean_hum;
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
      airAvgs.humidity = json.data.status.humidity
      airAvgs.temperature = json.data.status.temperature
      this.setState({ airAvgs });
      console.log('state set: ', this.state);
    });
  }

  render() {
    return (
      <div className="App">
        <h1>Ceres Green Application:</h1>
          <div id="dash">
            <div id="box1">Humidity: {this.state.airAvgs.humidity}</div>
            <div id="box2">temperature: {this.state.airAvgs.temperature}</div>
            <div id="box3">Box 3</div>
            <div id="box4">Box 4</div>
            <div id="box5">Box 5</div>
          </div>
      </div>
    );
  }
}

export default App;
