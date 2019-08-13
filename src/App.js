import React from 'react';
import logo from './logo.svg';
import './App.css';

const config = require('./config.js');
const fs = require('fs');


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sensor1: {
        id: 0,
        humidity: null,
        temperature: null
      }
    }
  }

  async componentDidMount() {
    console.log({config});
    console.log(config.password);
    let token = null;
    // login using proxy, username and pass
    await fetch('/proxy/api/v1/authentication/basic/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        'username': config.username,
        'password': config.password
      })
    })
    .then(response => response.json())
    .then(json => {
      console.log(json);
      console.log(json.data.token);
      token = json.data.token;      // assign token to token variable
    });

    console.log('this is the token: ', token);

    // fetch data using a get path
    // installation-id -> 215, sensor-id -> 0
    await fetch('/proxy/api/v1/base/installations/215/sensors/0', {
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
      const { sensor1 } = this.state
      sensor1.humidity = json.data.status.humidity
      sensor1.temperature = json.data.status.temperature
      this.setState({ sensor1 });
      console.log('state set: ', this.state);
    });

    // fetch outputs
    fetch('/proxy/api/v1/base/installations/215/outputs', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(json => {
      console.log(json);
      // fs.writeFile('./data.json', json.data, (err) => {
      //   if (err) throw err;
      //   console.log('file saved!');
      // })
    });
  }

  render() {
    return (
      <div className="App">
        <h1>Ceres Green Application:</h1>
          <div id="dash">
            <div id="box1">Humidity: {this.state.sensor1.humidity}</div>
            <div id="box2">temperature: {this.state.sensor1.temperature}</div>
            <div id="box3">Box 3</div>
            <div id="box4">Box 4</div>
            <div id="box5">Box 5</div>
          </div>
      </div>
    );
  }
}

export default App;
