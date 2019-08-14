import React from 'react';
// import logo from './logo.svg';
import './App.css';


// const username = require('./secrets.json').username;
// const password = require('./secrets.json').password;


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      humidity: null,
      light: null, // boolean -- "on" or "off"
      waterTemp: null,
      waterPump: null, // boolean -- "on" or "off"


      credentials: {
        // un: username, // username
        // pw: password  // password
      }
    }
    this.login = this.login.bind(this);
    // this.login1 = this.login1.bind(this);
  }

  componentDidMount() {

    // this.login1();
    // fetch('https://cloud.openmotics.com/api/v1/base/installations/215/sensors/9', {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json',
    //   },
    //   Authorization:'Bearer mhldry0za9m88aa90gu4i7lucf67s7zx',
    //   mode: 'no-cors'
    // })
    // .then(response => response.json())
    // .then(json => {
    //   console.log(json);
    // })
  }

  login1() {
    fetch('https://cloud.openmotics.com/api/v1/authentication/basic/login', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Origin': '*',
      },
      method: 'post',
      body: {
        "username": this.state.credentials.un,
        "password": this.state.credentials.pw
      },
      mode: 'no-cors'
    })
      .then(response => response.json())
      .then(json => {
        console.log(json);
      })
  }

  login() {
    var http = require("https");

    var options = {
      "method": "POST",
      "hostname": "cloud.openmotics.com",
      "path": "/api/v1/authentication/basic/login",
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Basic Og==",
        "Cache-Control": "no-cache",
        "Host": "cloud.openmotics.com",
        "Accept-Encoding": "gzip, deflate",
        "Content-Length": "69",
        "Connection": "keep-alive",
        "cache-control": "no-cache"
      }
    };

    var req = http.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        console.log(body.toString());
      });
    });

    req.write(JSON.stringify({ username: this.state.credentials.un, password: this.state.credentials.pw }));
    req.end();
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
          <div id="humidity-content">
            Humidity: {this.state.humidity}
            <div id="humidty-img-box">
              <img src="/wi-day-windy.svg" width="100" height="100" alt="">
              </img></div>
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
